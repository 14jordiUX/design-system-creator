// Patrón «Panel de gestión»: una webapp completa montada SOLO con lo que ya tiene el sistema.
// Componentes: App Sidebar, Tab, Stat Card y Fab (propios) + Card, Table, Item, Badge, Avatar, Button, Input Group,
// Dropdown Menu y Progress (shadcn/ui). Ninguna clase fuera de los tokens, ninguna pieza nueva.
import { useState } from "react"
import {
  BarChart3, Bell, Calendar, CalendarCheck, Clock, Euro, Home, Inbox, LogOut, Plus, Search, Settings, User, Users,
} from "lucide-react"
import { Avatar, AvatarFallback } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/ui/input-group"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "../components/ui/item"
import { Progress } from "../components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import {
  AppHeader, AppMain, AppShell, AppSidebar, AppSidebarContent, AppSidebarFooter, AppSidebarGroup, AppSidebarHeader,
  AppSidebarItem, AppSidebarTrigger, useAppSidebar,
} from "../components/custom/app-sidebar"
import { Fab, FabButton } from "../components/custom/fab"
import { StatCard } from "../components/custom/stat-card"
import { Tab, TabContent, TabList, TabTrigger } from "../components/custom/tab"

export const meta = {
  label: "Panel de gestión",
  description: "Una webapp de reservas completa: barra lateral, cabecera con búsqueda, resumen con datos, agenda en pestañas y actividad. Se adapta a móvil.",
}

type Status = "confirmada" | "pendiente" | "cancelada"
type Cita = { hora: string; cliente: string; servicio: string; con: string; estado: Status }

const DIAS: Record<string, Cita[]> = {
  hoy: [
    { hora: "09:00", cliente: "Lucía Romero", servicio: "Primera visita", con: "Marta", estado: "confirmada" },
    { hora: "10:30", cliente: "Andrés Molina", servicio: "Revisión", con: "Pablo", estado: "confirmada" },
    { hora: "12:00", cliente: "Carmen Vidal", servicio: "Tratamiento", con: "Marta", estado: "pendiente" },
    { hora: "16:15", cliente: "Javier Soler", servicio: "Revisión", con: "Pablo", estado: "cancelada" },
    { hora: "17:30", cliente: "Elena Navarro", servicio: "Seguimiento", con: "Marta", estado: "confirmada" },
  ],
  manana: [
    { hora: "09:30", cliente: "Marc Puig", servicio: "Primera visita", con: "Pablo", estado: "pendiente" },
    { hora: "11:00", cliente: "Sara Ibáñez", servicio: "Tratamiento", con: "Marta", estado: "confirmada" },
  ],
  semana: [],
}

const ESTADO: Record<Status, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  confirmada: { label: "Confirmada", variant: "secondary" },
  pendiente: { label: "Pendiente", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "destructive" },
}

const NAV = [
  { id: "inicio", label: "Inicio", icon: <Home /> },
  { id: "agenda", label: "Agenda", icon: <Calendar /> },
  { id: "clientes", label: "Clientes", icon: <Users /> },
  { id: "mensajes", label: "Mensajes", icon: <Inbox />, count: 3 },
  { id: "informes", label: "Informes", icon: <BarChart3 /> },
]

const iniciales = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2)

export default function PanelDeGestion() {
  const [page, setPage] = useState("inicio")
  return (
    <AppShell className="h-full" shortcut={false}>
      <AppSidebar>
        <AppSidebarHeader logo={<CalendarCheck className="text-primary" />} title="Reservas" />
        <AppSidebarContent>
          <AppSidebarGroup label="Menú">
            {NAV.map((n) => (
              <AppSidebarItem key={n.id} icon={n.icon} badge={n.count} active={page === n.id} onClick={() => setPage(n.id)}>{n.label}</AppSidebarItem>
            ))}
          </AppSidebarGroup>
        </AppSidebarContent>
        <AppSidebarFooter>
          <AppSidebarItem icon={<Settings />}>Ajustes</AppSidebarItem>
        </AppSidebarFooter>
      </AppSidebar>
      <Contenido titulo={NAV.find((n) => n.id === page)?.label ?? ""} />
    </AppShell>
  )
}

