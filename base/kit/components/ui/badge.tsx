import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-gap-2xs overflow-hidden rounded-pill border-thin border-transparent px-inset-sm py-inset-3xs text-caption font-emphasis whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:focus-ring aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-icon-sm",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary-hover",
        destructive:
          "bg-destructive text-destructive-foreground [a&]:hover:bg-destructive-hover",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-link underline-offset-[var(--space-inset-2xs)] [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
