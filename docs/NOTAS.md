# Notas de contexto y roadmap

Escrito el 2026-09-02, tras la investigación inicial. Sirve para retomar esto dentro de meses
sin volver a leer el código de Orca.

## Qué queríamos

Ver la suscripción de NaN (cuotas por modelo, consumo, billing) dentro de Orca, y de paso
cualquier otra cosa que NaN y Orca pudieran compartir a través de los plugins de Orca.

## Lo que encontramos

### Orca plugins (v1.4.195, «Experimental», pluginApi 1)

Fuente: `stablyai/orca` en GitHub (`src/shared/plugins/*`, `src/main/plugins/*`,
`examples/plugins/hello-orca`). No hay doc pública más allá de dos párrafos en
`docs/settings#plugins-experimental`; el schema real está en `plugin-manifest.ts`.

- Manifiesto `orca-plugin.json` (`manifestVersion: 1`, `pluginApi: 1`), `contributes` **estricto**:
  `panels`, `commands`, `events`, `keybindings`, `languagePacks`, `vmRecipes`, `agents`.
  El marketplace oficial ya publica `contributes.skills`, que esta build rechaza: la API se mueve
  por delante de la app.
- Capacidades (set cerrado, sin scope): `workspace:read`, `terminal:send`, `notifications:show`,
  `storage`, `secrets`, `events:subscribe`, `settings:own`. El código anuncia `net:fetch` con hosts y
  `process:exec` «en fases posteriores».
- Host API v0 (13 métodos): `workspace.readContext`, `terminal.sendText`, `notifications.show`,
  `storage.*`, `secrets.*`, `settings.*`, `events.subscribe`. Solo los tres primeros son llamables
  desde un panel.
- Eventos: `worktree.created`, `worktree.removed`, `agent.status.changed` (`working|blocked|waiting|done`).
- **Panel**: iframe sandboxed con CSP `default-src 'none'; connect-src 'none'` → sin red. No existe
  canal worker → panel. Un panel no puede mostrar datos vivos de fuera.
- **Worker**: Node plano (`ELECTRON_RUN_AS_NODE`, Node 24) fuera de proceso, `execArgv: []`, entorno
  allowlist (`PATH`, `HOME`, `LANG`, `TZ`, `TMPDIR`…): no hereda variables. Se arranca al primer
  comando/evento y muere a los 5 min de idle (`PLUGIN_WORKER_IDLE_REAP_MS`). Tiene `fetch` porque
  nadie lo bloquea, no porque esté permitido.
- Comandos: aparecen en ⌘J con prefijo `plugin:`; sin argumentos. `keybindings` funcionan **solo con
  el foco en contexto `app`** (`use-global-keybindings.ts`: en terminal/editor/browser mandan sus
  propios handlers). Si el usuario está en una terminal, el atajo no hace nada: ⌘J sí.
- `workspace.readContext` devuelve las terminales del worktree **sin título** (el binding proyecta
  solo `handle`; el delegado sí tiene `title`) e incluye las de agentes. `terminal.sendText` a una
  sesión de agente puede fallar con «PTY write refused» (lease) o teclear en su prompt. De ahí el
  botón «Marcar» (texto sin Enter) para identificar la terminal.
- Las capacidades que llama el panel (`workspace:read`, `terminal:send`) hay que declararlas
  aunque el worker no las use; el error llega al panel como `plugin does not have the … capability`.
- Instalación: marketplace git (`orca-marketplace.json` en la raíz de un repo; entradas con
  `source.kind: git` + `ref`) o carpeta de desarrollo (Settings → Plugins → Development). `.git` en
  la raíz queda fuera del hash de contenido; límite 50 MB.
- Roster de uso de Orca (barra de estado): proveedores cableados en `src/main/rate-limits/*`
  (`claude`, `codex`, `gemini`, `opencode-go`, `kimi`, `minimax`, `grok`, `antigravity`). **MiniMax**
  es el precedente de proveedor remoto por credencial (cookie en Settings → Integrations), ~18
  ficheros no-test entre `main/rate-limits`, `shared/*-types` y settings.

### NaN

- `api.nan.builders/v1` (LiteLLM) no expone uso: `/v1/usage`, `/key/info`, `/spend/logs` → 404.
- **La misma API key autentica `https://cloud-api.nan.builders`**, backend del SPA
  `cloud.nan.builders`. Rutas sacadas del bundle JS, no documentadas:
  - `GET /api/usage/quota` → `periodStart`, `models[{model, tokensUsed, cap, remaining, periodEnd,
    updatedAt}]`; glm5.2 añade `fullWindowTokens` + `windowHours` (ventana rodante 4h).
  - `GET /api/metrics/usage` → `last24h`, `last30d`, `monthToDate`, `allTime` (cada uno con
    `totalTokens` + `byModel[{model,inputTokens,outputTokens}]`) y `timeSeries[{date,model,…}]`.
    SSE en `/api/metrics/usage/sse` (evento `usage_snapshot`).
  - `GET /api/billing` → `subscription{status, currentPeriodStart/End (epoch), premium,
    cancelAtPeriodEnd, currency}`.
  - `GET /api/auth/me` → handle, tier, región, namespace, features.
  - `GET /api/keys`, `/api/agents`, `/api/apps`, `/api/spaces`, `/api/agents/models`.
  - `GET /api/projects` (público), `POST /api/projects` (name, description, imageUrl, appUrl,
    repoUrl, tags ⊂ {agents, tools, mcp, websites, automation, ai, data, voice, api}); solo tier
    inference. Es la sección «Projects» de nan.builders.
- Cloudflare devuelve **403 al User-Agent por defecto de `urllib`**; curl y Node pasan. El script
  manda UA propio.
