// App Sidebar: la estructura de una aplicación con barra lateral de navegación.
// Escritorio: tres estados — desplegada (iconos y textos), plegada a iconos, u oculta del todo.
// Móvil: la barra se esconde y queda un único botón (☰) que la abre por encima del contenido,
//        o bien (mobileNav="tabbar") una barra inferior con 4 accesos + «Más», que abre la barra lateral completa.
// Decide escritorio o móvil por el ancho de su contenedor (token layout.desktop), así funciona igual a pantalla completa o dentro de un hueco.
// Componente propio (no viene de shadcn/ui): está en base/components, así que lo tienen todos los sistemas.
import * as React from "react"
import { Slot } from "radix-ui"
import { Menu, MoreHorizontal, PanelLeft, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import { cn, tokenPx } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type AppSidebarState = "expanded" | "icons" | "hidden"

type Ctx = {
  mobile: boolean
  mobileNav: "menu" | "tabbar"
  state: AppSidebarState
  setState: (s: AppSidebarState) => void
  open: boolean
  setOpen: (o: boolean) => void
}
const ShellContext = React.createContext<Ctx | null>(null)

export function useAppSidebar() {
  const ctx = React.useContext(ShellContext)
  if (!ctx) throw new Error("useAppSidebar va dentro de <AppShell>")
  return ctx
}

// Raíz: ocupa el hueco que le des (en una app, toda la pantalla: className="h-dvh").
// state / defaultState / onStateChange: estado en escritorio. shortcut: ⌘B / Ctrl+B muestra u oculta la barra.
// mobileNav: en móvil, "menu" (un botón ☰ en la cabecera) o "tabbar" (barra inferior <AppTabBar> con «Más»).
function AppShell({ state, defaultState = "expanded", onStateChange, shortcut = true, mobileNav = "menu", className, children, ...props }:
  React.ComponentProps<"div"> & { state?: AppSidebarState; defaultState?: AppSidebarState; onStateChange?: (s: AppSidebarState) => void; shortcut?: boolean; mobileNav?: "menu" | "tabbar" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [inner, setInner] = React.useState(defaultState)
  const current = state ?? inner
  const setState = React.useCallback((s: AppSidebarState) => { setInner(s); onStateChange?.(s) }, [onStateChange])
  const [mobile, setMobile] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const lastVisible = React.useRef<AppSidebarState>(current === "hidden" ? "expanded" : current)
  if (current !== "hidden") lastVisible.current = current

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setMobile(e.contentRect.width < tokenPx(`layout-desktop`, 768)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  React.useEffect(() => { if (!mobile) setOpen(false) }, [mobile])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false)
      if (shortcut && e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (mobile) setOpen(!open)
        else setState(current === "hidden" ? lastVisible.current : "hidden")
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, mobile, current, shortcut, setState])

  return (
    <ShellContext.Provider value={{ mobile, mobileNav, state: current, setState, open, setOpen }}>
      <div ref={ref} data-slot="app-shell" data-mode={mobile ? "mobile" : "desktop"} data-state={current} data-open={open || undefined}
        className={cn("relative flex w-full overflow-hidden bg-background text-foreground", className)} {...props}>
        {children}
      </div>
    </ShellContext.Provider>
  )
}

function AppSidebar({ className, children, ...props }: React.ComponentProps<"aside">) {
  const { mobile, state, open, setOpen } = useAppSidebar()
  return (
    <>
      {mobile && (
        <div data-slot="app-sidebar-scrim" aria-hidden onClick={() => setOpen(false)}
          className={cn("absolute inset-0 z-overlay bg-overlay transition-opacity duration-default", open ? "opacity-100" : "pointer-events-none opacity-0")} />
      )}
      <aside data-slot="app-sidebar" data-state={mobile ? (open ? "open" : "closed") : state} aria-hidden={mobile ? !open : state === "hidden"}
        className={cn(
          "flex shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-all duration-default ease-default",
          mobile
            ? cn("absolute inset-y-0 start-0 z-overlay w-sidebar-mobile max-w-full shadow-modal", !open && "invisible -translate-x-full")
            : cn("border-e-thin border-sidebar-border",
                state === "expanded" && "w-sidebar",
                state === "icons" && "w-sidebar-icon",
                state === "hidden" && "invisible w-0 border-e-0"),
          className)}
        {...props}>
        {children}
      </aside>
    </>
  )
}

// ¿Se ven los textos? (no en escritorio plegado a iconos)
const useCompact = () => { const { mobile, state } = useAppSidebar(); return !mobile && state === "icons" }

// Cabecera: logo y nombre. Lleva el botón de plegar a iconos (escritorio) o de cerrar (móvil).
function AppSidebarHeader({ logo, title, className, ...props }: React.ComponentProps<"div"> & { logo?: React.ReactNode; title?: React.ReactNode }) {
  const { mobile, state, setState, setOpen } = useAppSidebar()
  const compact = useCompact()
  return (
    <div data-slot="app-sidebar-header" className={cn("flex h-header shrink-0 items-center gap-gap-sm px-inset-xs", className)} {...props}>
      {!compact && (logo || title) && (
        <div className="flex min-w-0 flex-1 items-center gap-gap-sm ps-inset-xs">
          {logo && <span className="flex shrink-0 [&_svg:not([class*='size-'])]:size-icon-lg">{logo}</span>}
          {title && <span className="truncate text-ui font-strong">{title}</span>}
        </div>
      )}
      <SidebarButton
        label={mobile ? "Cerrar menú" : state === "icons" ? "Desplegar" : "Plegar a iconos"}
        onClick={() => (mobile ? setOpen(false) : setState(state === "icons" ? "expanded" : "icons"))}
        className={cn(compact && "mx-auto")}>
        {mobile ? <X /> : state === "icons" ? <PanelLeftOpen /> : <PanelLeftClose />}
      </SidebarButton>
    </div>
  )
}

function AppSidebarContent({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="app-sidebar-content" className={cn("flex min-h-0 flex-1 flex-col gap-gap-lg overflow-x-hidden overflow-y-auto px-inset-xs py-inset-xs", className)} {...props} />
}

function AppSidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="app-sidebar-footer" className={cn("flex shrink-0 flex-col gap-gap-2xs border-t-thin border-sidebar-border p-inset-xs", className)} {...props} />
}

function AppSidebarGroup({ label, className, children, ...props }: React.ComponentProps<"div"> & { label?: React.ReactNode }) {
  const compact = useCompact()
  return (
    <div data-slot="app-sidebar-group" role="group" className={cn("flex flex-col gap-gap-2xs", className)} {...props}>
      {label && (compact
        ? <div aria-hidden className="mx-auto h-line w-icon-lg rounded-pill bg-sidebar-border" />
        : <div className="px-inset-sm pb-inset-3xs text-caption font-emphasis text-muted-foreground">{label}</div>)}
      {children}
    </div>
  )
}

// Un enlace o botón de la barra. Con asChild envuelve tu propio <a> o <Link>. Plegada a iconos, el texto sale en un tooltip.
function AppSidebarItem({ icon, active, badge, asChild, onClick, className, children, ...props }:
  React.ComponentProps<"button"> & { icon?: React.ReactNode; active?: boolean; badge?: React.ReactNode; asChild?: boolean }) {
  const { mobile, setOpen } = useAppSidebar()
  const compact = useCompact()
  const Comp = asChild ? Slot.Root : "button"
  const item = (
    <Comp data-slot="app-sidebar-item" data-active={active || undefined} aria-current={active ? "page" : undefined}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => { onClick?.(e); if (mobile) setOpen(false) }}
      className={cn(
        "relative flex h-control-md w-full shrink-0 items-center gap-gap-sm rounded-control px-inset-sm text-ui text-sidebar-foreground transition-colors outline-none",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:focus-ring-inset disabled:pointer-events-none disabled:opacity-disabled",
        "data-active:bg-sidebar-accent data-active:font-emphasis data-active:text-sidebar-accent-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
        compact && "mx-auto size-control-md justify-center px-0",
        className)}
      {...props}>
      {asChild ? children : (
        <>
          {icon}
          {!compact && <span className="min-w-0 flex-1 truncate text-start">{children}</span>}
          {badge != null && (compact
            ? <span aria-hidden className="absolute end-inset-2xs top-inset-2xs size-indicator rounded-pill bg-primary" />
            : <span className="inline-flex min-w-icon-lg items-center justify-center rounded-pill bg-primary px-inset-xs text-caption leading-compact text-primary-foreground">{badge}</span>)}
        </>
      )}
    </Comp>
  )
  if (!compact) return item
  return (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="right">{children}</TooltipContent>
    </Tooltip>
  )
}

