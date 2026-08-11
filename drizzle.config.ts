import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // Shares a Postgres database with the casa-vida repo's own drizzle-tracked
  // tables - namespaced so the two projects' migration histories don't collide.
  migrations: {
    table: '__drizzle_migrations_forms',
    schema: 'drizzle',
  },
} satisfies Config
