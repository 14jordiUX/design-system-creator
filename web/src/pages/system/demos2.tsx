import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import {
  AlignCenter, AlignLeft, AlignRight, ArrowUpDown, CalendarDays, Calendar as CalendarIcon, Check, ChevronsUpDown,
  Home, Inbox, Settings, Smile, User, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
} from "@/components/ui/sidebar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { Demo } from "./demos"

const imp = (name: string, file: string) => `import { ${name} } from "@/components/ui/${file}"\n\n`

/* ---------- demos con estado ---------- */

const TREATMENTS = [
  { value: "limpieza", label: "Limpieza dental" },
  { value: "ortodoncia", label: "Ortodoncia" },
  { value: "implante", label: "Implante" },
  { value: "blanqueamiento", label: "Blanqueamiento" },
  { value: "revision", label: "Revisión" },
]

function ComboboxDemo() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-popover justify-between">
          {value ? TREATMENTS.find((t) => t.value === value)?.label : "Elige un tratamiento…"}
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-popover p-0">
        <Command>
          <CommandInput placeholder="Buscar tratamiento…" />
          <CommandList>
            <CommandEmpty>No hay resultados.</CommandEmpty>
            <CommandGroup>
              {TREATMENTS.map((t) => (
                <CommandItem key={t.value} value={t.value} onSelect={(v) => { setValue(v === value ? "" : v); setOpen(false) }}>
                  {t.label}
                  <Check className={cn("ml-auto", value === t.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const schema = z.object({
  nombre: z.string().min(2, "Escribe al menos 2 letras."),
  email: z.string().email("Revisa el correo: no parece válido."),
})

function FormDemo() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { nombre: "", email: "" } })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => toast.success(`Gracias, ${v.nombre}`))} className="grid max-w-sheet gap-gap-lg">
        <FormField control={form.control} name="nombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl><Input placeholder="Laura Pérez" {...field} /></FormControl>
            <FormDescription>Así aparecerá en tus citas.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Correo</FormLabel>
            <FormControl><Input placeholder="laura@correo.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-fit">Enviar</Button>
      </form>
    </Form>
  )
}

function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return <Calendar mode="single" selected={date} onSelect={setDate} locale={es} className="rounded-card border-thin shadow-flat" />
}

function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-popover justify-start font-normal", !date && "text-muted-foreground")}>
          <CalendarIcon />
          {date ? format(date, "PPP", { locale: es }) : "Elige una fecha"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} locale={es} />
      </PopoverContent>
    </Popover>
  )
}

