import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-gap-sm rounded-control text-ui font-emphasis whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-disabled aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        outline:
          "border-thin bg-background shadow-flat hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-link underline-offset-[var(--space-inset-2xs)] hover:underline",
      },
      size: {
        default: "h-control-md px-inset-lg py-inset-sm has-[>svg]:px-inset-md",
        xs: "h-avatar-sm gap-gap-2xs rounded-control px-inset-sm text-caption has-[>svg]:px-inset-xs [&_svg:not([class*='size-'])]:size-icon-sm",
        sm: "h-control-sm gap-gap-xs rounded-control px-inset-md has-[>svg]:px-inset-md",
        lg: "h-control-lg rounded-control px-inset-xl has-[>svg]:px-inset-lg",
        icon: "size-control-md",
        "icon-xs": "size-avatar-sm rounded-control [&_svg:not([class*='size-'])]:size-icon-sm",
        "icon-sm": "size-control-sm",
        "icon-lg": "size-control-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
