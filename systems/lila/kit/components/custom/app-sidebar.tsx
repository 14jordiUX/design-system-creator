// App Sidebar: la estructura de una aplicación con barra lateral de navegación.
// Escritorio: tres estados — desplegada (iconos y textos), plegada a iconos, u oculta del todo.
// Móvil: la barra se esconde y queda un único botón (☰) que la abre por encima del contenido,
//        o bien (mobileNav="tabbar") una barra inferior con 4 accesos + «Más», que abre la barra lateral completa.
//        Esa barra puede ser flotante (variant="floating"): grande en reposo y pequeña, solo iconos, al bajar.
//        En una página de detalle, <AppDetailBar> la sustituye: círculo para volver + barra con las acciones (comprar, filtrar…).
//        Y un tercer nivel, <AppModal>: sube desde abajo y se cierra con una X abajo en el centro, con el mismo estilo.
// Decide escritorio o móvil por el ancho de su contenedor (token layout.desktop), así funciona igual a pantalla completa o dentro de un hueco.
// Componente propio (no viene de shadcn/ui): está en base/components, así que lo tienen todos los sistemas.
import * as React from "react"
import { Slot } from "radix-ui"
import { ArrowLeft, Menu, MoreHorizontal, PanelLeft, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import { cn, tokenPx } from "../../lib/utils"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

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
// variant="floating" (app-tab-bar/floating): barra flotante en forma de píldora. En reposo es grande (icono y texto,
//   casi todo el ancho); al bajar por el contenido se encoge con una transición suave a solo iconos, y al subir
//   (o al volver arriba del todo) recupera su tamaño. compact / defaultCompact / onCompactChange: para controlarlo tú.
//   La pestaña activa tiene un solo fondo que se desliza de una pestaña a otra con la misma animación.
//   La animación sale de tokens: motion.duration.emphasis, motion.easing.emphasis, motion.distance.scroll y size.tab-bar.*
function AppTabBar({ moreLabel = "Más", moreIcon = <MoreHorizontal />, moreActive, variant = "default", compact, defaultCompact = false, onCompactChange, className, style, children, ...props }:
  React.ComponentProps<"nav"> & { moreLabel?: string; moreIcon?: React.ReactNode; moreActive?: boolean; variant?: "default" | "floating"
    compact?: boolean; defaultCompact?: boolean; onCompactChange?: (compact: boolean) => void }) {
  const { mobile, mobileNav, open, setOpen } = useAppSidebar()
  const floating = variant === "floating"
  const ref = React.useRef<HTMLDivElement>(null)
  const [inner, setInner] = React.useState(defaultCompact)
  // Al aparecer (por ejemplo, al volver de una página de detalle) nace pequeña y crece con la misma animación que al hacer scroll
  const [entering, setEntering] = React.useState(true)
  const small = floating && (entering || (compact ?? inner))
  const change = React.useRef(onCompactChange)
  change.current = onCompactChange
  const shown = mobile && mobileNav === "tabbar"
  const lastActive = React.useRef(0)

  // Al bajar se encoge, al subir (o arriba del todo) vuelve a ser grande. Escucha el scroll de <AppMain>.
  React.useEffect(() => {
    if (!floating || !shown) return
    const el = ref.current?.closest<HTMLElement>("main")   // <AppMain>
    if (!el) return
    const step = parseFloat(getComputedStyle(el).getPropertyValue("--motion-distance-scroll")) || 0
    let last = el.scrollTop, run = 0, now = false
    const set = (v: boolean) => { if (v !== now) { now = v; setInner(v); change.current?.(v) } }
    const onScroll = () => {
      const y = Math.max(0, el.scrollTop), d = y - last
      last = y
      if (y <= step) { run = 0; set(false); return }
      run = Math.sign(d) === Math.sign(run) ? run + d : d
      if (run > step) set(true)
      else if (run < -step) set(false)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [floating, shown])

  React.useEffect(() => {
    if (!shown || !floating) return
    let b = 0
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setEntering(false)) })
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
  }, [shown, floating])

  if (!shown) return null
  const more = <TabBarButton icon={moreIcon} active={open || moreActive} aria-expanded={open} onClick={() => setOpen(true)}>{moreLabel}</TabBarButton>
  if (!floating) return (
    <nav data-slot="app-tab-bar" aria-label="Navegación principal"
      className={cn("sticky bottom-0 z-sticky mt-auto flex shrink-0 border-t-thin bg-background pb-[env(safe-area-inset-bottom)]", className)} style={style} {...props}>
      {children}
      {more}
    </nav>
  )
  // Un solo fondo para la pestaña activa, que se desliza hasta la que pulses (nunca desaparece: si no hay ninguna activa, se queda en la última)
  const items = React.Children.toArray(children)
  const count = items.length + 1
  const found = open || moreActive ? count - 1 : items.findIndex((c) => React.isValidElement<{ active?: boolean }>(c) && c.props.active)
  if (found >= 0) lastActive.current = found
  return (
    <TabBarCompact.Provider value={small}>
      <div ref={ref} data-slot="app-tab-bar-dock"
        className="pointer-events-none sticky bottom-0 z-sticky mt-auto flex shrink-0 justify-center px-inset-md pb-inset-md">
        <nav data-slot="app-tab-bar" data-variant="floating" data-compact={small || undefined} aria-label="Navegación principal"
          style={{ "--tab-count": count, "--tab-index": lastActive.current, ...style } as React.CSSProperties}
          className={cn(
            "pointer-events-auto relative mb-[env(safe-area-inset-bottom)] flex h-tab-bar-expanded w-full max-w-full rounded-pill border-thin bg-popover p-inset-2xs text-popover-foreground shadow-overlay",
            "transition-[width,height] duration-emphasis ease-emphasis motion-reduce:transition-none",
            "data-compact:h-tab-bar-compact data-compact:w-[calc(var(--tab-count)*var(--size-tab-bar-item)+var(--space-inset-2xs)*2)]",
            className)}
          {...props}>
          <span aria-hidden data-slot="app-tab-bar-indicator"
            className="absolute inset-y-inset-2xs start-inset-2xs w-[calc((100%-var(--space-inset-2xs)*2)/var(--tab-count))] translate-x-[calc(var(--tab-index)*100%)] rounded-pill bg-primary-subtle transition-transform duration-emphasis ease-emphasis motion-reduce:transition-none" />
          {children}
          {more}
        </nav>
      </div>
    </TabBarCompact.Provider>
  )
}

