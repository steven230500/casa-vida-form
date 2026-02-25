"use client"

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < currentStep
              ? "bg-primary"
              : i === currentStep
                ? "bg-primary/60"
                : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}