- Latencias medidas (primer token, 2026-09-02): qwen3.8-flash 1,1 s · deepseek-v4-flash 1,6 s ·
  glm5.3-flash 9,4 s (reasoning por defecto).

## Decisiones

- **Script + plugin, no solo plugin.** El panel no puede hacer red, así que el panel escribe
  `nan …` en la terminal y el script hace el trabajo. El worker solo para lo que un script no
  puede: notificar y reaccionar a `agent.status.changed`.
- **Key en `~/.config/nan/api-key`**, una sola fuente para script y worker (el worker no hereda env).
  No usamos el vault `secrets` porque no hay forma de meter la key desde la UI (los comandos no
  reciben argumentos).
- **Aviso solo al 80 % y con memoria**: un aviso por modelo y periodo, comprobación como mucho cada
  10 min tras un `done`. Sin polling: el worker muere solo.
- Textos en español: es para la comunidad de NaN.
- Descartado: automations de Orca (arrancan un agente entero para un curl) y `agents` del
  manifiesto (solo valida ruta y tamaño; sin schema público).

## Roadmap

### Plugin (aquí)

1. Umbral y cooldown configurables vía `settings:own` cuando Orca tenga UI de settings de plugin.
2. Ventana 4h de glm5.2: hoy mostramos la cuota mensual; el consumo de la ventana no viene en la API.
   Pedirlo a NaN o derivarlo de `timeSeries`.
3. Aviso de renovación de periodo (`billing.currentPeriodEnd` a ≤ 2 días) en el mismo check.
4. `secrets` en vez de fichero cuando exista una vía de entrada (settings UI o comando con args).
5. Declarar `net:fetch` en cuanto exista y re-consentir. Vigilar `PLUGIN_CAPABILITY_KINDS` en
   `src/shared/plugins/plugin-capabilities.ts`.
6. Panel con datos vivos si Orca abre canal worker → panel o permite `storage.get` desde panel.
7. Versión EN de textos si se comparte fuera de NaN. Tests del worker con el arnés de `scripts/`.

### Upstream a `stablyai/orca` (cuando tenga sentido)

Lo que de verdad queremos —NaN en el roster de uso de la barra de estado, con chip al 80 % y
tiempo de reset— **no se puede hacer con plugins v0**. Se puede como proveedor nativo:

- Precedente: MiniMax (`src/main/rate-limits/minimax-fetcher.ts`, `minimax-request-context.ts`,
  `src/main/ipc/minimax-credentials.ts`, `src/main/minimax/minimax-cookie-store.ts`, más el
  union `provider` en `shared/rate-limit-types.ts`, `status-bar-defaults`, `global-settings-types`,
  `default-global-settings`, `persisted-ui-state-types`, `ui-chrome-types` y la sección de
  Settings → Integrations).
- Mapeo: `ProviderRateLimits{provider:'nan', session, weekly, updatedAt, status, usageMetadata}`.
  NaN no tiene ventana de 5 h/semana: la mensual por modelo iría como `weekly`-equivalente con
  `resetAt = periodEnd`, y la ventana 4h de glm5.2 como `session`.
- Cómo venderlo: mejor como **proveedor genérico «OpenAI-compatible quota»** (endpoint + bearer +
  mapeo JSON) que como «NaN»; Stably no va a mantener un proveedor de nicho.
- Paso previo barato: abrir issue preguntando por `net:fetch` para plugins y por un proveedor
  genérico de cuota. Si contestan que los plugins tendrán status-bar + red, no hace falta el PR.
- Tiene sentido si: (a) NaN documenta o estabiliza `cloud-api` (hoy es ingeniería inversa) y
  (b) hay más gente de NaN usando Orca. Sin (a), un PR upstream se rompe con el primer cambio de NaN.

### NaN

- Publicar en Projects (`nan.builders/projects`) con tags `tools`, `api`, `agents`.
- Pedir a NaN un endpoint documentado de cuota/uso (aunque sea el mismo `cloud-api`) para no
  depender de rutas del bundle. Y `tokensUsed` de la ventana 4h de glm5.2.

## Vigía (automatización semanal en Orca)

`scripts/vigia.sh` fotografía lo que le importa al plugin y lo compara con `docs/vigia/`:
- Orca: ficheros raw de `stablyai/orca@main` (`plugin-capabilities`, `plugin-host-api`,
  `plugin-manifest`, `plugin-events`, `plugin-host-protocol`, `plugin-panel-shell`,
  `plugin-content-pack-contributions`, `rate-limit-types`), commit de main, ejemplos, la sección
  «Plugins (Experimental)» y la página de usage-tracking de la doc, versión instalada.
- NaN: la doc desde su fuente pública `helmcode/nan` (`models.mdx`, `getting-started.md`,
  `examples.md`, `openapi.json` → lista de endpoints oficiales), rutas de cloud-api sacadas del bundle
  del SPA, forma (solo claves) de `/api/usage/quota`, `/api/metrics/usage`, `/api/billing`, modelos
  servidos y caps por modelo.
Una automatización de Orca (`nan-orca-vigia`, diaria 10:00 Europe/Madrid, agente claude; el precheck `vigia.sh --precheck` la salta si no hay cambios, y el commit de Orca y la versión instalada no cuentan como cambio) ejecuta el
script y aplica el criterio de `docs/vigia/PROMPT.md`: cambios de código → rama `vigia/<fecha>` + PR;
solo snapshots → commit en main; nunca publica. Se lanza a mano con `orca automations run`.

## Cómo se probó

- Script: todos los subcomandos contra la API real.
- Worker: `scripts/test-worker.mjs` con el Node de Orca y `env -i` (entorno saneado como el real);
  los cinco comandos y el evento `done` responden.
- Plugin instalado en Orca como plugin de desarrollo; ⌘⌥U y el panel funcionan.
