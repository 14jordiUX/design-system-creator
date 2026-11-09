// Back Button: «Volver» o «Atrás» con flecha, siempre igual en todos los flujos.
// Componente propio (base). Por dentro es un Button fantasma pequeño.
import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"

function BackButton({ children = "Volver", className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button type="button" variant="ghost" size="sm" data-slot="back-button" className={cn("justify-self-start", className)} {...props}>
      <ArrowLeft />{children}
    </Button>
  )
}

export { BackButton }
