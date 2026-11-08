import { useState } from "react"
import { Calendar, FileText, Home, Inbox, MessageSquare, Settings, Sparkles, Users } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  AppHeader, AppMain, AppShell, AppSidebar, AppSidebarContent, AppSidebarFooter, AppSidebarGroup, AppSidebarHeader,
  AppSidebarItem, AppSidebarTrigger, AppTabBar, AppTabBarItem, type AppSidebarState,
} from "./app-sidebar"

type Item = { id: string; label: string; icon: React.ReactNode; count?: number }
const NAV: { group: string; items: Item[] }[] = [
  { group: "General", items: [{ id: "inicio", label: "Inicio", icon: <Home /> }, { id: "bandeja", label: "Bandeja", icon: <Inbox />, count: 4 }, { id: "agenda", label: "Agenda", icon: <Calendar /> }] },
  { group: "Trabajo", items: [{ id: "chats", label: "Conversaciones", icon: <MessageSquare /> }, { id: "docs", label: "Documentos", icon: <FileText /> }, { id: "equipo", label: "Equipo", icon: <Users /> }] },
]

function Demo({ state, onStateChange, shortcut = false, mobileNav }: { state?: AppSidebarState; onStateChange?: (s: AppSidebarState) => void; shortcut?: boolean; mobileNav?: "menu" | "tabbar" }) {
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
          {[0, 1, 2].map((i) => <div key={i} className="h-avatar-2xl rounded-card bg-subtle" />)}
        </div>
        <AppTabBar>
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

export default {
  label: "App Sidebar",
  description: "Estructura de app con barra lateral. En escritorio puede estar desplegada, plegada a iconos u oculta; en móvil queda un solo botón (☰) que la abre por encima del contenido.",
  examples: [
    { title: "Escritorio: desplegada, plegada a iconos u oculta", render: <Desktop />,
      code: `import {\n  AppShell, AppSidebar, AppSidebarHeader, AppSidebarContent, AppSidebarGroup,\n  AppSidebarItem, AppSidebarFooter, AppSidebarTrigger, AppMain, AppHeader,\n} from "@/components/custom/app-sidebar"\n\n<AppShell className="h-dvh">\n  <AppSidebar>\n    <AppSidebarHeader logo={<Logo />} title="Mi app" />\n    <AppSidebarContent>\n      <AppSidebarGroup label="General">\n        <AppSidebarItem icon={<Home />} active>Inicio</AppSidebarItem>\n        <AppSidebarItem icon={<Inbox />} badge={4}>Bandeja</AppSidebarItem>\n      </AppSidebarGroup>\n    </AppSidebarContent>\n    <AppSidebarFooter>…</AppSidebarFooter>\n  </AppSidebar>\n  <AppMain>\n    <AppHeader><AppSidebarTrigger /> Inicio</AppHeader>\n    …\n  </AppMain>\n</AppShell>` },
    { title: "Móvil: un solo botón que la abre", render: (
      <div className="h-sheet w-full max-w-sheet overflow-hidden rounded-card border-thin"><Demo /></div>),
      code: `// Es el mismo código: por debajo de layout.desktop la barra se esconde\n// y <AppSidebarTrigger /> se convierte en el botón ☰ que la abre.` },
    { title: "Móvil: barra inferior con 4 accesos y «Más»", description: "Con mobileNav=\"tabbar\", en móvil aparece abajo una barra con los 4 accesos principales. El quinto, «Más», abre la barra lateral con todo. En escritorio no cambia nada.", render: (
      <div className="h-sheet w-full max-w-sheet overflow-hidden rounded-card border-thin"><Demo mobileNav="tabbar" /></div>),
      code: `<AppShell mobileNav="tabbar" className="h-dvh">\n  <AppSidebar>…</AppSidebar>\n  <AppMain>\n    <AppHeader>…</AppHeader>\n    …\n    <AppTabBar>\n      <AppTabBarItem icon={<Home />} active>Inicio</AppTabBarItem>\n      <AppTabBarItem icon={<Inbox />} badge={4}>Bandeja</AppTabBarItem>\n      <AppTabBarItem icon={<Calendar />}>Agenda</AppTabBarItem>\n      <AppTabBarItem icon={<MessageSquare />}>Conversaciones</AppTabBarItem>\n    </AppTabBar>\n  </AppMain>\n</AppShell>` },
  ],
} satisfies CustomDemo
