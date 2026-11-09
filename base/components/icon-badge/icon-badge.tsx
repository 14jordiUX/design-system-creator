// Icon Badge: un icono dentro de un círculo de color, para encabezar mensajes, resultados o pasos.
// Componente propio (base). Variantes de color y tres tamaños. Tamaño fijo: no escala.
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconBadgeVariants = cva("inline-flex shrink-0 items-center justify-center rounded-pill", {
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground",
      accent: "bg-accent text-accent-foreground",
      success: "bg-success-subtle text-success-text",
      danger: "bg-danger-subtle text-danger-text",
      muted: "bg-muted text-muted-foreground",
    },
    size: {
      sm: "size-avatar-md [&_svg]:size-icon-sm",
      md: "size-avatar-lg [&_svg]:size-icon-md",
      lg: "size-avatar-xl [&_svg]:size-icon-lg",
    },
  },
  defaultVariants: { variant: "primary", size: "lg" },
})

function IconBadge({ className, variant, size, ...props }: React.ComponentProps<"span"> & VariantProps<typeof iconBadgeVariants>) {
  return (
    <span data-slot="icon-badge" data-variant={variant ?? "primary"} data-size={size ?? "lg"}
      className={cn(iconBadgeVariants({ variant, size }), className)} {...props} />
  )
}

export { IconBadge, iconBadgeVariants }
