# orca-nan

![NaN Usage · plugin de Orca](assets/banner.png)

Tu suscripción de [NaN](https://nan.builders) —cuotas, consumo, modelos, salud— sin salir de
[Orca](https://www.onorca.dev), el IDE de agentes. Dos piezas que se complementan:

- **`nan-usage`**, un script de terminal (Python 3, sin dependencias).
- **NaN Usage**, un plugin de Orca: comandos en la paleta, aviso cuando un modelo pasa del 80 %
  justo al terminar un agente, y un panel que lanza `nan-usage` en tu terminal.

> *Your NaN subscription (quotas, usage, models, health) inside Orca, the agent IDE. A terminal
> script plus an Orca plugin. Spanish UI; the code is commented in Spanish too.*

## Requisitos

- Suscripción de NaN con API key (tier *inference*).
- La key en cualquiera de estos sitios (se buscan en este orden): `$NAN_API_KEY`,
  `~/.config/nan/api-key` (`chmod 600`), `~/.config/nan/env` (línea `NAN_API_KEY=…`) o el
  `~/.config/nan/session.json` que deja el CLI oficial de NaN tras `nan auth login`. Si ya usas el
  oficial, no hay nada que configurar.
- Para el plugin: Orca ≥ 1.4 con **Settings → Plugins (Experimental)** activado.

## Convivencia con el CLI oficial `nan`

NaN publica su propio CLI, [`nan`](https://nan.builders/docs/nan-cli) (`curl -fsSL
https://nan.builders/install | bash`). No compiten: hacen cosas distintas.

| | CLI oficial `nan` | `nan-usage` (este repo) |
|---|---|---|
| Interfaz | TUI (Profile · Usage · Models · Costs · Setup · About) | subcomandos de una línea, `--json` |
| Configurar herramientas | **Setup** escribe la config de OpenCode, Codex, Pi, droid y Hermes | snippets para pegar (`config env|opencode|pi|cursor|zed`) |
| Consumo | `nan metrics usage` (JSON), `nan me` | `usage`, `billing` |
| Cuota **por modelo** con reset y ventana 4h | no | `quota` |
| Latencia y modelo que responde de verdad | no | `ping` |
| Una línea para el prompt / statusline | no | `status` |
| Orca | no | panel, ⌘J, aviso al 80 % |

Hasta la versión 0.1.x este script también se llamaba `nan`. **Si tienes el symlink antiguo
`~/.local/bin/nan`, bórralo** (`rm ~/.local/bin/nan`): tapa al oficial en el PATH y, si instalas
el oficial con `INSTALL_DIR=$HOME/.local/bin`, lo sobrescribe sin avisar.

## `nan-usage` — el script

```sh
ln -s "$PWD/bin/nan-usage" ~/.local/bin/nan-usage     # o cualquier carpeta del PATH
```

```
nan-usage quota              cuota por modelo (usado / cap / reset)
nan-usage usage              consumo 24h · mes · 30d · total, por modelo
nan-usage models             modelos servidos ahora mismo + cuota + notas
nan-usage billing            estado de la suscripción
nan-usage ping [modelo...]   latencia al primer token y qué modelo ha servido de verdad
nan-usage status             una línea, para tu prompt o statusline
nan-usage config <destino>   snippet listo para pegar: env | opencode | pi | cursor | zed
nan-usage --json <cmd>       salida JSON cruda
```

```
$ nan-usage quota
periodo desde 2026-09-01
  glm5.3-flash         ███████░░░░░░░░░░░░░  33.7%   674.4M / 2.00B  reset 14d
  deepseek-v4-flash    ██████░░░░░░░░░░░░░░  29.2%   874.8M / 3.00B  reset 14d
  qwen3.8-flash        █░░░░░░░░░░░░░░░░░░░   6.8%    34.0M / 500.0M reset 14d
  glm5.3               ░░░░░░░░░░░░░░░░░░░░   0.0%        0 / 3.00B  reset 18d  ventana 4h: 400.0M

$ nan-usage ping
  qwen3.8-flash        ok    1.10s primer token
  glm5.3-flash         ok    9.36s primer token
  deepseek-v4-flash    ok    1.26s primer token
```

`ping` avisa si el modelo que responde no es el que pediste (NaN puede degradar de modelo sin
error). `config` genera los snippets con los modelos que hay *ahora*, no con una lista pegada, y
recuerda que el CLI oficial ya configura OpenCode/Codex/Pi/droid/Hermes por sí solo. Ojo con
`config pi`: si usas `@gtrabanco/pi-nan-provider`, el bloque `providers.nan` lo genera la extensión
(o pi-fleet) con los `compat` que necesita; ni este snippet ni el Setup del oficial —que reemplaza
`providers.nan` entero— deben pisarlo.

`models` añade a cada modelo su ficha (contexto, modalidades, respuesta máxima, notas y qué hace con
`reasoning_effort`), tomada de `internal/models/models.go` del CLI oficial y de la doc de NaN. Un `—` en la columna de cuota
significa que ese modelo no sale en `/usage/quota`: imagen, voz y embeddings van por un
presupuesto aparte (`flux-2-klein`, por ejemplo, gasta 20 req/min y 100 req/mes, no tokens).

La línea `reasoning_effort` de cada modelo sale de la doc de NaN (2026-09-18): `glm5.3` y
`glm5.3-flash` admiten `low`·`medium`·`high`·`max`; `qwen3.6` y `gemma4` además `none` y `minimal`
(sin fase de razonamiento) y topan la fase en 2.048 / 8.192 / 16.384 / 32.768 tokens;
`deepseek-v4-flash` razona por su cuenta e ignora el parámetro; `qwen3.8-flash` y `mimo-v2.5` lo
aceptan pero gestionan su profundidad. Un valor que un modelo no aplica **no da error**. La traza
llega en `message.reasoning_content`, aparte de la respuesta.

## NaN Usage — el plugin de Orca

| Dónde | Qué |
|---|---|
| ⌘J → «NaN: …» | **cuota por modelo** (⌘⌥U) · **consumo 24h / mes** · **modelos disponibles** · **suscripción** · **comprobar umbral 80 %** — como notificación de escritorio |
| Automático | Cuando un agente pasa a `done`, mira la cuota (máx. 1 vez / 10 min) y avisa si algún modelo supera el 80 %. Un aviso por modelo y periodo |
| Panel «NaN» (barra derecha) | Botones que escriben `nan-usage quota`, `nan-usage ping`, `nan-usage config …` en la terminal que elijas |

### Instalar (y que se actualice solo)

1. Settings → **Plugins (Experimental)** → activa *Plugin system*.
2. En **Marketplaces** → *Add* → pega `https://github.com/rub3n88/orca-nan.git`. Este repo es a la vez
   plugin y marketplace (lleva su propio `orca-marketplace.json`).
3. Busca **NaN Usage** en la lista, *Install*, y acepta las capacidades que pide: `workspace:read`,
   `terminal:send`, `notifications:show`, `storage`, `events:subscribe`.
4. Deja la key en `~/.config/nan/api-key` (`chmod 600`), en `~/.config/nan/env` o inicia sesión con
   el CLI oficial (`nan auth login`). El worker la lee de disco porque su entorno está saneado y no
   hereda variables.
5. Para los botones del panel, pon `bin/nan-usage` en el PATH (symlink de arriba).

**Actualizar:** cuando haya versión nueva, en Settings → Plugins te aparecerá **Update** junto al
plugin (Orca refresca el marketplace y compara). No hace falta desinstalar; solo vuelve a pedir
consentimiento si cambian las capacidades. *Roll back* deshace la última actualización.

**Para desarrollarlo:** Settings → Plugins → *Development* → añade la carpeta del repo. Orca vigila
los ficheros y recarga sola al guardar; no lo tengas a la vez que la instalación de marketplace.

### Usar el panel

El panel no puede hacer red ni conoce los nombres de tus terminales (la API v0 solo da su orden),
y el orden de la lista no es el de tus pestañas), así que: pulsa **Identificar** y el panel escribe
`# NaN -> terminal N` (sin Enter) en cada terminal del worktree. Mira tu terminal de shell, elige ese
número en *Ejecutar en* y ya: cada botón escribe `nan-usage …` ahí y pulsa Enter. La elección se
recuerda por worktree. Las terminales de agentes suelen rechazar la escritura; si no, borra la marca
con ⌃U.

El atajo ⌘⌥U solo dispara con el foco fuera de una terminal (dentro, Orca deja las teclas al PTY;
usa ⌘J). Se puede cambiar en Settings → Shortcuts, grupo «Plugins».

## Cómo funciona (y por qué así)

La misma API key de inferencia autentica `cloud-api.nan.builders`, el backend del panel web de
NaN, que es donde viven cuotas, consumo y billing. Esas rutas no están documentadas, aunque el CLI
oficial de NaN ya usa las mismas (`/auth/me`, `/metrics/usage`, `/agents/models`): pueden cambiar.
Y a veces fallan a medias: `/api/billing` puede devolver `subscription: null` un rato aunque tengas
suscripción; `billing` (y el comando del plugin) lo dicen tal cual en vez de inventar fechas. Reintenta.

El sistema de plugins de Orca (v0) no tiene barra de estado, ni canal worker → panel, ni permiso de
red declarable todavía. De ahí el reparto: el worker (Node, fuera de proceso) hace las llamadas y
notifica; el panel, que no puede hacer red, delega en el script. Cuando Orca añada `net:fetch`
habrá que declararlo y volver a consentir. Contexto completo y plan en [`docs/NOTAS.md`](docs/NOTAS.md).

## Mantenimiento automático

Una automatización de Orca (diaria, solo si algo cambió) corre `scripts/vigia.sh`, que compara la
API de plugins de Orca, la doc/API de NaN y el CLI oficial (`helmcode/nan-cli`: release y ficha de
modelos) con el snapshot en `docs/vigia/`, y si algo cambia (una capacidad nueva en Orca, un
endpoint oficial de uso en NaN, modelos o cuotas) adapta el plugin, lo prueba, lo mergea en `main` y
publica la release (versión patch). Es autónomo; el criterio está en `docs/vigia/PROMPT.md`. Si el
cambio es grande o ambiguo escribe un informe en `docs/vigia/` en vez de implementarlo.

## Desarrollo

```sh
ELECTRON_RUN_AS_NODE=1 /Applications/Orca.app/Contents/MacOS/Orca scripts/test-worker.mjs
```

Ejecuta los comandos del worker con el Node del propio Orca contra la API real, simulando el
objeto `orca` que inyecta el host. `scripts/panel-preview.html` previsualiza el panel en un navegador
normal simulando el bridge del host.

MIT · [Rubén León](https://github.com/rub3n88) · hecho para la comunidad de NaN
