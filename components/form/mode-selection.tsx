"use client"

import { UserRound, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormData } from "@/lib/form-data"

interface ModeSelectionProps {
  formData: FormData
  onSelectMode: (mode: "anonymous" | "named") => void
  onUpdateField: (field: keyof FormData, value: string) => void
  onContinue: () => void
}

export function ModeSelection({
  formData,
  onSelectMode,
  onUpdateField,
  onContinue,
}: ModeSelectionProps) {
  const isNameMode = formData.mode === "named"
  const canContinue =
    formData.mode === "anonymous" ||
    (formData.mode === "named" && formData.name.trim() !== "")

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="font-serif text-2xl text-foreground">
            {"Como deseas responder?"}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Elige la opcion con la que te sientas mas comodo/a
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onSelectMode("anonymous")}
            className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
              formData.mode === "anonymous"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <EyeOff className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                Responder anonimo
              </span>
              <span className="text-xs text-muted-foreground">
                Sin datos personales
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode("named")}
            className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
              formData.mode === "named"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <UserRound className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                Responder con mi nombre
              </span>
              <span className="text-xs text-muted-foreground">
                Para seguimiento pastoral
              </span>
            </div>
          </button>
        </div>

        {isNameMode && (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre
              </Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={(e) => onUpdateField("name", e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo electronico <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={formData.email}
                onChange={(e) => onUpdateField("email", e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>
        )}

        <Button
          onClick={onContinue}
          disabled={!canContinue}
          size="lg"
          className="w-full rounded-xl text-base font-medium"
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
