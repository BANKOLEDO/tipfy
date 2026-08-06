import crypto from 'crypto'
import { getEnv } from '~/config/env'

const MONNIFY_BASE_URL =
  getEnv().NODE_ENV === 'production'
    ? 'https://api.monnify.com'
    : 'https://sandbox.monnify.com'

let accessTokenCache: { token: string; expiresAt: number } | null = null

interface MonnifyAuthResponse {
  requestSuccessful: boolean
  responseMessage: string
  responseBody: {
    accessToken: string
    expiresIn: number
  }
}

async function getAccessToken(): Promise<string> {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token
  }

  const env = getEnv()
  const credentials = Buffer.from(
    `${env.MONNIFY_API_KEY}:${env.MONNIFY_SECRET_KEY}`
  ).toString('base64')

  const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  })

  const data = (await response.json()) as MonnifyAuthResponse

  if (!data.requestSuccessful) {
    throw new Error(
      `Monnify auth failed: ${data.responseMessage || 'Unknown error'}`
    )
  }

  accessTokenCache = {
    token: data.responseBody.accessToken,
    expiresAt: Date.now() + 55 * 60 * 1000,
  }

  return accessTokenCache.token
}

export interface InitializePaymentInput {
  amount: number
  customerName: string
  customerEmail: string
  transactionReference: string
  paymentDescription: string
  redirectUrl?: string
  metadata?: Record<string, string>
}

export interface MonnifyPaymentResponse {
  requestSuccessful: boolean
  responseMessage: string
  responseCode: string
  responseBody: {
    transactionReference: string
    paymentReference: string
    checkoutUrl?: string
    amount: number
    transactionDate: string
    paymentMethod: string
    paymentStatus: string
    paymentDescription: string
  }
}

export interface MonnifyWebhookPayload {
  eventType: string
  eventData: {
    transactionReference: string
    paymentReference: string
    amount: number
    paidAt: string
    paymentStatus: string
    paymentMethod: string
    customerName: string
    customerEmail: string
    metadata: Record<string, string>
  }
}

export interface MonnifyDisbursementResponse {
  requestSuccessful: boolean
  responseMessage: string
  responseCode: string
  responseBody: {
    reference: string
    amount: number
    bankCode: string
    bankAccountNumber: string
    accountName: string
    narration: string
    status: string
  }
}

export interface MonnifyAccountValidationResponse {
  requestSuccessful: boolean
  responseMessage: string
  responseCode: string
  responseBody: {
    accountNumber: string
    accountName: string
    bankCode: string
  }
}

export interface MonnifyDisbursementStatusResponse {
  requestSuccessful: boolean
  responseMessage: string
  responseBody?: {
    content?: Array<{
      reference: string
      amount: number
      status: string
      responseMessage?: string
      dateCreated?: string
    }>
    totalElements?: number
  }
}

export async function initializePayment(
  data: InitializePaymentInput
): Promise<MonnifyPaymentResponse> {
  const token = await getAccessToken()
  const env = getEnv()

  const body: Record<string, unknown> = {
    amount: data.amount,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    paymentReference: data.transactionReference,
    paymentDescription: data.paymentDescription,
    currencyCode: 'NGN',
    contractCode: env.MONNIFY_CONTRACT_CODE,
    paymentMethods: env.MONNIFY_PAYMENT_METHODS.split(',').map((m) => m.trim()).filter(Boolean),
    redirectUrl: data.redirectUrl,
  }

  if (data.metadata && Object.keys(data.metadata).length > 0) {
    body.metaData = data.metadata
  }

  const response = await fetch(
    `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  return (await response.json()) as MonnifyPaymentResponse
}

export async function verifyTransaction(
  reference: string
): Promise<MonnifyPaymentResponse> {
  const token = await getAccessToken()

  // We initiate payments with our own reference as the `paymentReference`,
  // so verify using that (Monnify's `transactionReference` is generated
  // server-side and unknown to us).
  const response = await fetch(
    `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query?paymentReference=${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return (await response.json()) as MonnifyPaymentResponse
}

export async function validateAccount(
  bankCode: string,
  accountNumber: string
): Promise<MonnifyAccountValidationResponse> {
  const token = await getAccessToken()

  const response = await fetch(
    `${MONNIFY_BASE_URL}/api/v2/disbursements/account/validate?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return (await response.json()) as MonnifyAccountValidationResponse
}

export async function initiateDisbursement(data: {
  amount: number
  bankCode: string
  accountNumber: string
  accountName: string
  reference: string
  narration?: string
}): Promise<MonnifyDisbursementResponse> {
  const token = await getAccessToken()
  const env = getEnv()

  const sourceAccountNumber = env.MONNIFY_WALLET_ACCOUNT_NUMBER
  if (!sourceAccountNumber) {
    throw new Error(
      'MONNIFY_WALLET_ACCOUNT_NUMBER is not set. Copy your WALLET ACCOUNT NUMBER from the Monnify dashboard (Disbursements page).'
    )
  }

  const response = await fetch(
    `${MONNIFY_BASE_URL}/api/v2/disbursements/single`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        reference: data.reference,
        narration: data.narration || 'TipFY Withdrawal',
        destinationBankCode: data.bankCode,
        destinationAccountNumber: data.accountNumber,
        destinationAccountName: data.accountName,
        sourceAccountNumber,
        currency: 'NGN',
      }),
    }
  )

  return (await response.json()) as MonnifyDisbursementResponse
}

export async function getDisbursementStatus(
  reference: string
): Promise<MonnifyDisbursementStatusResponse> {
  const token = await getAccessToken()

  const response = await fetch(
    `${MONNIFY_BASE_URL}/api/v2/disbursements/search?page=0&size=10&searchTerm=${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return (await response.json()) as MonnifyDisbursementStatusResponse
}

export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) return false
  const env = getEnv()
  const secret = env.MONNIFY_WEBHOOK_SECRET
  if (!secret) return false

  const expected = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex')

  // timingSafeEqual throws on length mismatch — normalize lengths first
  // so malformed signatures fail cleanly instead of 500ing.
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return false

  return crypto.timingSafeEqual(sigBuf, expBuf)
}
