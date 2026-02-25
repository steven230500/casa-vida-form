"use client"

import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="flex flex-col gap-1">
          <p className="font-serif text-xl text-foreground">Enviando tus respuestas</p>
          <p className="text-sm text-muted-foreground">Un momento por favor...</p>
        </div>
      </div>
    </div>
  )
}
