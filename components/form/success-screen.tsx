"use client"

import { CheckCircle2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuccessScreenProps {
  onReset: () => void
}

export function SuccessScreen({ onReset }: SuccessScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" strokeWidth={1.5} />
          </div>
          <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <Heart className="h-4 w-4 text-accent-foreground" fill="currentColor" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-3xl text-foreground">
            {"Gracias por tu honestidad"}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Tu reflexion ha sido enviada exitosamente. Que esta semana sea una
            oportunidad para acercarte mas a Dios y vivir con proposito.
          </p>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-5">
          <p className="font-serif text-lg leading-relaxed text-foreground italic">
            {'"Porque donde esta tu tesoro, ahi estara tambien tu corazon."'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Mateo 6:21</p>
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="w-full rounded-xl text-base font-medium"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}
