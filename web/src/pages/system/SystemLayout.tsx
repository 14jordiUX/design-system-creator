import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ChevronRight, Menu, Smartphone, Download, Eye, Home, LayoutGrid, Moon, Pencil, Puzzle, Redo2, Save, Search, Shapes, Workflow, Sun, Undo2, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getSystem } from "@/lib/systems"
import { hasLocalServer, saveSystem } from "@/lib/localServer"
import { hostedRepo, saveSystemToGitHub } from "@/lib/github"
import { useGitHubConnect } from "@/components/app/github-connect"
import { setTokenValue, type Mode, type TokenFiles } from "@/lib/tokens"
import { useSystemTheme } from "@/lib/theme"
import { FOUNDATIONS, COMPONENT_GROUPS } from "@/lib/nav"
import { customFor } from "@/lib/custom"
import { patternsFor } from "@/lib/patterns"
import { prototypesFor } from "@/lib/prototypes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MOBILE_TESTS } from "@/lib/mobile-tests"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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

// Grupos de la barra lateral que se abren y se cierran. Lo que dejas abierto se recuerda en este navegador.
const OPEN_KEY = "dsc.barra.abiertos"
function readOpen(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(OPEN_KEY) || "{}") } catch { return {} }
}

function SideGroup({ title, icon, count, open, onOpenChange, children }: {
  title: string; icon: React.ReactNode; count?: number; open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="mt-gap-md">
      <CollapsibleTrigger className="group flex w-full items-center gap-gap-sm rounded-control px-inset-md py-inset-xs text-caption font-strong tracking-caps text-foreground uppercase transition-colors hover:bg-accent focus-visible:focus-ring">
        {icon}<span className="flex-1 text-left">{title}</span>
        {count !== undefined && <span className="font-normal text-muted-foreground">{count}</span>}
        <ChevronRight className="size-icon-sm text-muted-foreground transition-transform group-data-[state=open]:rotate-turn" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-inset-2xs">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function SideSubgroup({ title, count, open, onOpenChange, children }: {
  title: string; count: number; open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="group flex w-full items-center gap-gap-xs rounded-control px-inset-md py-inset-2xs text-caption text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:focus-ring">
        <ChevronRight className="size-icon-sm transition-transform group-data-[state=open]:rotate-turn" />
        <span className="flex-1 text-left">{title}</span><span>{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-inset-md border-l-thin pl-inset-2xs">{children}</CollapsibleContent>
    </Collapsible>
  )
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
  const [menu, setMenu] = useState(false)
  const [seenPath, setSeenPath] = useState("")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(readOpen)
  const setGroup = (key: string, open: boolean) => setOpenGroups((g) => {
    const next = { ...g, [key]: open }
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)) } catch { /* sin almacenamiento */ }
    return next
  })
  // En móvil el menú lateral es un panel: se cierra al cambiar de página
  useEffect(() => { setMenu(false) }, [location.pathname])
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
  const pats = patternsFor(ds.meta.id).filter((p) => match(p.meta.label))
  const protos = prototypesFor(ds.meta.id).filter((p) => match(p.meta.label))
  const mobiles = MOBILE_TESTS.filter((m) => match(m.label))

  // Qué grupo contiene la página abierta: ese siempre se ve abierto (y al buscar, todos)
  const here = location.pathname.slice(base.length)
  const hereComp = here.startsWith("/componentes/") ? comps.find((g) => g.items.some((i) => here === `/componentes/${i.slug}`))?.group : undefined
  const isHere = (key: string) =>
    key === "componentes/" + hereComp || key === "prototipos/movil" && here.startsWith("/prototipos") ||
    !key.includes("/") && (here === `/${key}` || here.startsWith(`/${key}/`))
  // Al llegar a una página, su grupo se abre (aunque lo hubieras cerrado antes)
  if (seenPath !== location.pathname) {
    setSeenPath(location.pathname)
    const keys = ["fundamentos", "componentes", "componentes/" + hereComp, "patrones", "prototipos", "prototipos/movil", "descargas"].filter(isHere)
    if (keys.some((k) => openGroups[k] === false)) keys.forEach((k) => setGroup(k, true))
  }
  const groupProps = (key: string) => ({
    open: !!q || (openGroups[key] ?? isHere(key)),
    onOpenChange: (o: boolean) => setGroup(key, o),
  })

  const sidebar = (
    <>
      <div className="p-inset-md">
        <div className="relative">
          <Search className="absolute top-1/2 left-inset-sm size-icon-md -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="h-control-sm pl-inset-2xl" />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav className="px-inset-md pb-inset-xl">
          {!q && <SideLink to={base} end><span className="flex items-center gap-gap-sm"><Home className="size-icon-md" />Inicio</span></SideLink>}
          {founds.length > 0 && (
            <SideGroup title="Fundamentos" icon={<Shapes className="size-icon-sm" />} count={founds.length} {...groupProps("fundamentos")}>
              {founds.map((f) => <SideLink key={f.slug} to={`${base}/fundamentos/${f.slug}`}>{f.label}</SideLink>)}
            </SideGroup>
          )}
          {comps.length > 0 && (
            <SideGroup title="Componentes" icon={<Puzzle className="size-icon-sm" />} count={comps.reduce((n, g) => n + g.items.length, 0)} {...groupProps("componentes")}>
              {!q && <SideLink to={`${base}/componentes`} end>Todos</SideLink>}
              {comps.map((g) => (
                <SideSubgroup key={g.group} title={g.group} count={g.items.length} {...groupProps(`componentes/${g.group}`)}>
                  {g.items.map((i) => (
                    <SideLink key={i.slug} to={`${base}/componentes/${i.slug}`} disabled={!i.ready}>
                      {i.label}{!i.ready && <Soon step="1.3" />}
                    </SideLink>
                  ))}
                </SideSubgroup>
              ))}
            </SideGroup>
          )}
          {(match("Patrones") || pats.length > 0) && (
            <SideGroup title="Patrones" icon={<LayoutGrid className="size-icon-sm" />} count={patternsFor(ds.meta.id).length} {...groupProps("patrones")}>
              <SideLink to={`${base}/patrones`} end>Todos los patrones</SideLink>
              {(match("Patrones") ? patternsFor(ds.meta.id) : pats).map((p) => <SideLink key={p.slug} to={`${base}/patrones/${p.slug}`}>{p.meta.label}</SideLink>)}
            </SideGroup>
          )}
          {(match("Prototipos") || protos.length > 0 || mobiles.length > 0) && (
            <SideGroup title="Prototipos" icon={<Workflow className="size-icon-sm" />} count={prototypesFor(ds.meta.id).length + MOBILE_TESTS.length} {...groupProps("prototipos")}>
              <SideLink to={`${base}/prototipos`} end>Todos los prototipos</SideLink>
              {(match("Prototipos") ? prototypesFor(ds.meta.id) : protos).map((p) => <SideLink key={p.slug} to={`${base}/prototipos/${p.slug}`}>{p.meta.label}</SideLink>)}
              {(match("Prototipos") ? MOBILE_TESTS : mobiles).length > 0 && (
                <SideSubgroup title="Para probar en el móvil" count={MOBILE_TESTS.length} {...groupProps("prototipos/movil")}>
                  {(match("Prototipos") ? MOBILE_TESTS : mobiles).map((m) => (
                    <SideLink key={m.exp + m.opt} to={`${base}/prototipos/movil/${m.exp}/${m.opt}`}>
                      <span className="flex items-center gap-gap-sm"><Smartphone className="size-icon-sm shrink-0" />{m.label}</span>
                    </SideLink>
                  ))}
                </SideSubgroup>
              )}
            </SideGroup>
          )}
          {match("Descargas") && (
            <SideGroup title="Descargas" icon={<Download className="size-icon-sm" />} {...groupProps("descargas")}>
              <SideLink to={`${base}/descargas`}>Kit, Figma y Claude</SideLink>
            </SideGroup>
          )}
          {q && !founds.length && !comps.length && !match("Patrones") && !pats.length && !match("Prototipos") && !protos.length && !mobiles.length && !match("Descargas") && (
            <p className="px-inset-md py-inset-xl text-ui text-muted-foreground">Nada coincide con «{q}».</p>
          )}
        </nav>
      </ScrollArea>
    </>
  )

  return (
    <Ctx.Provider value={ctx}>
      {connect.dialog}
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="flex h-header shrink-0 items-center gap-gap-sm border-b-thin px-inset-md md:gap-gap-md md:px-inset-lg">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenu(true)} aria-label="Abrir el menú"><Menu /></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/" aria-label="Biblioteca"><ArrowLeft /><span className="max-md:hidden">Biblioteca</span></Link></Button>
          <div className="h-icon-lg w-thin bg-border max-md:hidden" />
          <span className="truncate font-strong">{ds.meta.name}</span>
          <div className="flex-1" />
          <Tabs value={editor ? "editor" : "cliente"} onValueChange={(v) => switchMode(v === "editor")}>
            <TabsList>
              <TabsTrigger value="cliente" aria-label="Modo cliente"><Eye /><span className="max-md:hidden">Modo cliente</span></TabsTrigger>
              <TabsTrigger value="editor" aria-label="Modo editor"><Pencil /><span className="max-md:hidden">Modo editor</span></TabsTrigger>
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
            <span className="text-muted-foreground max-md:hidden">
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

        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent side="left" className="w-sidebar gap-0 p-0">
            <SheetHeader className="sr-only"><SheetTitle>Menú de {ds.meta.name}</SheetTitle><SheetDescription>Fundamentos, componentes, patrones y prototipos</SheetDescription></SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col pt-inset-2xl">{sidebar}</div>
          </SheetContent>
        </Sheet>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-sidebar shrink-0 flex-col border-r-thin lg:flex">
            {sidebar}
          </aside>
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-content px-inset-lg py-inset-xl md:px-inset-2xl md:py-inset-3xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </Ctx.Provider>
  )
}
