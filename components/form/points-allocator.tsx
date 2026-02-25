"use client"

import { useCallback } from "react"
import { Slider } from "@/components/ui/slider"

interface Category {
  key: string
  label: string
}

interface PointsAllocatorProps {
  categories: Category[]
  values: Record<string, number>
  onChange: (values: Record<string, number>) => void
  total?: number
}

export function PointsAllocator({
  categories,
  values,
  onChange,
  total = 100,
}: PointsAllocatorProps) {
  const currentTotal = Object.values(values).reduce((sum, v) => sum + v, 0)
  const remaining = total - currentTotal

  const handleChange = useCallback(
    (key: string, newValue: number) => {
      const otherTotal = currentTotal - (values[key] || 0)
      const maxAllowed = total - otherTotal
      const clampedValue = Math.min(newValue, maxAllowed)
      onChange({ ...values, [key]: clampedValue })
    },
    [values, onChange, currentTotal, total]
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-4 py-2.5">
        <span className="text-sm font-medium text-foreground">Puntos restantes</span>
        <span
          className={`text-lg font-bold tabular-nums ${
            remaining === 0
              ? "text-primary"
              : remaining < 0
                ? "text-destructive"
                : "text-muted-foreground"
          }`}
        >
          {remaining}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {categories.map((cat) => {
          const value = values[cat.key] || 0
          return (
            <div key={cat.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{cat.label}</span>
                <span className="min-w-[2.5rem] text-right text-sm font-semibold tabular-nums text-primary">
                  {value}
                </span>
              </div>
              <Slider
                value={[value]}
                onValueChange={(v) => handleChange(cat.key, v[0])}
                max={total}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          )
        })}
      </div>

      {/* Visual bar showing distribution */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div className="flex h-full">
          {categories.map((cat, i) => {
            const value = values[cat.key] || 0
            if (value === 0) return null
            const colors = [
              "bg-primary",
              "bg-accent",
              "bg-chart-1",
              "bg-chart-2",
              "bg-chart-4",
              "bg-chart-5",
            ]
            return (
              <div
                key={cat.key}
                className={`${colors[i % colors.length]} h-full transition-all duration-300`}
                style={{ width: `${(value / total) * 100}%` }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
