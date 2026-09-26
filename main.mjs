// Worker del plugin «NaN Usage» para Orca (pluginApi 1).
// Corre en un proceso Node aparte con entorno saneado (solo PATH/HOME/…), así
// que la key NO llega por env: se lee de disco en el mismo orden que el script
// `nan-usage` de bin/ (menos $NAN_API_KEY, que aquí no existe): api-key →
// env (pi-fleet) → session.json del CLI oficial de NaN.
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CLOUD_API = 'https://cloud-api.nan.builders'
const INFERENCE = 'https://api.nan.builders/v1'
const NAN_DIR = join(homedir(), '.config', 'nan')
const KEY_FILE = join(NAN_DIR, 'api-key')
const ENV_FILE = join(NAN_DIR, 'env') // pi-fleet: NAN_API_KEY=…
const SESSION_FILE = join(NAN_DIR, 'session.json') // CLI oficial: { token, apiKey }
const THRESHOLD = 0.8
// No machacar con avisos: un check por cada N minutos tras un `done`, y un
// aviso por modelo y periodo (se recuerda en storage).
const CHECK_COOLDOWN_MS = 10 * 60_000
const FETCH_TIMEOUT_MS = 15_000

const readText = (path) => readFile(path, 'utf8').catch(() => '')

async function readKey() {
  const fromFile = (await readText(KEY_FILE)).trim()
  if (fromFile) return fromFile
  const envLine = (await readText(ENV_FILE))
    .split('\n')
    .map((l) => l.trim().replace(/^export\s+/, ''))
    .find((l) => l.startsWith('NAN_API_KEY='))
  const fromEnv = envLine ? envLine.slice('NAN_API_KEY='.length).trim().replace(/^["']|["']$/g, '') : ''
  if (fromEnv) return fromEnv
  let fromSession = ''
  try {
    fromSession = String(JSON.parse((await readText(SESSION_FILE)) || '{}').apiKey ?? '').trim()
  } catch {
    fromSession = ''
  }
  if (fromSession) return fromSession
  throw new Error(`falta la API key: ${KEY_FILE}, ${ENV_FILE} o ${SESSION_FILE} (CLI oficial: nan auth login)`)
}

async function getJson(base, path) {
  const key = await readKey()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(base + path, {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal
    })
    if (!res.ok) throw new Error(`${path.split('?')[0]} → HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}
const api = (path) => getJson(CLOUD_API, path)

// GET /v1/usage (oficial desde 2026-09-26): filas por (día UTC, modelo). Una ventana que cubre
// el mes en curso y los últimos 30 días, todas las páginas.
async function officialUsage() {
  const day = (d) => d.toISOString().slice(0, 10)
  const now = new Date()
  const today = day(now)
  const month = today.slice(0, 8) + '01'
  const last30 = day(new Date(now.getTime() - 29 * 86_400_000))
  const base = `/usage?start_date=${month < last30 ? month : last30}&end_date=${today}&limit=500`
  const rows = []
  let report = null
  let cursor = null
  do {
    const r = await getJson(INFERENCE, base + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''))
    report ??= r
    rows.push(...(r.data ?? []))
    cursor = r.has_more ? r.next_cursor : null
  } while (cursor)
  const bucket = (since) => {
    const by = new Map()
    for (const r of rows) if (r.date >= since) by.set(r.model, (by.get(r.model) ?? 0) + (r.total_tokens ?? 0))
    return { total: [...by.values()].reduce((a, b) => a + b, 0), byModel: [...by].map(([model, total]) => ({ model, total })) }
  }
  return { today: bucket(today), month: bucket(month), last30: bucket(last30), allTime: report.all_time?.total_tokens ?? 0 }
}

// cloud-api /api/metrics/usage (no documentada): respaldo si la oficial falla.
async function cloudUsage() {
  const u = await api('/api/metrics/usage')
  const bucket = (b) => ({
    total: b?.totalTokens ?? 0,
    byModel: (b?.byModel ?? []).map((m) => ({ model: m.model, total: m.inputTokens + m.outputTokens }))
  })
  return { today: bucket(u.last24h), month: bucket(u.monthToDate), last30: bucket(u.last30d), allTime: u.allTime?.totalTokens ?? 0 }
}

const fmt = (n) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n)
const pct = (used, cap) => (cap > 0 ? used / cap : 0)
const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))

function quotaLines(quota) {
  // El premium (glm5.3; antes glm5.2) lleva ventana rodante de 4h además de la
  // cuota por periodo: se enseña siempre, es lo que un agente de código se come primero.
  return quota.models
    .filter((m) => m.tokensUsed > 0 || m.windowHours)
    .sort((a, b) => pct(b.tokensUsed, b.cap) - pct(a.tokensUsed, a.cap))
    .map((m) => {
      const p = Math.round(pct(m.tokensUsed, m.cap) * 100)
      const win = m.windowHours ? ` · ventana ${m.windowHours}h` : ''
      return `${m.model}: ${p}% (${fmt(m.tokensUsed)}/${fmt(m.cap)})${win}`
    })
}

async function notify(orca, title, lines) {
  await orca.host.call('notifications.show', {
    title: title.slice(0, 120),
    body: lines.join('\n').slice(0, 1000)
  })
}

export default function activate(orca) {
  orca.commands.register('nan-quota', async () => {
    const quota = await api('/api/usage/quota')
    const lines = quotaLines(quota)
    const reset = quota.models.find((m) => !m.windowHours)?.periodEnd
    if (reset) lines.push(`reset en ${daysLeft(reset)} días`)
    await notify(orca, 'NaN · cuota por modelo', lines.length ? lines : ['sin consumo este periodo'])
    return { models: quota.models.length }
  })

  orca.commands.register('nan-usage', async () => {
    let u
    let source = 'v1/usage'
    try {
      u = await officialUsage()
    } catch (error) {
      orca.log(`/v1/usage falló (${error instanceof Error ? error.message : String(error)}); uso cloud-api`)
      u = await cloudUsage()
      source = 'cloud-api'
    }
    const top = (bucket) =>
      [...bucket.byModel]
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
        .map((m) => `${m.model} ${fmt(m.total)}`)
        .join(', ')
    // La oficial cuenta por día UTC («hoy»); la de respaldo, 24h rodantes.
    await notify(orca, 'NaN · consumo', [
      `${source === 'v1/usage' ? 'hoy (UTC)' : '24h'}: ${fmt(u.today.total)} — ${top(u.today)}`,
      `mes: ${fmt(u.month.total)} — ${top(u.month)}`,
      `30d: ${fmt(u.last30.total)} · total: ${fmt(u.allTime)}`
    ])
    return { ok: true, source }
  })

  orca.commands.register('nan-models', async () => {
    // Lo servido ahora mismo (inferencia) cruzado con lo que tiene cuota (cloud).
    const live = (await getJson(INFERENCE, '/models')).data.map((m) => m.id).sort()
    const quota = new Map((await api('/api/usage/quota')).models.map((m) => [m.model, m]))
    const lines = live.map((id) => {
      const q = quota.get(id)
      return q ? `${id} · ${fmt(q.tokensUsed)}/${fmt(q.cap)}` : id
    })
    await notify(orca, `NaN · ${live.length} modelos servidos`, lines)
    return { models: live }
  })

  orca.commands.register('nan-billing', async () => {
    const [b, me] = await Promise.all([api('/api/billing'), api('/api/auth/me')])
    const s = b.subscription // cloud-api puede devolver null (transitorio, visto 2026-09-20)
    const end = s?.currentPeriodEnd ? new Date(s.currentPeriodEnd * 1000) : null
    await notify(orca, 'NaN · suscripción', [
      `${me.handle} · tier ${me.tier} · región ${me.region}`,
      s
        ? `estado ${s.status ?? '?'}${s.premium ? ' · premium (glm5.3)' : ''} · ${(s.currency ?? '').toUpperCase()}`
        : 'sin suscripción (cloud-api devolvió subscription=null; reintenta si tienes una activa)',
      s ? (end ? `renueva ${end.toLocaleDateString('es-ES')} (${daysLeft(end)} días)` : 'sin periodo') : '',
      s?.cancelAtPeriodEnd ? '⚠ cancelación programada' : ''
    ].filter(Boolean))
    return { ok: true }
  })

  // Comprobación de umbral: manual (comando) o automática al terminar un agente.
  async function checkThreshold({ force }) {
    const quota = await api('/api/usage/quota')
    const seen = (await orca.host.call('storage.get', { key: 'alerted' }))?.value ?? {}
    const hot = []
    for (const m of quota.models) {
      const p = pct(m.tokensUsed, m.cap)
      if (p < THRESHOLD) continue
      // Clave por modelo+periodo: un aviso por periodo, salvo comprobación forzada.
      const tag = `${m.model}@${m.periodEnd ?? ''}`
      if (!force && seen[tag]) continue
      seen[tag] = Date.now()
      hot.push(`${m.model}: ${Math.round(p * 100)}% (${fmt(m.remaining)} restantes)`)
    }
    await orca.host.call('storage.set', { key: 'alerted', value: seen })
    if (hot.length) await notify(orca, '⚠ NaN · cuota por encima del 80 %', hot)
    else if (force) await notify(orca, 'NaN · todo por debajo del 80 %', quotaLines(quota))
    return hot
  }

  orca.commands.register('nan-check', () => checkThreshold({ force: true }))

  orca.events.on('agent.status.changed', async (payload) => {
    if (payload.state !== 'done') return
    const last = (await orca.host.call('storage.get', { key: 'lastCheckAt' }))?.value ?? 0
    if (Date.now() - last < CHECK_COOLDOWN_MS) return
    await orca.host.call('storage.set', { key: 'lastCheckAt', value: Date.now() })
    try {
      const hot = await checkThreshold({ force: false })
      orca.log(`umbral tras agente done: ${hot.length ? hot.join(' | ') : 'ok'}`)
    } catch (error) {
      orca.log(`check de cuota falló: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
}
