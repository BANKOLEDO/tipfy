import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '~/lib/db'
import { createToken, verifyTokenAsync } from '~/lib/jwt'
import { hashToken, generateResetToken, generateOTP } from '~/lib/crypto'
import { AppError } from '~/lib/errors'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, setWithdrawalPinSchema } from '~/lib/validations'
import { validate } from '~/middleware/validate'
import { authenticate } from '~/middleware/auth'
import { authRateLimit } from '~/middleware/rateLimit'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { notifyWithdrawalPinSet } from '~/services/notifications'
import { getEnv } from '~/config/env'

const router = Router()

router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { email, username, displayName, password, isBusiness, businessName, businessCategory } =
        req.body

      const existingUser = await db.user.findFirst({
        where: { OR: [{ email }, { username }] },
      })

      if (existingUser) {
        if (existingUser.email === email) {
          throw AppError.conflict('Email already registered')
        }
        throw AppError.conflict('Username already taken')
      }

      const env = getEnv()
      const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

      const user = await db.user.create({
        data: {
          email,
          username,
          displayName,
          passwordHash,
          isBusiness: isBusiness || false,
          businessName: businessName || null,
          businessCategory: businessCategory || null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isBusiness: true,
        },
      })

      const token = await createToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: 'user',
      })

      const tokenHash = hashToken(token)

      await db.session.create({
        data: {
          userId: user.id,
          tokenHash,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ),
        },
      })

      await logAuditEvent({
        userId: user.id,
        action: AuditActions.USER_REGISTER,
        resource: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.status(201).json({
        success: true,
        data: {
          message: 'Account created successfully',
          token,
          user,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body

      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          passwordHash: true,
          isBusiness: true,
          isActive: true,
          role: true,
        },
      })

      if (!user) {
        throw AppError.unauthorized('Invalid email or password')
      }

      if (!user.isActive) {
        throw AppError.forbidden('Account has been deactivated')
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        throw AppError.unauthorized('Invalid email or password')
      }

      const token = await createToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      })

      const env = getEnv()

      // Auto-promote admin if email matches ADMIN_EMAIL env
      let userRole = user.role
      if (env.ADMIN_EMAIL && user.email === env.ADMIN_EMAIL && user.role !== 'admin') {
        await db.user.update({ where: { id: user.id }, data: { role: 'admin' } })
        userRole = 'admin'
      }

      // Re-issue token with correct role if promoted
      const finalToken = userRole !== user.role
        ? await createToken({ userId: user.id, email: user.email, username: user.username, role: userRole })
        : token

      const tokenHash = hashToken(finalToken)

      await db.session.create({
        data: {
          userId: user.id,
          tokenHash,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ),
        },
      })

      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      await logAuditEvent({
        userId: user.id,
        action: AuditActions.USER_LOGIN,
        resource: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.json({
        success: true,
        data: {
          token: finalToken,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            isBusiness: user.isBusiness,
            role: userRole,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const tokenHash = hashToken(token)

      await db.session.deleteMany({ where: { tokenHash } })

      if (req.user) {
        await logAuditEvent({
          userId: req.user.userId,
          action: AuditActions.USER_LOGOUT,
          resource: 'user',
          resourceId: req.user.userId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        })
      }
    }

    res.json({ success: true, data: { message: 'Logged out' } })
  } catch (error) {
    next(error)
  }
})

router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.json({ success: true, data: { user: null } })
    }

    const token = authHeader.slice(7)
    const payload = await verifyTokenAsync(token)

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        isBusiness: true,
        businessName: true,
        businessCategory: true,
        totalTipsReceived: true,
        totalAmount: true,
        rating: true,
        withdrawalPinHash: true,
        isVerified: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return res.json({ success: true, data: { user: null } })
    }

    const { withdrawalPinHash, ...safeUser } = user

    res.json({
      success: true,
      data: {
        user: {
          ...safeUser,
          totalAmount: Number(safeUser.totalAmount),
          rating: Number(safeUser.rating),
          hasWithdrawalPin: Boolean(withdrawalPinHash),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// ─── Withdrawal PIN ────────────────────────────────────────────
// Send a 6-digit OTP to the user's email to prove identity before
// setting a withdrawal PIN for the first time.
router.post(
  '/withdrawal-pin/send-otp',
  authenticate,
  authRateLimit,
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, withdrawalPinHash: true },
      })
      if (!user) throw AppError.notFound('User not found')

      if (user.withdrawalPinHash) {
        throw AppError.badRequest('Withdrawal PIN already set')
      }

      // Invalidate any outstanding OTPs for this purpose
      await db.otp.deleteMany({
        where: { userId, purpose: 'withdrawal_pin', usedAt: null },
      })

      const otp = generateOTP(6)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      await db.otp.create({
        data: {
          userId,
          otpHash: hashToken(otp),
          purpose: 'withdrawal_pin',
          expiresAt,
        },
      })

      const env = getEnv()

      if (env.RESEND_API_KEY) {
        const { Resend } = await import('resend')
        const resend = new Resend(env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'tipfy <noreply@tipfy.app>',
          to: user.email,
          subject: 'Your tipfy verification code',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="margin:0 0 8px">Verify it's you</h2>
              <p style="color:#666;margin:0 0 24px">Use this code to set your withdrawal PIN. It expires in 10 minutes.</p>
              <div style="background:#F3F4F6;border-radius:12px;padding:20px;text-align:center;letter-spacing:8px;font-size:28px;font-weight:800;color:#1F2937">${otp}</div>
              <p style="color:#999;margin:24px 0 0;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        })
      } else {
        console.log(`[DEV] Withdrawal PIN OTP for ${user.email}: ${otp}`)
      }

      await logAuditEvent({
        userId,
        action: 'WITHDRAWAL_PIN_OTP_SENT',
        resource: 'user',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.json({ success: true, data: { message: 'Verification code sent to your email' } })
    } catch (error) {
      next(error)
    }
  }
)

// Set the withdrawal PIN after verifying the OTP
router.post(
  '/withdrawal-pin',
  authenticate,
  authRateLimit,
  validate(setWithdrawalPinSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId
      const { otp, pin } = req.body

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { withdrawalPinHash: true },
      })
      if (!user) throw AppError.notFound('User not found')

      if (user.withdrawalPinHash) {
        throw AppError.badRequest('Withdrawal PIN already set')
      }

      const otpRecord = await db.otp.findFirst({
        where: { userId, purpose: 'withdrawal_pin', usedAt: null },
        orderBy: { createdAt: 'desc' },
      })

      if (!otpRecord) {
        throw AppError.badRequest('No verification code found. Request a new one.')
      }

      if (new Date() > otpRecord.expiresAt) {
        throw AppError.badRequest('Verification code has expired. Request a new one.')
      }

      if (otpRecord.attempts >= 5) {
        throw AppError.tooMany('Too many incorrect attempts. Request a new code.')
      }

      if (hashToken(otp) !== otpRecord.otpHash) {
        await db.otp.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        })
        throw AppError.badRequest('Incorrect verification code')
      }

      const env = getEnv()
      const pinHash = await bcrypt.hash(pin, env.BCRYPT_ROUNDS)

      await db.$transaction([
        db.user.update({
          where: { id: userId },
          data: { withdrawalPinHash: pinHash },
        }),
        db.otp.update({
          where: { id: otpRecord.id },
          data: { usedAt: new Date() },
        }),
      ])

      await logAuditEvent({
        userId,
        action: 'WITHDRAWAL_PIN_SET',
        resource: 'user',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      notifyWithdrawalPinSet(userId).catch(() => {})

      res.json({ success: true, data: { message: 'Withdrawal PIN set successfully' } })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body
      const env = getEnv()

      // Always return success to prevent email enumeration
      const user = await db.user.findUnique({ where: { email } })

      if (!user) {
        return res.json({ success: true, data: { message: 'If an account exists, a reset email has been sent' } })
      }

      // Invalidate any existing reset tokens for this user
      await db.passwordResetToken.deleteMany({ where: { userId: user.id } })

      const { raw, hash } = generateResetToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hash,
          expiresAt,
        },
      })

      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${raw}`

      if (env.RESEND_API_KEY) {
        const { Resend } = await import('resend')
        const resend = new Resend(env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'tipfy <noreply@tipfy.app>',
          to: email,
          subject: 'Reset your tipfy password',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="margin:0 0 8px">Reset your password</h2>
              <p style="color:#666;margin:0 0 24px">Click the link below to set a new password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a>
              <p style="color:#999;margin:24px 0 0;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        })
      } else {
        console.log(`[DEV] Password reset URL: ${resetUrl}`)
      }

      await logAuditEvent({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.json({ success: true, data: { message: 'If an account exists, a reset email has been sent' } })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const { token, password } = req.body

      const tokenHash = hashToken(token)

      const resetToken = await db.passwordResetToken.findUnique({
        where: { tokenHash },
      })

      if (!resetToken) {
        throw AppError.badRequest('Invalid or expired reset token')
      }

      if (resetToken.usedAt) {
        throw AppError.badRequest('Reset token has already been used')
      }

      if (new Date() > resetToken.expiresAt) {
        throw AppError.badRequest('Reset token has expired')
      }

      const env = getEnv()
      const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

      await db.$transaction([
        db.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash },
        }),
        db.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
        // Invalidate all sessions for this user
        db.session.deleteMany({ where: { userId: resetToken.userId } }),
      ])

      await logAuditEvent({
        userId: resetToken.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'user',
        resourceId: resetToken.userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.json({ success: true, data: { message: 'Password reset successfully' } })
    } catch (error) {
      next(error)
    }
  }
)

export default router
