import { PrismaClient } from '@prisma/client'
import { getEnv } from '~/config/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const env = getEnv()
  return new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (getEnv().NODE_ENV !== 'production') globalForPrisma.prisma = db
