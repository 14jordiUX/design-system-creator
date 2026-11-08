import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="empty"
      className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-gap-xl rounded-card border-dashed p-inset-xl text-center text-balance md:p-inset-3xl", className)} {...props} />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-header" className={cn("flex max-w-popover flex-col items-center gap-gap-sm text-center", className)} {...props} />
}

const emptyMediaVariants = cva("mb-gap-sm flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0", {
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "flex size-avatar-lg shrink-0 items-center justify-center rounded-card bg-muted text-foreground [&_svg:not([class*='size-'])]:size-icon-lg",
    },
  },
  defaultVariants: { variant: "default" },
})

function EmptyMedia({ className, variant = "default", ...props }: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return <div data-slot="empty-icon" data-variant={variant} className={cn(emptyMediaVariants({ variant, className }))} {...props} />
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-title" className={cn("text-lead font-emphasis tracking-heading", className)} {...props} />
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div data-slot="empty-description"
      className={cn("text-ui leading-body text-muted-foreground [&>a]:underline [&>a]:underline-offset-[var(--space-inset-2xs)] [&>a:hover]:text-primary", className)} {...props} />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-content" className={cn("flex w-full max-w-popover min-w-0 flex-col items-center gap-gap-lg text-ui text-balance", className)} {...props} />
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia }
