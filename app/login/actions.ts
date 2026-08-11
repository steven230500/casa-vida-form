"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findUserByEmail } from "@/lib/users";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Correo o contraseña incorrectos" };
  }

  const token = createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  revalidatePath("/", "layout");
  redirect("/reviewer");
}

export async function signout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  revalidatePath("/", "layout");
  redirect("/login");
}
