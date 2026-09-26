import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '~/lib/db'
import { createToken, verifyTokenAsync } from '~/lib/jwt'
import { hashToken, generateResetToken, generateOTP } from '~/lib/crypto'
import { AppError } from '~/lib/errors'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, setWithdrawalPinSchema, verifyAdminOtpSchema } from '~/lib/validations'
import { validate } from '~/middleware/validate'
import { authenticate } from '~/middleware/auth'
import { authRateLimit } from '~/middleware/rateLimit'
import { logAuditEvent, AuditActions } from '~/lib/audit'
import { notifyWithdrawalPinSet } from '~/services/notifications'
import { getEnv } from '~/config/env'

const router = Router()

// Transactional mail is required for these flows (admin OTP, withdrawal PIN,
// password reset). If Resend is not configured we must fail loudly rather than
// fall back to logging the secret to stdout, which would leak OTPs and reset
// links into production logs.
function requireEmailDelivery() {
  if (!getEnv().RESEND_API_KEY) {
    console.error('[AUTH] RESEND_API_KEY is not configured; refusing to send security email')
    throw new AppError(
      'Email delivery is not configured. Please contact support.',
      503,
      'EMAIL_NOT_CONFIGURED'
    )
  }
}

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

      const env = getEnv()

      // Auto-promote admin if email matches ADMIN_EMAIL env
      let userRole = user.role
      if (env.ADMIN_EMAIL && user.email === env.ADMIN_EMAIL && user.role !== 'admin') {
        await db.user.update({ where: { id: user.id }, data: { role: 'admin' } })
        userRole = 'admin'
      }

      // ─── Staff 2FA ─────────────────────────────────────────────
      // Admin and support accounts must verify an email OTP before a
      // session is issued. No token is returned from /login for these
      // roles — the client must complete /auth/login/verify-otp.
      const isStaff = userRole === 'admin' || userRole === 'support'
      if (isStaff) {
        // Same reasoning as the withdrawal PIN: prior codes are retained, not
        // deleted, so the attempt counter cannot be reset by simply logging in
        // again. Without this, 5 guesses per login is a 5-guess-per-request
        // oracle against a 6-digit code.
        const COOLDOWN_MS = 60 * 1000
        const MAX_PER_HOUR = 5
        const MAX_FAILURES_PER_HOUR = 10
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

        const recent = await db.otp.findMany({
          where: { userId: user.id, purpose: 'admin_login', createdAt: { gte: oneHourAgo } },
          select: { createdAt: true, attempts: true },
        })

        if (recent.length >= MAX_PER_HOUR) {
          throw AppError.tooMany('Too many verification codes requested. Try again later.')
        }

        const lastIssued = recent[0]?.createdAt
        if (lastIssued && Date.now() - lastIssued.getTime() < COOLDOWN_MS) {
          throw AppError.tooMany('Please wait before requesting another code.')
        }

        const totalFailures = recent.reduce((sum, row) => sum + row.attempts, 0)
        if (totalFailures >= MAX_FAILURES_PER_HOUR) {
          throw AppError.tooMany('Too many incorrect attempts. Try again later.')
        }

        await db.otp.updateMany({
          where: { userId: user.id, purpose: 'admin_login', usedAt: null },
          data: { usedAt: new Date() },
        })

        const otp = generateOTP(6)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        await db.otp.create({
          data: {
            userId: user.id,
            otpHash: hashToken(otp),
            purpose: 'admin_login',
            expiresAt,
          },
        })

        requireEmailDelivery()
        const { Resend } = await import('resend')
        const resend = new Resend(env.RESEND_API_KEY)
        await resend.emails.send({
          from: env.EMAIL_FROM,
          to: user.email,
          subject: 'Your tipfy admin sign-in code',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="margin:0 0 8px">Admin sign-in</h2>
              <p style="color:#666;margin:0 0 24px">Use this code to finish signing in to the tipfy admin panel. It expires in 10 minutes.</p>
              <div style="background:#F3F4F6;border-radius:12px;padding:20px;text-align:center;letter-spacing:8px;font-size:28px;font-weight:800;color:#1F2937">${otp}</div>
              <p style="color:#999;margin:24px 0 0;font-size:13px">If you didn't try to sign in, someone has your password — change it immediately.</p>
            </div>
          `,
        })

        await logAuditEvent({
          userId: user.id,
          action: AuditActions.ADMIN_LOGIN_OTP_SENT,
          resource: 'user',
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        })

        const maskedEmail = user.email.replace(/^(.)(.+)(@.+)$/, '$1***$3')
        return res.json({
          success: true,
          data: { requiresOtp: true, email: maskedEmail },
        })
      }

      const token = await createToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: userRole,
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
          token,
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

// Complete staff 2FA: verify the emailed OTP and issue the session
router.post(
  '/login/verify-otp',
  authRateLimit,
  validate(verifyAdminOtpSchema),
  async (req, res, next) => {
    try {
      const { email, otp } = req.body

      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isBusiness: true,
          isActive: true,
          role: true,
        },
      })

      if (!user) {
        throw AppError.unauthorized('Verification failed. Sign in again.')
      }

      if (!user.isActive) {
        throw AppError.forbidden('Account has been deactivated')
      }

      if (user.role !== 'admin' && user.role !== 'support') {
        throw AppError.forbidden('Verification is only required for staff accounts')
      }

      const otpRecord = await db.otp.findFirst({
        where: { userId: user.id, purpose: 'admin_login', usedAt: null },
        orderBy: { createdAt: 'desc' },
      })

      if (!otpRecord) {
        throw AppError.badRequest('No verification code found. Sign in again to get a new one.')
      }

      if (new Date() > otpRecord.expiresAt) {
        throw AppError.badRequest('Verification code has expired. Sign in again to get a new one.')
      }

      if (otpRecord.attempts >= 5) {
        throw AppError.tooMany('Too many incorrect attempts. Sign in again to get a new code.')
      }

      // Constant-time compare rather than !==, so a wrong code can't be
      // recovered byte-by-byte from response timing.
      const supplied = Buffer.from(hashToken(otp))
      const stored = Buffer.from(otpRecord.otpHash)
      const matches =
        supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored)

      if (!matches) {
        await db.otp.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        })
        throw AppError.badRequest('Incorrect verification code')
      }

      const token = await createToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      })

      const tokenHash = hashToken(token)

      // Claim the OTP with a conditional write before minting the session, so
      // two concurrent requests with the same valid code cannot both log in.
      const claim = await db.otp.updateMany({
        where: { id: otpRecord.id, usedAt: null },
        data: { usedAt: new Date() },
      })
      if (claim.count === 0) {
        throw AppError.badRequest('Verification code has already been used.')
      }
      await db.$transaction([
        db.session.create({
          data: {
            userId: user.id,
            tokenHash,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
        db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }),
        db.otp.update({
          where: { id: otpRecord.id },
          data: { usedAt: new Date() },
        }),
      ])

      await logAuditEvent({
        userId: user.id,
        action: AuditActions.ADMIN_LOGIN_VERIFIED,
        resource: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            isBusiness: user.isBusiness,
            role: user.role,
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

// Deliberately tolerant of anonymous callers: the client calls this on boot to
// decide whether it is signed in, so it answers { user: null } rather than 401.
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
        isActive: true,
        role: true,
        createdAt: true,
      },
    })

    // verifyTokenAsync only proves the JWT is well-formed. The Session row and
    // isActive are checked here so logout and admin deactivation actually
    // revoke access, exactly as `resolveLiveSession` does for every other
    // route.
    if (!user) {
      return res.json({ success: true, data: { user: null } })
    }

    if (!user.isActive) {
      return res.json({ success: true, data: { user: null } })
    }

    const session = await db.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, expiresAt: true },
    })
    if (!session || session.expiresAt <= new Date()) {
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

      // Retain (don't delete) prior OTPs. Deleting them reset `attempts` to 0
      // on every new code, which voided the 5-attempt lockout and let an
      // attacker mint unlimited fresh 5-guess windows against a 6-digit space.
      const COOLDOWN_MS = 60 * 1000
      const MAX_PER_HOUR = 5
      const MAX_FAILURES_PER_HOUR = 10
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const recent = await db.otp.findMany({
        where: { userId, purpose: 'withdrawal_pin', createdAt: { gte: oneHourAgo } },
        select: { createdAt: true, attempts: true },
      })

      if (recent.length >= MAX_PER_HOUR) {
        throw AppError.tooMany('Too many verification codes requested. Try again later.')
      }

      const lastIssued = recent[0]?.createdAt
      if (lastIssued && Date.now() - lastIssued.getTime() < COOLDOWN_MS) {
        throw AppError.tooMany('Please wait before requesting another code.')
      }

      // Lock the account out based on failures across *all* codes issued in the
      // window, not just the current one.
      const totalFailures = recent.reduce((sum, row) => sum + row.attempts, 0)
      if (totalFailures >= MAX_FAILURES_PER_HOUR) {
        throw AppError.tooMany('Too many incorrect attempts. Try again later.')
      }

      await db.otp.updateMany({
        where: { userId, purpose: 'withdrawal_pin', usedAt: null },
        data: { usedAt: new Date() },
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

      requireEmailDelivery()
      const { Resend } = await import('resend')
      const resend = new Resend(env.RESEND_API_KEY)
      await resend.emails.send({
        from: env.EMAIL_FROM,
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

      // Constant-time compare rather than !==, so a wrong code can't be
      // recovered byte-by-byte from response timing.
      const supplied = Buffer.from(hashToken(otp))
      const stored = Buffer.from(otpRecord.otpHash)
      const matches =
        supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored)

      if (!matches) {
        await db.otp.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        })
        throw AppError.badRequest('Incorrect verification code')
      }

      const env = getEnv()
      const pinHash = await bcrypt.hash(pin, env.BCRYPT_ROUNDS)

      // Consume the OTP with a conditional write so two concurrent submissions
      // of the same valid code cannot both set a PIN.
      await db.$transaction(async (tx) => {
        const claim = await tx.otp.updateMany({
          where: { id: otpRecord.id, usedAt: null },
          data: { usedAt: new Date() },
        })
        if (claim.count === 0) {
          throw AppError.badRequest('Verification code has already been used.')
        }
        await tx.user.update({
          where: { id: userId },
          data: { withdrawalPinHash: pinHash },
        })
      })

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

      // Checked up front: failing here hits both the known and unknown-email
      // paths identically, so a misconfigured mailer can't become an account
      // enumeration oracle.
      requireEmailDelivery()

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

      const { Resend } = await import('resend')
      const resend = new Resend(env.RESEND_API_KEY)
      await resend.emails.send({
        from: env.EMAIL_FROM,
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

      const env = getEnv()
      const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

      // Claim the token with a conditional write *inside* the transaction.
      // A read-then-write let two concurrent submissions of the same link both
      // observe usedAt = null and both proceed, so the second overwrote the
      // password the first had just set.
      const now = new Date()
      await db.$transaction(async (tx) => {
        const claim = await tx.passwordResetToken.updateMany({
          where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
          data: { usedAt: now },
        })
        if (claim.count === 0) {
          throw AppError.badRequest('Invalid or expired reset token')
        }

        await tx.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash },
        })
        // Invalidate all sessions for this user
        await tx.session.deleteMany({ where: { userId: resetToken.userId } })
      })

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
