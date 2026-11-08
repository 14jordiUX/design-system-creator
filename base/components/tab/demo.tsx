import { Bell, Home, Search, User } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { Tab, TabContent, TabList, TabTrigger } from "./tab"

const SECCIONES = [["resumen", "Resumen"], ["citas", "Citas", 3], ["pacientes", "Pacientes"], ["facturas", "Facturas", 12], ["informes", "Informes"], ["ajustes", "Ajustes"]] as const

const Body = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-control bg-subtle p-inset-lg text-ui text-muted-foreground">{children}</p>
)

const Frame = ({ label, mobile, children }: { label: string; mobile?: boolean; children: React.ReactNode }) => (
  <div className={mobile ? "w-full max-w-sidebar-mobile shrink-0" : "min-w-0 flex-1"}>
    <p className="mb-gap-xs text-caption text-muted-foreground">{label}</p>
    <div className="overflow-hidden rounded-card border-thin bg-background p-inset-md">{children}</div>
  </div>
)

const Example = ({ variant, mobile }: { variant?: "line" | "pill"; mobile?: "scroll" | "fill" }) => (
  <Tab defaultValue="citas" variant={variant} mobile={mobile}>
    <TabList>
      {(mobile === "fill" ? SECCIONES.slice(0, 3) : SECCIONES).map(([v, l, n]) => <TabTrigger key={v} value={v} badge={n}>{l}</TabTrigger>)}
    </TabList>
    {SECCIONES.map(([v, l]) => <TabContent key={v} value={v}><Body>Contenido de «{l}».</Body></TabContent>)}
  </Tab>
)

const AppBar = () => (
  <Tab defaultValue="inicio" mobile="bar" className="h-full">
    <TabList>
      <TabTrigger value="inicio" icon={<Home />}>Inicio</TabTrigger>
      <TabTrigger value="buscar" icon={<Search />}>Buscar</TabTrigger>
      <TabTrigger value="avisos" icon={<Bell />} badge={2}>Avisos</TabTrigger>
      <TabTrigger value="perfil" icon={<User />}>Perfil</TabTrigger>
    </TabList>
    {["inicio", "buscar", "avisos", "perfil"].map((v) => <TabContent key={v} value={v} className="p-inset-md"><Body>Pantalla «{v}».</Body></TabContent>)}
  </Tab>
)

export default {
  label: "Tab",
  description: "Pestañas que se adaptan al espacio que tienen: en escritorio son una fila de pestañas; en móvil se desplazan de lado, reparten el ancho o se convierten en una barra inferior con iconos.",
  examples: [
    { title: "Línea: en móvil se desplaza de lado", render: (
      <div className="flex w-full flex-wrap items-start gap-gap-xl">
        <Frame label="Escritorio"><Example /></Frame>
        <Frame label="Móvil" mobile><Example /></Frame>
      </div>),
      code: `import { Tab, TabList, TabTrigger, TabContent } from "@/components/custom/tab"\n\n<Tab defaultValue="citas">\n  <TabList>\n    <TabTrigger value="resumen">Resumen</TabTrigger>\n    <TabTrigger value="citas" badge={3}>Citas</TabTrigger>\n    …\n  </TabList>\n  <TabContent value="resumen">…</TabContent>\n  <TabContent value="citas">…</TabContent>\n</Tab>` },
    { title: "Pastilla: en móvil ocupa todo el ancho", render: (
      <div className="flex w-full flex-wrap items-start gap-gap-xl">
        <Frame label="Escritorio"><Example variant="pill" mobile="fill" /></Frame>
        <Frame label="Móvil" mobile><Example variant="pill" mobile="fill" /></Frame>
      </div>),
      code: `<Tab defaultValue="citas" variant="pill" mobile="fill">\n  <TabList>…</TabList>\n  …\n</Tab>` },
    { title: "Barra inferior en móvil", render: (
      <div className="flex w-full flex-wrap items-start gap-gap-xl">
        <Frame label="Escritorio"><AppBar /></Frame>
        <div className="w-full max-w-sidebar-mobile shrink-0">
          <p className="mb-gap-xs text-caption text-muted-foreground">Móvil</p>
          <div className="h-sheet overflow-hidden rounded-card border-thin bg-background"><AppBar /></div>
        </div>
      </div>),
      code: `<Tab defaultValue="inicio" mobile="bar">\n  <TabList>\n    <TabTrigger value="inicio" icon={<Home />}>Inicio</TabTrigger>\n    <TabTrigger value="avisos" icon={<Bell />} badge={2}>Avisos</TabTrigger>\n    …\n  </TabList>\n  <TabContent value="inicio">…</TabContent>\n  …\n</Tab>` },
  ],
} satisfies CustomDemo
