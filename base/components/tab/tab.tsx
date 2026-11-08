// Tab: pestañas que se adaptan al sitio donde se ponen (escritorio o móvil).
// Se adapta al ancho de su contenedor (no al de la pantalla): por debajo de layout.compact usa su versión móvil.
// En móvil puede: desplazarse de lado (scroll), repartir el ancho (fill) o convertirse en una barra inferior con iconos (bar).
// Componente propio (no viene de shadcn/ui): está en base/components, así que lo tienen todos los sistemas.
import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

type Variant = "line" | "pill"
type Mobile = "scroll" | "fill" | "bar"
const TabContext = React.createContext<{ variant: Variant; mobile: Mobile }>({ variant: "line", mobile: "scroll" })

function Tab({ variant = "line", mobile = "scroll", className, ...props }:
  React.ComponentProps<typeof TabsPrimitive.Root> & { variant?: Variant; mobile?: Mobile }) {
  return (
    <TabContext.Provider value={{ variant, mobile }}>
      <TabsPrimitive.Root data-slot="tab" data-variant={variant} data-mobile={mobile}
        className={cn("@container/tab flex w-full min-w-0 flex-col gap-gap-md", mobile === "bar" && "@max-compact/tab:gap-0", className)} {...props} />
    </TabContext.Provider>
  )
}

function TabList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const { variant, mobile } = React.useContext(TabContext)
  const list = (
    <TabsPrimitive.List data-slot="tab-list"
      className={cn(
        "flex max-w-full items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        variant === "line" && "w-full gap-gap-lg border-b-thin",
        variant === "pill" && "w-fit gap-gap-2xs rounded-pill bg-muted p-inset-3xs",
        mobile === "fill" && "@max-compact/tab:w-full @max-compact/tab:gap-0",
        mobile === "bar" && "@max-compact/tab:order-last @max-compact/tab:w-full @max-compact/tab:gap-0 @max-compact/tab:rounded-square @max-compact/tab:border-b-0 @max-compact/tab:border-t-thin @max-compact/tab:bg-background @max-compact/tab:p-0",
        className)}
      {...props} />
  )
  if (mobile !== "scroll") return list
  // En móvil, un degradado al final avisa de que hay más pestañas al desplazar
  return (
    <div className="relative flex min-w-0">
      {list}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 end-0 hidden w-avatar-md bg-linear-to-l from-background to-transparent @max-compact/tab:block" />
    </div>
  )
}

// icon: icono opcional (en la barra inferior móvil va encima del texto). badge: número o aviso opcional.
function TabTrigger({ icon, badge, className, children, ...props }:
  React.ComponentProps<typeof TabsPrimitive.Trigger> & { icon?: React.ReactNode; badge?: React.ReactNode }) {
  const { variant, mobile } = React.useContext(TabContext)
  const ref = React.useRef<HTMLButtonElement>(null)
  // En móvil, la pestaña activa siempre queda a la vista
  const reveal = () => ref.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
  return (
    <TabsPrimitive.Trigger ref={ref} data-slot="tab-trigger" onFocus={reveal}
      className={cn(
        "group/trigger relative inline-flex shrink-0 items-center justify-center gap-gap-xs text-ui font-emphasis whitespace-nowrap text-muted-foreground",
        "transition-colors outline-none hover:text-foreground focus-visible:focus-ring-inset disabled:pointer-events-none disabled:opacity-disabled",
        "data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
        variant === "line" && "h-control-md px-inset-2xs after:absolute after:inset-x-0 after:-bottom-thin after:h-line after:rounded-pill after:bg-primary after:opacity-0 after:transition-opacity data-[state=active]:after:opacity-100",
        variant === "pill" && "h-control-sm rounded-pill px-inset-md data-[state=active]:bg-background data-[state=active]:shadow-flat",
        mobile === "fill" && "@max-compact/tab:flex-1",
        mobile === "bar" && [
          "@max-compact/tab:h-auto @max-compact/tab:flex-1 @max-compact/tab:flex-col @max-compact/tab:gap-gap-3xs @max-compact/tab:rounded-square",
          "@max-compact/tab:px-inset-2xs @max-compact/tab:py-inset-xs @max-compact/tab:text-caption",
          "@max-compact/tab:after:hidden @max-compact/tab:data-[state=active]:bg-transparent @max-compact/tab:data-[state=active]:text-link @max-compact/tab:data-[state=active]:shadow-none",
        ],
        className)}
      {...props}>
      {icon && <span className="relative flex">{icon}
        {badge != null && mobile === "bar" && (
          <span className="absolute -end-inset-sm -top-inset-2xs hidden min-w-icon-md items-center justify-center rounded-pill bg-primary px-inset-2xs text-caption leading-compact text-primary-foreground @max-compact/tab:flex">{badge}</span>
        )}
      </span>}
      <span className="truncate">{children}</span>
      {badge != null && (
        <span data-slot="tab-badge"
          className={cn("inline-flex min-w-icon-lg items-center justify-center rounded-pill bg-muted px-inset-xs text-caption leading-compact text-muted-foreground",
            "group-data-[state=active]/trigger:bg-primary group-data-[state=active]/trigger:text-primary-foreground",
            variant === "pill" && "bg-background",
            mobile === "bar" && icon && "@max-compact/tab:hidden")}>
          {badge}
        </span>
      )}
    </TabsPrimitive.Trigger>
  )
}

function TabContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tab-content" className={cn("min-w-0 flex-1 outline-none", className)} {...props} />
}

export { Tab, TabList, TabTrigger, TabContent }
