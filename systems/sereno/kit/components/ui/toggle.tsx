"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-gap-sm rounded-control text-ui font-emphasis whitespace-nowrap transition-colors outline-none hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-disabled aria-invalid:border-destructive data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border-thin border-input bg-transparent shadow-flat hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-control-md min-w-control-md px-inset-sm",
        sm: "h-control-sm min-w-control-sm px-inset-xs",
        lg: "h-control-lg min-w-control-lg px-inset-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
