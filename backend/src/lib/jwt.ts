import { SignJWT, jwtVerify } from 'jose'
import { randomUUID } from 'crypto'
import { getEnv } from '~/config/env'

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: string
}

function getSecret() {
  return new TextEncoder().encode(getEnv().JWT_SECRET)
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    // jti makes every token distinct. Without it, two logins for the same user
    // inside the same second are byte-identical (iat has one-second
    // granularity), and Session.tokenHash is unique, so the second insert fails
    // with a 500. A double-clicked login button should not be a server error.
    .setJti(randomUUID())
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
