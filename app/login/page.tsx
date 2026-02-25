"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-serif">Panel de Acceso</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Solo personal autorizado (test@test.com / 123456789)
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="email">
              Correo Electrónico
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@casavida.com"
              className="bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="password">
              Contraseña
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="bg-background"
            />
          </div>

          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-xl py-6"
          >
            {pending ? "Iniciando sesión..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
