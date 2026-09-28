import { config } from 'dotenv'
import { resolve } from 'path'
import dns from 'dns'

// Use Google DNS to resolve Neon hostname (ISP DNS can't resolve it)
dns.setServers(['8.8.8.8', '8.8.4.4'])
dns.setDefaultResultOrder('ipv4first')

// This module must be imported before anything that calls getEnv(). getEnv()
// memoizes its result, and lib/db calls it at module load, so a static import
// of lib/db would freeze the environment at whatever process.env held before
// .env.test was loaded -- leaving MONNIFY_WEBHOOK_SECRET (and any other var
// that differs between .env and .env.test) stuck at its .env value.
config({ path: resolve(__dirname, '../../.env.test'), override: true })
process.env.NODE_ENV = 'test'
