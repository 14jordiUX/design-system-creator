import { Camera, FileText, Image, Mail, Pencil, Plus, Share2, MessageCircle } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { Fab, FabButton, FabList } from "./fab"

const Area = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative h-sheet w-full overflow-hidden rounded-card border-thin bg-subtle ${className}`}>{children}</div>
)

export default {
  label: "Fab",
  description: "Botón flotante con la acción principal de la pantalla. Se coloca en una esquina, en el centro o sobre un borde, y puede abrir listas de acciones más pequeñas.",
  examples: [
    { title: "Posiciones", render: (
      <Area>
        <Fab vertical="top" horizontal="start"><FabButton aria-label="Añadir"><Plus /></FabButton></Fab>
        <Fab vertical="top" horizontal="end"><FabButton size="sm" aria-label="Añadir"><Plus /></FabButton></Fab>
        <Fab vertical="center" horizontal="center"><FabButton aria-label="Añadir"><Plus /></FabButton></Fab>
        <Fab vertical="bottom" horizontal="start"><FabButton size="sm" aria-label="Añadir"><Plus /></FabButton></Fab>
        <Fab vertical="bottom" horizontal="end"><FabButton aria-label="Añadir"><Plus /></FabButton></Fab>
      </Area>),
      code: `import { Fab, FabButton } from "@/components/custom/fab"\n\n<div className="relative …">\n  <Fab vertical="bottom" horizontal="end">\n    <FabButton aria-label="Añadir"><Plus /></FabButton>\n  </Fab>\n</div>` },
    { title: "Con lista de acciones", render: (
      <Area>
        <Fab vertical="center" horizontal="center" defaultActivated>
          <FabButton aria-label="Compartir"><Share2 /></FabButton>
          <FabList side="top">
            <FabButton aria-label="Correo"><Mail /></FabButton>
            <FabButton aria-label="Mensaje"><MessageCircle /></FabButton>
          </FabList>
          <FabList side="bottom">
            <FabButton aria-label="Foto"><Camera /></FabButton>
          </FabList>
          <FabList side="start">
            <FabButton aria-label="Imagen"><Image /></FabButton>
          </FabList>
          <FabList side="end">
            <FabButton aria-label="Documento"><FileText /></FabButton>
          </FabList>
        </Fab>
        <Fab vertical="bottom" horizontal="end">
          <FabButton aria-label="Crear"><Plus /></FabButton>
          <FabList side="top">
            <FabButton aria-label="Escribir"><Pencil /></FabButton>
            <FabButton aria-label="Foto"><Camera /></FabButton>
          </FabList>
        </Fab>
      </Area>),
      code: `<Fab vertical="bottom" horizontal="end">\n  <FabButton aria-label="Crear"><Plus /></FabButton>\n  <FabList side="top">\n    <FabButton aria-label="Escribir"><Pencil /></FabButton>\n    <FabButton aria-label="Foto"><Camera /></FabButton>\n  </FabList>\n</Fab>` },
    { title: "Sobre el borde de una cabecera", render: (
      <div className="w-full overflow-hidden rounded-card border-thin">
        <div className="flex h-header items-center border-b-thin bg-background px-inset-lg text-body font-strong">Mis notas</div>
        <div className="relative h-area-min bg-subtle">
          <Fab vertical="top" horizontal="end" edge><FabButton aria-label="Nueva nota"><Plus /></FabButton></Fab>
        </div>
      </div>),
      code: `<header>…</header>\n<main className="relative">\n  <Fab vertical="top" horizontal="end" edge>\n    <FabButton aria-label="Nueva nota"><Plus /></FabButton>\n  </Fab>\n</main>` },
  ],
} satisfies CustomDemo
