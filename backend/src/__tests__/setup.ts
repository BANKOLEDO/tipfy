import { config } from 'dotenv'
import { resolve } from 'path'
import dns from 'dns'

// Use Google DNS to resolve Neon hostname (ISP DNS can't resolve it)
dns.setServers(['8.8.8.8', '8.8.4.4'])
dns.setDefaultResultOrder('ipv4first')

config({ path: resolve(__dirname, '../../.env.test'), override: true })

process.env.NODE_ENV = 'test'

import { db } from '~/lib/db'

// Warm up the DB connection with retries (Neon cold-start needs time)
let _warmup: Promise<any> | null = null
export function getWarmup() {
  if (!_warmup) {
    _warmup = (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await db.$queryRaw`SELECT 1`
          return
        } catch (err: any) {
          if (attempt === 3) throw err
          await new Promise((r) => setTimeout(r, 2000 * attempt))
        }
      }
    })()
  }
  return _warmup
}
