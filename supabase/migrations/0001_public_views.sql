-- 0001_public_views.sql

-- 1. Add draft_id to responses to prevent duplicate submissions
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS draft_id uuid UNIQUE;

-- 2. Create a View for Public Form Loading
-- This securely exposes only active forms, their blocks, and their questions.
-- Nested JSON aggregation is used so the frontend gets a single ready-to-use object.
CREATE OR REPLACE VIEW public.public_forms_questions AS
SELECT
  f.id AS form_id,
  f.title,
  f.description,
  (
    SELECT json_agg(
      json_build_object(
        'id', b.id,
        'key', b.key,
        'title', b.title,
        'order', b."order",
        'questions', (
          SELECT coalesce(json_agg(
            json_build_object(
              'id', q.id,
              'key', q.key,
              'label', q.label,
              'type', q.type,
              'options', q.options,
              'required', q.required,
              'order', q."order",
              'condition', q.condition
            ) ORDER BY q."order" ASC
          ), '[]'::json)
          FROM public.questions q
          WHERE q.block_id = b.id
        )
      ) ORDER BY b."order" ASC
    )
    FROM public.form_blocks b
    WHERE b.form_id = f.id
  ) AS blocks
FROM public.forms f
WHERE f.is_active = true
  AND (f.start_at IS NULL OR f.start_at <= now())
  AND (f.end_at IS NULL OR f.end_at >= now());

-- Grant access to the view for authenticated and anonymous users
-- This works because the VIEW itself only SELECTs forms where is_active = true
GRANT SELECT ON public.public_forms_questions TO anon, authenticated;
