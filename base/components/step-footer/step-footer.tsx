// Step Footer: los botones de un paso a paso: «Atrás» a la izquierda y la acción principal a la derecha.
// Componente propio (base). Se usa junto a Steps. Sin onBack (primer paso), solo sale el botón principal.
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/custom/back-button"

function StepFooter({ onBack, onNext, backLabel = "Atrás", nextLabel = "Continuar", nextDisabled, className, ...props }: React.ComponentProps<"div"> & {
  onBack?: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  nextDisabled?: boolean
}) {
  return (
    <div data-slot="step-footer" className={cn("flex w-full items-center gap-gap-sm", onBack ? "justify-between" : "justify-end", className)} {...props}>
      {onBack && <BackButton size="default" onClick={onBack}>{backLabel}</BackButton>}
      <Button onClick={onNext} disabled={nextDisabled}>{nextLabel}</Button>
    </div>
  )
}

export { StepFooter }
