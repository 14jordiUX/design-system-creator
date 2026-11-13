// Prototipos: flujos de varias pantallas que se pueden clicar (probar, test con usuarios y presentar).
// Toda la pantalla del prototipo sale del sistema que se está viendo: si cambias de sistema, el mismo flujo cambia de look.
import { Component as ReactComponent, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toBlob } from "html-to-image"
import { strToU8, zipSync } from "fflate"
import { toast } from "sonner"
import {
  ArrowLeft, BadgeCheck, Check, Code2, Copy, Download, ExternalLink, PenTool, Image as ImageIcon, Puzzle, Lightbulb, Loader2, Map as MapIcon, Monitor, MousePointerClick,
  Presentation, RotateCcw, Share2, Smartphone, Workflow,
  Plus as PlusIcon, ArrowRight as ArrowRightIcon,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EmptyState, PageHeader, Section } from "@/components/app/common"
import { getSystem, systems } from "@/lib/systems"
import { useSystemTheme } from "@/lib/theme"
import { prototypesFor, prototypeUrl, type Prototype } from "@/lib/prototypes"
import { cn } from "@/lib/utils"
import { buildFigmaBundle, buildFigmaExport, measureOpen, type FNode } from "@/lib/figma-export"
import type { TokenFiles } from "@/lib/tokens"
import pluginManifest from "../../../../figma-plugin/manifest.json?raw"
import pluginCode from "../../../../figma-plugin/code.js?raw"
import pluginUi from "../../../../figma-plugin/ui.html?raw"
import { useDS } from "./context"
import { InstallCommand, installCommand, siteUrl } from "@/components/app/install"
import { CodeBlock } from "./Components"
import { DEMOS } from "./demos"
import { ALL_COMPONENTS } from "@/lib/nav"
import { customFor } from "@/lib/custom"
import { QrButton } from "@/components/app/qr-button"
import { MOBILE_TESTS, mobileTestPath } from "@/lib/mobile-tests"

