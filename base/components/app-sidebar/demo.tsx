import { useState } from "react"
import { Calendar, FileText, Home, Inbox, MessageSquare, Settings, SlidersHorizontal, Sparkles, Users } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  AppHeader, AppMain, AppShell, AppSidebar, AppSidebarContent, AppSidebarFooter, AppSidebarGroup, AppSidebarHeader,
  AppSidebarItem, AppSidebarTrigger, AppTabBar, AppTabBarItem, AppDetailBar, AppDetailBarButton, type AppSidebarState,
} from "./app-sidebar"

type Item = { id: string; label: string; icon: React.ReactNode; count?: number }
const NAV: { group: string; items: Item[] }[] = [
  { group: "General", items: [{ id: "inicio", label: "Inicio", icon: <Home /> }, { id: "bandeja", label: "Bandeja", icon: <Inbox />, count: 4 }, { id: "agenda", label: "Agenda", icon: <Calendar /> }] },
  { group: "Trabajo", items: [{ id: "chats", label: "Chat", icon: <MessageSquare /> }, { id: "docs", label: "Documentos", icon: <FileText /> }, { id: "equipo", label: "Equipo", icon: <Users /> }] },
]

function Demo({ state, onStateChange, shortcut = false, mobileNav, floating, compact, rows = 3 }:
  { state?: AppSidebarState; onStateChange?: (s: AppSidebarState) => void; shortcut?: boolean; mobileNav?: "menu" | "tabbar"; floating?: boolean; compact?: boolean; rows?: number }) {
  const [page, setPage] = useState("inicio")
  const title = NAV.flatMap((g) => g.items).find((i) => i.id === page)?.label
  return (
    <AppShell state={state} onStateChange={onStateChange} shortcut={shortcut} mobileNav={mobileNav} className="h-full">
      <AppSidebar>
        <AppSidebarHeader logo={<Sparkles className="text-primary" />} title="Mi app" />
        <AppSidebarContent>
          {NAV.map(({ group, items }) => (
            <AppSidebarGroup key={group} label={group}>
              {items.map((i) => (
                <AppSidebarItem key={i.id} icon={i.icon} badge={i.count} active={page === i.id} onClick={() => setPage(i.id)}>{i.label}</AppSidebarItem>
              ))}
            </AppSidebarGroup>
          ))}
        </AppSidebarContent>
        <AppSidebarFooter>
          <AppSidebarItem icon={<Settings />}>Ajustes</AppSidebarItem>
          <AppSidebarItem icon={<Avatar className="size-icon-lg"><AvatarFallback className="text-caption">JP</AvatarFallback></Avatar>}>Jordi</AppSidebarItem>
        </AppSidebarFooter>
      </AppSidebar>
      <AppMain>
        <AppHeader>
          <AppSidebarTrigger />
          <span className="text-ui font-strong">{title}</span>
        </AppHeader>
        <div className="grid gap-gap-md p-inset-lg">
          {Array.from({ length: rows }, (_, i) => <div key={i} className="h-avatar-2xl rounded-card bg-subtle" />)}
        </div>
        <AppTabBar variant={floating ? "floating" : "default"} compact={compact}>
          {NAV.flatMap((g) => g.items).slice(0, 4).map((i) => (
            <AppTabBarItem key={i.id} icon={i.icon} badge={i.count} active={page === i.id} onClick={() => setPage(i.id)}>{i.label}</AppTabBarItem>
          ))}
        </AppTabBar>
      </AppMain>
    </AppShell>
  )
}

function Desktop() {
  const [state, setState] = useState<AppSidebarState>("expanded")
  return (
    <div className="grid w-full gap-gap-md">
      <ToggleGroup type="single" variant="outline" size="sm" value={state} onValueChange={(v) => v && setState(v as AppSidebarState)} className="w-fit">
        <ToggleGroupItem value="expanded">Desplegada</ToggleGroupItem>
        <ToggleGroupItem value="icons">Plegada a iconos</ToggleGroupItem>
        <ToggleGroupItem value="hidden">Oculta</ToggleGroupItem>
      </ToggleGroup>
      <div className="h-sheet w-full overflow-hidden rounded-card border-thin"><Demo state={state} onStateChange={setState} /></div>
    </div>
  )
}

