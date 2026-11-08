import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Textarea } from "./textarea"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex w-full items-center rounded-control border-thin border-input shadow-flat transition-colors outline-none",
        "h-control-md min-w-0 has-[>textarea]:h-auto",
        // Según dónde vaya el complemento
        "has-[>[data-align=inline-start]]:[&>input]:pl-inset-sm",
        "has-[>[data-align=inline-end]]:[&>input]:pr-inset-sm",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-inset-md",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-inset-md",
        // Foco: el anillo va en el grupo, no en el campo
        "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:focus-ring",
        // Error
        "has-[[data-slot][aria-invalid=true]]:border-destructive",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-gap-sm py-inset-xs text-ui font-emphasis text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-disabled [&>kbd]:rounded-fine [&>svg:not([class*='size-'])]:size-icon-md",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-inset-md has-[>button]:-ml-inset-xs has-[>kbd]:-ml-inset-2xs",
        "inline-end": "order-last pr-inset-md has-[>button]:-mr-inset-xs has-[>kbd]:-mr-inset-2xs",
        "block-start": "order-first w-full justify-start px-inset-md pt-inset-md group-has-[>input]/input-group:pt-inset-sm [.border-b]:pb-inset-md",
        "block-end": "order-last w-full justify-start px-inset-md pb-inset-md group-has-[>input]/input-group:pb-inset-sm [.border-t]:pt-inset-md",
      },
    },
    defaultVariants: { align: "inline-start" },
  }
)

function InputGroupAddon({ className, align = "inline-start", ...props }: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div role="group" data-slot="input-group-addon" data-align={align} className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props} />
  )
}

const inputGroupButtonVariants = cva("flex items-center gap-gap-sm text-ui shadow-none", {
  variants: {
    size: {
      xs: "h-avatar-sm gap-gap-2xs rounded-fine px-inset-sm has-[>svg]:px-inset-sm [&>svg:not([class*='size-'])]:size-icon-sm",
      sm: "h-control-sm gap-gap-xs rounded-control px-inset-sm has-[>svg]:px-inset-sm",
      "icon-xs": "size-avatar-sm rounded-fine p-0 has-[>svg]:p-0",
      "icon-sm": "size-control-sm p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: { size: "xs" },
})

function InputGroupButton({ className, type = "button", variant = "ghost", size = "xs", ...props }: Omit<React.ComponentProps<typeof Button>, "size"> & VariantProps<typeof inputGroupButtonVariants>) {
  return <Button type={type} data-size={size} variant={variant} className={cn(inputGroupButtonVariants({ size }), className)} {...props} />
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("flex items-center gap-gap-sm text-ui text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-icon-md", className)} {...props} />
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return <Input data-slot="input-group-control" className={cn("flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:outline-none", className)} {...props} />
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <Textarea data-slot="input-group-control" className={cn("flex-1 resize-none rounded-none border-0 bg-transparent py-inset-md shadow-none focus-visible:outline-none", className)} {...props} />
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea }
