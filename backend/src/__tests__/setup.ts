import './env'
import { resolve } from 'path'
import fs from 'fs'

const root = resolve(__dirname, '../..')

function readEnvUrl(file: string): string | undefined {
  const full = resolve(root, file)
  if (!fs.existsSync(full)) return undefined
  const match = fs.readFileSync(full, 'utf8').match(/^DATABASE_URL=["']?(.*?)["']?\s*$/m)
  return match?.[1]
}

// These suites write real rows (users, tips, withdrawals, audit logs) and
// clean up with `email contains 'test+'` rather than rolling back a
// transaction. Pointing them at the live database would pollute production and
// fire real notification/webhook side effects, so refuse to start.
const testUrl = readEnvUrl('.env.test')
const prodUrl = readEnvUrl('.env')
if (testUrl && prodUrl && testUrl === prodUrl) {
  throw new Error(
    'Refusing to run tests: .env.test DATABASE_URL is identical to .env DATABASE_URL.\n' +
      'Create an isolated test database (e.g. a Neon branch) and point .env.test at it.'
  )
}

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
