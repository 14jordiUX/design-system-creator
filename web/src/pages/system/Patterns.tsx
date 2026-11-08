import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { LayoutGrid, Monitor, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EmptyState, PageHeader, Section } from "@/components/app/common"
import { patternsFor } from "@/lib/patterns"
import { notYet } from "../Library"
import { useDS } from "./context"
import { CodeBlock } from "./Components"

export default function Patterns() {
  const { editor, ds } = useDS()
  const list = patternsFor(ds.meta.id)
  return (
    <div>
      <PageHeader eyebrow="Patrones" title="Patrones"
        description="Pantallas hechas solo juntando componentes y tokens del sistema, sin nada inventado. Sirven de modelo para montar las de tu producto." />
      {list.length ? (
        <div className="grid gap-gap-lg md:grid-cols-2">
          {list.map((p) => (
            <Link key={p.slug} to={p.slug} className="rounded-card border-thin p-inset-lg transition-colors hover:bg-subtle focus-visible:focus-ring">
              <div className="mb-gap-xs flex items-center gap-gap-sm text-body font-strong"><LayoutGrid className="size-icon-md text-primary" />{p.meta.label}</div>
              <p className="text-ui text-muted-foreground">{p.meta.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={<LayoutGrid className="size-icon-lg" />} title="No hay nada todavía"
          text="Este sistema aún no tiene patrones. Pídemelos en el chat: «monta una pantalla de… con lo que tenemos».">
          {editor && <Button variant="outline" onClick={() => notYet("Añadir un patrón", "fase 2")}>Añadir patrón</Button>}
        </EmptyState>
      )}
    </div>
  )
}

export function PatternPage() {
  const { slug } = useParams()
  const { ds } = useDS()
  const [view, setView] = useState("desktop")
  const p = patternsFor(ds.meta.id).find((x) => x.slug === slug)
  if (!p) return <EmptyState title="Este patrón no existe" />
  return (
    <div>
      <PageHeader eyebrow="Patrones" title={p.meta.label} description={p.meta.description}
        actions={
          <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v)}>
            <ToggleGroupItem value="desktop" aria-label="Escritorio"><Monitor />Escritorio</ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Móvil"><Smartphone />Móvil</ToggleGroupItem>
          </ToggleGroup>
        } />
      <div className={view === "mobile" ? "mx-auto h-content w-full max-w-sheet overflow-hidden rounded-overlay border-thick shadow-overlay" : "h-content w-full overflow-hidden rounded-card border-thin shadow-raised"}>
        <p.Component key={view} />
      </div>
      <Section title="Código" description="Solo usa componentes del sistema (components/ui y components/custom) y clases de tokens. Está también en el kit, en patterns/.">
        <CodeBlock code={p.source} />
      </Section>
    </div>
  )
}
