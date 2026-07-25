import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createApp } from '~/app'
import { getTestApp, cleanupTestData } from './helpers'

let app: ReturnType<typeof createApp>
let request: ReturnType<typeof getTestApp>

beforeAll(async () => {
  app = createApp()
  request = getTestApp(app)
})

afterAll(async () => {
  await cleanupTestData()
})

describe('Health & 404', () => {
  it('GET /health returns healthy', async () => {
    const res = await request.get('/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('healthy')
  })

  it('returns 404 for unknown routes', async () => {
    const res = await request.get('/api/v1/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect(res.body.error.message).toBe('Resource not found')
    expect(res.body.error.message).not.toContain('/api/v1')
  })

  it('POST to unknown route returns 404', async () => {
    const res = await request.post('/api/v1/auth/nonexistent').send({})
    expect(res.status).toBe(404)
  })
})
