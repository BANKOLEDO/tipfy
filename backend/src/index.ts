import 'dotenv/config'
import dns from 'dns'

// Fix DNS resolution — ISP DNS can't resolve Neon, Monnify, etc.
dns.setServers(['8.8.8.8', '8.8.4.4'])

import { createApp } from '~/app'
import { getEnv } from '~/config/env'

const env = getEnv()
const app = createApp()

const PORT = env.PORT

app.listen(PORT, () => {
  console.log(`🚀 TipFY API running on port ${PORT}`)
  console.log(`📡 Environment: ${env.NODE_ENV}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})

export default app
