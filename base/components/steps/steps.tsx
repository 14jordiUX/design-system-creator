// Pasos: en qué paso de un proceso estás («Paso 2 de 3») con una barra por tramos.
// Componente propio (no viene de shadcn/ui): está en base/components, así que lo tienen todos los sistemas.
// Estados: cada tramo está hecho, actual o pendiente. En Figma es un componente con una variante por paso.
import * as React from "react"
import { cn } from "@/lib/utils"

function Steps({ current, total, label, className, ...props }: React.ComponentProps<"div"> & {
  /** Paso actual, empezando en 1 */
  current: number
  /** Número total de pasos */
  total: number
  /** Nombre del paso (opcional): sale al lado del contador */
  label?: string
}) {
  const now = Math.min(Math.max(current, 1), total)
  return (
    <div
      data-slot="steps"
      data-step={now}
      data-total={total}
      role="group"
      aria-label={`Paso ${now} de ${total}${label ? `: ${label}` : ""}`}
      className={cn("flex w-full flex-col gap-gap-xs", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-gap-sm text-caption">
        <span data-slot="steps-count" className="text-muted-foreground">Paso {now} de {total}</span>
        {label && <span data-slot="steps-label" className="font-emphasis text-foreground">{label}</span>}
      </div>
      <div className="flex w-full gap-gap-2xs" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            data-slot="steps-segment"
            data-state={i + 1 < now ? "complete" : i + 1 === now ? "current" : "upcoming"}
            className="h-indicator flex-1 rounded-pill bg-primary-subtle data-[state=complete]:bg-primary data-[state=current]:bg-primary"
          />
        ))}
      </div>
    </div>
  )
}

export { Steps }
