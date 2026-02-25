"use client"

interface StepHeaderProps {
  stepNumber: number
  totalSteps: number
  title: string
  subtitle?: string
}

export function StepHeader({ stepNumber, totalSteps, title, subtitle }: StepHeaderProps) {
  return (
    <div className="flex flex-col gap-2 px-1">
      <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
        Paso {stepNumber} de {totalSteps}
      </span>
      <h2 className="font-serif text-2xl leading-tight text-foreground text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
