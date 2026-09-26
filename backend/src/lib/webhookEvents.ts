import { createHash } from 'crypto'
import { db } from '~/lib/db'

// Monnify retries a webhook until it gets a 2xx, so the same event legitimately
// arrives many times over hours or days. The conditional status claims in the
// handlers stop a duplicate from moving money twice; this table stops the
// duplicate from being processed at all, which is cheaper and means a replay
// cannot produce a different audit trail from the first delivery.

export interface WebhookEventKey {
  provider: string
  eventId: string
  eventType: string
  payload: unknown
}

/**
 * Best-effort stable identifier for an event.
 *
 * Prefers the provider's own reference and falls back to a hash of the payload.
 * A hash fallback means two genuinely distinct events with no reference of
 * their own would collide and the second would be dropped, so callers that
 * cannot supply a reference should not use this.
 */
export function eventKeyFor(input: WebhookEventKey): string {
  const explicit = (input.payload as Record<string, unknown> | undefined)?.transactionReference
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim()
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(input.payload ?? null))
    .digest('hex')}`
}

/**
 * Records the event. Returns false when this event has already been seen, in
 * which case the caller should acknowledge it without acting.
 */
export async function claimWebhookEvent(
  key: WebhookEventKey,
): Promise<{ claimed: boolean }> {
  const eventId = eventKeyFor(key)
  const payloadHash = createHash('sha256')
    .update(JSON.stringify(key.payload ?? null))
    .digest('hex')

  try {
    await db.processedWebhookEvent.create({
      data: {
        provider: key.provider,
        eventId,
        eventType: key.eventType,
        payloadHash,
        status: 'processed',
      },
    })
    return { claimed: true }
  } catch (err: any) {
    // P2002 = the unique (provider, event_id) index already holds this event.
    if (err?.code === 'P2002') return { claimed: false }
    throw err
  }
}
