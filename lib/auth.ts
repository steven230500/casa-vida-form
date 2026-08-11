import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import type { Role } from '@/lib/db/schema'

export const SESSION_COOKIE = 'casavida_forms_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, 'hex')
  const derivedBuffer = scryptSync(password, salt, 64)
  if (hashBuffer.length !== derivedBuffer.length) return false
  return timingSafeEqual(hashBuffer, derivedBuffer)
}

function secret() {
  return process.env.SESSION_SECRET ?? 'dev-only-secret-change-me'
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export type SessionPayload = {
  userId: string
  email: string
  role: Role
  exp: number
}

export function createSessionToken(user: {
  id: string
  email: string
  role: Role
}) {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${payloadB64}.${sign(payloadB64)}`
}

export function verifySessionToken(
  token: string | undefined | null,
): SessionPayload | null {
  if (!token) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null

  const expected = sign(payloadB64)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString(),
    ) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export const reviewerRoles: Role[] = ['admin', 'reviewer', 'pastor', 'leader']
