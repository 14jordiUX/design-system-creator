import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Download, Eye, Home, LayoutGrid, Moon, Pencil, Puzzle, Redo2, Save, Search, Shapes, Sun, Undo2, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getSystem } from "@/lib/systems"
import { hasLocalServer, saveSystem } from "@/lib/localServer"
import { hostedRepo, saveSystemToGitHub } from "@/lib/github"
import { useGitHubConnect } from "@/components/app/github-connect"
import { setTokenValue, type Mode, type TokenFiles } from "@/lib/tokens"
import { useSystemTheme } from "@/lib/theme"
import { FOUNDATIONS, COMPONENT_GROUPS } from "@/lib/nav"
import { customFor } from "@/lib/custom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState, Soon } from "@/components/app/common"
import { cn } from "@/lib/utils"
import { Ctx } from "./context"

function SideLink({ to, children, end, disabled }: { to: string; children: React.ReactNode; end?: boolean; disabled?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => cn(
      "flex items-center justify-between gap-gap-sm rounded-control px-inset-md py-inset-xs text-ui transition-colors",
      isActive ? "bg-accent font-emphasis text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      disabled && "opacity-disabled",
    )}>{children}</NavLink>
  )
}

function SideTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="mt-gap-xl mb-gap-2xs flex items-center gap-gap-sm px-inset-md text-caption font-strong tracking-caps text-foreground uppercase">{icon}{children}</div>
}

export default function SystemLayoutKeyed() {
  const { id } = useParams()
  return <SystemLayout key={id} id={id} />
}

