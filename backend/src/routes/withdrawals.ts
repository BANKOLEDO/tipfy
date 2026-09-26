import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import { db } from '~/lib/db'
import { AppError } from '~/lib/errors'
import { withdrawSchema, accountValidateSchema } from '~/lib/validations'
import { validate } from '~/middleware/validate'
import { authenticate } from '~/middleware/auth'
import { pinRateLimit, accountLookupRateLimit } from '~/middleware/rateLimit'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { initiateDisbursement, verifyWebhookSignature, validateAccount } from '~/services/monnify'
import { notifyWithdrawalCompleted, notifyWithdrawalProcessing, notifyWithdrawalFailed } from '~/services/notifications'
import { computeWithdrawalFee, estimateWithholdingTax } from '~/lib/fees'
import { getEnv } from '~/config/env'
import { postLedger, withdrawalDebitLegs, withdrawalRefundLegs } from '~/lib/ledger'
import { encryptAccountNumber, readAccountNumber, maskAccountNumber } from '~/lib/crypto'
import {
  claimIdempotencyKey,
  hashRequest,
  readIdempotencyKey,
  replayIdempotent,
} from '~/lib/idempotency'
import { claimWebhookEvent } from '~/lib/webhookEvents'

const router = Router()

// Get withdrawal info (balance, history)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totalAmount: true,
        totalTipsReceived: true,
      },
    })

    const pendingTips = await db.tip.aggregate({
      where: { recipientId: userId, status: 'pending' },
      _sum: { amount: true },
    })

    // In-flight withdrawals are already debited from totalAmount but not yet
    // settled, so they must be excluded here too — otherwise the balance the
    // user is shown disagrees with the one POST / enforces.
    const pendingWithdrawals = await db.withdrawal.aggregate({
      where: { userId, status: { in: ['pending', 'processing'] } },
      _sum: { amount: true },
    })

    const grossBalance = Number(user?.totalAmount || 0)
    const inFlightWithdrawals = Number(pendingWithdrawals._sum.amount || 0)
    const availableBalance = Math.max(0, grossBalance - inFlightWithdrawals)
    const pendingAmount = Number(pendingTips._sum.amount || 0)

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthlyWithdrawals = await db.withdrawal.count({
      where: { userId, createdAt: { gte: monthStart }, status: { not: 'failed' } },
    })

    const withdrawals = await db.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    res.json({
      success: true,
      data: {
        balance: availableBalance,
        grossBalance,
        inFlightWithdrawals,
        pendingAmount,
        totalTips: user?.totalTipsReceived || 0,
        monthlyWithdrawals,
        withdrawalFee: computeWithdrawalFee(monthlyWithdrawals),
        freeWithdrawalsPerMonth: getEnv().FREE_WITHDRAWALS_PER_MONTH,
        withdrawals: withdrawals.map((w) => ({
          id: w.id,
          reference: w.reference,
          amount: Number(w.amount),
          fee: Number(w.fee || 0),
          netAmount: Number(w.netAmount || 0),
          estimatedTax: Number(w.estimatedTax || 0),
          bankCode: w.bankCode,
          bankName: w.bankName,
          accountName: w.accountName,
          status: w.status,
          failureReason: w.failureReason,
          processedAt: w.processedAt,
          createdAt: w.createdAt,
          // accountNumber is masked, and monnifyResponse is deliberately
          // omitted: spreading the whole row leaked the provider payload,
          // which contains the unmasked destination account number that the
          // masking two lines below was meant to hide.
          accountNumber: maskAccountNumber(
            readAccountNumber({
              accountNumberEncrypted: w.accountNumberEncrypted,
              accountNumber: w.accountNumber,
            }),
          ),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Look up a bank account name (Monnify name enquiry) so the user can
// confirm their details before submitting a withdrawal.
router.post(
  '/validate-account',
  authenticate,
  validate(accountValidateSchema),
  accountLookupRateLimit,
  async (req, res, next) => {
    try {
      const { bankCode, accountNumber } = req.body

      const result = await validateAccount(bankCode, accountNumber)

      if (!result.requestSuccessful || !result.responseBody?.accountName) {
        throw AppError.badRequest(result.responseMessage || 'Could not verify account details')
      }

      res.json({
        success: true,
        data: {
          accountNumber: result.responseBody.accountNumber,
          accountName: result.responseBody.accountName,
          bankCode: result.responseBody.bankCode,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Create withdrawal request
router.post(
  '/',
  authenticate,
  validate(withdrawSchema),
  pinRateLimit,
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const { amount, bankCode, accountNumber, pin } = req.body

      // Verify the withdrawal PIN before doing anything
      const pinUser = await db.user.findUnique({
        where: { id: userId },
        select: { withdrawalPinHash: true },
      })

      if (!pinUser?.withdrawalPinHash) {
        throw new AppError('Withdrawal PIN not set. Set a PIN first.', 403, 'PIN_NOT_SET')
      }

      const pinValid = await bcrypt.compare(pin, pinUser.withdrawalPinHash)
      if (!pinValid) {
        throw AppError.unauthorized('Incorrect withdrawal PIN')
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          totalAmount: true,
          displayName: true,
        },
      })

      if (!user) throw AppError.notFound('User not found')

      // Payouts are the one request where a retry is most expensive, so the
      // key is claimed in the same transaction that debits the balance.
      const idemKey = readIdempotencyKey(req.headers['idempotency-key'])
      const idemScope = 'withdrawal:create'
      const idemHash = hashRequest(req.body)
      if (idemKey) {
        const replay = await replayIdempotent<Record<string, unknown>>(idemScope, idemKey, idemHash)
        if (replay) {
          res.status(replay.status).json(replay.body)
          return
        }
      }

      const pendingWithdrawals = await db.withdrawal.aggregate({
        where: {
          userId,
          status: { in: ['pending', 'processing'] },
        },
        _sum: { amount: true },
      })

      const pendingAmount = Number(pendingWithdrawals._sum.amount || 0)
      const available = Number(user.totalAmount) - pendingAmount

      if (amount > available) {
        throw AppError.badRequest(
          `Insufficient balance. Available: ₦${available.toLocaleString()}`
        )
      }

      if (amount < 1000) {
        throw AppError.badRequest('Minimum withdrawal is ₦1,000')
      }

      if (amount > 500000) {
        throw AppError.badRequest('Maximum withdrawal is ₦500,000')
      }

      // Resolve the beneficiary account name via Monnify name enquiry —
      // it's now a mandatory field for disbursements and must match.
      const accountCheck = await validateAccount(bankCode, accountNumber)
      if (!accountCheck.requestSuccessful || !accountCheck.responseBody?.accountName) {
        throw AppError.badRequest(
          accountCheck.responseMessage || 'Unable to verify bank account details'
        )
      }
      const resolvedAccountName = accountCheck.responseBody.accountName

      // Withdrawal fee: first N withdrawals per month are free, then a flat fee
      // comes out of the payout. WHT is recorded as an estimate for reconciliation.
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const monthlyWithdrawals = await db.withdrawal.count({
        where: { userId, createdAt: { gte: monthStart }, status: { not: 'failed' } },
      })
      const withdrawalFee = computeWithdrawalFee(monthlyWithdrawals)
      const netAmount = amount - withdrawalFee
      const estimatedTax = estimateWithholdingTax(netAmount)

      const BANKS: Record<string, string> = {
        '044': 'Access Bank',
        '033': 'United Bank for Africa',
        '057': 'Zenith Bank',
        '011': 'First Bank of Nigeria',
        '070': 'Guaranty Trust Bank',
        '214': 'First City Monument Bank',
        '032': 'Union Bank',
        '035': 'Wema Bank',
        '069': 'Heritage Bank',
        '076': 'Polaris Bank',
        '090': 'Keystone Bank',
        '101': 'Providus Bank',
        '221': 'Stanbic IBTC Bank',
        '068': 'Standard Chartered Bank',
      }

      const bankName = BANKS[bankCode] || 'Unknown Bank'
      const reference = `WD-${uuid().slice(0, 8).toUpperCase()}`
      // Stored only as ciphertext; the plaintext column is left NULL.
      const encrypted = encryptAccountNumber(accountNumber)

      // Atomically debit balance and create withdrawal. The conditional
      // updateMany guards against concurrent withdrawals racing past each
      // other (TOCTOU) and driving the balance negative.
      const withdrawal = await db.$transaction(async (tx) => {
        if (idemKey) {
          const claimed = await claimIdempotencyKey(tx, idemScope, idemKey, userId, idemHash)
          if (!claimed) {
            throw AppError.conflict(
              'A request with this Idempotency-Key is already in progress. Retry shortly.',
            )
          }
        }

        const debited = await tx.user.updateMany({
          where: { id: userId, totalAmount: { gte: amount } },
          data: { totalAmount: { decrement: amount } },
        })

        if (debited.count === 0) {
          const current = await tx.user.findUnique({
            where: { id: userId },
            select: { totalAmount: true },
          })

          const pending = await tx.withdrawal.aggregate({
            where: {
              userId,
              status: { in: ['pending', 'processing'] },
            },
            _sum: { amount: true },
          })

          const available =
            Number(current?.totalAmount || 0) - Number(pending._sum.amount || 0)

          throw AppError.badRequest(
            `Insufficient balance. Available: ₦${available.toLocaleString()}`
          )
        }

        const withdrawal = await tx.withdrawal.create({
          data: {
            userId,
            amount,
            fee: withdrawalFee,
            netAmount,
            estimatedTax,
            bankCode,
            bankName,
            // Left NULL on purpose: the destination account is stored only as
            // ciphertext. See the backfill script for legacy rows.
            accountNumber: null,
            accountNumberEncrypted: encrypted.ciphertext,
            accountNumberLast4: encrypted.last4,
            accountNumberHash: encrypted.lookupHash,
            accountName: resolvedAccountName,
            reference,
            status: 'pending',
          },
        })

        // Journal entry for the same movement, in the same transaction. If the
        // group does not balance this throws and undoes the debit, so money can
        // never move without a record of where it went.
        await postLedger(
          tx,
          `withdrawal:${withdrawal.id}`,
          withdrawalDebitLegs(
            {
              id: withdrawal.id,
              reference,
              userId,
              amount,
              fee: withdrawalFee,
              estimatedTax,
              netAmount,
            },
            // Re-read because updateMany above did not return the row.
            (await tx.user.findUniqueOrThrow({
              where: { id: userId },
              select: { totalAmount: true },
            })).totalAmount,
          ),
        )

        return withdrawal
      })

      let finalStatus = withdrawal.status

      // Mark the payout as "in flight" BEFORE calling Monnify. If the call
      // throws (timeout/network) the outcome is unknown, so we must NOT refund
      // — the webhook or the staleness reaper settles it from Monnify's status.
      await db.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: 'processing' },
      })

      try {
        const disbursement = await initiateDisbursement({
          amount: netAmount,
          bankCode,
          accountNumber,
          accountName: resolvedAccountName,
          reference,
          narration: 'TipFY Withdrawal',
        })

        if (disbursement.requestSuccessful) {
          await db.withdrawal.update({
            where: { id: withdrawal.id },
            data: { monnifyResponse: disbursement as any },
          })
          finalStatus = 'processing'
          await notifyWithdrawalProcessing(userId, amount)
        } else {
          // Monnify explicitly rejected the payout — safe to refund balance.
          await db.$transaction(async (tx) => {
            const refunded = await tx.user.update({
              where: { id: userId },
              data: { totalAmount: { increment: withdrawal.amount } },
              select: { totalAmount: true },
            })

            await tx.withdrawal.update({
              where: { id: withdrawal.id },
              data: {
                status: 'failed',
                failureReason: disbursement.responseMessage,
              },
            })

            // Reverse of the debit posted at creation time.
            await postLedger(              tx,
              `withdrawal-refund:${withdrawal.id}`,
              withdrawalRefundLegs(
                {
                  id: withdrawal.id,
                  reference,
                  userId,
                  amount: withdrawal.amount,
                  fee: withdrawal.fee,
                  estimatedTax: withdrawal.estimatedTax,
                  netAmount: withdrawal.netAmount,
                },
                refunded.totalAmount,
              ),
            )
          })
          finalStatus = 'failed'
          await notifyWithdrawalFailed(userId, amount, disbursement.responseMessage)
        }
      } catch (err) {
        // Ambiguous outcome — do not refund. The webhook or the reaper will
        // settle this once Monnify reports the final disbursement status.
        const message = err instanceof Error ? err.message : 'Disbursement service error'

        await db.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            monnifyResponse: { outcome: 'ambiguous', error: message },
          },
        })

        await logAuditEvent({
          userId,
          action: 'withdrawal.ambiguous',
          resource: 'withdrawal',
          resourceId: withdrawal.id,
          ipAddress: req.ip,
          metadata: { amount, message },
        })

        finalStatus = 'processing'
        await notifyWithdrawalProcessing(userId, amount)
      }

      await logAuditEvent({
        userId,
        action: AuditActions.WITHDRAWAL_REQUEST,
        resource: 'withdrawal',
        resourceId: withdrawal.id,
        ipAddress: req.ip,
        metadata: { amount, bankCode },
      })

      const responseBody = {
        success: true,
        data: {
          withdrawal: {
            id: withdrawal.id,
            reference: withdrawal.reference,
            amount: Number(withdrawal.amount),
            fee: Number(withdrawal.fee || 0),
            netAmount: Number(withdrawal.netAmount || 0),
            estimatedTax: Number(withdrawal.estimatedTax || 0),
            status: finalStatus,
          },
        },
      }

      // Stored last, after the disbursement outcome is known, so a replay
      // reports the real status instead of claiming the payout is still
      // pending when it already failed.
      if (idemKey) {
        await db.idempotencyKey.update({
          where: { scope_key: { scope: idemScope, key: idemKey } },
          data: { responseStatus: 201, responseBody },
        }).catch((err) => {
          console.error(
            `[WITHDRAWAL] Failed to store idempotent response for ${withdrawal.reference}:`,
            err,
          )
        })
      }

      res.status(201).json(responseBody)
    } catch (error) {
      next(error)
    }
  }
)

// Webhook handler for Monnify disbursements
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['monnify-signature'] as string
    const rawBody = (req as any).rawBody

    // Fail closed. Re-serialising req.body would produce different bytes than
    // Monnify signed (key order, whitespace, unicode escaping), so the
    // signature check would reject legitimate webhooks.
    if (!rawBody) {
      throw AppError.badRequest('Unable to verify webhook payload')
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      throw AppError.badRequest('Invalid webhook signature')
    }

    const payload = req.body
    const { eventType, eventData } = payload

    // Monnify retries until it gets a 2xx, so the same event arrives
    // repeatedly. The unique index here makes the first delivery the only one
    // that does any work; the rest are acknowledged and dropped. The status
    // claims further down still guard the money, so this is about not
    // re-deriving a different audit trail for a replay.
    const { claimed } = await claimWebhookEvent({
      provider: 'monnify',
      eventId: eventData?.reference || eventData?.transactionReference || '',
      eventType: eventType || 'unknown',
      payload,
    })
    if (!claimed) {
      return res.status(200).json({ success: true, data: { duplicate: true } })
    }

    // Allowlist rather than the raw payload. A disbursement event carries the
    // destination account number and account-holder name, and GET /admin/audit
    // is readable by the support role — so persisting req.body verbatim would
    // expose unmasked PII that every other serializer masks.
    await logAuditEvent({
      action: 'withdrawal.webhook',
      resource: 'withdrawal',
      resourceId: eventData?.reference || 'unknown',
      ipAddress: req.ip,
      metadata: {
        eventType,
        reference: eventData?.reference,
        status: eventData?.status,
        amount: eventData?.amount,
        currency: eventData?.currency,
      },
    })

    if (eventType === 'SUCCESSFUL_DISBURSEMENT' || eventType === 'DISBURSEMENT_SUCCESS') {
      if (!eventData?.reference) {
        return res.status(400).json({ success: false, message: 'Missing reference' })
      }

      // Monnify retries until it gets a 2xx, so the same event can arrive
      // concurrently. Claim the row with a conditional write and only act if
      // this request is the one that flipped it out of 'processing'.
      const claimed = await db.withdrawal.updateMany({
        where: { reference: eventData.reference, status: 'processing' },
        data: { status: 'completed', processedAt: new Date() },
      })

      if (claimed.count > 0) {
        const withdrawal = await db.withdrawal.findFirst({
          where: { reference: eventData.reference },
          select: { userId: true, amount: true },
        })
        if (withdrawal) {
          await logAuditEvent({
            action: AuditActions.WITHDRAWAL_COMPLETE,
            resource: 'withdrawal',
            resourceId: eventData.reference,
            ipAddress: req.ip,
            metadata: { amount: Number(withdrawal.amount), source: 'webhook' },
          })
          await notifyWithdrawalCompleted(withdrawal.userId, Number(withdrawal.amount))
        }
      }
    }

    if (eventType === 'FAILED_DISBURSEMENT' || eventType === 'DISBURSEMENT_FAILED') {
      if (!eventData?.reference) {
        return res.status(400).json({ success: false, message: 'Missing reference' })
      }

      const existing = await db.withdrawal.findFirst({
        where: { reference: eventData.reference },
        select: {
          id: true,
          userId: true,
          amount: true,
          fee: true,
          netAmount: true,
          estimatedTax: true,
        },
      })

      // Refund balance on confirmed failure. The claim is a conditional write
      // inside the transaction: a read-then-write would let two deliveries of
      // the same event both pass the 'processing' check and both credit the
      // balance back, leaving the user with the money and the payout.
      const refunded = await db.$transaction(async (tx) => {
        const claim = await tx.withdrawal.updateMany({
          where: { reference: eventData.reference, status: 'processing' },
          data: {
            status: 'failed',
            failureReason: eventData?.responseMessage || 'Disbursement failed',
          },
        })
        if (claim.count === 0) return false
        if (existing) {
          const refundedUser = await tx.user.update({
            where: { id: existing.userId },
            data: { totalAmount: { increment: existing.amount } },
            select: { totalAmount: true },
          })

          await postLedger(
            tx,
            `withdrawal-refund:${existing.id}`,
            withdrawalRefundLegs(
              {
                id: existing.id,
                reference: eventData.reference,
                userId: existing.userId,
                amount: existing.amount,
                fee: existing.fee,
                estimatedTax: existing.estimatedTax,
                netAmount: existing.netAmount,
              },
              refundedUser.totalAmount,
            ),
          )
        }
        return true
      })

      if (refunded && existing) {
        await logAuditEvent({
          action: AuditActions.WITHDRAWAL_FAIL,
          resource: 'withdrawal',
          resourceId: eventData.reference,
          ipAddress: req.ip,
          metadata: {
            amount: Number(existing.amount),
            reason: eventData?.responseMessage || 'Disbursement failed',
            source: 'webhook',
          },
        })
        await notifyWithdrawalFailed(
          existing.userId,
          Number(existing.amount),
          eventData?.responseMessage || 'Disbursement failed'
        )
      }
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
