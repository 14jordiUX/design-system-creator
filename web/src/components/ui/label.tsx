"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label as LabelPrimitive } from "radix-ui"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-gap-sm text-ui leading-compact font-emphasis select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-disabled peer-disabled:cursor-not-allowed peer-disabled:opacity-disabled",
        className
      )}
      {...props}
    />
  )
}

export { Label }