function Contenido({ titulo }: { titulo: string }) {
  const { mobile } = useAppSidebar()
  return (
    <>
      <AppMain>
        <AppHeader>
          <AppSidebarTrigger />
          <span className="text-ui font-strong">{titulo}</span>
          <div className="ms-auto flex items-center gap-gap-xs">
            {!mobile && (
              <InputGroup className="w-popover">
                <InputGroupAddon><Search /></InputGroupAddon>
                <InputGroupInput placeholder="Buscar clientes o citas" />
              </InputGroup>
            )}
            {mobile && <Button variant="ghost" size="icon" aria-label="Buscar"><Search /></Button>}
            <Button variant="ghost" size="icon" aria-label="Avisos"><Bell /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Tu cuenta"><Avatar><AvatarFallback>MR</AvatarFallback></Avatar></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Marta Ruiz</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><User />Perfil</DropdownMenuItem>
                <DropdownMenuItem><Settings />Ajustes</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive"><LogOut />Cerrar sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </AppHeader>

        <div className={mobile ? "grid gap-gap-lg p-inset-md" : "grid gap-gap-xl p-inset-xl"}>
          <div className="flex items-end justify-between gap-gap-md">
            <div>
              <h1 className="text-h3 font-strong tracking-heading">Buenos días, Marta</h1>
              <p className="text-ui text-muted-foreground">Lunes, 10 de noviembre · 5 citas hoy</p>
            </div>
            {!mobile && <Button><Plus />Nueva cita</Button>}
          </div>

          <div className={mobile ? "grid gap-gap-md" : "grid grid-cols-3 gap-gap-lg"}>
            <StatCard label="Citas esta semana" value="42" change="+8 %" trend="up" hint="frente a la anterior" icon={<CalendarCheck />} />
            <StatCard label="Clientes nuevos" value="7" change="−2" trend="down" hint="frente a la anterior" icon={<Users />} />
            <StatCard label="Ingresos" value="3.180 €" change="+12 %" trend="up" hint="este mes" icon={<Euro />} />
          </div>

          <div className="grid gap-gap-lg">
            <Card>
              <CardHeader>
                <CardTitle>Agenda</CardTitle>
                <CardDescription>Citas por día</CardDescription>
                <CardAction><Button variant="outline" size="sm">Ver todo</Button></CardAction>
              </CardHeader>
              <CardContent>
                <Tab defaultValue="hoy" mobile="fill">
                  <TabList>
                    <TabTrigger value="hoy" badge={DIAS.hoy.length}>Hoy</TabTrigger>
                    <TabTrigger value="manana" badge={DIAS.manana.length}>Mañana</TabTrigger>
                    <TabTrigger value="semana">Esta semana</TabTrigger>
                  </TabList>
                  {Object.entries(DIAS).map(([dia, citas]) => (
                    <TabContent key={dia} value={dia}>
                      {!citas.length ? (
                        <p className="py-inset-xl text-center text-ui text-muted-foreground">No hay más citas esta semana.</p>
                      ) : mobile ? <ListaCitas citas={citas} /> : <TablaCitas citas={citas} />}
                    </TabContent>
                  ))}
                </Tab>
              </CardContent>
            </Card>

            <div className={mobile ? "grid gap-gap-lg" : "grid grid-cols-2 items-start gap-gap-lg"}>
              <Card>
                <CardHeader>
                  <CardTitle>Ocupación de hoy</CardTitle>
                  <CardDescription>5 de 8 huecos reservados</CardDescription>
                </CardHeader>
                <CardContent><Progress value={62} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Actividad</CardTitle></CardHeader>
                <CardContent>
                  <ItemGroup>
                    {[["Carmen Vidal", "ha pedido cambiar su cita", "hace 5 min"], ["Marc Puig", "ha reservado online", "hace 1 h"], ["Javier Soler", "ha cancelado", "hace 2 h"]].map(([n, t, h]) => (
                      <Item key={n} size="sm" className="px-0">
                        <ItemMedia><Avatar><AvatarFallback>{iniciales(n)}</AvatarFallback></Avatar></ItemMedia>
                        <ItemContent>
                          <ItemTitle>{n}</ItemTitle>
                          <ItemDescription>{t} · {h}</ItemDescription>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppMain>
      {mobile && <Fab vertical="bottom" horizontal="end"><FabButton aria-label="Nueva cita"><Plus /></FabButton></Fab>}
    </>
  )
}

function TablaCitas({ citas }: { citas: Cita[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead>Hora</TableHead><TableHead>Cliente</TableHead><TableHead>Servicio</TableHead><TableHead>Con</TableHead><TableHead>Estado</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        {citas.map((c) => (
          <TableRow key={c.hora}>
            <TableCell className="font-emphasis">{c.hora}</TableCell>
            <TableCell>{c.cliente}</TableCell>
            <TableCell>{c.servicio}</TableCell>
            <TableCell className="text-muted-foreground">{c.con}</TableCell>
            <TableCell><Badge variant={ESTADO[c.estado].variant}>{ESTADO[c.estado].label}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ListaCitas({ citas }: { citas: Cita[] }) {
  return (
    <ItemGroup>
      {citas.map((c) => (
        <Item key={c.hora} size="sm" className="px-0">
          <ItemMedia variant="icon"><Clock /></ItemMedia>
          <ItemContent>
            <ItemTitle>{c.hora} · {c.cliente}</ItemTitle>
            <ItemDescription>{c.servicio} con {c.con}</ItemDescription>
          </ItemContent>
          <ItemActions><Badge variant={ESTADO[c.estado].variant}>{ESTADO[c.estado].label}</Badge></ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}