export default function Prototypes() {
  const { ds, mode, tokens } = useDS()
  const list = prototypesFor(ds.meta.id)
  return (
    <div>
      <PageHeader eyebrow="Prototipos" title="Prototipos"
        description="Flujos de varias pantallas que se pueden clicar, hechos solo con los componentes y tokens del sistema. Pruébalos, pásalos a usuarios con un enlace o descarga las pantallas para tu presentación." />
      {list.length ? (
        <div className="grid gap-gap-lg md:grid-cols-2">
          {list.map((p) => (
            <Link key={p.slug} to={p.slug} className="rounded-card border-thin p-inset-lg transition-colors hover:bg-subtle focus-visible:focus-ring">
              <div className="mb-gap-xs flex items-center gap-gap-sm text-body font-strong">
                <Workflow className="size-icon-md text-primary" />{p.meta.label}
                {p.dev && <Badge variant="secondary" className="ml-auto"><BadgeCheck />Validado</Badge>}
              </div>
              <p className="text-ui text-muted-foreground">{p.meta.description}</p>
              <p className="mt-gap-sm text-caption text-muted-foreground">{p.meta.screens.length} pantallas</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Workflow className="size-icon-lg" />} title="No hay prototipos todavía" />
      )}
      <MobilePrototypes systemId={ds.meta.id} systemName={ds.meta.name} mode={mode} />
      <AllToFigma list={list} tokens={tokens} system={{ id: ds.meta.id, name: ds.meta.name }} mode={mode} />
      <Alert className="mt-gap-2xl">
        <Lightbulb />
        <AlertTitle>¿Quieres otro flujo?</AlertTitle>
        <AlertDescription>
          Pídemelo en el chat del proyecto, por ejemplo: «maqueta el flujo de registro con {ds.meta.name}» o «en el login quita el paso del código».
          Lo monto solo con este sistema y aparece aquí.
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Prototipos de móvil que vienen del Laboratorio: se abren a pantalla completa en el teléfono (con enlace o con QR).
const MOBILE = MOBILE_TESTS

function MobilePrototypes({ systemId, systemName, mode }: { systemId: string; systemName: string; mode: "light" | "dark" }) {
  if (!MOBILE.length) return null
  return (
    <div className="mt-gap-2xl">
    <Section title="Para probar en el móvil" description={`Se abren a pantalla completa en el teléfono, con ${systemName}. Escanea el QR con la cámara o abre el enlace.`}>
      <div className="grid gap-gap-lg md:grid-cols-2">
        {MOBILE.map((m) => {
          const path = mobileTestPath(m, systemId, mode)
          return (
            <div key={m.exp + m.opt} className="flex flex-col rounded-card border-thin p-inset-lg">
              <Link to={`movil/${m.exp}/${m.opt}`} className="mb-gap-xs flex items-center gap-gap-sm rounded-control text-body font-strong hover:underline focus-visible:focus-ring">
                <Smartphone className="size-icon-md text-primary" />{m.label}
              </Link>
              <p className="text-ui text-muted-foreground">{m.description}</p>
              <div className="mt-auto flex flex-wrap gap-gap-sm pt-inset-md">
                <QrButton url={`${siteUrl()}/#${path}`} title={`${m.label} · ${systemName}`} />
                <Button variant="outline" size="sm" asChild>
                  <Link to={path} target="_blank"><ExternalLink />Abrir</Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
    </div>
  )
}

/** Página de una prueba de móvil dentro de la web: vista previa en un marco de teléfono, QR y enlace a pantalla completa. */
export function MobileTestPage() {
  const { ds, mode, base } = useDS()
  const { exp, opt } = useParams()
  const m = MOBILE_TESTS.find((t) => t.exp === exp && t.opt === opt)
  if (!m) {
    return (
      <EmptyState icon={<Smartphone className="size-icon-lg" />} title="No encuentro esta prueba" text="Puede que se haya quitado de la lista.">
        <Button asChild><Link to={`${base}/prototipos`}>Ver todos los prototipos</Link></Button>
      </EmptyState>
    )
  }
  const path = mobileTestPath(m, ds.meta.id, mode)
  return (
    <div>
      <PageHeader eyebrow="Prototipos · Para probar en el móvil" title={m.label} description={m.description} />
      <div className="mb-gap-xl flex flex-wrap gap-gap-sm">
        <QrButton size="default" url={`${siteUrl()}/#${path}`} title={`${m.label} · ${ds.meta.name}`} />
        <Button variant="outline" asChild><Link to={path} target="_blank"><ExternalLink />Abrir a pantalla completa</Link></Button>
      </div>
      <p className="mb-gap-md text-ui text-muted-foreground">
        Vista previa: se usa con el ratón. Los gestos del dedo (como el arco del pulgar) solo funcionan de verdad en el teléfono.
      </p>
      <Frame view="mobile" className="mx-auto overflow-hidden">
        <iframe key={path} src={`${location.pathname}#${path}`} title={`${m.label} · ${ds.meta.name}`} className="size-full border-0" />
      </Frame>
    </div>
  )
}

/** Recorre el flujo: recuerda el camino para poder volver atrás. */
function usePlayer(p: Prototype, start?: string) {
  const first = p.meta.screens.some((s) => s.id === start) ? start! : p.meta.screens[0].id
  const [path, setPath] = useState([first])
  const screen = path[path.length - 1]
  return {
    screen,
    go: (id: string) => setPath((h) => (h[h.length - 1] === id ? h : [...h, id])),
    back: () => setPath((h) => (h.length > 1 ? h.slice(0, -1) : h)),
    canBack: path.length > 1,
    restart: (id = p.meta.screens[0].id) => setPath([id]),
  }
}

export function PrototypePage() {
  const { slug } = useParams()
  const { ds, mode, editor, tokens } = useDS()
  const navigate = useNavigate()
  const p = prototypesFor(ds.meta.id).find((x) => x.slug === slug)
  const [view, setView] = useState("mobile")
  const [tab, setTab] = useState("probar")
  if (!p) return <EmptyState title="Este prototipo no existe" />
  const others = systems.filter((s) => prototypesFor(s.meta.id).some((x) => x.slug === p.slug))
  return (
    <div>
      <PageHeader eyebrow="Prototipos" title={p.meta.label} description={p.meta.description}
        actions={
          <div className="flex flex-wrap items-center gap-gap-sm">
            {p.dev && <Badge variant="secondary"><BadgeCheck />Validado{p.dev.validated ? ` · ${p.dev.validated}` : ""}</Badge>}
            <Select value={ds.meta.id} onValueChange={(id) => navigate(`/s/${id}${editor ? "/editar" : ""}/prototipos/${p.slug}`)}>
              <SelectTrigger size="sm" aria-label="Ver con el sistema"><SelectValue /></SelectTrigger>
              <SelectContent>{others.map((s) => <SelectItem key={s.meta.id} value={s.meta.id}>Con {s.meta.name}</SelectItem>)}</SelectContent>
            </Select>
            <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v)}>
              <ToggleGroupItem value="mobile" aria-label="Móvil"><Smartphone />Móvil</ToggleGroupItem>
              <ToggleGroupItem value="desktop" aria-label="Escritorio"><Monitor />Escritorio</ToggleGroupItem>
            </ToggleGroup>
          </div>
        } />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-gap-lg">
          <TabsTrigger value="probar"><MousePointerClick />Probar</TabsTrigger>
          <TabsTrigger value="mapa"><MapIcon />Mapa</TabsTrigger>
          <TabsTrigger value="compartir"><Share2 />Compartir</TabsTrigger>
          {p.dev && <TabsTrigger value="desarrollo"><Code2 />Para desarrollo</TabsTrigger>}
        </TabsList>
        <TabsContent value="probar"><Try key={ds.meta.id + view} p={p} view={view} /></TabsContent>
        <TabsContent value="mapa"><FlowMap p={p} view={view} systemId={ds.meta.id} /></TabsContent>
        <TabsContent value="compartir">
          <Share p={p} systemId={ds.meta.id} systemName={ds.meta.name} mode={mode} view={view} />
          <ToFigma p={p} tokens={tokens} system={{ id: ds.meta.id, name: ds.meta.name }} mode={mode} view={view} />
        </TabsContent>
        {p.dev && <TabsContent value="desarrollo"><ForDev p={p} systemId={ds.meta.id} /></TabsContent>}
      </Tabs>
      <Section title="Código" description="Solo usa componentes del sistema (components/ui y components/custom) y clases de tokens. Está también en el kit, en prototypes/.">
        <CodeBlock code={p.source} />
      </Section>
    </div>
  )
}

function Frame({ view, children, className, ...props }: { view: string; children: React.ReactNode } & React.ComponentProps<"div">) {
  return (
    <div className={cn(view === "mobile"
      ? "h-desktop w-full max-w-sheet overflow-y-auto rounded-overlay border-thick shadow-overlay"
      : "h-desktop w-full overflow-y-auto rounded-card border-thin shadow-raised", className)} {...props}>
      {children}
    </div>
  )
}

function Try({ p, view }: { p: Prototype; view: string }) {
  const player = usePlayer(p)
  const index = p.meta.screens.findIndex((s) => s.id === player.screen)
  return (
    <div className="flex flex-col gap-gap-md">
      <div className="flex flex-wrap items-center gap-gap-sm">
        <Button size="sm" variant="outline" disabled={!player.canBack} onClick={player.back}><ArrowLeft />Atrás</Button>
        <Button size="sm" variant="outline" onClick={() => player.restart()}><RotateCcw />Empezar de nuevo</Button>
        <div className="flex-1" />
        <Label htmlFor="proto-screen" className="text-muted-foreground">Pantalla {index + 1} de {p.meta.screens.length}</Label>
        <Select value={player.screen} onValueChange={(id) => player.go(id)}>
          <SelectTrigger id="proto-screen" size="sm"><SelectValue /></SelectTrigger>
          <SelectContent>{p.meta.screens.map((s, i) => <SelectItem key={s.id} value={s.id}>{i + 1}. {s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Frame view={view} className={view === "mobile" ? "mx-auto" : ""}>
        <p.Component screen={player.screen} go={player.go} />
      </Frame>
      {p.meta.hints?.length ? (
        <ul className="mx-auto max-w-prose list-disc space-y-gap-2xs pl-inset-xl text-ui text-muted-foreground">
          {p.meta.hints.map((h) => <li key={h}>{h}</li>)}
        </ul>
      ) : null}
    </div>
  )
}

/** Flujo validado: lo que se lleva el desarrollo (comando de instalación, .zip y ficha de entrega). */
function ForDev({ p, systemId }: { p: Prototype; systemId: string }) {
  const dev = p.dev!
  const item = `flow-${p.slug}`
  const handoff = dev.handoff.replaceAll("{{URL}}", `${siteUrl()}/r/${systemId}/${item}.json`)
  const [file, setFile] = useState(dev.files.find((f) => f.name.endsWith(".tsx"))?.name ?? dev.files[0].name)
  const zip = () => {
    const files: Record<string, Uint8Array> = {}
    for (const f of dev.files) files[`${p.slug}/${f.name}`] = strToU8(f.name === "HANDOFF.md" ? handoff : f.code)
    download(`${systemId}-${p.slug}-desarrollo.zip`, new Blob([zipSync(files) as BlobPart], { type: "application/zip" }))
  }
  return (
    <div className="flex flex-col gap-gap-xl">
      <Alert>
        <BadgeCheck />
        <AlertTitle>Flujo validado{dev.validated ? ` el ${dev.validated}` : ""}</AlertTitle>
        <AlertDescription>
          Esta es la versión para producción: las mismas pantallas, sin datos de ejemplo. Reciben los datos por props y avisan de cada acción
          (entrar, enviar el código…) para que el desarrollo conecte su servidor. El prototipo de «Probar» se queda igual para seguir testeando.
        </AlertDescription>
      </Alert>
      <div className="flex flex-col gap-gap-sm">
        <h3 className="text-body font-strong">Instalar en un proyecto</h3>
        <p className="text-ui text-muted-foreground">Con un comando se instalan las pantallas en components/flows/{p.slug}/, los componentes que usan y el tema de este sistema.</p>
        <InstallCommand command={installCommand(systemId, [item])} />
        <div><Button variant="outline" size="sm" onClick={zip}><Download />Descargar .zip</Button></div>
      </div>
      <div className="flex flex-col gap-gap-sm">
        <h3 className="text-body font-strong">Ficha de entrega</h3>
        <div className="rounded-card border-thin bg-muted">
          <pre className="overflow-auto p-inset-lg font-code text-caption leading-prose whitespace-pre-wrap">{handoff}</pre>
        </div>
      </div>
      <div className="flex flex-col gap-gap-sm">
        <div className="flex flex-wrap items-center justify-between gap-gap-sm">
          <h3 className="text-body font-strong">Código</h3>
          <Select value={file} onValueChange={setFile}>
            <SelectTrigger size="sm" aria-label="Archivo"><SelectValue /></SelectTrigger>
            <SelectContent>{dev.files.filter((f) => f.name !== "HANDOFF.md").map((f) => <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="rounded-t-card border-thin border-b-0" />
        <CodeBlock code={dev.files.find((f) => f.name === file)?.code ?? ""} />
      </div>
    </div>
  )
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Imagen PNG (al doble de resolución, para que se vea nítida en las diapositivas) de una pantalla. */
async function capture(node: HTMLElement) {
  const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true })
  if (!blob) throw new Error("No se ha podido crear la imagen")
  return blob
}

function FlowMap({ p, view, systemId }: { p: Prototype; view: string; systemId: string }) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const name = (i: number, id: string) => `${systemId}-${p.slug}-${String(i + 1).padStart(2, "0")}-${id}.png`

  const one = async (id: string, i: number) => {
    const node = refs.current[id]
    if (!node) return
    setBusy(id)
    try { download(name(i, id), await capture(node)) }
    catch (e: any) { toast.error("No se ha podido descargar", { description: String(e.message || e) }) }
    setBusy(null)
  }
  const all = async () => {
    setBusy("all")
    try {
      const files: Record<string, Uint8Array> = {}
      for (const [i, s] of p.meta.screens.entries()) {
        const node = refs.current[s.id]
        if (node) files[name(i, s.id)] = new Uint8Array(await (await capture(node)).arrayBuffer())
      }
      download(`${systemId}-${p.slug}-pantallas.zip`, new Blob([zipSync(files) as BlobPart], { type: "application/zip" }))
    } catch (e: any) { toast.error("No se ha podido descargar", { description: String(e.message || e) }) }
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-gap-md">
        <p className="max-w-prose text-ui text-muted-foreground">
          Todas las pantallas del flujo, en orden. Descárgalas en PNG para ponerlas en tus diapositivas; salen con el sistema y el modo (claro u oscuro) que estás viendo.
        </p>
        <Button size="sm" onClick={all} disabled={!!busy}>{busy === "all" ? <Loader2 className="animate-spin" /> : <Download />}Descargar todas (.zip)</Button>
      </div>
      <div className="flex gap-gap-2xl overflow-x-auto pb-inset-lg">
        {p.meta.screens.map((s, i) => (
          <figure key={s.id} className={cn("flex shrink-0 flex-col gap-gap-sm", view === "mobile" ? "w-sheet" : "w-content")}>
            <figcaption className="flex items-center justify-between gap-gap-sm">
              <span className="text-ui font-strong">{i + 1}. {s.label}</span>
              <Button size="sm" variant="ghost" onClick={() => one(s.id, i)} disabled={!!busy}>
                {busy === s.id ? <Loader2 className="animate-spin" /> : <ImageIcon />}PNG
              </Button>
            </figcaption>
            {/* inert: en el mapa las pantallas son una foto, no se pueden clicar */}
            <div inert className="h-desktop overflow-hidden rounded-card border-thin shadow-raised">
              <div ref={(el) => { refs.current[s.id] = el }} className="h-full">
                <p.Component screen={s.id} go={() => {}} />
              </div>
            </div>
          </figure>
        ))}
      </div>
    </div>
  )
}

function CopyRow({ id, label, value }: { id: string; label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true); toast.success("Copiado")
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="flex flex-col gap-gap-xs">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-gap-sm">
        <Input id={id} readOnly value={value} onFocus={(e) => e.target.select()} className="font-code text-caption" />
        <Button variant="outline" onClick={copy}>{copied ? <Check /> : <Copy />}Copiar</Button>
      </div>
    </div>
  )
}

function Share({ p, systemId, systemName, mode, view }: { p: Prototype; systemId: string; systemName: string; mode: "light" | "dark"; view: string }) {
  const [start, setStart] = useState(p.meta.screens[0].id)
  const url = prototypeUrl(systemId, p.slug, { mode, screen: start === p.meta.screens[0].id ? undefined : start })
  // El tamaño del marco incrustado es el de un móvil o el de un escritorio, según la vista elegida arriba
  const embed = view === "mobile"
    ? `<iframe src="${url}" width="390" height="844" style="border:0" allow="clipboard-write" title="${p.meta.label} · ${systemName}"></iframe>`
    : `<iframe src="${url}" width="1280" height="800" style="border:0" allow="clipboard-write" title="${p.meta.label} · ${systemName}"></iframe>`
  return (
    <div className="grid gap-gap-2xl lg:grid-cols-2">
      <section className="flex flex-col gap-gap-md">
        <h3 className="flex items-center gap-gap-sm text-body font-strong"><Share2 className="size-icon-md text-primary" />Test con usuarios</h3>
        <p className="text-ui text-muted-foreground">
          Este enlace abre el prototipo a pantalla completa, sin el menú de esta web, con {systemName} en modo {mode === "dark" ? "oscuro" : "claro"}.
          Funciona en el ordenador y en el móvil, sin instalar nada.
        </p>
        <div className="flex flex-col gap-gap-xs">
          <Label htmlFor="proto-start">Empieza en</Label>
          <Select value={start} onValueChange={setStart}>
            <SelectTrigger id="proto-start" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{p.meta.screens.map((s, i) => <SelectItem key={s.id} value={s.id}>{i + 1}. {s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <CopyRow id="proto-url" label="Enlace" value={url} />
        <div className="flex flex-wrap gap-gap-sm">
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noreferrer"><ExternalLink />Abrir a pantalla completa</a>
          </Button>
          <QrButton size="default" url={url.replace(`${location.origin}${location.pathname}`, `${siteUrl()}/`)} title={`${p.meta.label} · ${systemName}`} />
        </div>
      </section>
      <section className="flex flex-col gap-gap-md">
        <h3 className="flex items-center gap-gap-sm text-body font-strong"><Presentation className="size-icon-md text-primary" />En una presentación</h3>
        <ul className="list-disc space-y-gap-xs pl-inset-xl text-ui text-muted-foreground">
          <li><span className="font-emphasis text-foreground">Imágenes:</span> en la pestaña «Mapa» descargas cada pantalla en PNG (o todas en un .zip). Sirven para PowerPoint, Keynote, Google Slides, Figma…</li>
          <li><span className="font-emphasis text-foreground">Prototipo vivo:</span> pega este código en las herramientas que aceptan incrustar webs (Notion, Pitch, una web propia…). Se puede clicar dentro de la diapositiva.</li>
          <li><span className="font-emphasis text-foreground">Enlace:</span> en cualquier presentación puedes poner el enlace de la izquierda en un botón o un texto.</li>
        </ul>
        <CopyRow id="proto-embed" label={`Código para incrustar (${view === "mobile" ? "tamaño móvil" : "tamaño escritorio"})`} value={embed} />
      </section>
    </div>
  )
}

/** Plugin de Figma (carpeta figma-plugin/ del proyecto) en un .zip, listo para «Importar desde manifiesto». */
function downloadPlugin() {
  const dir = "Plugin Design System Creator/"
  const zip = zipSync({ [dir + "manifest.json"]: strToU8(pluginManifest), [dir + "code.js"]: strToU8(pluginCode), [dir + "ui.html"]: strToU8(pluginUi) })
  download("Plugin Figma - Design System Creator.zip", new Blob([zip as BlobPart], { type: "application/zip" }))
}

/** Llevar a Figma: dibuja todas las pantallas fuera de la vista, las recorre y descarga el .json para el plugin. */
function ToFigma({ p, tokens, system, mode, view }: { p: Prototype; tokens: TokenFiles; system: { id: string; name: string }; mode: "light" | "dark"; view: string }) {
  const [busy, setBusy] = useState(false)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  useEffect(() => {
    if (!busy) return
    let cancel = false
    ;(async () => {
      await document.fonts.ready
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      if (cancel) return
      try {
        const data = buildFigmaExport({
          tokens, mode, system, view: view === "mobile" ? "mobile" : "desktop",
          prototype: { slug: p.slug, label: p.meta.label, description: p.meta.description, links: p.meta.links },
          screens: p.meta.screens.map((s) => ({ id: s.id, label: s.label, el: refs.current[s.id]! })).filter((s) => s.el),
        })
        download(`figma-${system.id}-${p.slug}.json`, new Blob([JSON.stringify(data)], { type: "application/json" }))
        toast.success("Archivo para Figma descargado", { description: "Ábrelo con el plugin «Design System Creator» en Figma." })
      } catch (e: any) {
        toast.error("No se ha podido preparar el archivo", { description: String(e.message || e) })
      }
      setBusy(false)
    })()
    return () => { cancel = true }
  }, [busy, tokens, mode, system, view, p])

  return (
    <section className="mt-gap-2xl flex flex-col gap-gap-md rounded-card border-thin p-inset-lg">
      <h3 className="flex items-center gap-gap-sm text-body font-strong"><PenTool className="size-icon-md text-primary" />Llevar a Figma</h3>
      <p className="max-w-prose text-ui text-muted-foreground">
        Dibuja este flujo en un archivo de Figma con componentes de verdad (con sus variantes) y los tokens como variables, todo enlazado.
        Cámbialo allí y, con el mismo plugin, exporta tus cambios para que los pase al código.
      </p>
      <ol className="list-decimal space-y-gap-xs pl-inset-xl text-ui text-muted-foreground">
        <li><span className="font-emphasis text-foreground">Solo la primera vez:</span> descarga el plugin y descomprímelo. En Figma de escritorio, abre un archivo y ve a <span className="font-emphasis text-foreground">Plugins → Desarrollo → Importar plugin desde manifiesto…</span> y elige el <span className="font-code">manifest.json</span> de la carpeta «Plugin Design System Creator».</li>
        <li>Descarga el archivo del flujo. Sale con {system.name}, en modo {mode === "dark" ? "oscuro" : "claro"} y en tamaño {view === "mobile" ? "móvil" : "escritorio"} (lo que tienes elegido arriba).</li>
        <li>En Figma: <span className="font-emphasis text-foreground">Plugins → Desarrollo → Design System Creator</span>, suelta el archivo y pulsa «Dibujar en Figma».</li>
        <li>Cuando lo hayas cambiado, en el plugin pulsa «Exportar cambios» y súbeme ese archivo al chat (o pásame el enlace del archivo de Figma).</li>
      </ol>
      <div className="flex flex-wrap gap-gap-sm">
        <Button onClick={() => setBusy(true)} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />}Descargar el flujo para Figma</Button>
        <Button variant="outline" onClick={downloadPlugin}><Puzzle />Descargar el plugin</Button>
      </div>
      {busy && (
        // Las pantallas se dibujan fuera de la vista para medirlas tal cual se ven
        <div inert aria-hidden className="pointer-events-none fixed top-0 left-full flex gap-gap-2xl">
          {p.meta.screens.map((s) => (
            <div key={s.id} ref={(el) => { refs.current[s.id] = el }} className={cn("h-desktop shrink-0 overflow-hidden", view === "mobile" ? "w-sheet" : "w-content")}>
              <p.Component screen={s.id} go={() => {}} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/** El catálogo: cada componente (de shadcn/ui y propios) con todos sus ejemplos, como una «pantalla» por componente. */
function catalogFor(systemId: string) {
  const ui = ALL_COMPONENTS.filter((c) => DEMOS[c.slug]).map((c) => ({ slug: c.slug, label: c.label, group: c.group, description: DEMOS[c.slug].description, examples: DEMOS[c.slug].examples }))
  const own = customFor(systemId).map((c) => ({ slug: c.slug, label: c.label, group: "Propios", description: c.demo.description, examples: c.demo.examples }))
  return [...ui, ...own]
}

const VIEWS = ["mobile", "desktop"] as const

/** Si un ejemplo falla al dibujarse, se salta (el resto del catálogo sigue). */
class Safe extends ReactComponent<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

/** Todo el sistema para Figma en un solo archivo: tokens, el catálogo de componentes y todos los flujos. */
// Piezas que se abren encima (diálogos, menús, paneles…): para el catálogo de Figma se abren un momento, se miden y se cierran.
// Cómo se abre cada una: con un clic, al pulsar (pointerdown), con el foco o con el menú contextual.
const OPENERS: Record<string, "click" | "press" | "focus" | "context"> = {
  dialog: "click", "alert-dialog": "click",
  sheet: "click", drawer: "click",
  popover: "click", "dropdown-menu": "press",
  menubar: "press", tooltip: "focus",
  "hover-card": "focus", "context-menu": "context",
}
const OPEN_CONTENT = ["dialog-content", "alert-dialog-content", "sheet-content", "drawer-content", "popover-content", "dropdown-menu-content",
  "menubar-content", "tooltip-content", "hover-card-content", "context-menu-content"].map((x) => `[data-slot="${x}"]`).join(",")
const slugify = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function measureOpened(card: HTMLElement, slug: string, tokens: TokenFiles, mode: "light" | "dark"): Promise<FNode[]> {
  const how = OPENERS[slug]
  if (!how) return []
  const out: FNode[] = []
  const triggers = Array.from(card.querySelectorAll<HTMLElement>(`[data-slot="${slug}-trigger"]`)).slice(0, 2)
  for (const t of triggers) {
    const before = new Set(document.querySelectorAll(OPEN_CONTENT))
    try {
      if (how === "click") t.click()
      else if (how === "press") t.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }))
      else if (how === "focus") t.focus()
      else { const r = t.getBoundingClientRect(); t.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: r.left + 4, clientY: r.top + 4 })) }
      await wait(how === "focus" ? 900 : 450)
      const opened = Array.from(document.querySelectorAll<HTMLElement>(OPEN_CONTENT)).filter((x) => !before.has(x) && !card.contains(x))
      for (const el of opened) { const n = measureOpen(tokens, mode, el); if (n) out.push(n) }
    } finally {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
      t.blur()
      await wait(300)
    }
  }
  return out
}

/** Para Figma: todas las combinaciones del botón (variante × tamaño, normal y desactivado), aunque no salgan en los ejemplos.
 *  Van primero en su tarjeta: de aquí salen los componentes maestros (con los dos iconos, que en Figma son interruptores). */
const BTN_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const
const BTN_SIZES = ["xs", "sm", "default", "lg"] as const
const BTN_ICON_SIZES = ["xs", "sm", "", "lg"].map((s) => (s ? `icon-${s}` : "icon")) as ("icon")[]
function AllButtons() {
  return (
    <div className="flex flex-col gap-gap-sm">
      <p className="text-ui font-emphasis text-muted-foreground">Todas las variantes</p>
      <div className="flex flex-col gap-gap-md rounded-card border-thin p-inset-2xl">
        {BTN_VARIANTS.map((v) => [false, true].map((off) => (
          <div key={v + off} className="flex flex-wrap items-center gap-gap-md">
            {BTN_SIZES.map((s) => <Button key={s} variant={v} size={s} disabled={off}><PlusIcon />Botón<ArrowRightIcon /></Button>)}
            {BTN_ICON_SIZES.map((s) => <Button key={s} variant={v} size={s} disabled={off} aria-label="Añadir"><PlusIcon /></Button>)}
          </div>
        )))}
      </div>
    </div>
  )
}

function AllToFigma({ list, tokens, system, mode }: { list: Prototype[]; tokens: TokenFiles; system: { id: string; name: string }; mode: "light" | "dark" }) {
  const catalog = useMemo(() => catalogFor(system.id), [system.id])
  const [busy, setBusy] = useState(false)
  const holder = useRef<HTMLDivElement | null>(null)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  useEffect(() => {
    if (!busy) return
    let cancel = false
    ;(async () => {
      await document.fonts.ready
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      if (cancel) return
      try {
        // Lo que se abre encima se mide antes (de uno en uno); mientras, la zona oculta deja de estar inerte
        const open: Record<string, FNode[]> = {}
        if (holder.current) holder.current.inert = false
        for (const c of catalog) {
          const card = refs.current["catalogo|" + c.slug]
          if (card && OPENERS[c.slug]) open[c.slug] = await measureOpened(card, c.slug, tokens, mode)
          if (cancel) return
        }
        if (holder.current) holder.current.inert = true
        const data = buildFigmaBundle({
          tokens, mode, system, view: "desktop",
          flows: [
            // El catálogo, una página por grupo (como en el menú de la web: Acciones, Formularios, Propios…)
            ...[...new Set(catalog.map((c) => c.group))].map((g) => ({
              prototype: { slug: `catalogo-${slugify(g)}`, label: "Catálogo · " + g, description: `Componentes de «${g}» con sus variantes y estados.` },
              screens: catalog.filter((c) => c.group === g).map((c) => ({ id: c.slug, label: c.label, description: c.description, el: refs.current["catalogo|" + c.slug]!, open: open[c.slug] })).filter((s) => s.el),
            })),
            // Cada flujo dos veces: en móvil y en escritorio (cada uno en su página de Figma)
            ...list.flatMap((p) => VIEWS.map((v) => ({
              view: v,
              prototype: { slug: p.slug, label: p.meta.label, description: p.meta.description, links: p.meta.links },
              screens: p.meta.screens.map((s) => ({ id: s.id, label: s.label, el: refs.current[v + "|" + p.slug + "|" + s.id]! })).filter((s) => s.el),
            }))),
          ],
        })
        download(`figma-${system.id}-todo.json`, new Blob([JSON.stringify(data)], { type: "application/json" }))
        toast.success("Archivo para Figma descargado", { description: `${catalog.length} componentes y ${list.length} flujos con ${system.name}. Ábrelo con el plugin «Design System Creator».` })
      } catch (e: any) {
        toast.error("No se ha podido preparar el archivo", { description: String(e.message || e) })
      }
      setBusy(false)
    })()
    return () => { cancel = true }
  }, [busy, tokens, mode, system, list, catalog])

  return (
    <section className="mt-gap-2xl flex flex-col gap-gap-md rounded-card border-thin p-inset-lg">
      <h3 className="flex items-center gap-gap-sm text-body font-strong"><PenTool className="size-icon-md text-primary" />Todo {system.name} para Figma</h3>
      <p className="max-w-prose text-ui text-muted-foreground">
        Un solo archivo con todo: los tokens (como variables), el catálogo entero de componentes ({catalog.length}, con sus variantes y estados) y los {list.length} flujos.
        En el plugin, «Dibujar en Figma» lo dibuja todo (el catálogo y una página por flujo) y «Actualizar este archivo» lo pone al día.
        Cada flujo se puede descargar también por separado, en su pestaña Compartir.
      </p>
      <div className="flex flex-wrap items-center gap-gap-sm">
        <span className="text-caption text-muted-foreground">Los flujos van en móvil y en escritorio (cada tamaño en su página). Modo {mode === "dark" ? "oscuro" : "claro"}, el que tienes elegido arriba.</span>
      </div>
      <div className="flex flex-wrap gap-gap-sm">
        <Button onClick={() => { setBusy(true); toast("Preparando el archivo…", { description: "Verás abrirse y cerrarse un momento los diálogos y menús: los mido para Figma." }) }} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />}Descargar todo para Figma</Button>
        <Button variant="outline" onClick={downloadPlugin}><Puzzle />Descargar el plugin</Button>
      </div>
      {busy && (
        <div ref={holder} inert aria-hidden className="pointer-events-none fixed top-0 left-full flex items-start gap-gap-2xl">
          {catalog.map((c) => (
            <div key={"catalogo" + c.slug} ref={(el) => { refs.current["catalogo|" + c.slug] = el }} className="flex w-content shrink-0 flex-col gap-gap-xl bg-background p-inset-2xl">
              <div className="flex flex-col gap-gap-2xs">
                <p className="text-caption text-muted-foreground">{c.group}</p>
                <h2 className="text-h2">{c.label}</h2>
              </div>
              {c.slug === "button" && <AllButtons />}
              {c.examples.map((ex) => (
                <div key={ex.title} className="flex flex-col gap-gap-sm">
                  <p className="text-ui font-emphasis text-muted-foreground">{ex.title}</p>
                  <div className="flex min-h-area-min items-center justify-center rounded-card border-thin p-inset-2xl"><Safe>{ex.render}</Safe></div>
                </div>
              ))}
            </div>
          ))}
          {VIEWS.flatMap((v) => list.flatMap((p) => p.meta.screens.map((s) => (
            <div key={v + p.slug + s.id} ref={(el) => { refs.current[v + "|" + p.slug + "|" + s.id] = el }} className={cn("h-desktop shrink-0 overflow-hidden", v === "mobile" ? "w-sheet" : "w-content")}>
              <p.Component screen={s.id} go={() => {}} />
            </div>
          ))))}
        </div>
      )}
    </section>
  )
}

/** El prototipo a pantalla completa, sin nada de la web alrededor: #/p/<sistema>/<prototipo>?pantalla=…&modo=oscuro */
export function PrototypeFullscreen() {
  const { id, slug } = useParams()
  const [q] = useSearchParams()
  const ds = getSystem(id)
  const p = useMemo(() => (ds ? prototypesFor(ds.meta.id).find((x) => x.slug === slug) : undefined), [ds, slug])
  if (!ds || !p) {
    return (
      <div className="mx-auto max-w-dialog p-inset-3xl">
        <EmptyState title="Este prototipo no existe" text="Puede que el enlace esté mal o que se haya quitado." />
      </div>
    )
  }
  return <Fullscreen key={ds.meta.id + p.slug} ds={ds} p={p} mode={q.get("modo") === "oscuro" ? "dark" : "light"} start={q.get("pantalla") ?? undefined} />
}

function Fullscreen({ ds, p, mode, start }: { ds: NonNullable<ReturnType<typeof getSystem>>; p: Prototype; mode: "light" | "dark"; start?: string }) {
  useSystemTheme(ds.tokens, mode)
  const player = usePlayer(p, start)
  return (
    <div className="h-dvh w-full overflow-y-auto bg-background text-foreground">
      <p.Component screen={player.screen} go={player.go} />
    </div>
  )
}
