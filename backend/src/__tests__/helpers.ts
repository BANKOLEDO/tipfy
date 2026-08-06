import type { Express } from 'express'
import supertest from 'supertest'
import { db } from '~/lib/db'

const testEmails: string[] = []

export function getTestApp(app: Express) {
  return supertest(app)
}

export async function cleanupTestData() {
  try {
    await db.auditLog.deleteMany({ where: { action: { contains: 'test' } } })
    await db.notification.deleteMany({ where: { user: { email: { contains: 'test+' } } } })
    await db.feedback.deleteMany({ where: { sender: { email: { contains: 'test+' } } } })
    await db.feedback.deleteMany({ where: { recipient: { email: { contains: 'test+' } } } })
    await db.withdrawal.deleteMany({ where: { user: { email: { contains: 'test+' } } } })
    await db.team.deleteMany({ where: { business: { email: { contains: 'test+' } } } })
    await db.team.deleteMany({ where: { member: { email: { contains: 'test+' } } } })
    await db.transaction.deleteMany({ where: { tip: { recipient: { email: { contains: 'test+' } } } } })
    await db.tip.deleteMany({ where: { recipient: { email: { contains: 'test+' } } } })
    await db.tip.deleteMany({ where: { sender: { email: { contains: 'test+' } } } })
    await db.session.deleteMany({ where: { user: { email: { contains: 'test+' } } } })
    await db.user.deleteMany({ where: { email: { contains: 'test+' } } })
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
}

export function testEmail(suffix: string = Math.random().toString(36).slice(2, 8)) {
  const email = `test+${suffix}@tipfy.test`
  testEmails.push(email)
  return email
}

export function testUsername(suffix: string = Math.random().toString(36).slice(2, 8)) {
  return `testuser_${suffix}`
}

export async function registerUser(
  request: supertest.Agent,
  overrides: Record<string, any> = {}
) {
  const suffix = Math.random().toString(36).slice(2, 8)
  const data = {
    email: testEmail(suffix),
    username: testUsername(suffix),
    displayName: 'Test User',
    password: 'TestPass123',
    ...overrides,
  }
  const res = await request.post('/api/v1/auth/register').send(data)
  // res.body is a getter that a plain spread would drop — preserve it.
  return { ...res, body: res.body, userData: data }
}

export async function loginUser(
  request: supertest.Agent,
  email: string,
  password: string = 'TestPass123'
) {
  return request.post('/api/v1/auth/login').send({ email, password })
}
