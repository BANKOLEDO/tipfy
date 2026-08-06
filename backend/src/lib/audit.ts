import { db } from '~/lib/db'

export async function logAuditEvent(data: {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata as any,
      },
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}

export const AuditActions = {
  USER_REGISTER: 'user.register',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  TIP_CREATE: 'tip.create',
  TIP_COMPLETE: 'tip.complete',
  TIP_FAIL: 'tip.fail',
  WITHDRAWAL_REQUEST: 'withdrawal.request',
  WITHDRAWAL_COMPLETE: 'withdrawal.complete',
  WITHDRAWAL_FAIL: 'withdrawal.fail',
  PAYMENT_WEBHOOK: 'payment.webhook',
  TEAM_ADD: 'team.add',
  TEAM_REMOVE: 'team.remove',
  PASSWORD_CHANGE: 'password.change',
  PASSWORD_RESET: 'password.reset',
  ADMIN_LOGIN_OTP_SENT: 'admin.login.otp_sent',
  ADMIN_LOGIN_VERIFIED: 'admin.login.otp_verified',
  ADMIN_TIP_UPDATE: 'admin.tip.update',
  ADMIN_TIP_DELETE: 'admin.tip.delete',
  ADMIN_WITHDRAWAL_CANCEL: 'admin.withdrawal.cancel',
  ADMIN_WITHDRAWAL_DELETE: 'admin.withdrawal.delete',
} as const
