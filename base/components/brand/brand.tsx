// Brand: el logo y el nombre del producto, para la cabecera de las pantallas de acceso o de bienvenida.
// Componente propio (base). Si no le pasas icono, usa uno genérico.
import * as React from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

function Brand({ name = "Mi producto", icon, className, ...props }: React.ComponentProps<"div"> & {
  name?: string
  /** El logo (un icono o una imagen) */
  icon?: React.ReactNode
}) {
  return (
    <div data-slot="brand" className={cn("flex items-center justify-center gap-gap-sm text-body font-strong text-foreground", className)} {...props}>
      <span className="flex size-avatar-md shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground [&_svg]:size-icon-md">
        {icon ?? <Sparkles />}
      </span>
      {name}
    </div>
  )
}

export { Brand }
