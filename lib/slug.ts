import { and, eq, like, ne } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { forms } from '@/lib/db/schema'

export function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** True if `slug` is already used by a different form. */
export async function isSlugTaken(slug: string, excludeId: string): Promise<boolean> {
  const db = getDb()
  const [existing] = await db
    .select({ id: forms.id })
    .from(forms)
    .where(and(eq(forms.slug, slug), ne(forms.id, excludeId)))
    .limit(1)
  return Boolean(existing)
}

/** Short stable slug for a form's /f/[slug] link - appends -2, -3, ... on collision. */
export async function generateUniqueSlug(title: string): Promise<string> {
  const db = getDb()
  const base = slugify(title) || 'formulario'
  const taken = new Set(
    (
      await db
        .select({ slug: forms.slug })
        .from(forms)
        .where(like(forms.slug, `${base}%`))
    ).map((r) => r.slug),
  )
  let slug = base
  let n = 2
  while (taken.has(slug)) {
    slug = `${base}-${n}`
    n += 1
  }
  return slug
}
