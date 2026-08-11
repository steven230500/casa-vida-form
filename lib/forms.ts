import { eq, and, or, isNull, lte, gte, asc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { forms, formBlocks, questions } from '@/lib/db/schema'

export type PublicQuestion = {
  id: string
  key: string
  label: string
  type: string
  options: unknown
  required: boolean
  order: number
  condition: unknown
}

export type PublicBlock = {
  id: string
  key: string | null
  title: string
  order: number
  questions: PublicQuestion[]
}

export type PublicForm = {
  form_id: string
  title: string
  description: string | null
  blocks: PublicBlock[]
}

/** Same "is this form open right now" rule the old public_forms_questions
 * Supabase view enforced: active flag + optional start/end window. */
function activeFormWhere() {
  const now = new Date()
  return and(
    eq(forms.is_active, true),
    or(isNull(forms.start_at), lte(forms.start_at, now)),
    or(isNull(forms.end_at), gte(forms.end_at, now)),
  )
}

async function assemble(formRow: {
  id: string
  title: string
  description: string | null
}): Promise<PublicForm> {
  const db = getDb()
  const [blockRows, questionRows] = await Promise.all([
    db
      .select()
      .from(formBlocks)
      .where(eq(formBlocks.form_id, formRow.id))
      .orderBy(asc(formBlocks.order)),
    db
      .select()
      .from(questions)
      .where(eq(questions.form_id, formRow.id))
      .orderBy(asc(questions.order)),
  ])

  const blocks: PublicBlock[] = blockRows.map((b) => ({
    id: b.id,
    key: b.key,
    title: b.title,
    order: b.order,
    questions: questionRows
      .filter((q) => q.block_id === b.id)
      .map((q) => ({
        id: q.id,
        key: q.key,
        label: q.label,
        type: q.type,
        options: q.options,
        required: q.required,
        order: q.order,
        condition: q.condition,
      })),
  }))

  return {
    form_id: formRow.id,
    title: formRow.title,
    description: formRow.description,
    blocks,
  }
}

export async function getActiveForm(): Promise<PublicForm | null> {
  const db = getDb()
  const [formRow] = await db.select().from(forms).where(activeFormWhere()).limit(1)
  if (!formRow) return null
  return assemble(formRow)
}

export async function getActiveFormById(id: string): Promise<PublicForm | null> {
  const db = getDb()
  const [formRow] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, id), activeFormWhere()))
    .limit(1)
  if (!formRow) return null
  return assemble(formRow)
}

export async function getActiveFormBySlug(slug: string): Promise<PublicForm | null> {
  const db = getDb()
  const [formRow] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.slug, slug), activeFormWhere()))
    .limit(1)
  if (!formRow) return null
  return assemble(formRow)
}
