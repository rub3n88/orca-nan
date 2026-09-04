#!/usr/bin/env bash
# vigía — toma una foto de lo que le importa a este plugin en Orca y en NaN y
# la compara con la anterior (docs/vigia/). Determinista: no juzga, solo enseña
# el diff. El juicio lo pone la automatización de Orca (ver docs/NOTAS.md).
#
#   scripts/vigia.sh            # actualiza snapshots y muestra el diff
#   scripts/vigia.sh --check    # solo muestra qué cambiaría, sin escribir
#   scripts/vigia.sh --precheck # como --check, pero sale 0 si hay cambios y 1 si no
#                               # (para el --precheck de la automatización de Orca:
#                               #  sin cambios no se arranca el agente)
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/vigia"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
CHECK=0; PRE=0
case "${1:-}" in --check) CHECK=1;; --precheck) CHECK=1; PRE=1;; esac
mkdir -p "$OUT/orca" "$OUT/nan"

say() { printf '\n== %s\n' "$*"; }
html2txt() { python3 -c '
import re,html,sys
t=sys.stdin.read()
m=re.search(r"<main.*?</main>",t,flags=re.S); t=m.group(0) if m else t
t=re.sub(r"<script.*?</script>|<style.*?</style>","",t,flags=re.S)
t=re.sub(r"</(p|h[1-6]|li|pre|tr|div)>","\n",t); t=re.sub(r"<[^>]+>","",t); t=html.unescape(t)
print(re.sub(r"\n\s*\n+","\n",t).strip())'; }

# ---------------------------------------------------------------- Orca
say "Orca: fuente del sistema de plugins (stablyai/orca @ main, ficheros raw)"
ORCA_RAW=https://raw.githubusercontent.com/stablyai/orca/main
for f in plugin-capabilities plugin-host-api plugin-manifest plugin-events plugin-host-protocol plugin-panel-shell plugin-content-pack-contributions; do
  curl -sfL --max-time 20 "$ORCA_RAW/src/shared/plugins/$f.ts" -o "$TMP/orca-$f.ts" || echo "  (no pude bajar $f.ts)"
done
curl -sfL --max-time 20 "$ORCA_RAW/src/shared/rate-limit-types.ts" -o "$TMP/orca-rate-limit-types.ts" || true
git ls-remote https://github.com/stablyai/orca.git refs/heads/main 2>/dev/null | cut -c1-12 > "$TMP/orca-commit.txt"
gh api repos/stablyai/orca/contents/examples/plugins --jq '.[].name' 2>/dev/null > "$TMP/orca-examples.txt" || true
say "Orca: doc pública de plugins y versión instalada"
curl -sL --max-time 20 https://www.onorca.dev/docs/settings | html2txt | sed -n '/Plugins (Experimental)/,/^Experimental$/p' > "$TMP/orca-docs-settings-plugins.txt" || true
curl -sL --max-time 20 https://www.onorca.dev/docs/agents/usage-tracking | html2txt | sed -n '/^Usage & rate-limit tracking$/,/← Previous/p' > "$TMP/orca-docs-usage-tracking.txt" || true
defaults read /Applications/Orca.app/Contents/Info.plist CFBundleShortVersionString 2>/dev/null > "$TMP/orca-installed-version.txt" || echo "?" > "$TMP/orca-installed-version.txt"

# ---------------------------------------------------------------- NaN
say "NaN: doc pública desde su fuente (helmcode/nan: models.mdx, getting-started.md, openapi.json)"
NAN_RAW=https://raw.githubusercontent.com/helmcode/nan/main
curl -sfL --max-time 20 "$NAN_RAW/src/content/docs/models.mdx" -o "$TMP/nan-docs-models.mdx" || echo "  (no pude bajar models.mdx)"
curl -sfL --max-time 20 "$NAN_RAW/src/content/docs/getting-started.md" -o "$TMP/nan-docs-getting-started.md" || true
curl -sfL --max-time 20 "$NAN_RAW/src/content/docs/examples.md" -o "$TMP/nan-docs-examples.md" || true
# openapi.json es la referencia de la API: aquí aparecería un endpoint oficial de uso/cuota.
curl -sfL --max-time 20 "$NAN_RAW/src/data/openapi.json" | python3 -c '
import json,sys
try:
    d=json.load(sys.stdin)
    for p,ops in sorted(d.get("paths",{}).items()):
        for m,op in ops.items():
            if isinstance(op,dict): print(m.upper(), p, "-", (op.get("summary") or op.get("operationId") or "")[:80])
except Exception as e: print("error", e)' > "$TMP/nan-openapi-paths.txt" || true
say "NaN: rutas del backend cloud-api (bundle del SPA) y forma de las respuestas"
idx=$(curl -sL --max-time 20 https://cloud.nan.builders/ | grep -o '/assets/index-[A-Za-z0-9_-]*\.js' | head -1)
if [ -n "$idx" ]; then
  curl -sL --max-time 30 "https://cloud.nan.builders$idx" | grep -oE '["`'"'"'](/api/[a-zA-Z0-9/_.:-]*)' | tr -d '"`'"'" | sed 's/\$.*//' | sort -u > "$TMP/nan-cloud-api-routes.txt"
fi
# Forma (solo claves) de las respuestas que usa el plugin; nunca valores.
shape() { python3 -c '
import json,sys
def walk(o,p=""):
    if isinstance(o,dict):
        for k in sorted(o): walk(o[k],p+"."+k)
    elif isinstance(o,list):
        if o: walk(o[0],p+"[]")
    else: print(p, type(o).__name__)
try: walk(json.load(sys.stdin))
except Exception as e: print("error", e)'; }
if command -v nan >/dev/null 2>&1; then
  nan --json quota 2>/dev/null | shape > "$TMP/nan-shape-quota.txt"
  nan --json usage 2>/dev/null | shape | grep -v '^\.timeSeries' > "$TMP/nan-shape-usage.txt"
  nan --json billing 2>/dev/null | shape > "$TMP/nan-shape-billing.txt"
  nan --json models 2>/dev/null | python3 -c 'import json,sys; print("\n".join(sorted(json.load(sys.stdin)["models"])))' > "$TMP/nan-models-live.txt" 2>/dev/null
  # Cuotas (cap por modelo): son parte del contrato, no datos personales.
  nan --json quota 2>/dev/null | python3 -c 'import json,sys; [print(m["model"], m["cap"], "window" if m.get("windowHours") else "") for m in sorted(json.load(sys.stdin)["models"], key=lambda m: m["model"])]' > "$TMP/nan-quota-caps.txt" 2>/dev/null
fi

# ---------------------------------------------------------------- comparar
say "Diff frente al snapshot anterior (docs/vigia/)"
changed=0
for f in "$TMP"/orca-* "$TMP"/nan-*; do
  [ -s "$f" ] || continue
  name=$(basename "$f"); dir=orca; case "$name" in nan-*) dir=nan;; esac
  dest="$OUT/$dir/${name#*-}"
  if [ -f "$dest" ]; then
    if ! diff -q "$dest" "$f" >/dev/null; then
      changed=1; echo "--- CAMBIA: $dir/${name#*-}"; diff -u "$dest" "$f" | sed -n '1,120p'
    fi
  else
    changed=1; echo "--- NUEVO: $dir/${name#*-} ($(wc -l < "$f") líneas)"
  fi
  [ $CHECK -eq 1 ] || cp "$f" "$dest"
done
[ $changed -eq 0 ] && echo "  sin cambios"
echo
echo "orca instalado: $(cat "$TMP/orca-installed-version.txt") · orca main: $(cut -c1-9 "$TMP/orca-commit.txt" 2>/dev/null || echo ?) · $(date +%F)"
if [ $PRE -eq 1 ]; then [ $changed -eq 1 ] && exit 0 || exit 1; fi
exit 0
