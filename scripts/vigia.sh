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
# Descarga con aviso: si una fuente deja de existir (renombrada, retirada) el
# fichero no se crea y más abajo sale como «DESAPARECE», en vez de callarse.
fetch() { curl -sfL --max-time 20 "$1" -o "$2" || echo "  (no pude bajar $1)"; }
say "NaN: doc publicada (nan.builders/api/docs: manifest con hash por página + páginas en markdown)"
NAN_DOCS=https://nan.builders/api/docs
# manifest.json: slug + contentHash de cada página. Un hash que cambia dice QUÉ página tocaron.
curl -sfL --max-time 20 "$NAN_DOCS/manifest.json" -o "$TMP/manifest.json" \
  && python3 -c '
import json,sys
d=json.load(open(sys.argv[1]))
for e in sorted(d.get("entries",[]), key=lambda e: e.get("slug","")): print(e.get("slug"), e.get("contentHash"))' "$TMP/manifest.json" > "$TMP/nan-docs-manifest.txt" \
  || echo "  (no pude bajar manifest.json)"
for slug in models choose-a-model nan-cli getting-started; do fetch "$NAN_DOCS/$slug.md" "$TMP/nan-docs-$slug.md"; done
say "NaN: fuente de la doc (helmcode/nan: models.mdx, openapi.json)"
NAN_RAW=https://raw.githubusercontent.com/helmcode/nan/main
fetch "$NAN_RAW/src/content/docs/models.mdx" "$TMP/nan-docs-models.mdx"
# openapi.json es la referencia de la API: aquí aparecería un endpoint oficial de uso/cuota.
if curl -sfL --max-time 20 "$NAN_RAW/src/data/openapi.json" -o "$TMP/openapi.json"; then
  python3 -c '
import json,sys
d=json.load(open(sys.argv[1]))
for p,ops in sorted(d.get("paths",{}).items()):
    for m,op in ops.items():
        if isinstance(op,dict): print(m.upper(), p, "-", (op.get("summary") or op.get("operationId") or "")[:80])' "$TMP/openapi.json" > "$TMP/nan-openapi-paths.txt"
else echo "  (no pude bajar openapi.json)"; fi
say "NaN: CLI oficial (helmcode/nan-cli: último release y ficha de modelos)"
# El tag del release es la señal de que hay que mirar su changelog (session.json, endpoints, Setup).
gh api repos/helmcode/nan-cli/releases/latest --jq '.tag_name + " " + .published_at' 2>/dev/null > "$TMP/nan-cli-release.txt" \
  || curl -sfL --max-time 20 https://api.github.com/repos/helmcode/nan-cli/releases/latest | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["tag_name"], d["published_at"])' > "$TMP/nan-cli-release.txt" 2>/dev/null \
  || echo "  (no pude leer el último release de nan-cli)"
# internal/models/models.go: la ficha de modelos que NaN mantiene (contexto, output, modalidades, premium).
fetch https://raw.githubusercontent.com/helmcode/nan-cli/main/internal/models/models.go "$TMP/nan-cli-models.go"
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
# Nuestro script, por ruta: `nan` a secas en el PATH es (o será) el CLI oficial de NaN.
NU="$ROOT/bin/nan-usage"
if "$NU" --json quota > "$TMP/quota.json" 2>/dev/null; then
  shape < "$TMP/quota.json" > "$TMP/nan-shape-quota.txt"
  "$NU" --json usage 2>/dev/null | shape | grep -v '^\.timeSeries' > "$TMP/nan-shape-usage.txt"
  "$NU" --json billing 2>/dev/null | shape > "$TMP/nan-shape-billing.txt"
  "$NU" --json models 2>/dev/null | python3 -c 'import json,sys; print("\n".join(sorted(json.load(sys.stdin)["models"])))' > "$TMP/nan-models-live.txt" 2>/dev/null
  # Cuotas (cap por modelo): son parte del contrato, no datos personales.
  python3 -c 'import json,sys; [print(m["model"], m["cap"], "window" if m.get("windowHours") else "") for m in sorted(json.load(sys.stdin)["models"], key=lambda m: m["model"])]' < "$TMP/quota.json" > "$TMP/nan-quota-caps.txt" 2>/dev/null
else
  echo "  (nan-usage no pudo leer la cuota: sin key o sin red; se saltan shape-*, models-live y quota-caps)"
fi

# ---------------------------------------------------------------- comparar
say "Diff frente al snapshot anterior (docs/vigia/)"
changed=0
for f in "$TMP"/orca-* "$TMP"/nan-*; do
  [ -s "$f" ] || continue
  name=$(basename "$f"); dir=orca; case "$name" in nan-*) dir=nan;; esac
  dest="$OUT/$dir/${name#*-}"
  # Informativos: cambian a diario sin que cambie nada que nos afecte. Se guardan, no disparan.
  info=0; case "${name#*-}" in commit.txt|installed-version.txt) info=1;; esac
  if [ -f "$dest" ]; then
    if ! diff -q "$dest" "$f" >/dev/null; then
      if [ $info -eq 1 ]; then echo "--- (info) $dir/${name#*-}: $(cat "$dest") → $(cat "$f")"
      else changed=1; echo "--- CAMBIA: $dir/${name#*-}"; diff -u "$dest" "$f" | sed -n '1,120p'; fi
    fi
  else
    [ $info -eq 1 ] || changed=1; echo "--- NUEVO: $dir/${name#*-} ($(wc -l < "$f") líneas)"
  fi
  [ $CHECK -eq 1 ] || cp "$f" "$dest"
done
# Snapshots sin fuente hoy: la URL murió (renombrado, retirado) o no hubo red. Antes se callaba.
for dest in "$OUT"/orca/* "$OUT"/nan/*; do
  [ -f "$dest" ] || continue
  dir=$(basename "$(dirname "$dest")"); name=$(basename "$dest")
  [ -s "$TMP/$dir-$name" ] && continue
  case "$name" in shape-*|models-live.txt|quota-caps.txt) [ -s "$TMP/quota.json" ] || continue;; esac
  changed=1; echo "--- DESAPARECE: $dir/$name (la fuente no ha bajado hoy; ¿renombrada o retirada?)"
done
[ $changed -eq 0 ] && echo "  sin cambios"
echo
echo "orca instalado: $(cat "$TMP/orca-installed-version.txt") · orca main: $(cut -c1-9 "$TMP/orca-commit.txt" 2>/dev/null || echo ?) · $(date +%F)"
if [ $PRE -eq 1 ]; then [ $changed -eq 1 ] && exit 0 || exit 1; fi
exit 0
