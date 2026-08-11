import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

export async function findUserByEmail(email: string) {
  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user ?? null
}

export async function findUserById(id: string) {
  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user ?? null
}
