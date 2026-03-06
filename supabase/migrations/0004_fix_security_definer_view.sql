-- Fix Security Definer View issue for public.public_forms_questions
-- By default, Postgres 15+ allows setting security_invoker = true on views
-- to ensure RLS is enforced based on the querying user.

CREATE OR REPLACE VIEW public.public_forms_questions 
WITH (security_invoker = true)
AS
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

-- Re-grant permissions just in case
GRANT SELECT ON public.public_forms_questions TO anon, authenticated;
