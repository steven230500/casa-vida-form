import { eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { people } from '@/lib/db/people-table'

type Queryable = Pick<PostgresJsDatabase, 'select' | 'insert' | 'update'>

export type RespondentInfo = {
  anonymous: boolean
  name?: string | null
  email?: string | null
  phone?: string | null
  birthdate?: string | null
  neighborhood?: string | null
  caregiverName?: string | null
}

/**
 * Matches an existing person by email, or creates a new one ("nuevo") from
 * the form submission - the tie-in point between this app's responses and
 * casa-vida's CRM. Returns null when there isn't enough identity to link
 * (anonymous submission, or no name/email given).
 *
 * phone/birthdate/neighborhood/caregiverName only reach the person record
 * when a form's questions are worded so their auto-generated key matches a
 * recognized prefix - see extractCrmFields() in app/api/responses/route.ts.
 * On an existing match, these only fill currently-blank fields; they never
 * overwrite data the person (or a servidor) already entered.
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
      .select()
      .from(people)
      .where(sql`lower(${people.email}) = ${email}`)
      .limit(1)

    if (existing) {
      const fill: Record<string, string> = {}
      if (!existing.phone && respondent.phone) fill.phone = respondent.phone
      if (!existing.birthdate && respondent.birthdate)
        fill.birthdate = respondent.birthdate
      if (!existing.neighborhood && respondent.neighborhood)
        fill.neighborhood = respondent.neighborhood
      if (!existing.caregiverName && respondent.caregiverName)
        fill.caregiverName = respondent.caregiverName

      if (Object.keys(fill).length > 0) {
        await db
          .update(people)
          .set({ ...fill, updatedAt: new Date() })
          .where(eq(people.id, existing.id))
      }

      return existing.id
    }
  }

  const [created] = await db
    .insert(people)
    .values({
      fullName: name || 'Sin nombre',
      email: email || null,
      phone: respondent.phone || null,
      birthdate: respondent.birthdate || null,
      neighborhood: respondent.neighborhood || null,
      caregiverName: respondent.caregiverName || null,
      status: 'nuevo',
    })
    .returning({ id: people.id })

  return created.id
}
