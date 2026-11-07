import { LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, PageHeader } from "@/components/app/common"
import { notYet } from "../Library"
import { useDS } from "./context"

export default function Patterns() {
  const { editor } = useDS()
  return (
    <div>
      <PageHeader eyebrow="Patrones" title="Patrones"
        description="Combinaciones de componentes para resolver tareas concretas: un formulario de acceso, una tabla con filtros, una página de ajustes…" />
      <EmptyState icon={<LayoutGrid className="size-icon-lg" />} title="No hay nada todavía"
        text="Este sistema aún no tiene patrones. Los añadiremos cuando estén listos todos los componentes.">
        {editor && <Button variant="outline" onClick={() => notYet("Añadir un patrón", "fase 2")}>Añadir patrón</Button>}
      </EmptyState>
    </div>
  )
}
