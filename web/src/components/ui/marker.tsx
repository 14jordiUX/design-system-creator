import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const markerVariants = cva(
  "group/marker relative flex min-h-icon-md w-full items-center gap-gap-sm text-left text-ui text-muted-foreground [&_svg:not([class*='size-'])]:size-icon-md [a]:underline [a]:underline-offset-[var(--space-inset-2xs)] [a]:hover:text-foreground",
  {
    variants: {
      variant: {
        default: "",
        separator: "before:mr-gap-2xs before:h-thin before:min-w-0 before:flex-1 before:bg-border after:ml-gap-2xs after:h-thin after:min-w-0 after:flex-1 after:bg-border",
        border: "border-b-thin border-border pb-inset-sm",
      },
    },
  }
)

function Marker({ className, variant = "default", asChild = false, ...props }: React.ComponentProps<"div"> & VariantProps<typeof markerVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"
  return <Comp data-slot="marker" data-variant={variant} className={cn(markerVariants({ variant, className }))} {...props} />
}

function MarkerIcon({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="marker-icon" aria-hidden="true" className={cn("size-icon-md shrink-0 [&_svg:not([class*='size-'])]:size-icon-md", className)} {...props} />
}

function MarkerContent({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span data-slot="marker-content"
      className={cn("min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-[var(--space-inset-2xs)] *:[a]:hover:text-foreground", className)} {...props} />
  )
}

export { Marker, MarkerIcon, MarkerContent, markerVariants }
