// Prototipo «Onboarding corto»: la variante B de «Onboarding», para compararlas en un test A/B.
// Cambia solo una cosa: los pasos 2 (intereses) y 3 (avisos) van juntos en una sola pantalla, «Tu app a medida».
// Son 2 pasos en vez de 3; la bienvenida y la pantalla final (ya en la app) son las mismas que en «Onboarding».
// Componentes: Card, Field, Button, Badge, Alert, Item y Avatar (shadcn/ui) y los propios Steps, Icon Badge, Choice Card,
// Setting Row, Step Footer y App Sidebar. Ninguna clase fuera de los tokens.
//
// Cómo funciona un prototipo: recibe `screen` (la pantalla que toca) y `go(id)` (para ir a otra).
import { useState } from "react"
import { Bell, CalendarDays, ChartLine, CircleCheck, Home, MessagesSquare, Settings, Sparkles, UsersRound } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError, FieldGroup, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import {
  AppHeader, AppMain, AppShell, AppSidebar, AppSidebarContent, AppSidebarFooter, AppSidebarGroup, AppSidebarHeader,
  AppSidebarItem, AppSidebarTrigger, AppTabBar, AppTabBarItem,
} from "@/components/custom/app-sidebar"
import { ChoiceCard } from "@/components/custom/choice-card"
import { IconBadge } from "@/components/custom/icon-badge"
import { SettingRow } from "@/components/custom/setting-row"
import { StepFooter } from "@/components/custom/step-footer"
import { Steps } from "@/components/custom/steps"

export const meta = {
  label: "Onboarding corto",
  description: "Variante del onboarding en 2 pasos: la bienvenida y, en una sola pantalla, qué te interesa y qué avisos quieres.",
  screens: [
    { id: "bienvenida", label: "Bienvenida" },
    { id: "preferencias", label: "Intereses y avisos" },
    { id: "inicio", label: "Ya en la app" },
  ],
  links: [
    { from: "bienvenida", text: "Empezar", to: "preferencias" },
    { from: "bienvenida", text: "Saltar", to: "preferencias" },
    { from: "preferencias", text: "Atrás", to: "bienvenida" },
    { from: "preferencias", text: "Terminar", to: "inicio" },
    { from: "inicio", text: "Repetir el onboarding", to: "bienvenida" },
  ],
  hints: [
    "Es la variante B de «Onboarding»: los intereses y los avisos van en la misma pantalla.",
    "Hay que elegir al menos un interés para terminar.",
    "«Saltar» lleva a la última pantalla del onboarding, igual que en la versión de 3 pasos.",
  ],
}

type Props = { screen: string; go: (id: string) => void }

const INTERESTS = [
  { id: "agenda", icon: CalendarDays, title: "Organizar mi agenda", text: "Citas, recordatorios y tareas." },
  { id: "equipo", icon: UsersRound, title: "Trabajar en equipo", text: "Compartir y repartir el trabajo." },
  { id: "datos", icon: ChartLine, title: "Ver mis números", text: "Informes claros cada semana." },
  { id: "clientes", icon: MessagesSquare, title: "Hablar con clientes", text: "Mensajes en un solo sitio." },
]

export default function Onboarding({ screen, go }: Props) {
  // Lo elegido se recuerda entre pantallas
  const [picked, setPicked] = useState<string[]>(["agenda"])
  const [alerts, setAlerts] = useState({ movil: true, email: false })
  if (screen === "inicio") return <AppHome go={go} picked={picked} alerts={alerts} />
  return (
    <div className="flex min-h-full w-full items-center justify-center bg-muted p-inset-lg">
      <div className="w-full max-w-sheet">
        {screen === "bienvenida" && <Welcome go={go} />}
        {screen === "preferencias" && <Preferences go={go} picked={picked} setPicked={setPicked} alerts={alerts} setAlerts={setAlerts} />}
      </div>
    </div>
  )
}

function Welcome({ go }: { go: Props["go"] }) {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <IconBadge className="mx-auto mb-gap-sm"><Sparkles /></IconBadge>
        <Badge variant="secondary" className="mx-auto">Nuevo</Badge>
        <CardTitle className="text-title">Te damos la bienvenida</CardTitle>
        <CardDescription>En menos de un minuto dejamos la app a tu medida. Puedes cambiarlo todo más tarde.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-gap-sm">
        <Steps current={1} total={2} />
      </CardContent>
      <CardFooter className="flex flex-col gap-gap-sm">
        <Button className="w-full" onClick={() => go("preferencias")}>Empezar</Button>
        <Button variant="ghost" className="w-full" onClick={() => go("preferencias")}>Saltar</Button>
      </CardFooter>
    </Card>
  )
}

type Alerts = { movil: boolean; email: boolean }

