import { pgTable, uuid, text, date, timestamp } from 'drizzle-orm/pg-core'

// Mirrors casa-vida's own `people` table (lib/db/schema.ts there). Owned and
// migrated by that repo, not this one - deliberately kept out of ./schema.ts
// so `drizzle-kit generate` here never tries to create/alter it. Both apps
// share the same Postgres database, so this is just a query-time definition.
export const peopleStatusValues = ['visitante', 'nuevo', 'miembro'] as const
export type PersonStatus = (typeof peopleStatusValues)[number]

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  birthdate: date('birthdate'),
  status: text('status').$type<PersonStatus>().notNull().default('nuevo'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
