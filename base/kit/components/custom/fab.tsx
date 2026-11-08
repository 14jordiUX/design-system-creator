// Fab: botón flotante (floating action button) con la acción principal de una pantalla.
// Puede abrir una o varias listas de acciones más pequeñas hacia arriba, abajo o los lados.
// Componente propio (no viene de shadcn/ui): está en base/components, así que lo tienen todos los sistemas.
import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

type FabState = { activated: boolean; setActivated: (v: boolean) => void; inList: boolean }
const FabContext = React.createContext<FabState | null>(null)

// Colocación: vertical (top | center | bottom) y horizontal (start | center | end).
// `fixed`: se queda fijo en la pantalla al hacer scroll; si no, se coloca dentro del contenedor (que debe ser `relative`).
// `edge`: con vertical top o bottom, queda a caballo sobre el borde del contenedor (por ejemplo bajo una cabecera).
function Fab({ vertical = "bottom", horizontal = "end", edge = false, fixed = false, activated, defaultActivated = false, onActivatedChange, className, children, ...props }:
  React.ComponentProps<"div"> & {
    vertical?: "top" | "center" | "bottom"
    horizontal?: "start" | "center" | "end"
    edge?: boolean
    fixed?: boolean
    activated?: boolean
    defaultActivated?: boolean
    onActivatedChange?: (activated: boolean) => void
  }) {
  const [inner, setInner] = React.useState(defaultActivated)
  const open = activated ?? inner
  const setActivated = React.useCallback((v: boolean) => { setInner(v); onActivatedChange?.(v) }, [onActivatedChange])
  const ref = React.useRef<HTMLDivElement>(null)

  // Se cierra con Escape o al hacer clic fuera
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActivated(false)
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setActivated(false)
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown) }
  }, [open, setActivated])

  return (
    <FabContext.Provider value={{ activated: open, setActivated, inList: false }}>
      <div ref={ref} data-slot="fab" data-state={open ? "open" : "closed"} data-vertical={vertical} data-horizontal={horizontal} data-edge={edge || undefined}
        className={cn(
          "z-40",
          fixed ? "fixed" : "absolute",
          "data-[vertical=top]:top-inset-lg data-[vertical=bottom]:bottom-inset-lg data-[vertical=center]:top-1/2 data-[vertical=center]:-translate-y-1/2",
          "data-[horizontal=start]:start-inset-lg data-[horizontal=end]:end-inset-lg data-[horizontal=center]:start-1/2 data-[horizontal=center]:-translate-x-1/2",
          "data-edge:data-[vertical=top]:top-0 data-edge:data-[vertical=top]:-translate-y-1/2 data-edge:data-[vertical=bottom]:bottom-0 data-edge:data-[vertical=bottom]:translate-y-1/2",
          className)}
        {...props}>
        {children}
      </div>
    </FabContext.Provider>
  )
}

// El botón. Dentro de <Fab> abre y cierra sus listas (y enseña `closeIcon` mientras están abiertas);
// dentro de <FabList> es una acción: más pequeño, de color secundario, y al pulsarlo se cierra el fab.
function FabButton({ size, closeIcon = <X />, onClick, className, children, ...props }:
  React.ComponentProps<"button"> & { size?: "default" | "sm"; closeIcon?: React.ReactNode }) {
  const ctx = React.useContext(FabContext)
  const inList = !!ctx?.inList
  const hasList = !inList && !!ctx
  const small = size ? size === "sm" : inList
  const showClose = hasList && ctx.activated && !!closeIcon
  return (
    <button type="button" data-slot="fab-button" data-size={small ? "sm" : "default"} data-in-list={inList || undefined}
      aria-expanded={hasList ? ctx.activated : undefined}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || !ctx) return
        ctx.setActivated(inList ? false : !ctx.activated)
      }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-pill shadow-raised transition-all duration-default outline-none",
        "focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0",
        small ? "size-fab-sm [&_svg:not([class*='size-'])]:size-icon-md" : "size-fab-md [&_svg:not([class*='size-'])]:size-icon-lg",
        inList ? "bg-secondary text-secondary-foreground hover:bg-secondary-hover" : "bg-primary text-primary-foreground hover:bg-primary-hover",
        className)}
      {...props}>
      <span data-slot="fab-button-icon" className={cn("flex items-center justify-center transition-all duration-default", showClose && "rotate-90 opacity-0")}>{children}</span>
      {hasList && closeIcon && (
        <span data-slot="fab-button-close" aria-hidden
          className={cn("absolute inset-0 flex items-center justify-center transition-all duration-default", !showClose && "rotate-90 opacity-0")}>
          {closeIcon}
        </span>
      )}
    </button>
  )
}

// Lista de acciones que se abre desde el botón principal. Un fab puede tener varias, una por lado.
function FabList({ side = "top", className, children, ...props }: React.ComponentProps<"div"> & { side?: "top" | "bottom" | "start" | "end" }) {
  const ctx = React.useContext(FabContext)
  const open = !!ctx?.activated
  return (
    <FabContext.Provider value={{ activated: open, setActivated: ctx?.setActivated ?? (() => {}), inList: true }}>
      <div data-slot="fab-list" data-side={side} data-state={open ? "open" : "closed"} aria-hidden={!open}
        className={cn(
          "absolute flex items-center gap-gap-sm transition-all duration-default",
          "data-[side=top]:bottom-full data-[side=top]:mb-gap-md data-[side=top]:flex-col-reverse",
          "data-[side=bottom]:top-full data-[side=bottom]:mt-gap-md data-[side=bottom]:flex-col",
          "data-[side=top]:start-1/2 data-[side=top]:-translate-x-1/2 data-[side=bottom]:start-1/2 data-[side=bottom]:-translate-x-1/2",
          "data-[side=start]:end-full data-[side=start]:me-gap-md data-[side=start]:flex-row-reverse",
          "data-[side=end]:start-full data-[side=end]:ms-gap-md",
          "data-[side=start]:top-1/2 data-[side=start]:-translate-y-1/2 data-[side=end]:top-1/2 data-[side=end]:-translate-y-1/2",
          "data-[state=closed]:pointer-events-none data-[state=closed]:invisible data-[state=closed]:opacity-0",
          className)}
        {...props}>
        {children}
      </div>
    </FabContext.Provider>
  )
}

export { Fab, FabButton, FabList }
