"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { LogoMark } from "@/components/brand/logo-mark";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="admin-theme flex min-h-dvh flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-9" />
          <h1 className="text-xl font-semibold tracking-tight">
            Panel de Formularios
          </h1>
        </div>

        <form
          action={formAction}
          className="grid gap-5 rounded-t-[2.5rem] rounded-b-2xl border border-foreground/10 bg-muted p-8"
        >
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@casavida.com"
              className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-foreground/40"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-foreground/40"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
          >
            {pending ? "Iniciando sesión..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
