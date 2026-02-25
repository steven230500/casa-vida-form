"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to get an admin client (bypassing RLS or acting as an admin user)
// Since this is a restricted /admin route, middleware already checked the role.
// We use the regular authenticated client, but we know it's an admin.
async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // We rely on RLS policies ("Admins can manage forms") mapped to this user session.
  return { supabase, user };
}

// --- FORMS ---

export async function createForm(formData: FormData) {
  const { supabase, user } = await getAdminClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const isActive = formData.get("is_active") === "true";

  if (!title) {
    return { error: "El título es obligatorio" };
  }

  const { data, error } = await supabase
    .from("forms")
    .insert([
      {
        title,
        description,
        is_active: isActive,
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating form:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/forms");
  return { data };
}

export async function updateForm(id: string, formData: FormData) {
  const { supabase } = await getAdminClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const isActive = formData.get("is_active") === "true";

  if (!title) {
    return { error: "El título es obligatorio" };
  }

  const { data, error } = await supabase
    .from("forms")
    .update({
      title,
      description,
      is_active: isActive,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating form:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}`);
  return { data };
}

export async function deleteForm(id: string) {
  const { supabase } = await getAdminClient();

  const { error } = await supabase.from("forms").delete().eq("id", id);

  if (error) {
    console.error("Error deleting form:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/forms");
  return { success: true };
}

// --- BLOCKS (Sections) ---

export async function createBlock(
  formId: string,
  title: string,
  order: number,
) {
  const { supabase } = await getAdminClient();

  const { data, error } = await supabase
    .from("form_blocks")
    .insert([
      {
        form_id: formId,
        title,
        order,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating block:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/forms/${formId}`);
  return { data };
}

export async function updateBlock(
  id: string,
  formId: string,
  title: string,
  order: number,
) {
  const { supabase } = await getAdminClient();

  const { data, error } = await supabase
    .from("form_blocks")
    .update({ title, order })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating block:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/forms/${formId}`);
  return { data };
}

export async function deleteBlock(id: string, formId: string) {
  const { supabase } = await getAdminClient();

  const { error } = await supabase.from("form_blocks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting block:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/forms/${formId}`);
  return { success: true };
}

// --- QUESTIONS ---

export type QuestionPayload = {
  form_id: string;
  block_id: string | null;
  key: string;
  label: string;
  type: string;
  options?: any;
  required: boolean;
  order: number;
};

export async function createQuestion(payload: QuestionPayload) {
  const { supabase } = await getAdminClient();

  const { data, error } = await supabase
    .from("questions")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating question:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/forms/${payload.form_id}`);
  return { data };
}

export async function updateQuestion(
  id: string,
  payload: Partial<QuestionPayload>,
) {
  const { supabase } = await getAdminClient();

  const { data, error } = await supabase
    .from("questions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating question:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/forms/${payload.form_id}`);
  return { data };
}

export async function deleteQuestion(id: string, formId: string) {
  const { supabase } = await getAdminClient();

  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting question:", error);
    return { error: error.message };
  }

  revalidatePath(`/admin/forms/${formId}`);
  return { success: true };
}