// ¿La barra flotante está en pequeño? (null = barra normal, no flotante)
const TabBarCompact = React.createContext<boolean | null>(null)

function AppTabBarItem({ asChild, ...props }: React.ComponentProps<"button"> & { icon: React.ReactNode; active?: boolean; badge?: React.ReactNode; asChild?: boolean }) {
  return <TabBarButton asChild={asChild} {...props} />
}

function TabBarButton({ icon, active, badge, asChild, className, children, ...props }:
  React.ComponentProps<"button"> & { icon: React.ReactNode; active?: boolean; badge?: React.ReactNode; asChild?: boolean }) {
  const small = React.useContext(TabBarCompact)
  const floating = small !== null
  const Comp = asChild ? Slot.Root : "button"
  const label = floating
    ? ( // el texto se pliega (alto a 0 y transparente) con la misma animación que la barra
      <span aria-hidden={small || undefined}
        className={cn("grid w-full grid-cols-[minmax(0,1fr)] text-center transition-[grid-template-rows,opacity] duration-emphasis ease-emphasis motion-reduce:transition-none",
          small ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")}>
        <span className="min-h-0 overflow-hidden"><span className="block truncate pt-inset-3xs">{children}</span></span>
      </span>)
    : <span className="max-w-full truncate">{children}</span>
  const inner = (
    <>
      <span className="relative flex">
        {icon}
        {badge != null && (
          <span className="absolute -end-inset-sm -top-inset-2xs flex min-w-icon-md items-center justify-center rounded-pill bg-primary px-inset-2xs text-caption leading-compact text-primary-foreground">{badge}</span>
        )}
      </span>
      {label}
    </>
  )
  return (
    <Comp data-slot="app-tab-bar-item" data-active={active || undefined} aria-current={active ? "page" : undefined}
      aria-label={floating && small && typeof children === "string" ? children : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center text-caption text-muted-foreground transition-colors outline-none",
        "hover:text-foreground data-active:font-emphasis data-active:text-link",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
        floating
          ? "relative rounded-pill px-inset-xs focus-visible:focus-ring"
          : "gap-gap-3xs px-inset-2xs py-inset-xs focus-visible:focus-ring-inset",
        className)}
      {...props}>
      {asChild ? children : inner}
    </Comp>
  )
}

// Barra flotante de una página de detalle (por ejemplo, un producto): el mismo estilo que la barra de pestañas
// flotante, pero con un círculo para volver atrás y, a su lado, una barra con las acciones de esa página.
// Ponla al final de <AppMain> en lugar de <AppTabBar>. Si no ocupan todo el ancho, se centran.
// Las acciones van con <AppDetailBarButton> (un Button de shadcn en forma de píldora; acepta variant, size…).
// fill: la barra de acciones ocupa todo el ancho que queda (botones grandes, para una sola acción importante).
function AppDetailBar({ onBack, backLabel = "Volver", fill, className, style, children, ...props }:
  React.ComponentProps<"div"> & { onBack?: () => void; backLabel?: string; fill?: boolean }) {
  const entering = useEntering()
  return (
    <div data-slot="app-detail-bar-dock"
      className="pointer-events-none sticky bottom-0 z-sticky mt-auto flex shrink-0 justify-center px-inset-md pb-inset-md">
      <div data-slot="app-detail-bar"
        style={{ ...(entering ? { opacity: 0, transform: "scale(var(--motion-scale-enter))" } : null), ...style }}
        className={cn("pointer-events-auto mb-[env(safe-area-inset-bottom)] flex max-w-full min-w-0 items-center gap-gap-sm",
          "transition-[opacity,transform] duration-emphasis ease-emphasis motion-reduce:transition-none", fill && "w-full", className)} {...props}>
        {onBack && <FloatingCircle data-slot="app-detail-bar-back" label={backLabel} onClick={onBack}><ArrowLeft /></FloatingCircle>}
        {React.Children.count(children) > 0 && (
          <div data-slot="app-detail-bar-actions"
            className={cn("flex h-tab-bar-expanded min-w-0 items-center gap-gap-2xs rounded-pill border-thin bg-popover p-inset-2xs text-popover-foreground shadow-overlay", fill && "flex-1")}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// Una acción de la barra de detalle: ocupa el alto de la barra y tiene forma de píldora.
// En una barra con fill, la que lleve grow se estira (normalmente la principal: «Comprar»).
function AppDetailBarButton({ grow, className, ...props }: React.ComponentProps<typeof Button> & { grow?: boolean }) {
  return <Button data-slot="app-detail-bar-button" className={cn("h-full min-w-0 rounded-pill px-inset-lg", grow && "flex-1", className)} {...props} />
}

// true solo en el primer fotograma: sirve para animar la entrada con transiciones (las mismas duraciones y curvas que la barra)
function useEntering() {
  const [entering, setEntering] = React.useState(true)
  React.useEffect(() => {
    let b = 0
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setEntering(false)) })
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
  }, [])
  return entering
}

// Botón redondo con el estilo de la barra flotante (volver, cerrar)
function FloatingCircle({ label, className, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label}
      className={cn("pointer-events-auto inline-flex size-tab-bar-expanded shrink-0 items-center justify-center rounded-pill border-thin bg-popover text-popover-foreground shadow-overlay transition-colors outline-none hover:bg-accent focus-visible:focus-ring [&_svg]:size-icon-lg", className)}
      {...props} />
  )
}

// Tercer nivel de navegación: una ventana que sube desde abajo y tapa toda la app (por ejemplo, la guía de tallas
// desde la ficha de un producto, o los filtros desde una categoría). Se cierra con una X abajo en el centro, con el
// mismo estilo que la barra flotante: así toda la navegación queda en el mismo sitio. También se cierra con Esc.
// Ponla dentro de <AppShell> (por ejemplo, al final de <AppMain>). open / onClose: la controlas tú.
function AppModal({ open, onClose, title, closeLabel = "Cerrar", className, children, ...props }:
  Omit<React.ComponentProps<"div">, "title"> & { open: boolean; onClose: () => void; title?: React.ReactNode; closeLabel?: string }) {
  const [rendered, setRendered] = React.useState(open)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  if (open && !rendered) setRendered(true)
  const leaving = rendered && !open
  React.useEffect(() => { if (open) closeRef.current?.focus({ preventScroll: true }) }, [open, rendered])
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!rendered) return null
  return (
    <div role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}
      data-slot="app-modal" data-state={leaving ? "closed" : "open"}
      onAnimationEnd={(e) => { if (leaving && e.target === e.currentTarget) setRendered(false) }}
      className={cn("absolute inset-0 z-overlay flex flex-col bg-background text-foreground shadow-modal motion-reduce:animate-none",
        leaving ? "animate-slide-out-bottom" : "animate-slide-in-bottom", className)}
      {...props}>
      {title && <div data-slot="app-modal-header" className="flex h-header shrink-0 items-center justify-center border-b-thin px-inset-md text-ui font-strong">{title}</div>}
      <div data-slot="app-modal-content" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
        <div data-slot="app-modal-dock" className="pointer-events-none sticky bottom-0 z-sticky mt-auto flex shrink-0 justify-center px-inset-md pb-inset-md">
          <FloatingCircle ref={closeRef} label={closeLabel} onClick={onClose} className="mb-[env(safe-area-inset-bottom)]"><X /></FloatingCircle>
        </div>
      </div>
    </div>
  )
}

// Zona de contenido, a la derecha de la barra.
function AppMain({ className, ...props }: React.ComponentProps<"main">) {
  return <main data-slot="app-main" className={cn("flex min-w-0 flex-1 flex-col overflow-y-auto", className)} {...props} />
}

function AppHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="app-header" className={cn("sticky top-0 z-sticky flex h-header shrink-0 items-center gap-gap-sm border-b-thin bg-background px-inset-md", className)} {...props} />
}

export { AppShell, AppSidebar, AppSidebarHeader, AppSidebarContent, AppSidebarFooter, AppSidebarGroup, AppSidebarItem, AppSidebarTrigger, AppTabBar, AppTabBarItem, AppDetailBar, AppDetailBarButton, AppModal, AppMain, AppHeader }
