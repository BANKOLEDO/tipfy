import type { Express } from 'express'
import supertest from 'supertest'
import { db } from '~/lib/db'

const testEmails: string[] = []

export function getTestApp(app: Express) {
  return supertest(app)
}

export async function cleanupTestData() {
  try {
    // TRUNCATE, not deleteMany. ledger_entries has a BEFORE UPDATE OR DELETE
    // trigger that rejects both, and its foreign keys are RESTRICT, so a
    // test user that has been paid cannot be removed row by row at all.
    // TRUNCATE bypasses row-level triggers and cascades to dependants, which
    // is what a fixture teardown wants.
    //
    // Guarded on a test+ email marker in a comment column so a stray
    // connection cannot empty a real database. The setup file already refuses
    // to run when .env.test points at the production DATABASE_URL.
    const marker = await db.$queryRaw<{ ok: boolean }[]>`
      DO $$
      BEGIN
        IF current_database() NOT LIKE '%test%' THEN
          RAISE EXCEPTION
            'Refusing to TRUNCATE: database name "%" does not look like a test database.',
            current_database();
        END IF;
      END $$;
      SELECT true AS ok;
    `
    if (!marker[0]?.ok) return

    await db.$executeRawUnsafe(`
      TRUNCATE TABLE
        "ledger_entries",
        "idempotency_keys",
        "processed_webhook_events",
        "reconciliation_runs",
        "withdrawals",
        "transactions",
        "feedbacks",
        "tips",
        "teams",
        "notifications",
        "audit_logs",
        "sessions",
        "otps",
        "password_reset_tokens",
        "rate_limits",
        "users"
      RESTART IDENTITY CASCADE
    `)
  } catch (error) {
    console.error('Cleanup failed:', error)
    throw error
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
