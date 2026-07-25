import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createApp } from '~/app'
import { getTestApp, registerUser, cleanupTestData } from './helpers'
import { getWarmup } from './setup'

let app: ReturnType<typeof createApp>
let request: ReturnType<typeof getTestApp>

beforeAll(async () => {
  await getWarmup()
  app = createApp()
  request = getTestApp(app)
})

afterAll(async () => {
  await cleanupTestData()
})

describe('Users - Check Username', () => {
  it('returns available for unused username', async () => {
    const res = await request.get('/api/v1/users/check/uniqueusername123')
    expect(res.status).toBe(200)
    expect(res.body.data.available).toBe(true)
  })

  it('returns unavailable for taken username', async () => {
    const suffix = Math.random().toString(36).slice(2, 8)
    const username = `taken_${suffix}`
    await registerUser(request, { username })

    const res = await request.get(`/api/v1/users/check/${username}`)
    expect(res.status).toBe(200)
    expect(res.body.data.available).toBe(false)
  })
})

describe('Users - Public Profile', () => {
  it('returns profile for existing user', async () => {
    const suffix = Math.random().toString(36).slice(2, 8)
    const username = `profile_${suffix}`
    await registerUser(request, { username, displayName: 'Profile User' })

    const res = await request.get(`/api/v1/users/${username}`)
    expect(res.status).toBe(200)
    expect(res.body.data.user.username).toBe(username)
    expect(res.body.data.user.displayName).toBe('Profile User')
    expect(res.body.data.user.passwordHash).toBeUndefined()
  })

  it('returns 404 for nonexistent user', async () => {
    const res = await request.get('/api/v1/users/doesnotexist999')
    expect(res.status).toBe(404)
  })
})

describe('Users - Profile Update', () => {
  it('updates profile when authenticated', async () => {
    const { userData } = await registerUser(request, { displayName: 'Original Name' })
    const loginRes = await request.post('/api/v1/auth/login').send({
      email: userData.email, password: userData.password,
    })
    const token = loginRes.body.data.token

    const res = await request.put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Updated Name', bio: 'New bio' })

    expect(res.status).toBe(200)
    expect(res.body.data.user.displayName).toBe('Updated Name')
    expect(res.body.data.user.bio).toBe('New bio')
  })

  it('rejects update without auth', async () => {
    const res = await request.put('/api/v1/users/profile')
      .send({ displayName: 'Hacker' })

    expect(res.status).toBe(401)
  })

  it('rejects duplicate username on update', async () => {
    const suffix = Math.random().toString(36).slice(2, 8)
    const username1 = `dupe_${suffix}a`
    const username2 = `dupe_${suffix}b`

    await registerUser(request, { username: username1 })
    const { userData } = await registerUser(request, { username: username2 })
    const loginRes = await request.post('/api/v1/auth/login').send({
      email: userData.email, password: userData.password,
    })
    const token = loginRes.body.data.token

    const res = await request.put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: username1 })

    expect(res.status).toBe(409)
  })
})
