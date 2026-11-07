"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Switch as SwitchPrimitive } from "radix-ui"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-pill p-inset-3xs shadow-flat transition-colors focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-disabled data-[size=default]:h-icon-lg data-[size=default]:w-avatar-md data-[size=sm]:h-icon-md data-[size=sm]:w-avatar-sm data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-pill bg-background shadow-flat transition-transform group-data-[size=default]/switch:size-icon-md group-data-[size=sm]/switch:size-icon-sm data-[state=checked]:translate-x-inset-md data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