// Botón para la cabecera del contenido: en móvil es el ☰ que abre la barra; en escritorio la oculta o la vuelve a mostrar.
// Con mobileNav="tabbar", en móvil no se muestra (la barra se abre desde «Más»).
function AppSidebarTrigger({ className, ...props }: React.ComponentProps<"button">) {
  const { mobile, mobileNav, state, setState, open, setOpen } = useAppSidebar()
  const last = React.useRef<AppSidebarState>("expanded")
  if (state !== "hidden") last.current = state
  if (mobile && mobileNav === "tabbar") return null
  return (
    <SidebarButton
      label={mobile ? "Abrir menú" : state === "hidden" ? "Mostrar la barra lateral" : "Ocultar la barra lateral"}
      aria-expanded={mobile ? open : state !== "hidden"}
      onClick={() => (mobile ? setOpen(true) : setState(state === "hidden" ? last.current : "hidden"))}
      className={className} {...props}>
      {mobile ? <Menu /> : <PanelLeft />}
    </SidebarButton>
  )
}

function SidebarButton({ label, className, children, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label}
      className={cn("inline-flex size-control-md shrink-0 items-center justify-center rounded-control text-muted-foreground transition-colors outline-none",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:focus-ring [&_svg]:size-icon-md", className)}
      {...props}>
      {children}
    </button>
  )
}

// Barra inferior para móvil (con mobileNav="tabbar"): ponla al final de <AppMain>. Lleva hasta 4 <AppTabBarItem>
// y añade sola un quinto, «Más», que abre la barra lateral con todo. En escritorio no se muestra.
// moreActive: marca «Más» como activo cuando la página actual no es uno de los 4 accesos.
function AppTabBar({ moreLabel = "Más", moreIcon = <MoreHorizontal />, moreActive, className, children, ...props }:
  React.ComponentProps<"nav"> & { moreLabel?: string; moreIcon?: React.ReactNode; moreActive?: boolean }) {
  const { mobile, mobileNav, open, setOpen } = useAppSidebar()
  if (!mobile || mobileNav !== "tabbar") return null
  return (
    <nav data-slot="app-tab-bar" aria-label="Navegación principal"
      className={cn("sticky bottom-0 z-sticky mt-auto flex shrink-0 border-t-thin bg-background pb-[env(safe-area-inset-bottom)]", className)} {...props}>
      {children}
      <TabBarButton icon={moreIcon} active={open || moreActive} aria-expanded={open} onClick={() => setOpen(true)}>{moreLabel}</TabBarButton>
    </nav>
  )
}

function AppTabBarItem({ asChild, ...props }: React.ComponentProps<"button"> & { icon: React.ReactNode; active?: boolean; badge?: React.ReactNode; asChild?: boolean }) {
  return <TabBarButton asChild={asChild} {...props} />
}

function TabBarButton({ icon, active, badge, asChild, className, children, ...props }:
  React.ComponentProps<"button"> & { icon: React.ReactNode; active?: boolean; badge?: React.ReactNode; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  const inner = (
    <>
      <span className="relative flex">
        {icon}
        {badge != null && (
          <span className="absolute -end-inset-sm -top-inset-2xs flex min-w-icon-md items-center justify-center rounded-pill bg-primary px-inset-2xs text-caption leading-compact text-primary-foreground">{badge}</span>
        )}
      </span>
      <span className="max-w-full truncate">{children}</span>
    </>
  )
  return (
    <Comp data-slot="app-tab-bar-item" data-active={active || undefined} aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-gap-3xs px-inset-2xs py-inset-xs text-caption text-muted-foreground transition-colors outline-none",
        "hover:text-foreground focus-visible:focus-ring-inset data-active:font-emphasis data-active:text-link",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
        className)}
      {...props}>
      {asChild ? children : inner}
    </Comp>
  )
}

// Zona de contenido, a la derecha de la barra.
function AppMain({ className, ...props }: React.ComponentProps<"main">) {
  return <main data-slot="app-main" className={cn("flex min-w-0 flex-1 flex-col overflow-y-auto", className)} {...props} />
}

function AppHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="app-header" className={cn("sticky top-0 z-sticky flex h-header shrink-0 items-center gap-gap-sm border-b-thin bg-background px-inset-md", className)} {...props} />
}

export { AppShell, AppSidebar, AppSidebarHeader, AppSidebarContent, AppSidebarFooter, AppSidebarGroup, AppSidebarItem, AppSidebarTrigger, AppTabBar, AppTabBarItem, AppMain, AppHeader }
