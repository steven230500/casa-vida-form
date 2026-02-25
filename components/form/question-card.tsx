"use client"

import { cn } from "@/lib/utils"

interface QuestionCardProps {
  children: React.ReactNode
  className?: string
}

export function QuestionCard({ children, className }: QuestionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}

interface QuestionLabelProps {
  children: React.ReactNode
  number?: number
  required?: boolean
}

export function QuestionLabel({ children, number, required }: QuestionLabelProps) {
  return (
    <label className="flex gap-2 text-sm font-medium leading-relaxed text-foreground">
      {number !== undefined && (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {number}
        </span>
      )}
      <span>
        {children}
        {required && <span className="ml-0.5 text-accent">*</span>}
      </span>
    </label>
  )
}
