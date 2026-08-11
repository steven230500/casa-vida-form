"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { forms, formBlocks, questions } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

// --- FORMS ---

export async function createForm(formData: FormData) {
  const session = await requireAdmin();
  const db = getDb();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const isActive = formData.get("is_active") === "true";

  if (!title) {
    return { error: "El título es obligatorio" };
  }

  try {
    const [data] = await db
      .insert(forms)
      .values({
        title,
        description,
        is_active: isActive,
        created_by: session.userId,
      })
      .returning();

    revalidatePath("/admin/forms");
    return { data };
  } catch (error) {
    console.error("Error creating form:", error);
    return { error: (error as Error).message };
  }
}

export async function updateForm(id: string, formData: FormData) {
  await requireAdmin();
  const db = getDb();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const isActive = formData.get("is_active") === "true";

  if (!title) {
    return { error: "El título es obligatorio" };
  }

  try {
    const [data] = await db
      .update(forms)
      .set({ title, description, is_active: isActive })
      .where(eq(forms.id, id))
      .returning();

    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${id}`);
    return { data };
  } catch (error) {
    console.error("Error updating form:", error);
    return { error: (error as Error).message };
  }
}

export async function deleteForm(id: string) {
  await requireAdmin();
  const db = getDb();

  try {
    await db.delete(forms).where(eq(forms.id, id));
    revalidatePath("/admin/forms");
    return { success: true };
  } catch (error) {
    console.error("Error deleting form:", error);
    return { error: (error as Error).message };
  }
}

// --- BLOCKS (Sections) ---

export async function createBlock(formId: string, title: string, order: number) {
  await requireAdmin();
  const db = getDb();

  try {
    const [data] = await db
      .insert(formBlocks)
      .values({ form_id: formId, title, order })
      .returning();

    revalidatePath(`/admin/forms/${formId}`);
    return { data };
  } catch (error) {
    console.error("Error creating block:", error);
    return { error: (error as Error).message };
  }
}

export async function updateBlock(id: string, formId: string, title: string, order: number) {
  await requireAdmin();
  const db = getDb();

  try {
    const [data] = await db
      .update(formBlocks)
      .set({ title, order })
      .where(eq(formBlocks.id, id))
      .returning();

    revalidatePath(`/admin/forms/${formId}`);
    return { data };
  } catch (error) {
    console.error("Error updating block:", error);
    return { error: (error as Error).message };
  }
}

export async function deleteBlock(id: string, formId: string) {
  await requireAdmin();
  const db = getDb();

  try {
    await db.delete(formBlocks).where(eq(formBlocks.id, id));
    revalidatePath(`/admin/forms/${formId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting block:", error);
    return { error: (error as Error).message };
  }
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
  await requireAdmin();
  const db = getDb();

  try {
    const [data] = await db
      .insert(questions)
      .values(payload as typeof questions.$inferInsert)
      .returning();

    revalidatePath(`/admin/forms/${payload.form_id}`);
    return { data };
  } catch (error) {
    console.error("Error creating question:", error);
    return { error: (error as Error).message };
  }
}

export async function updateQuestion(id: string, payload: Partial<QuestionPayload>) {
  await requireAdmin();
  const db = getDb();

  try {
    const [data] = await db
      .update(questions)
      .set(payload as Partial<typeof questions.$inferInsert>)
      .where(eq(questions.id, id))
      .returning();

    revalidatePath(`/admin/forms/${payload.form_id}`);
    return { data };
  } catch (error) {
    console.error("Error updating question:", error);
    return { error: (error as Error).message };
  }
}

export async function deleteQuestion(id: string, formId: string) {
  await requireAdmin();
  const db = getDb();

  try {
    await db.delete(questions).where(eq(questions.id, id));
    revalidatePath(`/admin/forms/${formId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting question:", error);
    return { error: (error as Error).message };
  }
}
