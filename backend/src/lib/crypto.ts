import {
  createHash,
  randomBytes,
  randomInt,
  createCipheriv,
  createDecipheriv,
} from 'crypto'
import { getEnv } from '~/config/env'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateApiKey(): string {
  return randomBytes(32).toString('hex')
}

export function encrypt(text: string): string {
  const env = getEnv()
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex')
  const iv = Buffer.from(env.ENCRYPTION_IV, 'hex')
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const env = getEnv()
  const [ivHex, encrypted] = encryptedText.split(':')
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length !== 4) return '****'
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4)
}

export function maskBVN(bvn: string): string {
  if (bvn.length !== 11) return '***********'
  return bvn.slice(0, 3) + '****' + bvn.slice(-4)
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 5000)
}

export function generateOTP(length: number = 6): string {
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += randomInt(0, 10).toString()
  }
  return otp
}

export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}
