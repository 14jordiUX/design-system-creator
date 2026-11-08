import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const attachmentVariants = cva(
  "group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-card border-thin bg-card text-card-foreground transition-colors focus-within:focus-ring has-[>a,>button]:hover:bg-subtle data-[state=error]:border-danger-border data-[state=idle]:border-dashed",
  {
    variants: {
      size: {
        default: "gap-gap-sm text-ui has-data-[slot=attachment-content]:px-inset-sm has-data-[slot=attachment-content]:py-inset-sm has-data-[slot=attachment-media]:p-inset-sm",
        sm: "gap-gap-sm text-caption has-data-[slot=attachment-content]:px-inset-sm has-data-[slot=attachment-content]:py-inset-xs has-data-[slot=attachment-media]:p-inset-xs",
        xs: "gap-gap-xs rounded-control text-caption has-data-[slot=attachment-content]:px-inset-xs has-data-[slot=attachment-content]:py-inset-2xs has-data-[slot=attachment-media]:p-inset-2xs",
      },
      orientation: {
        horizontal: "min-w-menu-min items-center",
        vertical: "w-field-sm flex-col has-data-[slot=attachment-content]:w-field-sm",
      },
    },
  }
)

function Attachment({ className, state = "done", size = "default", orientation = "horizontal", ...props }: React.ComponentProps<"div"> & VariantProps<typeof attachmentVariants> & { state?: "idle" | "uploading" | "processing" | "error" | "done" }) {
  return <div data-slot="attachment" data-state={state} data-size={size} data-orientation={orientation} className={cn(attachmentVariants({ size, orientation }), className)} {...props} />
}

const attachmentMediaVariants = cva(
  "relative flex aspect-square w-avatar-lg shrink-0 items-center justify-center overflow-hidden rounded-control bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-avatar-md group-data-[size=xs]/attachment:w-avatar-sm group-data-[size=xs]/attachment:rounded-inner group-data-[state=error]/attachment:bg-danger-subtle group-data-[state=error]/attachment:text-danger-text group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-icon-lg! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-icon-md group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-icon-lg group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-icon-sm",
  {
    variants: {
      variant: {
        icon: "",
        image: "opacity-disabled group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover",
      },
    },
    defaultVariants: { variant: "icon" },
  }
)

function AttachmentMedia({ className, variant = "icon", ...props }: React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants>) {
  return <div data-slot="attachment-media" data-variant={variant} className={cn(attachmentMediaVariants({ variant }), className)} {...props} />
}

function AttachmentContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="attachment-content" className={cn("max-w-full min-w-0 flex-1 leading-compact group-data-[orientation=vertical]/attachment:px-inset-2xs", className)} {...props} />
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="attachment-title" className={cn("block max-w-full min-w-0 truncate font-emphasis group-data-[state=processing]/attachment:animate-pulse group-data-[state=uploading]/attachment:animate-pulse", className)} {...props} />
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="attachment-description" className={cn("mt-gap-3xs block max-w-full min-w-0 truncate text-caption text-muted-foreground group-data-[state=error]/attachment:text-danger-text", className)} {...props} />
}

function AttachmentActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="attachment-actions"
      className={cn("relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-inset-md group-data-[orientation=vertical]/attachment:right-inset-md group-data-[orientation=vertical]/attachment:gap-gap-2xs", className)} {...props} />
  )
}

function AttachmentAction({ className, variant, size = "icon-xs", ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="attachment-action" variant={variant ?? "ghost"} size={size} className={cn(className)} {...props} />
}

function AttachmentTrigger({ className, asChild = false, type, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp data-slot="attachment-trigger" type={asChild ? undefined : (type ?? "button")} className={cn("absolute inset-0 z-10 outline-none", className)} {...props} />
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="attachment-group"
      className={cn("flex min-w-0 snap-x snap-mandatory gap-gap-md overflow-x-auto overscroll-x-contain py-inset-2xs *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start", className)} {...props} />
  )
}

export { Attachment, AttachmentGroup, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction, AttachmentTrigger }
