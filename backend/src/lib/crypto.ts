import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
} from 'crypto'
import { getEnv } from '~/config/env'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateApiKey(): string {
  return randomBytes(32).toString('hex')
}

// ---------------------------------------------------------------------------
// Authenticated encryption for bank details.
//
// The old helper was AES-256-CBC with a static IV from ENCRYPTION_IV, and
// nothing called it. A fixed IV means identical account numbers produce
// identical ciphertexts, and CBC without a MAC lets anyone with write access
// flip bits and decrypt to a different account number.
//
// This is AES-256-GCM: fresh 12-byte IV per value, stored alongside the
// ciphertext, with the auth tag verified on decrypt. Layout is
// `v1:<iv hex>:<tag hex>:<ciphertext hex>`.
//
// ENCRYPTION_IV is no longer read but stays in the env schema so existing
// deployments still boot. Remove it once nothing sets it.
// ---------------------------------------------------------------------------

const ENCRYPTION_VERSION = 'v1'

function encryptionKey(): Buffer {
  const key = Buffer.from(getEnv().ENCRYPTION_KEY, 'hex')
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes of hex (64 chars); got ${key.length} bytes. ` +
        `It is used directly as an AES-256 key, not stretched.`,
    )
  }
  return key
}

export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [
    ENCRYPTION_VERSION,
    iv.toString('hex'),
    tag.toString('hex'),
    ciphertext.toString('hex'),
  ].join(':')
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 4 || parts[0] !== ENCRYPTION_VERSION) {
    throw new Error(
      'Unrecognised ciphertext format. Expected v1:<iv>:<tag>:<ciphertext>. ' +
        'Values written by the old static-IV AES-CBC helper cannot be read and ' +
        'must be re-encrypted from plaintext.',
    )
  }
  const iv = Buffer.from(parts[1], 'hex')
  const tag = Buffer.from(parts[2], 'hex')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(Buffer.from(parts[3], 'hex')),
    decipher.final(),
  ]).toString('utf8')
}

// Keyed, non-reversible index for lookups. HMAC rather than a plain hash
// because the input space is small enough to brute-force offline.
export function blindIndex(value: string): string {
  return createHmac('sha256', encryptionKey())
    .update(value.trim().toUpperCase())
    .digest('hex')
}

/**
 * Constant-time string comparison. Used for OTP verification so a caller
 * cannot learn the code one character at a time from response timings.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) {
    // timingSafeEqual throws on a length mismatch, so compare against itself
    // to keep the work constant, then report the mismatch.
    timingSafeEqual(bufA, bufA)
    return false
  }  return timingSafeEqual(bufA, bufB)
}

export interface EncryptedAccountNumber {
  ciphertext: string
  last4: string
  lookupHash: string
}

/**
 * What to store for a withdrawal's destination account.
 *
 * `ciphertext` is the only way back to the full number. `last4` lets the UI
 * show which account a payout went to without decrypting. `lookupHash` is a
 * keyed blind index for equality lookups.
 *
 * The plaintext column is not written for new rows.
 */
export function encryptAccountNumber(accountNumber: string): EncryptedAccountNumber {
  const digits = accountNumber.replace(/\D/g, '')
  return {
    ciphertext: encrypt(digits),
    last4: digits.slice(-4),
    lookupHash: blindIndex(digits),
  }
}

/** Reads the full account number, tolerating rows not yet backfilled. */
export function readAccountNumber(row: {
  accountNumberEncrypted: string | null
  accountNumber: string | null
}): string {
  if (row.accountNumberEncrypted) return decrypt(row.accountNumberEncrypted)
  const legacy = row.accountNumber?.replace(/\D/g, '')
  if (!legacy) {
    throw new Error(
      'Withdrawal has neither an encrypted nor a plaintext account number. ' +
        'The row is unreadable; investigate before attempting a payout.',
    )
  }
  return legacy
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
