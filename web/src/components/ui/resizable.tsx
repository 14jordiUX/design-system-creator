import { GripVerticalIcon } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"
import { cn } from "@/lib/utils"

function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
  return <ResizablePrimitive.Group data-slot="resizable-panel-group" className={cn("flex h-full w-full aria-[orientation=vertical]:flex-col", className)} {...props} />
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({ withHandle, className, ...props }: ResizablePrimitive.SeparatorProps & { withHandle?: boolean }) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-thin items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-inset-2xs after:-translate-x-1/2 focus-visible:focus-ring aria-[orientation=horizontal]:h-thin aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-inset-2xs aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-turn",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-raised flex h-icon-md w-icon-sm items-center justify-center rounded-fine border-thin bg-border">
          <GripVerticalIcon className="size-icon-sm" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