// Una tienda pequeña: la lista con la barra de pestañas flotante y, al pulsar algo, su página de detalle con <AppDetailBar>.
// kind="cta": un producto, con volver + «Comprar». kind="filter": una categoría, con volver a la izquierda y filtrar + CTA a la derecha.
const PRODUCTS = ["Zapatillas Nube", "Mochila Ruta", "Gorra Brisa", "Botella Monte"]
function DetailDemo({ kind }: { kind: "cta" | "filter" }) {
  const [page, setPage] = useState("inicio")
  const [detail, setDetail] = useState<string | null>(kind === "cta" ? PRODUCTS[0] : "Zapatillas")
  const tabs = NAV.flatMap((g) => g.items).slice(0, 4)
  const box = (key: string | number, label: string, onClick?: () => void) => (
    <button key={key} type="button" onClick={onClick}
      className="flex flex-col gap-gap-xs rounded-card text-start outline-none focus-visible:focus-ring">
      <span className="h-avatar-2xl w-full rounded-card bg-subtle" />
      <span className="text-ui font-emphasis">{label}</span>
    </button>)
  return (
    <AppShell mobileNav="tabbar" shortcut={false} className="h-full">
      <AppSidebar>
        <AppSidebarHeader logo={<Sparkles className="text-primary" />} title="Mi tienda" />
        <AppSidebarContent>
          <AppSidebarGroup>
            {tabs.map((i) => <AppSidebarItem key={i.id} icon={i.icon} active={page === i.id} onClick={() => { setPage(i.id); setDetail(null) }}>{i.label}</AppSidebarItem>)}
          </AppSidebarGroup>
        </AppSidebarContent>
      </AppSidebar>
      <AppMain>
        <AppHeader><span className="text-ui font-strong">{detail ?? "Tienda"}</span></AppHeader>
        {detail == null ? (
          <div className="grid grid-cols-2 gap-gap-md p-inset-lg">
            {(kind === "cta" ? PRODUCTS : ["Zapatillas", "Mochilas", "Gorras", "Botellas"]).map((n) => box(n, n, () => setDetail(n)))}
          </div>
        ) : kind === "cta" ? (
          <div className="flex flex-col gap-gap-md p-inset-lg">
            <div className="aspect-[4/3] w-full rounded-card bg-subtle" />
            <div className="text-title font-strong">{detail}</div>
            <div className="text-body text-muted-foreground">Ligeras, cómodas y hechas para caminar todo el día. Envío en 24 horas y devolución gratis.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-gap-md p-inset-lg">
            {Array.from({ length: 6 }, (_, i) => box(i, `${detail} ${i + 1}`))}
          </div>
        )}
        {detail == null ? (
          <AppTabBar variant="floating">
            {tabs.map((i) => <AppTabBarItem key={i.id} icon={i.icon} active={page === i.id} onClick={() => setPage(i.id)}>{i.label}</AppTabBarItem>)}
          </AppTabBar>
        ) : kind === "cta" ? (
          <AppDetailBar onBack={() => setDetail(null)}>
            <AppDetailBarButton>Comprar · 49 €</AppDetailBarButton>
          </AppDetailBar>
        ) : (
          <AppDetailBar onBack={() => setDetail(null)} fill>
            <AppDetailBarButton variant="ghost"><SlidersHorizontal />Filtrar</AppDetailBarButton>
            <AppDetailBarButton grow>Ver cesta (2)</AppDetailBarButton>
          </AppDetailBar>
        )}
      </AppMain>
    </AppShell>
  )
}

