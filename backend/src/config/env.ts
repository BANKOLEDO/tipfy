import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().min(10).default(12),
  FRONTEND_URL: z.string().url(),
  ADMIN_URL: z.string().url(),
  MONNIFY_API_KEY: z.string().min(1, 'MONNIFY_API_KEY is required'),
  MONNIFY_SECRET_KEY: z.string().min(1, 'MONNIFY_SECRET_KEY is required'),
  MONNIFY_CONTRACT_CODE: z.string().optional().default(''),
  MONNIFY_WEBHOOK_SECRET: z.string().optional().default(''),
  MONNIFY_WALLET_ACCOUNT_NUMBER: z.string().optional().default(''),
  // CARD (4% MDR). Set to ACCOUNT_TRANSFER,USSD for zero international exposure.
  MONNIFY_PAYMENT_METHODS: z
    .string()
    .optional()
    .default('CARD,ACCOUNT_TRANSFER,USSD'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  TIP_RATE_LIMIT_MAX: z.coerce.number().default(20),
  ENCRYPTION_KEY: z.string().min(32),
  ENCRYPTION_IV: z.string().min(16),
  RESEND_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['dev', 'prod', 'combined']).default('dev'),
  ADMIN_EMAIL: z.string().optional(),

  // Monetization
  PLATFORM_FEE_PERCENT: z.coerce.number().default(5),
  PRO_PLATFORM_FEE_PERCENT: z.coerce.number().default(3),
  PROCESSING_FEE_MARKUP: z.coerce.number().default(50),
  FREE_WITHDRAWALS_PER_MONTH: z.coerce.number().default(3),
  WITHDRAWAL_FEE: z.coerce.number().default(100),
})

type Env = z.infer<typeof envSchema>

let _env: Env

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env)
    if (!result.success) {
      console.error('❌ Invalid environment variables:')
      console.error(result.error.flatten().fieldErrors)
      throw new Error('Invalid environment variables')
    }
    _env = result.data
  }
  return _env
}
