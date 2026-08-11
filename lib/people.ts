import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { people } from '@/lib/db/people-table'

type Queryable = Pick<PostgresJsDatabase, 'select' | 'insert'>

export type RespondentInfo = {
  anonymous: boolean
  name?: string | null
  email?: string | null
}

/**
 * Matches an existing person by email, or creates a new one ("nuevo") from
 * the form submission - the tie-in point between this app's responses and
 * casa-vida's CRM. Returns null when there isn't enough identity to link
 * (anonymous submission, or no name/email given).
 */
export async function findOrCreatePerson(
  db: Queryable,
  respondent: RespondentInfo,
): Promise<string | null> {
  if (respondent.anonymous) return null

  const name = respondent.name?.trim()
  const email = respondent.email?.trim().toLowerCase()

  if (!name && !email) return null

  if (email) {
    const [existing] = await db
      .select({ id: people.id })
      .from(people)
      .where(sql`lower(${people.email}) = ${email}`)
      .limit(1)
    if (existing) return existing.id
  }

  const [created] = await db
    .insert(people)
    .values({
      fullName: name || 'Sin nombre',
      email: email || null,
      status: 'nuevo',
    })
    .returning({ id: people.id })

  return created.id
}