function SystemLayout({ id }: { id?: string }) {
  const ds = getSystem(id)
  const navigate = useNavigate()
  const location = useLocation()
  const editor = /^\/s\/[^/]+\/editar/.test(location.pathname)
  const [mode, setMode] = useState<Mode>("light")
  const [q, setQ] = useState("")
  // Historial del editor: lista de estados y posición actual (para deshacer / rehacer)
  const [history, setHistory] = useState<TokenFiles[]>(() => (ds ? [ds.tokens] : []))
  const [pos, setPos] = useState(0)
  const tokens = history[pos] ?? ds?.tokens

  const update = useCallback((file: keyof TokenFiles, path: string, value: any) => {
    setHistory((h) => [...h.slice(0, pos + 1), setTokenValue(h[pos], file, path, value)])
    setPos((p) => p + 1)
    lastKey.current = null
  }, [pos])

  // Cambios en bloque (p. ej. regenerar una escala de color entera). Mientras arrastras el selector de color,
  // los cambios con la misma clave sustituyen al anterior en vez de llenar el historial.
  const lastKey = useRef<{ key: string; at: number; pos: number } | null>(null)
  const updateMany = useCallback((changes: [keyof TokenFiles, string, any][], key?: string) => {
    const now = Date.now()
    const merge = !!key && lastKey.current?.key === key && lastKey.current.pos === pos && now - lastKey.current.at < 1500 && pos > 0
    lastKey.current = key ? { key, at: now, pos: merge ? pos : pos + 1 } : null
    setHistory((h) => {
      const from = merge ? h[pos - 1] : h[pos]
      const next = changes.reduce((t, [file, path, value]) => setTokenValue(t, file, path, value), from)
      return merge ? [...h.slice(0, pos), next] : [...h.slice(0, pos + 1), next]
    })
    if (!merge) setPos((p) => p + 1)
  }, [pos])

  useSystemTheme(tokens!, mode)

  // Guardar en la carpeta: solo si la web se abrió con «Abrir el editor.bat» (servidor local)
  const [server, setServer] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const github = !server && !!hostedRepo()
  const connect = useGitHubConnect()
  useEffect(() => { hasLocalServer().then(setServer) }, [])
  const dirty = pos > 0
  useEffect(() => {
    if (!dirty || saving) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty, saving])

  const save = async () => {
    if (!ds || !tokens) return
    if (github) {
      if (!(await connect.ask())) return
      setSaving("Guardando en GitHub")
      try {
        await saveSystemToGitHub(ds.meta.id, ds.meta.name, tokens)
        // Lo guardado pasa a ser el punto de partida (la web publicada se actualiza sola en 1-2 minutos)
        setHistory([tokens]); setPos(0)
        toast.success("Guardado en GitHub", { description: "La web publicada se actualizará sola en 1 o 2 minutos. Si recargas antes, verás la versión anterior." })
      } catch (e: any) {
        toast.error("No se ha podido guardar", { description: String(e.message || e).slice(0, 300) })
      }
      setSaving(null)
      return
    }
    if (!server) {
      toast.info("Para guardar, abre el editor", { description: "Cierra esta pestaña y haz doble clic en «Abrir el editor.bat» de tu carpeta. Los cambios que no guardes se pierden." })
      return
    }
    setSaving("Guardando tokens")
    try {
      const s = await saveSystem(ds.meta.id, tokens, setSaving)
      if (s.state === "error") throw new Error(s.log.at(-1) || "Algo ha fallado")
      const warn = s.log.find((l) => l.startsWith("Aviso"))
      toast.success("Guardado en tu carpeta", { description: warn ?? "Recargo la web con los cambios." })
      setTimeout(() => window.location.reload(), warn ? 2500 : 900)
    } catch (e: any) {
      setSaving(null)
      toast.error("No se ha podido guardar", { description: String(e.message || e).slice(0, 300) })
    }
  }

  const base = ds ? (editor ? `/s/${ds.meta.id}/editar` : `/s/${ds.meta.id}`) : "/"
  const ctx = useMemo(() => ds && ({ ds, tokens: tokens!, mode, editor, base, update, updateMany, dirty }), [ds, tokens, mode, editor, base, update, updateMany, dirty])

  if (!ds || !ctx) {
    return (
      <div className="mx-auto max-w-dialog p-inset-3xl">
        <EmptyState title="No encuentro este sistema" text="Puede que se haya borrado o que el enlace esté mal.">
          <Button asChild><Link to="/">Volver a la biblioteca</Link></Button>
        </EmptyState>
      </div>
    )
  }

  const switchMode = (toEditor: boolean) => {
    const rest = location.pathname.replace(/^\/s\/[^/]+(\/editar)?/, "")
    navigate(`/s/${ds.meta.id}${toEditor ? "/editar" : ""}${rest}`)
  }

  const match = (label: string) => !q || label.toLowerCase().includes(q.toLowerCase())
  const own = customFor(ds.meta.id).map((c) => ({ slug: c.slug, label: c.label, ready: true }))
  const comps = [{ group: "Propios", items: own }, ...COMPONENT_GROUPS].map((g) => ({ ...g, items: g.items.filter((i) => match(i.label)) })).filter((g) => g.items.length)
  const founds = FOUNDATIONS.filter((f) => match(f.label))

  return (
    <Ctx.Provider value={ctx}>
      {connect.dialog}
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="flex h-header shrink-0 items-center gap-gap-md border-b-thin px-inset-lg">
          <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft />Biblioteca</Link></Button>
          <div className="h-icon-lg w-thin bg-border" />
          <span className="font-strong">{ds.meta.name}</span>
          <div className="flex-1" />
          <Tabs value={editor ? "editor" : "cliente"} onValueChange={(v) => switchMode(v === "editor")}>
            <TabsList>
              <TabsTrigger value="cliente"><Eye />Modo cliente</TabsTrigger>
              <TabsTrigger value="editor"><Pencil />Modo editor</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setMode(mode === "light" ? "dark" : "light")} aria-label="Cambiar claro / oscuro">
                {mode === "light" ? <Moon /> : <Sun />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mode === "light" ? "Ver en oscuro" : "Ver en claro"}</TooltipContent>
          </Tooltip>
        </header>

        {editor && (
          <div className="flex shrink-0 flex-wrap items-center gap-gap-sm border-b-thin bg-muted px-inset-lg py-inset-sm text-ui">
            <Pencil className="size-icon-md" />
            <span className="font-emphasis">Modo editor</span>
            <span className="text-muted-foreground">
              {saving ? `${saving}…`
                : server ? "Los cambios se ven al momento. Pulsa Guardar para escribirlos en tu carpeta."
                : github ? "Los cambios se ven al momento. Pulsa Guardar para subirlos a tu repositorio de GitHub."
                : "Los cambios se ven al momento. Para guardarlos, abre la web con «Abrir el editor.bat»."}
            </span>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" disabled={pos === 0 || !!saving} onClick={() => setPos(pos - 1)}><Undo2 />Deshacer</Button>
            <Button size="sm" variant="ghost" disabled={pos >= history.length - 1 || !!saving} onClick={() => setPos(pos + 1)}><Redo2 />Rehacer</Button>
            <Button size="sm" variant="ghost" disabled={pos === 0 || !!saving} onClick={() => { setHistory([ds.tokens]); setPos(0) }}><RotateCcw />Descartar</Button>
            <Button size="sm" disabled={pos === 0 || !!saving} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <Save />}{saving ? "Guardando" : "Guardar"}</Button>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-sidebar shrink-0 flex-col border-r-thin">
            <div className="p-inset-md">
              <div className="relative">
                <Search className="absolute top-1/2 left-inset-sm size-icon-md -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="h-control-sm pl-inset-2xl" />
              </div>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <nav className="px-inset-md pb-inset-xl">
                {!q && <SideLink to={base} end><span className="flex items-center gap-gap-sm"><Home className="size-icon-md" />Inicio</span></SideLink>}
                {founds.length > 0 && <SideTitle icon={<Shapes className="size-icon-sm" />}>Fundamentos</SideTitle>}
                {founds.map((f) => <SideLink key={f.slug} to={`${base}/fundamentos/${f.slug}`}>{f.label}</SideLink>)}
                {comps.length > 0 && <SideTitle icon={<Puzzle className="size-icon-sm" />}>Componentes</SideTitle>}
                {!q && <SideLink to={`${base}/componentes`} end>Todos</SideLink>}
                {comps.map((g) => (
                  <div key={g.group}>
                    <div className="mt-gap-md px-inset-md pb-inset-2xs text-caption text-muted-foreground">{g.group}</div>
                    {g.items.map((i) => (
                      <SideLink key={i.slug} to={`${base}/componentes/${i.slug}`} disabled={!i.ready}>
                        {i.label}{!i.ready && <Soon step="1.3" />}
                      </SideLink>
                    ))}
                  </div>
                ))}
                {match("Patrones") && <><SideTitle icon={<LayoutGrid className="size-icon-sm" />}>Patrones</SideTitle>
                  <SideLink to={`${base}/patrones`}>Todos los patrones</SideLink></>}
                {match("Descargas") && <><SideTitle icon={<Download className="size-icon-sm" />}>Descargas</SideTitle>
                  <SideLink to={`${base}/descargas`}>Kit, Figma y Claude</SideLink></>}
                {q && !founds.length && !comps.length && !match("Patrones") && !match("Descargas") && (
                  <p className="px-inset-md py-inset-xl text-ui text-muted-foreground">Nada coincide con «{q}».</p>
                )}
              </nav>
            </ScrollArea>
          </aside>
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-content px-inset-2xl py-inset-3xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </Ctx.Provider>
  )
}
