import { db } from '~/lib/db'
import type { Prisma } from '@prisma/client'

type NotificationType = 'tip_received' | 'tip_failed' | 'withdrawal_completed' | 'withdrawal_processing' | 'withdrawal_failed' | 'withdrawal_pin_set' | 'team_joined' | 'team_removed' | 'feedback_received'

interface CreateNotification {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
  data?: Record<string, unknown>
}

export async function createNotification(payload: CreateNotification) {
  return db.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link || null,
      data: (payload.data as Prisma.InputJsonValue) ?? undefined,
    },
  })
}

export async function notifyTipReceived(recipientId: string, senderName: string, amount: number, message?: string | null) {
  return createNotification({
    userId: recipientId,
    type: 'tip_received',
    title: 'New tip received!',
    body: message
      ? `${senderName} sent you ₦${amount.toLocaleString()} — "${message}"`
      : `${senderName} sent you ₦${amount.toLocaleString()}`,
    link: '/dashboard/tips',
    data: { amount, senderName },
  })
}

export async function notifyTipFailed(recipientId: string, amount: number) {
  return createNotification({
    userId: recipientId,
    type: 'tip_failed',
    title: 'Tip failed',
    body: `A ₦${amount.toLocaleString()} tip could not be completed.`,
    link: '/dashboard/tips',
    data: { amount },
  })
}

export async function notifyWithdrawalCompleted(userId: string, amount: number) {
  return createNotification({
    userId,
    type: 'withdrawal_completed',
    title: 'Withdrawal complete',
    body: `₦${amount.toLocaleString()} has been sent to your bank account.`,
    link: '/dashboard/withdraw',
    data: { amount },
  })
}

export async function notifyWithdrawalProcessing(userId: string, amount: number) {
  return createNotification({
    userId,
    type: 'withdrawal_processing',
    title: 'Withdrawal processing',
    body: `Your ₦${amount.toLocaleString()} withdrawal is being processed.`,
    link: '/dashboard/withdraw',
    data: { amount },
  })
}

export async function notifyWithdrawalFailed(userId: string, amount: number, reason?: string) {
  return createNotification({
    userId,
    type: 'withdrawal_failed',
    title: 'Withdrawal failed',
    body: reason || `Your ₦${amount.toLocaleString()} withdrawal could not be processed.`,
    link: '/dashboard/withdraw',
    data: { amount, reason },
  })
}

export async function notifyWithdrawalPinSet(userId: string) {
  return createNotification({
    userId,
    type: 'withdrawal_pin_set',
    title: 'Withdrawal PIN set',
    body: 'Your withdrawal PIN has been created. Keep it safe — you\u2019ll need it for every withdrawal.',
    link: '/dashboard/withdraw',
  })
}

export async function notifyTeamJoined(businessId: string, memberName: string) {
  return createNotification({
    userId: businessId,
    type: 'team_joined',
    title: 'New team member',
    body: `${memberName} joined your team.`,
    link: '/dashboard/team',
    data: { memberName },
  })
}

export async function notifyTeamRemoved(businessId: string, memberName: string) {
  return createNotification({
    userId: businessId,
    type: 'team_removed',
    title: 'Team member removed',
    body: `${memberName} has been removed from your team.`,
    link: '/dashboard/team',
    data: { memberName },
  })
}

export async function notifyFeedbackReceived(userId: string, rating: number) {
  return createNotification({
    userId,
    type: 'feedback_received',
    title: 'New feedback',
    body: `You received a ${rating}-star rating.`,
    link: '/dashboard/tips',
    data: { rating },
  })
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({ where: { userId, isRead: false } })
}