type Patient = { nombre: string; tratamiento: string; estado: "Confirmada" | "Pendiente" | "Cancelada"; importe: number }
const PATIENTS: Patient[] = [
  { nombre: "Laura Pérez", tratamiento: "Limpieza", estado: "Confirmada", importe: 60 },
  { nombre: "Marc Soler", tratamiento: "Ortodoncia", estado: "Pendiente", importe: 1200 },
  { nombre: "Ana Ruiz", tratamiento: "Implante", estado: "Confirmada", importe: 950 },
  { nombre: "Jordi Vidal", tratamiento: "Revisión", estado: "Cancelada", importe: 0 },
  { nombre: "Sara Gil", tratamiento: "Blanqueamiento", estado: "Pendiente", importe: 300 },
]
const COLUMNS: ColumnDef<Patient>[] = [
  { accessorKey: "nombre", header: ({ column }) => (
    <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Paciente<ArrowUpDown /></Button>) },
  { accessorKey: "tratamiento", header: "Tratamiento" },
  { accessorKey: "estado", header: "Estado" },
  { accessorKey: "importe", header: () => <div className="text-right">Importe</div>,
    cell: ({ row }) => <div className="text-right font-emphasis">{row.getValue<number>("importe").toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</div> },
]

function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [filter, setFilter] = React.useState("")
  const table = useReactTable({
    data: PATIENTS, columns: COLUMNS, state: { sorting, globalFilter: filter },
    onSortingChange: setSorting, onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
  })
  return (
    <div className="grid w-full gap-gap-md">
      <Input placeholder="Buscar paciente…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-popover" />
      <div className="rounded-card border-thin">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((r) => (
              <TableRow key={r.id}>{r.getVisibleCells().map((c) => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}</TableRow>
            )) : <TableRow><TableCell colSpan={COLUMNS.length} className="text-center text-muted-foreground">No hay resultados.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function CollapsibleDemo() {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="grid w-popover gap-gap-sm">
      <div className="flex items-center justify-between gap-gap-lg">
        <span className="text-ui font-strong">3 citas esta semana</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Mostrar todas"><ChevronsUpDown /></Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-control border-thin px-inset-lg py-inset-sm text-ui">Lunes · Limpieza</div>
      <CollapsibleContent className="grid gap-gap-sm">
        <div className="rounded-control border-thin px-inset-lg py-inset-sm text-ui">Miércoles · Revisión</div>
        <div className="rounded-control border-thin px-inset-lg py-inset-sm text-ui">Viernes · Ortodoncia</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const chartData = [
  { mes: "Ene", citas: 186, nuevas: 80 }, { mes: "Feb", citas: 305, nuevas: 200 }, { mes: "Mar", citas: 237, nuevas: 120 },
  { mes: "Abr", citas: 173, nuevas: 190 }, { mes: "May", citas: 209, nuevas: 130 }, { mes: "Jun", citas: 214, nuevas: 140 },
]
const chartConfig = {
  citas: { label: "Citas", color: "var(--color-chart-1)" },
  nuevas: { label: "Pacientes nuevos", color: "var(--color-chart-2)" },
} satisfies ChartConfig

function ChartDemo() {
  return (
    <ChartContainer config={chartConfig} className="w-full max-w-dialog">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="citas" fill="var(--color-citas)" />
        <Bar dataKey="nuevas" fill="var(--color-nuevas)" />
      </BarChart>
    </ChartContainer>
  )
}

function SidebarDemo() {
  const [active, setActive] = React.useState("Inicio")
  const items = [{ t: "Inicio", i: Home }, { t: "Mensajes", i: Inbox, badge: "3" }, { t: "Pacientes", i: Users }, { t: "Ajustes", i: Settings }]
  return (
    <SidebarProvider className="min-h-0 overflow-hidden rounded-card border-thin">
      <Sidebar collapsible="none">
        <SidebarHeader><div className="px-inset-sm py-inset-2xs text-ui font-strong">Clínica Sereno</div></SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menú</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((it) => (
                  <SidebarMenuItem key={it.t}>
                    <SidebarMenuButton isActive={active === it.t} onClick={() => setActive(it.t)}><it.i /><span>{it.t}</span></SidebarMenuButton>
                    {it.badge && <SidebarMenuBadge>{it.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu><SidebarMenuItem><SidebarMenuButton><User /><span>Laura Pérez</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-inset-xl"><div className="text-lead font-strong">{active}</div><p className="text-ui text-muted-foreground">Contenido de la página.</p></SidebarInset>
    </SidebarProvider>
  )
}

/* ---------- fichas ---------- */

export const DEMOS2: Record<string, Demo> = {
  "toggle-group": {
    description: "Grupo de botones que se activan; puede permitir uno solo o varios a la vez.",
    examples: [
      { title: "Uno a la vez", render: (
        <ToggleGroup type="single" variant="outline" defaultValue="left">
          <ToggleGroupItem value="left" aria-label="Izquierda"><AlignLeft /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Centro"><AlignCenter /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Derecha"><AlignRight /></ToggleGroupItem>
        </ToggleGroup>),
        code: imp("ToggleGroup, ToggleGroupItem", "toggle-group") + `<ToggleGroup type="single" variant="outline" defaultValue="left">\n  <ToggleGroupItem value="left"><AlignLeft /></ToggleGroupItem>\n  <ToggleGroupItem value="center"><AlignCenter /></ToggleGroupItem>\n  <ToggleGroupItem value="right"><AlignRight /></ToggleGroupItem>\n</ToggleGroup>` },
      { title: "Varios y con separación", render: (
        <ToggleGroup type="multiple" spacing={2}>
          <ToggleGroupItem value="m">Mañana</ToggleGroupItem>
          <ToggleGroupItem value="t">Tarde</ToggleGroupItem>
          <ToggleGroupItem value="s">Sábado</ToggleGroupItem>
        </ToggleGroup>),
        code: `<ToggleGroup type="multiple" spacing={2}>\n  <ToggleGroupItem value="m">Mañana</ToggleGroupItem>\n  …\n</ToggleGroup>` },
    ],
  },
  "context-menu": {
    description: "Menú que aparece al hacer clic derecho sobre una zona.",
    examples: [{ title: "Clic derecho en la caja", render: (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-area-min w-popover items-center justify-center rounded-card border-thin border-dashed text-ui text-muted-foreground">Haz clic derecho aquí</ContextMenuTrigger>
        <ContextMenuContent className="w-popover">
          <ContextMenuItem>Abrir ficha<ContextMenuShortcut>⌘O</ContextMenuShortcut></ContextMenuItem>
          <ContextMenuItem>Duplicar cita<ContextMenuShortcut>⌘D</ContextMenuShortcut></ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Eliminar</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>),
      code: imp("ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger", "context-menu") + `<ContextMenu>\n  <ContextMenuTrigger>Haz clic derecho aquí</ContextMenuTrigger>\n  <ContextMenuContent>\n    <ContextMenuItem>Abrir ficha</ContextMenuItem>\n    <ContextMenuItem variant="destructive">Eliminar</ContextMenuItem>\n  </ContextMenuContent>\n</ContextMenu>` }],
  },
  menubar: {
    description: "Barra de menús horizontal, como la de una aplicación de escritorio.",
    examples: [{ title: "Básico", render: (
      <Menubar>
        <MenubarMenu><MenubarTrigger>Archivo</MenubarTrigger>
          <MenubarContent><MenubarItem>Nueva cita<MenubarShortcut>⌘N</MenubarShortcut></MenubarItem><MenubarItem>Imprimir<MenubarShortcut>⌘P</MenubarShortcut></MenubarItem><MenubarSeparator /><MenubarItem>Salir</MenubarItem></MenubarContent>
        </MenubarMenu>
        <MenubarMenu><MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent><MenubarItem>Deshacer<MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem><MenubarItem>Rehacer</MenubarItem></MenubarContent>
        </MenubarMenu>
        <MenubarMenu><MenubarTrigger>Ver</MenubarTrigger>
          <MenubarContent><MenubarItem>Agenda semanal</MenubarItem><MenubarItem>Agenda diaria</MenubarItem></MenubarContent>
        </MenubarMenu>
      </Menubar>),
      code: imp("Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger", "menubar") + `<Menubar>\n  <MenubarMenu>\n    <MenubarTrigger>Archivo</MenubarTrigger>\n    <MenubarContent>\n      <MenubarItem>Nueva cita</MenubarItem>\n    </MenubarContent>\n  </MenubarMenu>\n</Menubar>` }],
  },
  combobox: {
    description: "Selector con buscador. Se monta con Popover + Command.",
    examples: [{ title: "Elegir tratamiento", render: <ComboboxDemo />,
      code: `<Popover>\n  <PopoverTrigger asChild><Button variant="outline">Elige un tratamiento…</Button></PopoverTrigger>\n  <PopoverContent className="p-0">\n    <Command>\n      <CommandInput placeholder="Buscar…" />\n      <CommandList>\n        <CommandEmpty>No hay resultados.</CommandEmpty>\n        <CommandItem>Limpieza dental</CommandItem>\n      </CommandList>\n    </Command>\n  </PopoverContent>\n</Popover>` }],
  },
  form: {
    description: "Formulario con validación (react-hook-form + zod). Los errores salen debajo de cada campo.",
    examples: [{ title: "Datos de contacto", description: "Pulsa Enviar con los campos vacíos para ver los errores.", render: <FormDemo />,
      code: imp("Form, FormControl, FormField, FormItem, FormLabel, FormMessage", "form") + `<Form {...form}>\n  <FormField control={form.control} name="nombre" render={({ field }) => (\n    <FormItem>\n      <FormLabel>Nombre</FormLabel>\n      <FormControl><Input {...field} /></FormControl>\n      <FormMessage />\n    </FormItem>\n  )} />\n</Form>` }],
  },
  calendar: {
    description: "Calendario para elegir un día o un rango.",
    examples: [{ title: "Un día", render: <CalendarDemo />,
      code: imp("Calendar", "calendar") + `<Calendar mode="single" selected={date} onSelect={setDate} />` }],
  },
  "date-picker": {
    description: "Campo de fecha que abre un calendario. Se monta con Popover + Calendar.",
    examples: [{ title: "Básico", render: <DatePickerDemo />,
      code: `<Popover>\n  <PopoverTrigger asChild><Button variant="outline"><CalendarIcon />Elige una fecha</Button></PopoverTrigger>\n  <PopoverContent className="w-auto p-0">\n    <Calendar mode="single" selected={date} onSelect={setDate} />\n  </PopoverContent>\n</Popover>` }],
  },
  "input-otp": {
    description: "Casillas para un código de un solo uso (SMS, correo).",
    examples: [{ title: "Código de 6 cifras", render: (
      <InputOTP maxLength={6}>
        <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /></InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
      </InputOTP>),
      code: imp("InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator", "input-otp") + `<InputOTP maxLength={6}>\n  <InputOTPGroup>\n    <InputOTPSlot index={0} />\n    …\n  </InputOTPGroup>\n</InputOTP>` }],
  },
  "data-table": {
    description: "Tabla con búsqueda y orden (Table + TanStack Table).",
    examples: [{ title: "Pacientes", description: "Escribe en el buscador o pulsa «Paciente» para ordenar.", render: <DataTableDemo />,
      code: `const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })\n\n<Table>\n  <TableHeader>…</TableHeader>\n  <TableBody>…</TableBody>\n</Table>` }],
  },
  collapsible: {
    description: "Zona que se abre y se cierra. Más simple que Accordion.",
    examples: [{ title: "Básico", render: <CollapsibleDemo />,
      code: imp("Collapsible, CollapsibleContent, CollapsibleTrigger", "collapsible") + `<Collapsible>\n  <CollapsibleTrigger>Ver todas</CollapsibleTrigger>\n  <CollapsibleContent>…</CollapsibleContent>\n</Collapsible>` }],
  },
  "aspect-ratio": {
    description: "Mantiene una proporción (por ejemplo 16:9) para imágenes y vídeos.",
    examples: [{ title: "16:9", render: (
      <div className="w-full max-w-sheet">
        <AspectRatio ratio={16 / 9} className="flex items-center justify-center rounded-card bg-muted text-ui text-muted-foreground"><Smile className="size-icon-lg" /></AspectRatio>
      </div>),
      code: imp("AspectRatio", "aspect-ratio") + `<AspectRatio ratio={16 / 9}>\n  <img src="…" alt="…" />\n</AspectRatio>` }],
  },
  carousel: {
    description: "Carrusel de tarjetas o imágenes con flechas.",
    examples: [{ title: "Básico", render: (
      <div className="px-inset-3xl">
        <Carousel className="w-popover">
          <CarouselContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <CarouselItem key={n}><div className="flex aspect-square items-center justify-center rounded-card border-thin bg-card text-h2">{n}</div></CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>),
      code: imp("Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious", "carousel") + `<Carousel>\n  <CarouselContent>\n    <CarouselItem>…</CarouselItem>\n  </CarouselContent>\n  <CarouselPrevious />\n  <CarouselNext />\n</Carousel>` }],
  },
  chart: {
    description: "Gráficos (Recharts) con los colores chart-1…5 del sistema.",
    examples: [{ title: "Barras", render: <ChartDemo />,
      code: imp("ChartContainer, ChartTooltip, ChartTooltipContent", "chart") + `const config = { citas: { label: "Citas", color: "var(--color-chart-1)" } }\n\n<ChartContainer config={config}>\n  <BarChart data={data}>\n    <Bar dataKey="citas" fill="var(--color-citas)" />\n    <ChartTooltip content={<ChartTooltipContent />} />\n  </BarChart>\n</ChartContainer>` }],
  },
  "navigation-menu": {
    description: "Menú principal de una web, con desplegables.",
    examples: [{ title: "Básico", render: (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Tratamientos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-popover gap-gap-2xs">
                {["Limpieza", "Ortodoncia", "Implantes"].map((t) => (
                  <li key={t}><NavigationMenuLink href="#"><div className="font-emphasis">{t}</div><div className="text-muted-foreground">Más información</div></NavigationMenuLink></li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem><NavigationMenuLink href="#">Equipo</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem><NavigationMenuLink href="#">Contacto</NavigationMenuLink></NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>),
      code: imp("NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger", "navigation-menu") + `<NavigationMenu>\n  <NavigationMenuList>\n    <NavigationMenuItem>\n      <NavigationMenuTrigger>Tratamientos</NavigationMenuTrigger>\n      <NavigationMenuContent>…</NavigationMenuContent>\n    </NavigationMenuItem>\n  </NavigationMenuList>\n</NavigationMenu>` }],
  },
  pagination: {
    description: "Pasar de página en listas largas.",
    examples: [{ title: "Básico", render: (
      <Pagination>
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
          <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis /></PaginationItem>
          <PaginationItem><PaginationNext href="#" /></PaginationItem>
        </PaginationContent>
      </Pagination>),
      code: imp("Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious", "pagination") + `<Pagination>\n  <PaginationContent>\n    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>\n    <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>\n    <PaginationItem><PaginationNext href="#" /></PaginationItem>\n  </PaginationContent>\n</Pagination>` }],
  },
  sidebar: {
    description: "Barra lateral de una aplicación. En una app real ocupa todo el alto y se puede plegar; aquí se muestra dentro de una caja.",
    examples: [{ title: "Menú de la clínica", render: <SidebarDemo />,
      code: imp("Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider", "sidebar") + `<SidebarProvider>\n  <Sidebar>\n    <SidebarContent>\n      <SidebarGroup>\n        <SidebarMenu>\n          <SidebarMenuItem><SidebarMenuButton>Inicio</SidebarMenuButton></SidebarMenuItem>\n        </SidebarMenu>\n      </SidebarGroup>\n    </SidebarContent>\n  </Sidebar>\n  <main>…</main>\n</SidebarProvider>` }],
  },
  command: {
    description: "Buscador de acciones con teclado (paleta de comandos).",
    examples: [{ title: "Paleta", render: (
      <Command className="max-w-sheet rounded-card border-thin shadow-flat">
        <CommandInput placeholder="Escribe una acción…" />
        <CommandList>
          <CommandEmpty>No hay resultados.</CommandEmpty>
          <CommandGroup heading="Sugerencias">
            <CommandItem><CalendarDays />Nueva cita</CommandItem>
            <CommandItem><Users />Buscar paciente</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ajustes">
            <CommandItem><User />Perfil<CommandShortcut>⌘P</CommandShortcut></CommandItem>
            <CommandItem><Settings />Preferencias<CommandShortcut>⌘S</CommandShortcut></CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>),
      code: imp("Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList", "command") + `<Command>\n  <CommandInput placeholder="Escribe una acción…" />\n  <CommandList>\n    <CommandEmpty>No hay resultados.</CommandEmpty>\n    <CommandGroup heading="Sugerencias">\n      <CommandItem>Nueva cita</CommandItem>\n    </CommandGroup>\n  </CommandList>\n</Command>` }],
  },
  "alert-dialog": {
    description: "Ventana que pide confirmar una acción importante. No se cierra al hacer clic fuera.",
    examples: [{ title: "Confirmar borrado", render: (
      <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="destructive">Cancelar cita</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar la cita?</AlertDialogTitle>
            <AlertDialogDescription>Se avisará al paciente por correo. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => toast("Cita cancelada")}>Sí, cancelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>),
      code: imp("AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger", "alert-dialog") + `<AlertDialog>\n  <AlertDialogTrigger asChild><Button variant="destructive">Cancelar cita</Button></AlertDialogTrigger>\n  <AlertDialogContent>\n    <AlertDialogHeader>\n      <AlertDialogTitle>¿Cancelar la cita?</AlertDialogTitle>\n    </AlertDialogHeader>\n    <AlertDialogFooter>\n      <AlertDialogCancel>Volver</AlertDialogCancel>\n      <AlertDialogAction>Sí, cancelar</AlertDialogAction>\n    </AlertDialogFooter>\n  </AlertDialogContent>\n</AlertDialog>` }],
  },
  drawer: {
    description: "Panel que sube desde abajo; pensado sobre todo para móvil (se puede arrastrar).",
    examples: [{ title: "Básico", render: (
      <Drawer>
        <DrawerTrigger asChild><Button variant="outline">Abrir drawer</Button></DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sheet">
            <DrawerHeader><DrawerTitle>Elige horario</DrawerTitle><DrawerDescription>Te guardamos la cita durante 10 minutos.</DrawerDescription></DrawerHeader>
            <div className="flex flex-wrap gap-gap-sm p-inset-lg">{["9:00", "10:30", "12:00", "16:30"].map((h) => <Button key={h} variant="outline" size="sm">{h}</Button>)}</div>
            <DrawerFooter><Button>Confirmar</Button><DrawerClose asChild><Button variant="outline">Cerrar</Button></DrawerClose></DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>),
      code: imp("Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger", "drawer") + `<Drawer>\n  <DrawerTrigger asChild><Button>Abrir</Button></DrawerTrigger>\n  <DrawerContent>\n    <DrawerHeader><DrawerTitle>Elige horario</DrawerTitle></DrawerHeader>\n    <DrawerFooter><DrawerClose>Cerrar</DrawerClose></DrawerFooter>\n  </DrawerContent>\n</Drawer>` }],
  },
  "hover-card": {
    description: "Tarjeta con más información al pasar el ratón por un enlace.",
    examples: [{ title: "Perfil", render: (
      <HoverCard>
        <HoverCardTrigger asChild><Button variant="link">@dra.martinez</Button></HoverCardTrigger>
        <HoverCardContent>
          <div className="flex gap-gap-md">
            <Avatar><AvatarFallback>CM</AvatarFallback></Avatar>
            <div className="grid gap-gap-2xs">
              <div className="text-ui font-strong">Dra. Carmen Martínez</div>
              <p className="text-ui text-muted-foreground">Ortodoncista. Atiende martes y jueves.</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>),
      code: imp("HoverCard, HoverCardContent, HoverCardTrigger", "hover-card") + `<HoverCard>\n  <HoverCardTrigger>@dra.martinez</HoverCardTrigger>\n  <HoverCardContent>…</HoverCardContent>\n</HoverCard>` }],
  },
}

