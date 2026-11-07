import * as React from "react"
import { cn } from "../../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-control-md w-full min-w-0 rounded-control border-thin border-input bg-transparent px-inset-md py-inset-2xs text-body shadow-flat transition-colors outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-full file:border-0 file:bg-transparent file:text-ui file:font-emphasis file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-disabled",
        "focus-visible:border-ring focus-visible:focus-ring",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