// Pasos 2 y 3 juntos: intereses arriba, avisos abajo, y un solo «Terminar».
function Preferences({ go, picked, setPicked, alerts, setAlerts }: {
  go: Props["go"]; picked: string[]; setPicked: (v: string[]) => void; alerts: Alerts; setAlerts: (a: Alerts) => void
}) {
  const [tried, setTried] = useState(false)
  const toggle = (id: string, on: boolean) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id))
  const empty = tried && picked.length === 0
  return (
    <Card>
      <CardHeader>
        <Steps current={2} total={2} />
        <CardTitle className="text-title">Deja la app a tu medida</CardTitle>
        <CardDescription>Elige lo que te interesa y cómo quieres que te avisemos. Puedes cambiarlo más tarde.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>¿Para qué la vas a usar?</FieldLegend>
            <FieldGroup className="gap-gap-sm">
              {INTERESTS.map(({ id, icon: Icon, title, text }) => (
                <ChoiceCard key={id} id={`interes-${id}`} icon={<Icon />} title={title} description={text}
                  checked={picked.includes(id)} onCheckedChange={(v) => toggle(id, v)} />
              ))}
              {empty && <FieldError>Elige al menos uno para terminar.</FieldError>}
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          <FieldSet>
            <FieldLegend>¿Te avisamos?</FieldLegend>
            <FieldGroup>
              <SettingRow id="aviso-movil" icon={<Bell />} title="Avisos en el móvil" description="Recordatorios y cambios importantes."
                checked={alerts.movil} onCheckedChange={(v) => setAlerts({ ...alerts, movil: v })} />
              <SettingRow id="aviso-email" icon={<MessagesSquare />} title="Resumen por email" description="Una vez a la semana, los lunes."
                checked={alerts.email} onCheckedChange={(v) => setAlerts({ ...alerts, email: v })} />
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <StepFooter onBack={() => go("bienvenida")} onNext={() => { setTried(true); if (picked.length) go("inicio") }} nextLabel="Terminar" />
      </CardFooter>
    </Card>
  )
}

// Última pantalla: ya estás dentro de la app. Lo primero que ves es lo que elegiste en el onboarding.
const NAV = [
  { id: "inicio", label: "Inicio", icon: <Home /> },
  { id: "agenda", label: "Agenda", icon: <CalendarDays /> },
  { id: "equipo", label: "Equipo", icon: <UsersRound /> },
  { id: "mensajes", label: "Mensajes", icon: <MessagesSquare /> },
]

function AppHome({ go, picked, alerts }: { go: Props["go"]; picked: string[]; alerts: Alerts }) {
  const chosen = INTERESTS.filter((i) => picked.includes(i.id))
  const shown = chosen.length ? chosen : INTERESTS.slice(0, 2)
  const on = [alerts.movil && "avisos en el móvil", alerts.email && "resumen por email"].filter(Boolean)
  return (
    <AppShell className="h-full" shortcut={false} mobileNav="tabbar">
      <AppSidebar>
        <AppSidebarHeader logo={<Sparkles className="text-primary" />} title="Tu app" />
        <AppSidebarContent>
          <AppSidebarGroup label="Menú">
            {NAV.map((n) => <AppSidebarItem key={n.id} icon={n.icon} active={n.id === "inicio"}>{n.label}</AppSidebarItem>)}
          </AppSidebarGroup>
        </AppSidebarContent>
        <AppSidebarFooter>
          <AppSidebarItem icon={<Settings />}>Ajustes</AppSidebarItem>
        </AppSidebarFooter>
      </AppSidebar>
      <AppMain>
        <AppHeader>
          <AppSidebarTrigger />
          <span className="text-ui font-strong">Inicio</span>
          <div className="ms-auto flex items-center gap-gap-xs">
            <Button variant="ghost" size="icon" aria-label="Avisos"><Bell /></Button>
            <Avatar><AvatarFallback>MR</AvatarFallback></Avatar>
          </div>
        </AppHeader>
        <div className="mx-auto grid w-full max-w-page gap-gap-lg p-inset-lg">
          <div>
            <h1 className="text-h3">¡Ya estás dentro, Marta!</h1>
            <p className="text-ui text-muted-foreground">Hemos preparado el inicio con lo que nos has contado.</p>
          </div>
          <Alert>
            <CircleCheck />
            <AlertTitle>Todo listo</AlertTitle>
            <AlertDescription>
              {on.length ? `Tienes activados: ${on.join(" y ")}.` : "No te enviaremos avisos. Puedes activarlos en Ajustes."}
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle>Empieza por aquí</CardTitle>
              <CardDescription>{chosen.length ? "Según lo que has elegido." : "Lo más usado para empezar."}</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup>
                {shown.map(({ id, icon: Icon, title, text }) => (
                  <Item key={id} variant="outline">
                    <ItemMedia variant="icon"><Icon /></ItemMedia>
                    <ItemContent>
                      <ItemTitle>{title}</ItemTitle>
                      <ItemDescription>{text}</ItemDescription>
                    </ItemContent>
                    <ItemActions><Button variant="outline" size="sm">Abrir</Button></ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => go("bienvenida")}>Repetir el onboarding</Button>
            </CardFooter>
          </Card>
        </div>
        <AppTabBar>
          {NAV.map((n) => <AppTabBarItem key={n.id} icon={n.icon} active={n.id === "inicio"}>{n.label}</AppTabBarItem>)}
        </AppTabBar>
      </AppMain>
    </AppShell>
  )
}
