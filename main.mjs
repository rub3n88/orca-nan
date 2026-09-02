// Worker del plugin «NaN Usage» para Orca (pluginApi 1).
// Corre en un proceso Node aparte con entorno saneado (solo PATH/HOME/…), así
// que la key NO llega por env: se lee de ~/.config/nan/api-key, el mismo
// fichero que usa el script `nan` de bin/. Una sola fuente de verdad.
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CLOUD_API = 'https://cloud-api.nan.builders'
const KEY_FILE = join(homedir(), '.config', 'nan', 'api-key')
const THRESHOLD = 0.8
// No machacar con avisos: un check por cada N minutos tras un `done`, y un
// aviso por modelo y periodo (se recuerda en storage).
const CHECK_COOLDOWN_MS = 10 * 60_000
const FETCH_TIMEOUT_MS = 15_000

async function readKey() {
  const raw = await readFile(KEY_FILE, 'utf8').catch(() => '')
  const key = raw.trim()
  if (!key) throw new Error(`falta la API key en ${KEY_FILE}`)
  return key
}

async function api(path) {
  const key = await readKey()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(CLOUD_API + path, {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal
    })
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

const fmt = (n) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n)
const pct = (used, cap) => (cap > 0 ? used / cap : 0)
const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))

function quotaLines(quota) {
  // glm5.2 lleva ventana rodante de 4h además de la cuota mensual: la mostramos
  // contra la ventana, que es la que un agente de código se come primero.
  return quota.models
    .filter((m) => m.tokensUsed > 0 || m.model === 'glm5.2')
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
    const u = await api('/api/metrics/usage')
    const top = (bucket) =>
      (bucket?.byModel ?? [])
        .map((m) => ({ ...m, total: m.inputTokens + m.outputTokens }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
        .map((m) => `${m.model} ${fmt(m.total)}`)
        .join(', ')
    await notify(orca, 'NaN · consumo', [
      `24h: ${fmt(u.last24h?.totalTokens ?? 0)} — ${top(u.last24h)}`,
      `mes: ${fmt(u.monthToDate?.totalTokens ?? 0)} — ${top(u.monthToDate)}`,
      `30d: ${fmt(u.last30d?.totalTokens ?? 0)} · total: ${fmt(u.allTime?.totalTokens ?? 0)}`
    ])
    return { ok: true }
  })

  orca.commands.register('nan-models', async () => {
    // Lo servido ahora mismo (inferencia) cruzado con lo que tiene cuota (cloud).
    const key = await readKey()
    const res = await fetch('https://api.nan.builders/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    })
    if (!res.ok) throw new Error(`/v1/models → HTTP ${res.status}`)
    const live = (await res.json()).data.map((m) => m.id).sort()
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
    const s = b.subscription ?? {}
    const end = s.currentPeriodEnd ? new Date(s.currentPeriodEnd * 1000) : null
    await notify(orca, 'NaN · suscripción', [
      `${me.handle} · tier ${me.tier} · región ${me.region}`,
      `estado ${s.status ?? '?'}${s.premium ? ' · premium (glm5.2)' : ''} · ${(s.currency ?? '').toUpperCase()}`,
      end ? `renueva ${end.toLocaleDateString('es-ES')} (${daysLeft(end)} días)` : 'sin periodo',
      s.cancelAtPeriodEnd ? '⚠ cancelación programada' : ''
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
