// Arnés mínimo: simula el objeto `orca` que Orca inyecta al worker y ejecuta
// los comandos contra la API real. `node scripts/test-worker.mjs`.
import activate from '../main.mjs'

const commands = new Map()
const events = new Map()
const storage = new Map()
const orca = {
  commands: { register: (id, fn) => commands.set(id, fn) },
  events: { on: (name, fn) => events.set(name, fn) },
  log: (line) => console.log('[log]', line),
  host: {
    call: async (method, params) => {
      if (method === 'notifications.show') {
        console.log(`\n🔔 ${params.title}\n${params.body}`)
        return { delivered: true }
      }
      if (method === 'storage.get') return { value: storage.get(params.key) ?? null }
      if (method === 'storage.set') {
        storage.set(params.key, params.value)
        return { ok: true }
      }
      throw new Error(`método no simulado: ${method}`)
    }
  }
}

activate(orca)
for (const id of ['nan-quota', 'nan-usage', 'nan-billing', 'nan-check']) {
  console.log(`\n=== ${id}`)
  console.log('→', JSON.stringify(await commands.get(id)()))
}
console.log('\n=== evento agent.status.changed (done)')
await events.get('agent.status.changed')({ worktreeId: 'w1', paneKey: 'p1', state: 'done', receivedAt: Date.now() })
console.log('storage:', Object.fromEntries(storage))
