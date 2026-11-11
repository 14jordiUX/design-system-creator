import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Copy, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, Wand2, Eye, FilePlus2, Globe, BookOpen, FlaskConical } from "lucide-react"
import { systems, ORIGIN_LABEL, type DesignSystem } from "@/lib/systems"
import { fontFamilyCss } from "@/lib/tokens"
import { loadFonts } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/app/common"
import { FromUrlDialog } from "@/components/app/from-url"

export const notYet = (what: string, step: string) =>
  toast.info(`${what}: todavía no`, { description: `Llegará en el paso ${step}. De momento es solo la pantalla.` })

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

function SystemCard({ ds, onDelete }: { ds: DesignSystem; onDelete: () => void }) {
  const p = ds.tokens.primitives.color
  const swatches = ["300", "500", "600", "800"].map((s) => p.brand?.[s]?.$value)
  const neutrals = ["100", "400", "900"].map((s) => p.neutral?.[s]?.$value)
  const font = ds.tokens.primitives.font?.family?.sans?.$value
  const navigate = useNavigate()
  return (
    <Card className="group gap-0 overflow-hidden py-0 transition-shadow hover:shadow-overlay">
      <Link to={`/s/${ds.meta.id}`} className="block">
        <div className="flex h-area-min">
          {[...swatches, ...neutrals].map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>
        <CardContent className="space-y-gap-md p-inset-xl">
          <div className="flex items-start justify-between gap-gap-md">
            <div>
              <h3 className="text-lead font-strong">{ds.meta.name}</h3>
              <p className="text-caption text-muted-foreground">{ds.meta.productType}</p>
            </div>
            <span className="text-h2 leading-compact font-strong" style={{ fontFamily: fontFamilyCss(font) }}>Aa</span>
          </div>
          <p className="line-clamp-2 text-ui text-muted-foreground">{ds.meta.description}</p>
          <div className="flex flex-wrap items-center gap-gap-sm text-caption text-muted-foreground">
            <Badge variant="secondary">{ORIGIN_LABEL[ds.meta.origin]}</Badge>
            <span>Editado el {fmtDate(ds.meta.updatedAt)}</span>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="justify-between gap-gap-sm border-t-thin p-inset-md">
        <div className="flex gap-gap-sm">
          <Button size="sm" variant="outline" asChild><Link to={`/s/${ds.meta.id}`}><Eye />Ver</Link></Button>
          <Button size="sm" variant="ghost" asChild><Link to={`/s/${ds.meta.id}/editar`}><Pencil />Editar</Link></Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Más acciones"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/s/${ds.meta.id}`)}><Eye />Abrir</DropdownMenuItem>
            <DropdownMenuItem onClick={() => notYet("Duplicar", "1.4")}><Copy />Duplicar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => notYet("Renombrar", "1.4")}><Pencil />Renombrar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2 />Borrar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

export default function Library() {
  const [q, setQ] = useState("")
  const [sort, setSort] = useState("recent")
  const [toDelete, setToDelete] = useState<DesignSystem | null>(null)
  const [askClaude, setAskClaude] = useState(false)
  const [fromUrl, setFromUrl] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadFonts(systems.map((s) => s.tokens.primitives.font?.family?.sans?.$value?.[0]))
  }, [])

  const list = useMemo(() => {
    const f = systems.filter((s) => (s.meta.name + " " + s.meta.description).toLowerCase().includes(q.toLowerCase()))
    return f.sort((a, b) => sort === "name" ? a.meta.name.localeCompare(b.meta.name) : b.meta.updatedAt.localeCompare(a.meta.updatedAt) || (a.meta.isTemplate ? 1 : -1))
  }, [q, sort])

  return (
    <div className="min-h-screen bg-subtle">
      <header className="border-b-thin bg-background">
        <div className="mx-auto flex h-header max-w-page items-center justify-between px-inset-xl">
          <div className="flex items-center gap-gap-sm font-strong">
            <div className="flex size-control-sm items-center justify-center rounded-card bg-primary text-primary-foreground"><Sparkles className="size-icon-md" /></div>
            Design System Creator
          </div>
          <div className="flex items-center gap-gap-2xs">
            <Button variant="ghost" size="sm" asChild><Link to="/laboratorio"><FlaskConical />Laboratorio</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/referencias"><BookOpen />Referencias</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-page px-inset-xl py-inset-3xl">
        <div className="mb-gap-2xl flex flex-wrap items-end justify-between gap-gap-lg">
          <div>
            <h1 className="text-h2 font-heavy tracking-heading">Tus sistemas de diseño</h1>
            <p className="mt-gap-2xs text-muted-foreground">{systems.length} sistemas. Ábrelos para verlos en modo cliente o editarlos.</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="lg"><Plus />Nuevo sistema</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-sidebar">
              <DropdownMenuLabel>¿Cómo quieres empezar?</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate("/nuevo")}><Wand2 />Con el cuestionario</DropdownMenuItem>
              <DropdownMenuItem onClick={() => notYet("Crear vacío desde la base", "1.4")}><FilePlus2 />Vacío, desde la base</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFromUrl(true)}><Globe />Desde una web</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAskClaude(true)}><MessageSquare />Pedírselo a Claude</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Desde Figma (fase 2)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-gap-xl flex flex-wrap gap-gap-md">
          <div className="relative min-w-sidebar flex-1">
            <Search className="absolute top-1/2 left-inset-md size-icon-md -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o descripción" className="bg-background pl-inset-2xl" />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="min-w-menu-min bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="name">Por nombre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {list.length ? (
          <div className="grid gap-gap-xl sm:grid-cols-2 lg:grid-cols-3">
            {list.map((ds) => <SystemCard key={ds.meta.id} ds={ds} onDelete={() => setToDelete(ds)} />)}
          </div>
        ) : (
          <EmptyState title="No hay ningún sistema con ese nombre" text="Prueba con otra palabra o borra la búsqueda.">
            <Button variant="outline" onClick={() => setQ("")}>Borrar búsqueda</Button>
          </EmptyState>
        )}
      </main>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar «{toDelete?.meta.name}»?</DialogTitle>
            <DialogDescription>Se borrará la carpeta del sistema. Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { setToDelete(null); notYet("Borrar", "1.4") }}>Borrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FromUrlDialog open={fromUrl} onOpenChange={setFromUrl} />

      <Dialog open={askClaude} onOpenChange={setAskClaude}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pídeme un sistema en la conversación</DialogTitle>
            <DialogDescription>
              Escríbeme en el chat del proyecto algo como «crea un sistema para una clínica dental, tono cercano y limpio».
              Lo guardo en la carpeta <code>systems/</code> y aparece aquí. Así se creó «Sereno».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => setAskClaude(false)}>Entendido</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
