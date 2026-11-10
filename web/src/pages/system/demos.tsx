import type { ReactNode } from "react"
import { DEMOS2 } from "./demos2"
import { DEMOS3 } from "./demos3"
import { DEMOS4 } from "./charts"
import { DEMOS5 } from "./demos5"
import { DEMOS6, AI_TURN_EXAMPLE } from "./demos6"
import { toast } from "sonner"
import { Bold, Italic, Underline, Info, AlertTriangle, ChevronDown, Settings, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toggle } from "@/components/ui/toggle"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export type Example = { title: string; description?: string; render: ReactNode; code: string }
export type Demo = { description: string; examples: Example[] }

const imp = (name: string, file: string) => `import { ${name} } from "@/components/ui/${file}"\n\n`

export const DEMOS: Record<string, Demo> = {
  button: {
    description: "Lanza una acción. Usa la variante principal solo para la acción más importante de cada pantalla.",
    examples: [
      { title: "Variantes", render: <div className="flex flex-wrap gap-gap-sm"><Button>Principal</Button><Button variant="secondary">Secundario</Button><Button variant="outline">Borde</Button><Button variant="ghost">Fantasma</Button><Button variant="destructive">Eliminar</Button><Button variant="link">Enlace</Button></div>,
        code: imp("Button", "button") + `<Button>Principal</Button>\n<Button variant="secondary">Secundario</Button>\n<Button variant="outline">Borde</Button>\n<Button variant="ghost">Fantasma</Button>\n<Button variant="destructive">Eliminar</Button>\n<Button variant="link">Enlace</Button>` },
      { title: "Tamaños", render: <div className="flex flex-wrap items-center gap-gap-sm"><Button size="sm">Pequeño</Button><Button>Normal</Button><Button size="lg">Grande</Button><Button size="icon" aria-label="Ajustes"><Settings /></Button></div>,
        code: `<Button size="sm">Pequeño</Button>\n<Button>Normal</Button>\n<Button size="lg">Grande</Button>\n<Button size="icon"><Settings /></Button>` },
      { title: "Deshabilitado", render: <div className="flex gap-gap-sm"><Button disabled>Principal</Button><Button variant="outline" disabled>Borde</Button></div>, code: `<Button disabled>Principal</Button>` },
    ],
  },
  toggle: {
    description: "Botón que se queda activado o desactivado.",
    examples: [{ title: "Formato de texto", render: <div className="flex gap-gap-2xs"><Toggle aria-label="Negrita"><Bold /></Toggle><Toggle aria-label="Cursiva" defaultPressed><Italic /></Toggle><Toggle variant="outline" aria-label="Subrayado"><Underline /></Toggle></div>,
      code: imp("Toggle", "toggle") + `<Toggle aria-label="Negrita"><Bold /></Toggle>\n<Toggle variant="outline"><Underline /></Toggle>` }],
  },
  "dropdown-menu": {
    description: "Menú de acciones que se abre desde un botón.",
    examples: [{ title: "Menú de cuenta", render: (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline">Mi cuenta<ChevronDown /></Button></DropdownMenuTrigger>
        <DropdownMenuContent><DropdownMenuLabel>Laura Pérez</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem><User />Perfil</DropdownMenuItem><DropdownMenuItem><Settings />Ajustes</DropdownMenuItem><DropdownMenuCheckboxItem checked>Avisos por email</DropdownMenuCheckboxItem><DropdownMenuSub><DropdownMenuSubTrigger>Idioma</DropdownMenuSubTrigger><DropdownMenuSubContent><DropdownMenuItem>Español</DropdownMenuItem><DropdownMenuItem>English</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuSub><DropdownMenuSeparator /><DropdownMenuLabel>Tema</DropdownMenuLabel><DropdownMenuRadioGroup value="claro"><DropdownMenuRadioItem value="claro">Claro</DropdownMenuRadioItem><DropdownMenuRadioItem value="oscuro">Oscuro</DropdownMenuRadioItem></DropdownMenuRadioGroup><DropdownMenuSeparator /><DropdownMenuItem variant="destructive"><LogOut />Cerrar sesión</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>),
      code: `<DropdownMenu>\n  <DropdownMenuTrigger asChild><Button variant="outline">Mi cuenta</Button></DropdownMenuTrigger>\n  <DropdownMenuContent>\n    <DropdownMenuItem>Perfil</DropdownMenuItem>\n    <DropdownMenuItem variant="destructive">Cerrar sesión</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>` }],
  },
  input: {
    description: "Campo de texto de una línea.",
    examples: [
      { title: "Con etiqueta", render: <div className="grid max-w-sheet gap-gap-xs"><Label htmlFor="d-in">Nombre</Label><Input id="d-in" placeholder="Tu nombre" /></div>, code: imp("Input", "input") + `<Label htmlFor="nombre">Nombre</Label>\n<Input id="nombre" placeholder="Tu nombre" />` },
      { title: "Estados", render: <div className="grid max-w-sheet gap-gap-md"><Input disabled placeholder="Deshabilitado" /><Input aria-invalid defaultValue="correo@mal" /></div>, code: `<Input disabled />\n<Input aria-invalid />` },
    ],
  },
  textarea: {
    description: "Campo de texto de varias líneas.",
    examples: [{ title: "Comentario", render: <div className="grid max-w-sheet gap-gap-xs"><Label>Comentario</Label><Textarea placeholder="Cuéntanos qué necesitas" /></div>, code: imp("Textarea", "textarea") + `<Textarea placeholder="Cuéntanos qué necesitas" />` }],
  },
  select: {
    description: "Elegir una opción de una lista.",
    examples: [{ title: "Básico", render: <Select><SelectTrigger className="w-popover"><SelectValue placeholder="Elige un horario" /></SelectTrigger><SelectContent><SelectItem value="m">Mañana</SelectItem><SelectItem value="t">Tarde</SelectItem><SelectItem value="n">Noche</SelectItem></SelectContent></Select>,
      code: `<Select>\n  <SelectTrigger><SelectValue placeholder="Elige un horario" /></SelectTrigger>\n  <SelectContent>\n    <SelectItem value="m">Mañana</SelectItem>\n  </SelectContent>\n</Select>` }],
  },
  checkbox: {
    description: "Marcar una o varias opciones.",
    examples: [{ title: "Con etiqueta", render: <div className="space-y-gap-md"><div className="flex items-center gap-gap-sm"><Checkbox id="c1" defaultChecked /><Label htmlFor="c1">Acepto las condiciones</Label></div><div className="flex items-center gap-gap-sm"><Checkbox id="c2" /><Label htmlFor="c2">Quiero recibir novedades</Label></div><div className="flex items-center gap-gap-sm"><Checkbox id="c3" disabled /><Label htmlFor="c3">Deshabilitado</Label></div></div>,
      code: imp("Checkbox", "checkbox") + `<Checkbox id="c1" />\n<Label htmlFor="c1">Acepto las condiciones</Label>` }],
  },
  "radio-group": {
    description: "Elegir una sola opción entre pocas.",
    examples: [{ title: "Básico", render: <RadioGroup defaultValue="a">{["Primera visita", "Revisión", "Urgencia"].map((x, i) => <div key={x} className="flex items-center gap-gap-sm"><RadioGroupItem value={"abc"[i]} id={"r" + i} /><Label htmlFor={"r" + i}>{x}</Label></div>)}</RadioGroup>,
      code: `<RadioGroup defaultValue="a">\n  <RadioGroupItem value="a" id="a" /><Label htmlFor="a">Primera visita</Label>\n</RadioGroup>` }],
  },
  switch: {
    description: "Activar o desactivar una opción al momento.",
    examples: [{ title: "Básico", render: <div className="space-y-gap-md"><div className="flex items-center gap-gap-sm"><Switch id="s1" defaultChecked /><Label htmlFor="s1">Notificaciones</Label></div><div className="flex items-center gap-gap-sm"><Switch id="s2" /><Label htmlFor="s2">Modo avión</Label></div></div>,
      code: imp("Switch", "switch") + `<Switch id="s1" />\n<Label htmlFor="s1">Notificaciones</Label>` }],
  },
  slider: {
    description: "Elegir un valor dentro de un rango.",
    examples: [{ title: "Básico", render: <Slider defaultValue={[40]} max={100} className="max-w-sheet" />, code: imp("Slider", "slider") + `<Slider defaultValue={[40]} max={100} />` }],
  },
  label: {
    description: "Texto que nombra un campo de formulario.",
    examples: [{ title: "Básico", render: <Label>Correo electrónico</Label>, code: imp("Label", "label") + `<Label htmlFor="email">Correo electrónico</Label>` }],
  },
  card: {
    description: "Agrupa contenido relacionado en una superficie.",
    examples: [{ title: "Con acciones", render: (
      <Card className="max-w-sheet"><CardHeader><CardTitle>Limpieza dental</CardTitle><CardDescription>45 minutos · Dra. Martín</CardDescription></CardHeader>
        <CardContent className="text-ui">Martes 12 de noviembre, 10:30. Recuerda llegar 5 minutos antes.</CardContent>
        <CardFooter className="gap-gap-sm"><Button>Confirmar</Button><Button variant="outline">Cambiar</Button></CardFooter></Card>),
      code: `<Card>\n  <CardHeader>\n    <CardTitle>Limpieza dental</CardTitle>\n    <CardDescription>45 minutos</CardDescription>\n  </CardHeader>\n  <CardContent>…</CardContent>\n  <CardFooter><Button>Confirmar</Button></CardFooter>\n</Card>` }],
  },
  table: {
    description: "Muestra datos en filas y columnas.",
    examples: [{ title: "Básica", render: (
      <Table><TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Tratamiento</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Importe</TableHead></TableRow></TableHeader>
        <TableBody>{[["Ana Gil", "Revisión", "Pagado", "40 €"], ["Marc Soler", "Empaste", "Pendiente", "90 €"], ["Lucía Ramos", "Limpieza", "Pagado", "60 €"]].map((r) => (
          <TableRow key={r[0]}><TableCell className="font-emphasis">{r[0]}</TableCell><TableCell>{r[1]}</TableCell><TableCell><Badge variant={r[2] === "Pagado" ? "secondary" : "outline"}>{r[2]}</Badge></TableCell><TableCell className="text-right">{r[3]}</TableCell></TableRow>))}</TableBody></Table>),
      code: `<Table>\n  <TableHeader><TableRow><TableHead>Paciente</TableHead></TableRow></TableHeader>\n  <TableBody><TableRow><TableCell>Ana Gil</TableCell></TableRow></TableBody>\n</Table>` }],
  },
  badge: {
    description: "Etiqueta corta para estados o categorías.",
    examples: [{ title: "Variantes", render: <div className="flex gap-gap-sm"><Badge>Nuevo</Badge><Badge variant="secondary">Secundario</Badge><Badge variant="outline">Borde</Badge><Badge variant="destructive">Error</Badge></div>,
      code: imp("Badge", "badge") + `<Badge>Nuevo</Badge>\n<Badge variant="secondary">Secundario</Badge>` }],
  },
  avatar: {
    description: "Imagen o iniciales de una persona.",
    examples: [{ title: "Con iniciales", render: <div className="flex gap-gap-sm"><Avatar><AvatarFallback>LP</AvatarFallback></Avatar><Avatar><AvatarFallback>MS</AvatarFallback></Avatar><Avatar className="size-avatar-xl"><AvatarFallback>AR</AvatarFallback></Avatar></div>,
      code: `<Avatar>\n  <AvatarImage src="/foto.jpg" />\n  <AvatarFallback>LP</AvatarFallback>\n</Avatar>` }],
  },
  accordion: {
    description: "Secciones que se abren y cierran.",
    examples: [{ title: "Preguntas frecuentes", render: (
      <Accordion type="single" collapsible className="max-w-dialog">
        <AccordionItem value="1"><AccordionTrigger>¿Puedo cambiar mi cita?</AccordionTrigger><AccordionContent>Sí, hasta 24 horas antes desde tu área personal.</AccordionContent></AccordionItem>
        <AccordionItem value="2"><AccordionTrigger>¿Aceptáis seguros?</AccordionTrigger><AccordionContent>Trabajamos con las principales aseguradoras.</AccordionContent></AccordionItem>
      </Accordion>),
      code: `<Accordion type="single" collapsible>\n  <AccordionItem value="1">\n    <AccordionTrigger>¿Puedo cambiar mi cita?</AccordionTrigger>\n    <AccordionContent>Sí…</AccordionContent>\n  </AccordionItem>\n</Accordion>` }],
  },
  tabs: {
    description: "Cambiar entre vistas relacionadas sin salir de la página.",
    examples: [{ title: "Básico", render: (
      <Tabs defaultValue="a" className="max-w-sheet"><TabsList><TabsTrigger value="a">Próximas</TabsTrigger><TabsTrigger value="b">Pasadas</TabsTrigger></TabsList>
        <TabsContent value="a" className="p-inset-sm text-ui">Tienes 2 citas próximas.</TabsContent><TabsContent value="b" className="p-inset-sm text-ui">No hay citas pasadas.</TabsContent></Tabs>),
      code: `<Tabs defaultValue="a">\n  <TabsList>\n    <TabsTrigger value="a">Próximas</TabsTrigger>\n  </TabsList>\n  <TabsContent value="a">…</TabsContent>\n</Tabs>` }],
  },
  separator: {
    description: "Línea que separa contenido.",
    examples: [{ title: "Horizontal y vertical", render: <div className="max-w-sheet text-ui"><div>Arriba</div><Separator className="my-gap-md" /><div className="flex h-icon-lg items-center gap-gap-md"><span>Uno</span><Separator orientation="vertical" /><span>Dos</span></div></div>, code: `<Separator />\n<Separator orientation="vertical" />` }],
  },
  breadcrumb: {
    description: "Muestra dónde estás dentro de la jerarquía.",
    examples: [{ title: "Básico", render: (
      <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#">Inicio</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="#">Tratamientos</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Ortodoncia</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>),
      code: `<Breadcrumb>\n  <BreadcrumbList>\n    <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>\n    <BreadcrumbSeparator />\n    <BreadcrumbItem><BreadcrumbPage>Ortodoncia</BreadcrumbPage></BreadcrumbItem>\n  </BreadcrumbList>\n</Breadcrumb>` }],
  },
  dialog: {
    description: "Ventana sobre la página para una tarea corta.",
    examples: [{ title: "Confirmación", render: (
      <Dialog><DialogTrigger asChild><Button variant="outline">Abrir diálogo</Button></DialogTrigger>
        <DialogContent><DialogHeader><DialogTitle>¿Cancelar la cita?</DialogTitle><DialogDescription>Podrás pedir otra cuando quieras.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Volver</Button></DialogClose><DialogClose asChild><Button variant="destructive">Cancelar cita</Button></DialogClose></DialogFooter></DialogContent></Dialog>),
      code: `<Dialog>\n  <DialogTrigger asChild><Button>Abrir</Button></DialogTrigger>\n  <DialogContent>\n    <DialogHeader><DialogTitle>¿Cancelar la cita?</DialogTitle></DialogHeader>\n  </DialogContent>\n</Dialog>` }],
  },
  sheet: {
    description: "Panel que entra desde un lateral.",
    examples: [{ title: "Lateral derecho", render: (
      <Sheet><SheetTrigger asChild><Button variant="outline">Abrir panel</Button></SheetTrigger>
        <SheetContent><SheetHeader><SheetTitle>Filtros</SheetTitle><SheetDescription>Ajusta qué citas quieres ver.</SheetDescription></SheetHeader></SheetContent></Sheet>),
      code: `<Sheet>\n  <SheetTrigger asChild><Button>Abrir panel</Button></SheetTrigger>\n  <SheetContent>…</SheetContent>\n</Sheet>` }],
  },
  popover: {
    description: "Contenido flotante junto a un elemento.",
    examples: [{ title: "Básico", render: (
      <Popover><PopoverTrigger asChild><Button variant="outline">Ver detalles</Button></PopoverTrigger>
        <PopoverContent className="text-ui">La consulta está en la segunda planta, puerta B.</PopoverContent></Popover>),
      code: `<Popover>\n  <PopoverTrigger asChild><Button>Ver detalles</Button></PopoverTrigger>\n  <PopoverContent>…</PopoverContent>\n</Popover>` }],
  },
  tooltip: {
    description: "Pista breve al pasar el ratón o enfocar.",
    examples: [{ title: "Básico", render: <Tooltip><TooltipTrigger asChild><Button variant="outline">Pasa el ratón</Button></TooltipTrigger><TooltipContent>Hola, soy un tooltip</TooltipContent></Tooltip>,
      code: `<Tooltip>\n  <TooltipTrigger asChild><Button>Pasa el ratón</Button></TooltipTrigger>\n  <TooltipContent>Hola</TooltipContent>\n</Tooltip>` }],
  },
  alert: {
    description: "Mensaje destacado dentro de la página.",
    examples: [{ title: "Variantes", render: <div className="grid max-w-dialog gap-gap-md"><Alert><Info /><AlertTitle>Recordatorio</AlertTitle><AlertDescription>Tu cita es mañana a las 10:30.</AlertDescription></Alert><Alert variant="destructive"><AlertTriangle /><AlertTitle>No se pudo guardar</AlertTitle><AlertDescription>Revisa tu conexión e inténtalo de nuevo.</AlertDescription></Alert></div>,
      code: imp("Alert, AlertTitle, AlertDescription", "alert") + `<Alert>\n  <AlertTitle>Recordatorio</AlertTitle>\n  <AlertDescription>…</AlertDescription>\n</Alert>` }],
  },
  toast: {
    description: "Aviso temporal en una esquina (librería Sonner).",
    examples: [{ title: "Lanzar un aviso", render: <div className="flex gap-gap-sm"><Button variant="outline" onClick={() => toast("Cita guardada", { description: "Te enviaremos un recordatorio." })}>Aviso</Button><Button variant="outline" onClick={() => toast.success("Pago completado")}>Éxito</Button><Button variant="outline" onClick={() => toast.error("Algo ha fallado")}>Error</Button></div>,
      code: `import { toast } from "sonner"\n\ntoast("Cita guardada", { description: "Te enviaremos un recordatorio." })` }],
  },
  progress: {
    description: "Indica cuánto falta para terminar.",
    examples: [{ title: "Básico", render: <Progress value={62} className="max-w-sheet" />, code: imp("Progress", "progress") + `<Progress value={62} />` }],
  },
  skeleton: {
    description: "Hueco que se muestra mientras carga el contenido.",
    examples: [{ title: "Tarjeta cargando", render: <div className="flex items-center gap-gap-md"><Skeleton className="size-avatar-xl rounded-pill" /><div className="space-y-gap-sm"><Skeleton className="h-icon-md w-field-sm" /><Skeleton className="h-icon-md w-field-xs" /></div></div>,
      code: `<Skeleton className="size-avatar-xl rounded-pill" />\n<Skeleton className="h-icon-md w-field-sm" />` }],
  },
}

Object.assign(DEMOS, DEMOS2, DEMOS3, DEMOS4, DEMOS5, DEMOS6)
DEMOS.message.examples.push(AI_TURN_EXAMPLE)
