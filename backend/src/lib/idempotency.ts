import { createHash } from 'crypto'
import { Prisma } from '@prisma/client'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'

// ---------------------------------------------------------------------------
// Idempotency for money-creating requests.
//
// POST /tips and POST /withdrawals charge or pay out. A client that retries
// because it did not see the response would otherwise do it twice, and nothing
// downstream stops it: Monnify's reference uniqueness only covers the tip
// reference we generate per request, not the user's intent to pay once.
//
// A client sends `Idempotency-Key: <uuid>`. The first request stores the key
// with the response it produced. A retry with the same key replays that stored
// response instead of acting again. A retry with the same key but a different
// body is rejected, because that is a client bug and silently returning the
// old answer would hide it.
// ---------------------------------------------------------------------------

const KEY_RETENTION_HOURS = 24

export function hashRequest(body: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(body ?? null))
    .digest('hex')
}

export interface IdempotentRecord<T> {
  status: number
  body: T
}

/** Reads a previously stored response, or null if the key is unused/expired. */
export async function replayIdempotent<T>(
  scope: string,
  key: string,
  requestHash: string,
): Promise<IdempotentRecord<T> | null> {
  const existing = await db.idempotencyKey.findUnique({
    where: { scope_key: { scope, key } },
  })

  if (!existing) return null

  if (existing.expiresAt < new Date()) {
    // Expired keys are left for a cleanup pass rather than deleted here, so a
    // replay cannot race a delete and end up acting twice.
    return null
  }

  if (existing.requestHash !== requestHash) {
    throw AppError.conflict(
      'This Idempotency-Key was already used with a different request body. ' +
        'Use a new key, or resend the original request unchanged.',
    )
  }

  if (existing.responseStatus == null || existing.responseBody == null) {
    throw AppError.conflict(
      'A request with this Idempotency-Key is still in progress. Retry shortly.',
    )
  }

  return {
    status: existing.responseStatus,
    body: existing.responseBody as T,
  }
}

/**
 * Claims a key for the current request. Must run inside the same transaction
 * that performs the work, so the key and the effect commit together.
 *
 * Returns false if another request already claimed it, which means this caller
 * lost the race and should not act.
 */
export async function claimIdempotencyKey(
  tx: Prisma.TransactionClient,
  scope: string,
  key: string,
  userId: string | null,
  requestHash: string,
): Promise<boolean> {
  try {
    await tx.idempotencyKey.create({
      data: {
        scope,
        key,
        userId,
        requestHash,
        expiresAt: new Date(Date.now() + KEY_RETENTION_HOURS * 3600_000),
      },
    })
    return true
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return false
    }
    throw err
  }
}

/** Stores the response so a later retry can replay it. */
export async function storeIdempotentResponse(
  tx: Prisma.TransactionClient,
  scope: string,
  key: string,
  status: number,
  body: unknown,
): Promise<void> {
  await tx.idempotencyKey.update({
    where: { scope_key: { scope, key } },
    data: { responseStatus: status, responseBody: body as Prisma.InputJsonValue },
  })
}

/** Pulls the header into a usable shape, rejecting values we cannot index. */
export function readIdempotencyKey(header: unknown): string | null {
  if (typeof header !== 'string') return null
  const key = header.trim()
  if (!key) return null
  if (key.length > 255) {
    throw AppError.badRequest('Idempotency-Key must be 255 characters or fewer.')
  }
  return key
}
