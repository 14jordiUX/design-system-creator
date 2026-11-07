import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-avatar-2xl w-full rounded-control border-thin border-input bg-transparent px-inset-md py-inset-sm text-body shadow-flat transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-disabled aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
