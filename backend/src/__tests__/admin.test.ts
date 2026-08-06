import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import express from 'express'
import { createApp } from '~/app'
import { db } from '~/lib/db'
import { getTestApp, registerUser, cleanupTestData } from './helpers'
import { getWarmup } from './setup'

// Deterministic OTP so tests don't depend on email delivery or console
// output. The verification logic under test still hashes and validates it.
vi.mock('~/lib/crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/crypto')>()
  return {
    ...actual,
    generateOTP: vi.fn(() => '123456'),
  }
})

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

async function createStaff(role: 'admin' | 'support' = 'admin') {
  const { userData } = await registerUser(request)
  const user = await db.user.update({
    where: { email: userData.email },
    data: { role },
    select: { id: true, email: true },
  })
  return user
}

async function staffLogin(email: string) {
  return request
    .post('/api/v1/auth/login')
    .send({ email, password: 'TestPass123' })
}

async function staffSession(role: 'admin' | 'support' = 'admin') {
  const user = await createStaff(role)
  await staffLogin(user.email)
  const res = await request
    .post('/api/v1/auth/login/verify-otp')
    .send({ email: user.email, otp: '123456' })
  return { user, token: res.body.data.token as string }
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

const suffix = () => Math.random().toString(36).slice(2, 10)

describe('Admin 2FA login', () => {
  it('requires an email OTP for staff and issues no token', async () => {
    const staff = await createStaff('admin')
    const loginRes = await staffLogin(staff.email)

    expect(loginRes.status).toBe(200)
    expect(loginRes.body.data.requiresOtp).toBe(true)
    expect(loginRes.body.data.token).toBeUndefined()
    expect(loginRes.body.data.email).toContain('***')
  })

  it('completes OTP verification and issues a session', async () => {
    const staff = await createStaff('admin')
    await staffLogin(staff.email)

    const res = await request
      .post('/api/v1/auth/login/verify-otp')
      .send({ email: staff.email, otp: '123456' })

    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user.role).toBe('admin')
  })

  it('rejects an incorrect OTP', async () => {
    const staff = await createStaff('support')
    const loginRes = await staffLogin(staff.email)
    expect(loginRes.body.data.requiresOtp).toBe(true)

    const res = await request
      .post('/api/v1/auth/login/verify-otp')
      .send({ email: staff.email, otp: '000000' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Incorrect verification code')
  })

  it('rejects an expired OTP', async () => {
    const staff = await createStaff('admin')
    await staffLogin(staff.email)

    await db.otp.updateMany({
      where: { userId: staff.id, purpose: 'admin_login', usedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    const res = await request
      .post('/api/v1/auth/login/verify-otp')
      .send({ email: staff.email, otp: '123456' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('expired')
  })

  it('does not require an OTP for regular users', async () => {
    const { body, userData } = await registerUser(request)
    expect(body.data.token).toBeDefined()
    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: userData.email, password: 'TestPass123' })

    expect(res.status).toBe(200)
    expect(res.body.data.requiresOtp).toBeUndefined()
    expect(res.body.data.token).toBeDefined()
  })
})

describe('Admin tip actions', () => {
  it('updates a tip message and category', async () => {
    const { user, token } = await staffSession()
    const tip = await db.tip.create({
      data: {
        reference: `TIP-TEST-${suffix()}`,
        recipientId: user.id,
        senderName: 'Tester',
        amount: 1000,
        platformFee: 50,
        netAmount: 950,
        totalCharged: 1000,
        status: 'completed',
        message: 'old message',
        category: 'general',
        completedAt: new Date(),
      },
    })

    const res = await request
      .patch(`/api/v1/admin/tips/${tip.id}`)
      .set(auth(token))
      .send({ message: 'new message', category: 'content' })

    expect(res.status).toBe(200)
    expect(res.body.data.tip.message).toBe('new message')
    expect(res.body.data.tip.category).toBe('content')

    const updated = await db.tip.findUnique({ where: { id: tip.id } })
    expect(updated?.message).toBe('new message')
    expect(updated?.category).toBe('content')
  })

  it('deletes a completed tip and reverses the credited ledger', async () => {
    const { user, token } = await staffSession()
    const amount = 5000
    const platformFee = 250
    const netCredit = amount - platformFee

    await db.user.update({
      where: { id: user.id },
      data: { totalAmount: { increment: netCredit }, totalTipsReceived: { increment: 1 } },
    })

    const tip = await db.tip.create({
      data: {
        reference: `TIP-TEST-${suffix()}`,
        recipientId: user.id,
        senderName: 'Tester',
        amount,
        platformFee,
        netAmount: netCredit,
        totalCharged: amount,
        status: 'completed',
        completedAt: new Date(),
      },
    })
    await db.transaction.create({
      data: {
        tipId: tip.id,
        amount,
        currency: 'NGN',
        paymentMethod: 'card',
        monnifyResponse: { test: true },
        status: 'completed',
        completedAt: new Date(),
      },
    })

    const res = await request
      .delete(`/api/v1/admin/tips/${tip.id}`)
      .set(auth(token))

    expect(res.status).toBe(200)

    const [tipAfter, transactionAfter, userAfter] = await Promise.all([
      db.tip.findUnique({ where: { id: tip.id } }),
      db.transaction.findUnique({ where: { tipId: tip.id } }),
      db.user.findUnique({ where: { id: user.id }, select: { totalAmount: true, totalTipsReceived: true } }),
    ])
    expect(tipAfter).toBeNull()
    expect(transactionAfter).toBeNull()
    expect(Number(userAfter?.totalAmount || 0)).toBe(0)
    expect(userAfter?.totalTipsReceived).toBe(0)
  })

  it('blocks regular users from admin endpoints', async () => {
    const { body, userData } = await registerUser(request)
    expect(body.data.token).toBeDefined()

    const res = await request.get('/api/v1/admin/stats').set(auth(body.data.token))
    expect(res.status).toBe(403)
    expect(userData.email).toBeDefined()
  })
})

describe('Admin withdrawal actions', () => {
  it('cancels a pending withdrawal and refunds the balance', async () => {
    const { user, token } = await staffSession()
    const amount = 2000

    const withdrawal = await db.withdrawal.create({
      data: {
        userId: user.id,
        amount,
        fee: 0,
        netAmount: amount,
        estimatedTax: 0,
        bankCode: '044',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Test Account',
        reference: `WD-TEST-${suffix()}`,
        status: 'pending',
      },
    })

    const res = await request
      .post(`/api/v1/admin/withdrawals/${withdrawal.id}/cancel`)
      .set(auth(token))
      .send({ action: 'cancel', reason: 'Admin test' })

    expect(res.status).toBe(200)
    expect(res.body.data.refunded).toBe(amount)

    const [withdrawalAfter, userAfter] = await Promise.all([
      db.withdrawal.findUnique({ where: { id: withdrawal.id } }),
      db.user.findUnique({ where: { id: user.id }, select: { totalAmount: true } }),
    ])
    expect(withdrawalAfter?.status).toBe('failed')
    expect(withdrawalAfter?.failureReason).toBe('Admin test')
    expect(Number(userAfter?.totalAmount || 0)).toBe(amount)
  })

  it('refuses to cancel a processing withdrawal', async () => {
    const { user, token } = await staffSession()
    const withdrawal = await db.withdrawal.create({
      data: {
        userId: user.id,
        amount: 1000,
        fee: 0,
        netAmount: 1000,
        estimatedTax: 0,
        bankCode: '044',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Test Account',
        reference: `WD-TEST-${suffix()}`,
        status: 'processing',
      },
    })

    const res = await request
      .post(`/api/v1/admin/withdrawals/${withdrawal.id}/cancel`)
      .set(auth(token))
      .send({ action: 'cancel' })

    expect(res.status).toBe(409)
    const after = await db.withdrawal.findUnique({ where: { id: withdrawal.id } })
    expect(after?.status).toBe('processing')
  })

  it('deletes a failed withdrawal record', async () => {
    const { user, token } = await staffSession()
    const withdrawal = await db.withdrawal.create({
      data: {
        userId: user.id,
        amount: 1000,
        fee: 0,
        netAmount: 1000,
        estimatedTax: 0,
        bankCode: '044',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Test Account',
        reference: `WD-TEST-${suffix()}`,
        status: 'failed',
      },
    })

    const res = await request
      .delete(`/api/v1/admin/withdrawals/${withdrawal.id}`)
      .set(auth(token))

    expect(res.status).toBe(200)
    expect(await db.withdrawal.findUnique({ where: { id: withdrawal.id } })).toBeNull()
  })

  it('refuses to delete a non-failed withdrawal', async () => {
    const { user, token } = await staffSession()
    const withdrawal = await db.withdrawal.create({
      data: {
        userId: user.id,
        amount: 1000,
        fee: 0,
        netAmount: 1000,
        estimatedTax: 0,
        bankCode: '044',
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Test Account',
        reference: `WD-TEST-${suffix()}`,
        status: 'completed',
      },
    })

    const res = await request
      .delete(`/api/v1/admin/withdrawals/${withdrawal.id}`)
      .set(auth(token))

    expect(res.status).toBe(409)
    expect(await db.withdrawal.findUnique({ where: { id: withdrawal.id } })).toBeDefined()
  })
})
