import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-z][a-z0-9_]+$/,
      'Username must start with a letter and contain only lowercase letters, numbers, and underscores'
    ),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Display name contains invalid characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  isBusiness: z.boolean().default(false).optional(),
  businessName: z
    .string()
    .max(100, 'Business name is too long')
    .optional()
    .or(z.literal('')),
  businessCategory: z.string().optional().or(z.literal('')),
})

export const tipSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  amount: z
    .number()
    .min(100, 'Minimum tip is ₦100')
    .max(1000000, 'Maximum tip is ₦1,000,000'),
  message: z
    .string()
    .max(200, 'Message must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  isAnonymous: z.boolean().default(false),
  senderName: z
    .string()
    .max(50, 'Name is too long')
    .optional()
    .or(z.literal('')),
  senderEmail: z.string().email().optional().or(z.literal('')),
  category: z.enum(['general', 'service', 'content', 'food', 'music']).default('general'),
})

export const withdrawSchema = z.object({
  amount: z
    .number()
    .min(1000, 'Minimum withdrawal is ₦1,000')
    .max(500000, 'Maximum withdrawal is ₦500,000'),
  bankCode: z.string().min(1, 'Select a bank'),
  accountNumber: z
    .string()
    .length(10, 'Account number must be 10 digits')
    .regex(/^\d+$/, 'Account number must be numeric'),
  pin: z
    .string()
    .length(4, 'PIN must be 4 digits')
    .regex(/^\d{4}$/, 'PIN must be 4 digits'),
})

export const setWithdrawalPinSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
  pin: z
    .string()
    .length(4, 'PIN must be 4 digits')
    .regex(/^\d{4}$/, 'PIN must be 4 digits'),
})

export const verifyAdminOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
})

export const updateTipSchema = z.object({
  message: z
    .string()
    .max(200, 'Message must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  category: z
    .enum(['general', 'service', 'content', 'food', 'music'])
    .optional(),
  isAnonymous: z.boolean().optional(),
})

export const withdrawalAdminActionSchema = z.object({
  action: z.enum(['cancel']),
  reason: z.string().max(500).optional(),
})

export const accountValidateSchema = z.object({
  bankCode: z.string().min(1, 'Select a bank'),
  accountNumber: z
    .string()
    .length(10, 'Account number must be 10 digits')
    .regex(/^\d+$/, 'Account number must be digits only'),
})

export const tipFeeQuoteSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  amount: z.coerce.number().min(1, 'Amount must be at least ₦1').max(10000000, 'Amount too large'),
})

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-z][a-z0-9_]+$/,
      'Username must start with a letter and contain only lowercase letters, numbers, and underscores'
    )
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'Location must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  isBusiness: z.boolean().optional(),
  businessName: z.string().optional().or(z.literal('')),
  businessCategory: z.string().optional().or(z.literal('')),
})

export const feedbackSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5),
  comment: z
    .string()
    .max(500, 'Comment must be at most 500 characters')
    .optional()
    .or(z.literal('')),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TipInput = z.infer<typeof tipSchema>
export type WithdrawInput = z.infer<typeof withdrawSchema>
export type SetWithdrawalPinInput = z.infer<typeof setWithdrawalPinSchema>
export type VerifyAdminOtpInput = z.infer<typeof verifyAdminOtpSchema>
export type UpdateTipInput = z.infer<typeof updateTipSchema>
export type WithdrawalAdminActionInput = z.infer<typeof withdrawalAdminActionSchema>
export type TipFeeQuoteInput = z.infer<typeof tipFeeQuoteSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type FeedbackInput = z.infer<typeof feedbackSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
