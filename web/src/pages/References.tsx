// Sección «Referencias»: sistemas de diseño públicos para inspirarse.
// Los datos viven en ../referencias/referencias.json (fuera de la web, para poder añadir más sin tocar código).
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, CodeXml, Compass, ExternalLink, Globe, Search, Waves } from "lucide-react"
import data from "../../../referencias/referencias.json"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/app/common"
import { cn } from "@/lib/utils"

type Links = { web?: string; github?: string; surf?: string }
type Reference = { name: string; company: string; sector: string; note: string; tags: string[]; links: Links }
type Directory = { name: string; note: string; url: string }

const TAGS = data.tags as Record<string, string>
const SYSTEMS = data.systems as Reference[]
const DIRECTORIES = data.directories as Directory[]
const SECTORS = [...new Set(SYSTEMS.map((s) => s.sector))].sort((a, b) => a.localeCompare(b))

const LINKS: { key: keyof Links; label: string; icon: typeof Globe }[] = [
  { key: "web", label: "Web", icon: Globe },
  { key: "github", label: "Código", icon: CodeXml },
  { key: "surf", label: "Ficha", icon: Waves },
]

function initials(name: string) {
  return name.replace(/[^\p{L}\p{N} ]/gu, " ").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

function ReferenceCard({ r, activeTag }: { r: Reference; activeTag: string | null }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-1 flex-col gap-gap-md p-inset-xl">
        <div className="flex items-start gap-gap-md">
          <div className="flex size-avatar-lg shrink-0 items-center justify-center rounded-card bg-muted text-ui font-strong text-muted-foreground" aria-hidden>
            {initials(r.name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lead font-strong">{r.name}</h3>
            <p className="text-caption text-muted-foreground">{r.company} · {r.sector}</p>
          </div>
        </div>
        <p className="text-ui text-muted-foreground">{r.note}</p>
        <div className="mt-auto flex flex-wrap gap-gap-xs">
          {r.tags.map((t) => (
            <Badge key={t} variant={t === activeTag ? "default" : "secondary"}>{TAGS[t] ?? t}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-wrap gap-gap-sm border-t-thin p-inset-md">
        {LINKS.filter((l) => r.links[l.key]).map(({ key, label, icon: Icon }) => (
          <Button key={key} size="sm" variant={key === "web" || (key === "github" && !r.links.web) ? "outline" : "ghost"} asChild>
            <a href={r.links[key]} target="_blank" rel="noreferrer"><Icon />{label}</a>
          </Button>
        ))}
      </CardFooter>
    </Card>
  )
}

export default function References() {
  const [q, setQ] = useState("")
  const [tag, setTag] = useState<string | null>(null)
  const [sector, setSector] = useState("all")

  const list = useMemo(() => {
    const text = q.trim().toLowerCase()
    return SYSTEMS.filter((s) =>
      (!tag || s.tags.includes(tag)) &&
      (sector === "all" || s.sector === sector) &&
      (!text || [s.name, s.company, s.note, s.sector].join(" ").toLowerCase().includes(text)),
    )
  }, [q, tag, sector])

  const clear = () => { setQ(""); setTag(null); setSector("all") }

  return (
    <div className="min-h-screen bg-subtle">
      <header className="border-b-thin bg-background">
        <div className="mx-auto flex h-header max-w-page items-center justify-between px-inset-xl">
          <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft />Tus sistemas</Link></Button>
          <span className="text-caption text-muted-foreground">{SYSTEMS.length} sistemas de referencia</span>
        </div>
      </header>

      <main className="mx-auto max-w-page px-inset-xl py-inset-3xl">
        <div className="mb-gap-2xl space-y-gap-sm">
          <h1 className="text-h2 font-heavy tracking-heading">Referencias</h1>
          <p className="max-w-prose text-muted-foreground">
            Sistemas de diseño públicos de otras empresas para inspirarte. Cada uno dice qué merece la pena mirar.
            Filtra por lo que buscas: tokens, componentes, kit de Figma, accesibilidad…
          </p>
        </div>

        <div className="mb-gap-lg flex flex-wrap gap-gap-md">
          <div className="relative min-w-sidebar flex-1">
            <Search className="absolute top-1/2 left-inset-md size-icon-md -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, empresa o tema" className="bg-background pl-inset-2xl" />
          </div>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="min-w-menu-min bg-background" aria-label="Sector"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los sectores</SelectItem>
              {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-gap-xl flex flex-wrap gap-gap-sm" role="group" aria-label="Qué buscas">
          {[null, ...Object.keys(TAGS)].map((t) => (
            <Button key={t ?? "all"} size="sm" variant={tag === t ? "default" : "outline"} aria-pressed={tag === t}
              className={cn(tag !== t && "bg-background")} onClick={() => setTag(t)}>
              {t ? TAGS[t] : "Todo"}
            </Button>
          ))}
        </div>

        {list.length ? (
          <div className="grid gap-gap-xl sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => <ReferenceCard key={r.name} r={r} activeTag={tag} />)}
          </div>
        ) : (
          <EmptyState title="Ninguna referencia coincide" text="Prueba con otra palabra o quita los filtros.">
            <Button variant="outline" onClick={clear}>Quitar filtros</Button>
          </EmptyState>
        )}

        <section className="mt-gap-4xl">
          <h2 className="mb-gap-2xs flex items-center gap-gap-sm text-title font-strong"><Compass className="size-icon-lg" />Para buscar más</h2>
          <p className="mb-gap-lg text-ui text-muted-foreground">Directorios y herramientas con muchos más sistemas.</p>
          <div className="grid gap-gap-md sm:grid-cols-2">
            {DIRECTORIES.map((d) => (
              <a key={d.url} href={d.url} target="_blank" rel="noreferrer"
                className="group flex items-start justify-between gap-gap-md rounded-card border-thin bg-background p-inset-lg transition-shadow hover:shadow-overlay">
                <div>
                  <p className="font-strong">{d.name}</p>
                  <p className="text-ui text-muted-foreground">{d.note}</p>
                </div>
                <ExternalLink className="size-icon-md shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </section>

        <p className="mt-gap-2xl text-caption text-muted-foreground">
          ¿Echas en falta alguno? Pídemelo en el chat y lo añado.
        </p>
      </main>
    </div>
  )
}