// Los dos tamaños de la barra flotante, para ver (y repetir) la animación sin hacer scroll.
function FloatingStates() {
  const [size, setSize] = useState("grande")
  return (
    <div className="grid w-full gap-gap-md">
      <ToggleGroup type="single" variant="outline" size="sm" value={size} onValueChange={(v) => v && setSize(v)} className="w-fit">
        <ToggleGroupItem value="grande">Grande (en reposo)</ToggleGroupItem>
        <ToggleGroupItem value="pequeña">Pequeña (al bajar)</ToggleGroupItem>
      </ToggleGroup>
      <div className="h-sheet w-full max-w-sheet overflow-hidden rounded-card border-thin"><Demo mobileNav="tabbar" floating compact={size === "pequeña"} /></div>
    </div>
  )
}

export default {
  label: "App Sidebar",
  description: "Estructura de app con barra lateral. En escritorio puede estar desplegada, plegada a iconos u oculta; en móvil queda un solo botón (☰) que la abre por encima del contenido, o una barra inferior de pestañas (normal o flotante).",
  examples: [
    { title: "Escritorio: desplegada, plegada a iconos u oculta", render: <Desktop />,
      code: `import {\n  AppShell, AppSidebar, AppSidebarHeader, AppSidebarContent, AppSidebarGroup,\n  AppSidebarItem, AppSidebarFooter, AppSidebarTrigger, AppMain, AppHeader,\n} from "@/components/custom/app-sidebar"\n\n<AppShell className="h-dvh">\n  <AppSidebar>\n    <AppSidebarHeader logo={<Logo />} title="Mi app" />\n    <AppSidebarContent>\n      <AppSidebarGroup label="General">\n        <AppSidebarItem icon={<Home />} active>Inicio</AppSidebarItem>\n        <AppSidebarItem icon={<Inbox />} badge={4}>Bandeja</AppSidebarItem>\n      </AppSidebarGroup>\n    </AppSidebarContent>\n    <AppSidebarFooter>…</AppSidebarFooter>\n  </AppSidebar>\n  <AppMain>\n    <AppHeader><AppSidebarTrigger /> Inicio</AppHeader>\n    …\n  </AppMain>\n</AppShell>` },
    { title: "Móvil: un solo botón que la abre", render: (
      <div className="h-sheet w-full max-w-sheet overflow-hidden rounded-card border-thin"><Demo /></div>),
      code: `// Es el mismo código: por debajo de layout.desktop la barra se esconde\n// y <AppSidebarTrigger /> se convierte en el botón ☰ que la abre.` },
    { title: "Móvil: barra inferior con 4 accesos y «Más»", description: "Con mobileNav=\"tabbar\", en móvil aparece abajo una barra con los 4 accesos principales. El quinto, «Más», abre la barra lateral con todo. En escritorio no cambia nada.", render: (
      <div className="h-sheet w-full max-w-sheet overflow-hidden rounded-card border-thin"><Demo mobileNav="tabbar" /></div>),
      code: `<AppShell mobileNav="tabbar" className="h-dvh">\n  <AppSidebar>…</AppSidebar>\n  <AppMain>\n    <AppHeader>…</AppHeader>\n    …\n    <AppTabBar>\n      <AppTabBarItem icon={<Home />} active>Inicio</AppTabBarItem>\n      <AppTabBarItem icon={<Inbox />} badge={4}>Bandeja</AppTabBarItem>\n      <AppTabBarItem icon={<Calendar />}>Agenda</AppTabBarItem>\n      <AppTabBarItem icon={<MessageSquare />}>Chat</AppTabBarItem>\n    </AppTabBar>\n  </AppMain>\n</AppShell>` },
    { title: "Móvil: barra flotante que se encoge al bajar", description: "Con variant=\"floating\" (app-tab-bar/floating) la barra flota sobre el contenido. En reposo es grande: casi todo el ancho, icono y texto, y la pestaña activa con fondo de color. Ese fondo es uno solo: al pulsar otra pestaña se desliza hasta ella. Al bajar por el contenido se encoge con una transición suave: solo iconos y el fondo de la activa. Al subir, o al volver arriba del todo, vuelve a ser grande. Haz scroll dentro del ejemplo para verlo.", render: (
      <div className="h-sheet w-full max-w-sheet overflow-hidden rounded-card border-thin"><Demo mobileNav="tabbar" floating rows={8} /></div>),
      code: `<AppShell mobileNav="tabbar" className="h-dvh">\n  <AppSidebar>…</AppSidebar>\n  <AppMain>\n    <AppHeader>…</AppHeader>\n    …\n    <AppTabBar variant="floating">\n      <AppTabBarItem icon={<Home />} active>Inicio</AppTabBarItem>\n      <AppTabBarItem icon={<Inbox />} badge={4}>Bandeja</AppTabBarItem>\n      <AppTabBarItem icon={<Calendar />}>Agenda</AppTabBarItem>\n      <AppTabBarItem icon={<MessageSquare />}>Chat</AppTabBarItem>\n    </AppTabBar>\n  </AppMain>\n</AppShell>` },
    { title: "La animación, paso a paso", description: "Cambia entre los dos tamaños para repetir la animación. Para replicarla en otro sitio, todo sale de tokens: dura motion.duration.emphasis (320 ms en Base) con la curva motion.easing.emphasis (cubic-bezier(0.32, 0.72, 0, 1): arranca rápido y frena muy suave). Anima a la vez el ancho (de todo el hueco menos los márgenes a tantas pestañas × size.tab-bar.item, 48 px), el alto (de size.tab-bar.expanded, 64 px, a size.tab-bar.compact, 48 px) y el texto, que se pliega y se desvanece. El fondo de la pestaña activa se desliza de una a otra con la misma duración y curva. Reacciona después de motion.distance.scroll (24 px) de scroll en una dirección. Si el móvil tiene «reducir movimiento», cambia sin animación.", render: <FloatingStates />,
      code: `// Controlada por ti (por ejemplo, para encogerla mientras se reproduce un vídeo):\nconst [compact, setCompact] = useState(false)\n\n<AppTabBar variant="floating" compact={compact} onCompactChange={setCompact}>\n  …\n</AppTabBar>\n\n/* La misma animación en CSS, solo con tokens */\n.tab-bar {\n  height: var(--size-tab-bar-expanded);\n  transition: width var(--motion-duration-emphasis) var(--motion-easing-emphasis),\n              height var(--motion-duration-emphasis) var(--motion-easing-emphasis);\n}\n.tab-bar[data-compact] {\n  height: var(--size-tab-bar-compact);\n  width: calc(var(--tab-count) * var(--size-tab-bar-item) + var(--space-inset-2xs) * 2);\n}` },
    { title: "Página de detalle: volver + una acción", description: "Al entrar en una página concreta (aquí, un producto), la barra de pestañas se cambia por <AppDetailBar>: con el mismo estilo flotante, un círculo para volver atrás y, al lado, una barra con la acción de esa página. Si no ocupan todo el ancho, se quedan centrados. Pulsa la flecha para volver a la lista y entra en otro producto.", render: (
      <div className="h-sheet w-full max-w-sheet overflow-hidden rounded-card border-thin"><DetailDemo kind="cta" /></div>),
      code: `import { AppDetailBar, AppDetailBarButton } from "@/components/custom/app-sidebar"\n\n// Al final de <AppMain>, en lugar de <AppTabBar>:\n<AppDetailBar onBack={() => router.back()}>\n  <AppDetailBarButton>Comprar · 49 €</AppDetailBarButton>\n</AppDetailBar>` },
    { title: "Página de detalle: volver a la izquierda, filtrar + acción a la derecha", description: "Con fill, la barra de acciones ocupa todo el ancho que deja el círculo. La acción con grow (la principal) se estira; las demás (Filtrar) tienen su tamaño. Cada acción es un Button de shadcn en forma de píldora, así que acepta variant, iconos, etc.", render: (
      <div className="h-sheet w-full max-w-sheet overflow-hidden rounded-card border-thin"><DetailDemo kind="filter" /></div>),
      code: `<AppDetailBar onBack={() => router.back()} fill>\n  <AppDetailBarButton variant="ghost"><SlidersHorizontal />Filtrar</AppDetailBarButton>\n  <AppDetailBarButton grow>Ver cesta (2)</AppDetailBarButton>\n</AppDetailBar>` },
  ],
} satisfies CustomDemo
