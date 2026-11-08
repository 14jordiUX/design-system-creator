// Tarjeta de métrica: un dato importante con su etiqueta y cómo ha cambiado.
// Componente propio (no viene de shadcn/ui): está en base/components, así que lo tienen todos los sistemas.
import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "../../lib/utils"
import { Card } from "../ui/card"

type Trend = "up" | "down" | "flat"

function StatCard({ label, value, change, trend = "flat", hint, icon, className, ...props }: React.ComponentProps<"div"> & {
  label: string
  value: React.ReactNode
  change?: string
  trend?: Trend
  hint?: string
  icon?: React.ReactNode
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus
  return (
    <Card data-slot="stat-card" className={cn("gap-gap-sm p-inset-lg", className)} {...props}>
      <div className="flex items-center justify-between gap-gap-sm text-ui text-muted-foreground">
        <span data-slot="stat-card-label">{label}</span>
        {icon && <span className="[&_svg:not([class*='size-'])]:size-icon-md">{icon}</span>}
      </div>
      <div data-slot="stat-card-value" className="text-h2 font-strong tracking-heading">{value}</div>
      {(change || hint) && (
        <div className="flex items-center gap-gap-xs text-caption text-muted-foreground">
          {change && (
            <span data-slot="stat-card-change" data-trend={trend}
              className="inline-flex items-center gap-gap-2xs rounded-pill px-inset-xs py-inset-3xs font-emphasis data-[trend=up]:bg-success-subtle data-[trend=up]:text-success-text data-[trend=down]:bg-danger-subtle data-[trend=down]:text-danger-text data-[trend=flat]:bg-muted [&_svg]:size-icon-sm">
              <TrendIcon />{change}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </Card>
  )
}

export { StatCard }
