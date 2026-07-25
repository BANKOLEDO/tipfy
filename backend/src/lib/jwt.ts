import { SignJWT, jwtVerify } from 'jose'
import { getEnv } from '~/config/env'

export interface JWTPayload {
  userId: string
  email: string
  username: string
}

function getSecret() {
  return new TextEncoder().encode(getEnv().JWT_SECRET)
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(getEnv().JWT_EXPIRES_IN)
    .setIssuer('tipfy')
    .setAudience('tipfy-app')
    .sign(getSecret())
}

export async function verifyTokenAsync(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: 'tipfy',
    audience: 'tipfy-app',
  })
  return payload as unknown as JWTPayload
}
