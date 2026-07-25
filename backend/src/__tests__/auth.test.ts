import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
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

describe('Auth - Register', () => {
  it('registers a new user successfully', async () => {
    const res = await registerUser(request)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user).toBeDefined()
    expect(res.body.data.user.email).toBeDefined()
    expect(res.body.data.user.username).toBeDefined()
    expect(res.body.data.user.displayName).toBe('Test User')
    expect(res.body.data.user.passwordHash).toBeUndefined()
  })

  it('rejects duplicate email', async () => {
    const suffix = Math.random().toString(36).slice(2, 8)
    const email = `test+${suffix}@tipfy.test`
    const data = { email, username: `testuser_${suffix}a`, displayName: 'Dup User', password: 'TestPass123' }

    await request.post('/api/v1/auth/register').send(data)
    const res = await request.post('/api/v1/auth/register').send({
      ...data, username: `testuser_${suffix}b`
    })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('rejects duplicate username', async () => {
    const suffix = Math.random().toString(36).slice(2, 8)
    const username = `testuser_${suffix}`
    const data1 = { email: `test+${suffix}a@tipfy.test`, username, displayName: 'User One', password: 'TestPass123' }
    const data2 = { email: `test+${suffix}b@tipfy.test`, username, displayName: 'User Two', password: 'TestPass123' }

    await request.post('/api/v1/auth/register').send(data1)
    const res = await request.post('/api/v1/auth/register').send(data2)

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('rejects short password', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: `test+short@tipfy.test`,
      username: testUsername(),
      displayName: 'Short Pass',
      password: 'Ab1',
    })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Validation failed')
  })

  it('rejects missing fields', async () => {
    const res = await request.post('/api/v1/auth/register').send({})
    expect(res.status).toBe(400)
  })

  it('rejects invalid email', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'not-an-email',
      username: 'testuser',
      displayName: 'Bad Email',
      password: 'TestPass123',
    })
    expect(res.status).toBe(400)
  })

  it('rejects invalid username format', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: `test+invaliduname@tipfy.test`,
      username: '123invalid',
      displayName: 'Bad Username',
      password: 'TestPass123',
    })
    expect(res.status).toBe(400)
  })
})

describe('Auth - Login', () => {
  let registeredEmail: string
  let registeredPassword: string

  beforeAll(async () => {
    const suffix = Math.random().toString(36).slice(2, 8)
    registeredEmail = `test+login${suffix}@tipfy.test`
    registeredPassword = 'TestPass123'
    await request.post('/api/v1/auth/register').send({
      email: registeredEmail,
      username: `testlogin_${suffix}`,
      displayName: 'Login User',
      password: registeredPassword,
    })
  })

  it('logs in with valid credentials', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: registeredEmail,
      password: registeredPassword,
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user.email).toBe(registeredEmail)
    expect(res.body.data.user.passwordHash).toBeUndefined()
  })

  it('rejects wrong password', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: registeredEmail,
      password: 'WrongPassword123',
    })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects non-existent email', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: 'test+nonexistent@tipfy.test',
      password: 'TestPass123',
    })

    expect(res.status).toBe(401)
  })

  it('rejects missing fields', async () => {
    const res = await request.post('/api/v1/auth/login').send({})
    expect(res.status).toBe(400)
  })
})

describe('Auth - Logout', () => {
  it('logs out successfully with valid token', async () => {
    const { userData } = await registerUser(request)
    const loginRes = await request.post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    })
    const token = loginRes.body.data.token

    const res = await request.post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('logs out gracefully without token', async () => {
    const res = await request.post('/api/v1/auth/logout')
    expect(res.status).toBe(200)
  })
})

describe('Auth - /me', () => {
  it('returns user when authenticated', async () => {
    const { userData } = await registerUser(request)
    const loginRes = await request.post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    })
    const token = loginRes.body.data.token

    const res = await request.get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.user).toBeDefined()
    expect(res.body.data.user.email).toBe(userData.email)
  })

  it('returns null user when unauthenticated', async () => {
    const res = await request.get('/api/v1/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.data.user).toBeNull()
  })
})

function testUsername(suffix?: string) {
  return `testuser_${suffix || Math.random().toString(36).slice(2, 8)}`
}
