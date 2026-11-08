"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"
import { Accordion as AccordionPrimitive } from "radix-ui"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b-thin last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-start justify-between gap-gap-lg rounded-control py-inset-lg text-left text-ui font-emphasis transition-all outline-none hover:underline focus-visible:border-ring focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-disabled [&[data-state=open]>svg]:rotate-flip",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-icon-md shrink-0 translate-y-inset-3xs text-muted-foreground transition-transform" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-ui data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
      {...props}
    >
      <div className={cn("pt-0 pb-inset-lg", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
