import postgres from 'postgres'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

let cached: PostgresJsDatabase<typeof schema> | null = null

export function getDb() {
  if (!cached) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL no está configurada')
    }
    const client = postgres(connectionString)
    cached = drizzle(client, { schema })
  }
  return cached
}
