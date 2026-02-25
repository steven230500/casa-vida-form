"use client"

import { ShieldCheck, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingScreenProps {
  onStart: () => void
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        {/* Logo / Icon area */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Heart className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-3xl leading-tight text-foreground text-balance">
            {"Jovenes Casa Vida 20+"}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Reflexion semanal para tu crecimiento espiritual
          </p>
        </div>

        {/* Confidentiality card */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              Tu informacion es confidencial
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Tus respuestas son privadas y seran tratadas con absoluta
              confidencialidad por el equipo pastoral. Puedes responder de forma
              anonima si lo prefieres.
            </span>
          </div>
        </div>

        <Button
          onClick={onStart}
          size="lg"
          className="w-full rounded-xl text-base font-medium"
        >
          Empezar
        </Button>
      </div>
    </div>
  )
}
