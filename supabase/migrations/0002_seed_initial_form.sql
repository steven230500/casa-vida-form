-- 0002_seed_initial_form.sql

-- This script inserts the sample form, its blocks, and its questions based on the Google Form structure.

DO $$
DECLARE
  v_form_id uuid;
  v_block_0_id uuid;
  v_block_1_id uuid;
  v_block_2_id uuid;
  v_block_3_id uuid;
  v_block_4_id uuid;
  v_block_5_id uuid;
BEGIN
  -- 1. Create the Form
  INSERT INTO public.forms (title, description, is_active)
  VALUES (
    'Reflexión y Diagnóstico de la Semana',
    'Espacio confidencial para reflexionar sobre la semana y nuestro caminar con Dios.',
    true
  ) RETURNING id INTO v_form_id;

  -- 2. Create Blocks
  -- Block 0 matches our built-in respondent_name and respondent_email fields in responses table,
  -- but they also have a confidential_ack question, so we'll put that in Block 1 alongside Diagnostics.
  -- Alternatively, we can create a block just for the consent.

  INSERT INTO public.form_blocks (form_id, key, title, "order")
  VALUES (v_form_id, 'consent', 'Identificación y consentimiento', 0) RETURNING id INTO v_block_0_id;

  INSERT INTO public.form_blocks (form_id, key, title, "order")
  VALUES (v_form_id, 'diagnostic', 'Diagnóstico (Texto + Selección)', 1) RETURNING id INTO v_block_1_id;

  INSERT INTO public.form_blocks (form_id, key, title, "order")
  VALUES (v_form_id, 'points_real', 'Distribuye 100 puntos (Cómo viviste la semana)', 2) RETURNING id INTO v_block_2_id;

  INSERT INTO public.form_blocks (form_id, key, title, "order")
  VALUES (v_form_id, 'points_pressure', 'Distribuye 100 puntos (Escenario con presión y costo)', 3) RETURNING id INTO v_block_3_id;

  INSERT INTO public.form_blocks (form_id, key, title, "order")
  VALUES (v_form_id, 'reflection', 'Reflexión del texto del día', 4) RETURNING id INTO v_block_4_id;

  INSERT INTO public.form_blocks (form_id, key, title, "order")
  VALUES (v_form_id, 'application', 'Aplicación / Acción', 5) RETURNING id INTO v_block_5_id;


  -- 3. Create Questions

  -- Block 0
  INSERT INTO public.questions (form_id, block_id, key, label, type, required, "order", options) VALUES
  (v_form_id, v_block_0_id, 'confidential_ack', 'Confirmo que entiendo que este espacio es confidencial y de uso pastoral interno.', 'radio', true, 0, '["Sí, entiendo y acepto."]'::jsonb);

  -- Block 1
  INSERT INTO public.questions (form_id, block_id, key, label, type, required, "order", options) VALUES
  (v_form_id, v_block_1_id, 'week_receipt', 'Si mi semana fuera un recibo (tiempo, energía, conversaciones), mi vida se fue principalmente en:', 'textarea', true, 0, null),
  (v_form_id, v_block_1_id, 'fear_to_lose', 'Lo que más temo perder hoy es:', 'textarea', true, 1, null),
  (v_form_id, v_block_1_id, 'relationship_with_god_week', 'Mi relación con Dios esta semana fue:', 'radio', true, 2, '["Intermitente", "Cercana y constante", "Inexistente"]'::jsonb),
  (v_form_id, v_block_1_id, 'who_governed_decisions_under_pressure', 'En el ambiente donde más presión tengo, ¿quién gobernó realmente mis decisiones?', 'radio', true, 3, '["Cristo", "A veces Cristo, a veces el entorno", "Principalmente el entorno", "No lo pensé"]'::jsonb);

  -- Block 2
  INSERT INTO public.questions (form_id, block_id, key, label, type, required, "order", options) VALUES
  (v_form_id, v_block_2_id, 'points_week_real', 'Distribuye 100 puntos según cómo realmente viviste esta semana. (La suma debe dar exactamente 100)', 'points100', true, 0, '["paz_interior", "control_y_seguridad", "aprobacion_e_imagen", "placer_y_escape", "dinero_y_avance", "relacion_con_dios"]'::jsonb);

  -- Block 3
  INSERT INTO public.questions (form_id, block_id, key, label, type, required, "order", options) VALUES
  (v_form_id, v_block_3_id, 'points_pressure_opportunity', 'Ahora imagina que llega una oportunidad con presión y costo. Distribuye nuevamente 100 puntos.', 'points100', true, 0, '["paz_interior", "control_y_seguridad", "aprobacion_e_imagen", "placer_y_escape", "dinero_y_avance", "relacion_con_dios"]'::jsonb);

  -- Block 4
  INSERT INTO public.questions (form_id, block_id, key, label, type, required, "order", options) VALUES
  (v_form_id, v_block_4_id, 'how_do_you_see_god_in_text', '¿Cómo ves a Dios en el texto leído hoy?', 'textarea', true, 0, null),
  (v_form_id, v_block_4_id, 'what_confronted_you_most', '¿Qué palabra o idea te confrontó más? ¿Por qué?', 'textarea', true, 1, null),
  (v_form_id, v_block_4_id, 'biggest_danger_when_all_good', 'Según lo que escuchaste hoy, ¿cuál es el mayor peligro cuando todo va bien?', 'textarea', true, 2, null),
  (v_form_id, v_block_4_id, 'phrase_that_spoke_to_you', 'Marca la frase que más te habló hoy:', 'radio', true, 3, '["Dios protege lo que le pertenece.", "El mayor peligro es olvidar mientras prosperas.", "Amar con todo elimina zonas grises.", "Dios no comparte la lealtad del corazón.", "Escuchar implica obedecer, no solo oír."]'::jsonb);

  -- Block 5
  INSERT INTO public.questions (form_id, block_id, key, label, type, required, "order", options) VALUES
  (v_form_id, v_block_5_id, 'what_competes_with_god', 'Hoy identifiqué que lo que más compite con Dios en mi vida es:', 'textarea', true, 0, null),
  (v_form_id, v_block_5_id, 'concrete_renunciation_this_week', 'Mi renuncia concreta esta semana será:', 'textarea', true, 1, null),
  (v_form_id, v_block_5_id, 'immediate_actions', 'Acciones inmediatas (marca lo que harás hoy):', 'checkbox', false, 2, '["Escribir lo que identifiqué en un lugar visible.", "Enviar mensaje a una persona para hablar esta semana.", "Separar tiempo específico con Dios mañana temprano."]'::jsonb);

END $$;
