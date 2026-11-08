import { cn } from "../../lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-icon-lg w-fit min-w-icon-lg items-center justify-center gap-gap-2xs rounded-inner bg-muted px-inset-2xs font-base text-caption font-emphasis text-muted-foreground select-none",
        "[&_svg:not([class*='size-'])]:size-icon-sm",
        "[[data-slot=tooltip-content]_&]:bg-inverse [[data-slot=tooltip-content]_&]:text-background",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-gap-2xs", className)} {...props} />
}

export { Kbd, KbdGroup }
