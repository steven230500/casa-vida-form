import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  date,
  time,
  timestamp,
} from 'drizzle-orm/pg-core'

export const roleValues = ['admin', 'reviewer', 'user', 'pastor', 'leader'] as const
export type Role = (typeof roleValues)[number]

// Own auth now (was auth.users + public.profiles under Supabase).
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  full_name: text('full_name'),
  role: text('role').$type<Role>().notNull().default('user'),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  start_at: timestamp('start_at', { withTimezone: true }),
  end_at: timestamp('end_at', { withTimezone: true }),
  created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const formBlocks = pgTable('form_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  form_id: uuid('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  key: text('key'),
  title: text('title').notNull(),
  order: integer('order').notNull().default(0),
})

export const questionTypeValues = [
  'text',
  'textarea',
  'radio',
  'checkbox',
  'points100',
  'date',
  'time',
  'scale',
] as const
export type QuestionType = (typeof questionTypeValues)[number]

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  form_id: uuid('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  block_id: uuid('block_id').references(() => formBlocks.id, { onDelete: 'set null' }),
  key: text('key').notNull(),
  label: text('label').notNull(),
  type: text('type').$type<QuestionType>().notNull(),
  options: jsonb('options'),
  required: boolean('required').notNull().default(false),
  order: integer('order').notNull().default(0),
  condition: jsonb('condition'),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const responseStatusValues = ['new', 'reviewed', 'followup_pending', 'closed'] as const
export type ResponseStatus = (typeof responseStatusValues)[number]

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  form_id: uuid('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  draft_id: uuid('draft_id').unique(),
  anonymous: boolean('anonymous').notNull().default(false),
  respondent_user_id: uuid('respondent_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  // Soft link to casa-vida's people table (shared DB, separate app/repo owns
  // that table's migrations - no formal FK across the two codebases).
  person_id: uuid('person_id'),
  respondent_name: text('respondent_name'),
  respondent_email: text('respondent_email'),
  need_1on1: boolean('need_1on1').notNull().default(false),
  preferred_date: date('preferred_date'),
  preferred_time: time('preferred_time'),
  status: text('status').$type<ResponseStatus>().notNull().default('new'),
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  reviewed_by: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  response_id: uuid('response_id')
    .notNull()
    .references(() => responses.id, { onDelete: 'cascade' }),
  question_id: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  value: jsonb('value'),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const reviewerAssignments = pgTable('reviewer_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  form_id: uuid('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  reviewer_id: uuid('reviewer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
})
