import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createHmac } from 'crypto'
import { createApp } from '~/app'
import { db } from '~/lib/db'
import { getTestApp, registerUser, cleanupTestData } from './helpers'
import { getWarmup } from './setup'

const WEBHOOK_SECRET = 'tipfy-test-webhook-secret'
let request: ReturnType<typeof getTestApp>

beforeAll(async () => {
  await getWarmup()
  request = getTestApp(createApp())
})

afterAll(async () => {
  await cleanupTestData()
})

const suffix = () => Math.random().toString(36).slice(2, 10)

/** Post a webhook the way Monnify does: signed over the exact bytes sent. */
async function postWebhook(payload: unknown) {
  const body = JSON.stringify(payload)
  const signature = createHmac('sha512', WEBHOOK_SECRET).update(body).digest('hex')
  return request
    .post('/api/v1/withdrawals/webhook')
    .set('monnify-signature', signature)
    .set('Content-Type', 'application/json')
    .send(body)
}

async function makeProcessingWithdrawal(netAmount = 4750) {
  const { userData } = await registerUser(request)
  const reference = `W-${suffix()}`
  const withdrawal = await db.withdrawal.create({
    data: {
      userId: (await db.user.findUniqueOrThrow({ where: { email: userData.email } })).id,
      amount: 5000,
      fee: 250,
      netAmount,
      estimatedTax: 0,
      bankCode: '058',
      bankName: 'GTBank',
      accountName: 'Test User',
      reference,
      status: 'processing',
    },
  })
  return withdrawal
}

const successEvent = (reference: string, amount: number, fee: number) => ({
  eventType: 'SUCCESSFUL_DISBURSEMENT',
  eventData: {
    reference,
    amount,
    fee,
    status: 'SUCCESS',
    currency: 'NGN',
    destinationAccountNumber: '0123456789',
    destinationAccountName: 'Test User',
    destinationBankCode: '058',
  },
})

describe('Withdrawal webhook amount verification', () => {
  it('marks a withdrawal paid when the reported principal matches our record', async () => {
    const withdrawal = await makeProcessingWithdrawal(4750)

    const res = await postWebhook(successEvent(withdrawal.reference, 4750, 10))
    expect(res.status).toBe(200)

    const after = await db.withdrawal.findUnique({ where: { reference: withdrawal.reference } })
    expect(after?.status).toBe('completed')
  })

  it('holds a withdrawal when the reported principal does not match', async () => {
    const withdrawal = await makeProcessingWithdrawal(4750)

    const res = await postWebhook(successEvent(withdrawal.reference, 100, 10))
    expect(res.status).toBe(202)

    const after = await db.withdrawal.findUnique({ where: { reference: withdrawal.reference } })
    expect(after?.status).toBe('processing')
  })

  it('holds a withdrawal when the fee is missing', async () => {
    const withdrawal = await makeProcessingWithdrawal(4750)
    const event = successEvent(withdrawal.reference, 4750, 10)
    delete (event.eventData as any).fee

    const res = await postWebhook(event)
    expect(res.status).toBe(202)

    const after = await db.withdrawal.findUnique({ where: { reference: withdrawal.reference } })
    expect(after?.status).toBe('processing')
  })

  it('does not pay out an unknown reference', async () => {
    const res = await postWebhook(successEvent('W-DOES-NOT-EXIST', 4750, 10))
    expect(res.status).toBe(400)
  })
})
