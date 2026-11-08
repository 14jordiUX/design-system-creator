import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, ArrowRight, Check, Loader2, Search, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { systems, type SystemMeta } from "@/lib/systems"
import { contrast, contrastReport, cssVars, type Mode } from "@/lib/tokens"
import { loadFonts } from "@/lib/theme"
import { brandScale, buildTokens, DEFAULT_ANSWERS, fromCharacter, readableOnWhite, slugify, STEPS as SCALE, type Answers } from "@/lib/generator"
import { GOOGLE_FONTS, type FontCategory } from "@/lib/fonts"
import { createSystem, hasLocalServer } from "@/lib/localServer"
import { createSystemOnGitHub, hostedRepo } from "@/lib/github"
import { useGitHubConnect } from "@/components/app/github-connect"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const STEPS = ["Identidad", "Carácter", "Color", "Tipografía", "Forma", "Espaciado", "Profundidad y movimiento", "Revisión"]
const BASE = systems.find((s) => s.meta.id === "base")!

/** Ficha del sistema (system.json) a partir de las respuestas. */
function metaFrom(a: Answers): Omit<SystemMeta, "id" | "createdAt" | "updatedAt"> {
  const tone = (v: number, lo: string, mid: string, hi: string) => (v < 34 ? lo : v > 66 ? hi : mid)
  return {
    name: a.name.trim(),
    description: a.description.trim() || `Sistema ${tone(a.sober, "sobrio", "equilibrado", "expresivo")} y ${tone(a.serious, "serio", "neutro", "cercano")}.`,
    productType: a.productType.trim(),
    origin: "cuestionario",
    principles: [
      { title: tone(a.sober, "Sobrio", "Equilibrado", "Expresivo"), text: tone(a.sober,
        "El color de marca se reserva para acciones principales; el resto, en neutros.",
        "La marca aparece en acciones y detalles; fondos y textos en neutros.",
        "La marca tiñe también los neutros y los titulares ganan peso.") },
      { title: tone(a.serious, "Serio", "Neutro", "Cercano"), text: `Esquinas de ${a.radius} px en controles y grises ${a.warmNeutral ? "cálidos" : "fríos"}.` },
      { title: tone(a.dense, "Denso", "Cómodo", "Espacioso"), text: `Rejilla de ${a.unit} px y escala tipográfica ${a.scale}.` },
    ],
    notes: {
      general: "Creado con el cuestionario. Ajusta lo que haga falta en el modo editor.",
      color: `Color de marca ${a.brand} (tono 600, el de los botones). La escala se genera en OKLCH.`,
      "tipografía": `${a.font} para todo.`,
    },
  }
}

export default function NewSystem() {
  const [step, setStep] = useState(0)
  const [a, setA] = useState<Answers>({ ...DEFAULT_ANSWERS, brand: BASE.tokens.primitives.color.brand["600"].$value })
  const set = (patch: Partial<Answers>) => setA((o) => ({ ...o, ...patch }))
  const [mode, setMode] = useState<Mode>("light")
  const [server, setServer] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)
  const github = !server && !!hostedRepo()
  const connect = useGitHubConnect()
  const navigate = useNavigate()

  useEffect(() => { hasLocalServer().then(setServer) }, [])
  useEffect(() => loadFonts([a.font]), [a.font])

  const tokens = useMemo(() => buildTokens(BASE.tokens, a), [a])
  const vars = useMemo(() => cssVars(tokens, mode), [tokens, mode])
  const report = useMemo(() => [...contrastReport(tokens, "light"), ...contrastReport(tokens, "dark").map((r) => ({ ...r, label: `${r.label} (oscuro)` }))], [tokens])
  const failing = report.filter((r) => !r.ok)
  const taken = systems.some((s) => s.meta.id === slugify(a.name))

  const create = async () => {
    if (!a.name.trim()) { setStep(0); toast.error("Ponle un nombre al sistema"); return }
    if (github) {
      if (!(await connect.ask())) return
      setCreating("Guardando en GitHub")
      try {
        const id = await createSystemOnGitHub({ ...metaFrom(a), id: slugify(a.name) }, tokens, a)
        toast.success(`«${a.name}» creado en GitHub`, { description: `Carpeta systems/${id}. Aparecerá en la biblioteca en 1 o 2 minutos, cuando la web se vuelva a publicar.`, duration: 10000 })
        navigate("/")
      } catch (e: any) {
        toast.error("No se ha podido crear", { description: String(e.message || e).slice(0, 300) })
      }
      setCreating(null)
      return
    }
    if (!server) {
      toast.info("Para crear el sistema, abre el editor", { description: "Haz doble clic en «Abrir el editor.bat» de tu carpeta y vuelve a hacer el cuestionario desde ahí." })
      return
    }
    setCreating("Creando la carpeta")
    try {
      const id = await createSystem({ ...metaFrom(a), id: slugify(a.name) }, tokens, a, setCreating)
      toast.success(`«${a.name}» creado`, { description: "Abro el sistema nuevo." })
      setTimeout(() => { window.location.hash = `#/s/${id}`; window.location.reload() }, 900)
    } catch (e: any) {
      setCreating(null)
      toast.error("No se ha podido crear", { description: String(e.message || e).slice(0, 300) })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-subtle">
      {connect.dialog}
      <header className="flex h-header items-center gap-gap-sm border-b-thin bg-background px-inset-md md:gap-gap-md md:px-inset-lg">
        <Button variant="ghost" size="sm" asChild><Link to="/" aria-label="Biblioteca"><ArrowLeft /><span className="max-md:hidden">Biblioteca</span></Link></Button>
        <div className="h-icon-lg w-thin bg-border max-md:hidden" />
        <span className="font-strong">Nuevo sistema</span>
        {!server && !github && <Badge variant="outline" className="max-md:hidden">Solo vista: para crearlo, abre «Abrir el editor.bat»</Badge>}
      </header>
      <div className="grid flex-1 lg:grid-cols-[var(--layout-sidebar)_1fr_1fr]">
        <ol className="space-y-gap-2xs border-r-thin bg-background p-inset-lg max-lg:hidden">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button onClick={() => setStep(i)} className={cn("flex w-full items-center gap-gap-md rounded-control px-inset-md py-inset-sm text-left text-ui",
                i === step ? "bg-accent font-emphasis" : "text-muted-foreground hover:bg-accent")}>
                <span className={cn("flex size-avatar-sm shrink-0 items-center justify-center rounded-pill border-thin text-caption",
                  i < step && "border-primary bg-primary text-primary-foreground", i === step && "border-primary")}>
                  {i < step ? <Check className="size-icon-sm" /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ol>

        <section className="space-y-gap-xl p-inset-2xl">
          <div>
            <p className="text-caption text-muted-foreground">Paso {step + 1} de {STEPS.length}</p>
            <h1 className="text-h3 font-heavy">{STEPS[step]}</h1>
            <p className="text-ui text-muted-foreground">{INTRO[step]}</p>
          </div>

          {step === 0 && <div className="space-y-gap-lg">
            <Field label="Nombre">
              <Input value={a.name} onChange={(e) => set({ name: e.target.value })} placeholder="Por ejemplo: Sereno" />
              {a.name.trim() && <p className="text-caption text-muted-foreground">Carpeta: <code className="font-code">systems/{slugify(a.name)}{taken ? "-2" : ""}</code>{taken && " (ya existe uno con ese nombre)"}</p>}
            </Field>
            <Field label="Descripción"><Textarea value={a.description} onChange={(e) => set({ description: e.target.value })} placeholder="Para qué es y qué tono tiene" /></Field>
            <Field label="Tipo de producto"><Input value={a.productType} onChange={(e) => set({ productType: e.target.value })} placeholder="Web, app, panel de gestión…" /></Field>
          </div>}

          {step === 1 && <div className="space-y-gap-xl">
            <Range label={["Sobrio", "Expresivo"]} value={a.sober} onChange={(v) => set(fromCharacter(a, "sober", v))} hint="Mueve sombras, velocidad, peso de titulares y cuánto se tiñen los grises." />
            <Range label={["Serio", "Cercano"]} value={a.serious} onChange={(v) => set(fromCharacter(a, "serious", v))} hint="Mueve el radio de las esquinas y la temperatura de los grises." />
            <Range label={["Denso", "Espacioso"]} value={a.dense} onChange={(v) => set(fromCharacter(a, "dense", v))} hint="Mueve el espaciado y la escala de tamaños de texto." />
            <Note>Estos tres deslizadores ajustan varios tokens a la vez. Luego puedes afinar cada cosa en los pasos siguientes.</Note>
          </div>}

          {step === 2 && <div className="space-y-gap-xl">
            <Field label="Color de marca">
              <div className="flex gap-gap-sm">
                <input type="color" value={a.brand} onChange={(e) => set({ brand: e.target.value })} className="h-control-md w-avatar-xl cursor-pointer rounded-control border-thin" />
                <Input defaultValue={a.brand} key={a.brand} onBlur={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && set({ brand: e.target.value.toLowerCase() })} className="w-field-xs font-code" />
              </div>
            </Field>
            <ScaleStrip label="Escala de marca" colors={brandScale(a.brand)} highlight={6} />
            <ScaleStrip label="Grises" colors={SCALE.map((k) => tokens.primitives.color.neutral[k].$value)} />
            <div className="flex items-center gap-gap-sm"><Switch checked={a.warmNeutral} onCheckedChange={(v) => set({ warmNeutral: v })} id="warm" /><Label htmlFor="warm">Grises cálidos</Label></div>
            <Note>Tu color queda tal cual como tono 600 (botones y enlaces). Los demás tonos se calculan en OKLCH para que la luminosidad suba y baje de forma pareja. Los colores de estado (éxito, aviso, error, info) se toman del sistema base.</Note>
          </div>}

          {step === 3 && <FontPicker value={a.font} onChange={(font) => set({ font })} scale={a.scale} onScale={(scale) => set({ scale })} />}

          {step === 4 && <div className="space-y-gap-xl">
            <Field label={`Radio de esquinas: ${a.radius} px`}><Slider min={0} max={24} value={[a.radius]} onValueChange={([v]) => set({ radius: v })} /></Field>
            <div className="flex flex-wrap gap-gap-md">
              {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((k) => (
                <div key={k} className="text-center text-caption text-muted-foreground">
                  <div className="mb-gap-2xs size-avatar-xl border-thin border-strong bg-muted" style={{ borderRadius: tokens.primitives.radius[k].$value }} />
                  {k} · {tokens.primitives.radius[k].$value}
                </div>
              ))}
            </div>
            <Field label={`Grosor de bordes: ${a.border} px`}><Slider min={1} max={3} value={[a.border]} onValueChange={([v]) => set({ border: v })} /></Field>
          </div>}

          {step === 5 && <div className="space-y-gap-xl">
            <Field label="Rejilla">
              <ToggleGroup type="single" variant="outline" value={a.unit} onValueChange={(v) => v && set({ unit: v as Answers["unit"] })}>
                <ToggleGroupItem value="4">4 px</ToggleGroupItem>
                <ToggleGroupItem value="8">8 px</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Range label={["Compacto", "Amplio"]} value={a.density} onChange={(v) => set({ density: v })} />
            <div className="space-y-gap-2xs">
              {["1", "2", "3", "4", "6", "8", "12", "16"].map((k) => (
                <div key={k} className="flex items-center gap-gap-md text-caption">
                  <span className="w-field-sm font-code text-muted-foreground">space.{k} · {tokens.primitives.space[k].$value}</span>
                  <div className="h-icon-sm rounded-fine bg-primary" style={{ width: tokens.primitives.space[k].$value }} />
                </div>
              ))}
            </div>
          </div>}

          {step === 6 && <div className="space-y-gap-xl">
            <Range label={["Sombras suaves", "Sombras marcadas"]} value={a.shadow} onChange={(v) => set({ shadow: v })} />
            <div className="flex flex-wrap gap-gap-lg">
              {(["sm", "md", "lg", "xl"] as const).map((k) => {
                const s = tokens.primitives.shadow[k].$value
                return <div key={k} className="flex size-avatar-2xl items-center justify-center rounded-card bg-background text-caption text-muted-foreground"
                  style={{ boxShadow: `${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color}` }}>{k}</div>
              })}
            </div>
            <Range label={["Animaciones rápidas", "Animaciones lentas"]} value={a.speed} onChange={(v) => set({ speed: v })}
              hint={`Rápida ${tokens.primitives.duration.fast.$value} · normal ${tokens.primitives.duration.normal.$value} · lenta ${tokens.primitives.duration.slow.$value}`} />
          </div>}

          {step === 7 && <div className="space-y-gap-lg">
            <dl className="grid grid-cols-2 gap-gap-sm rounded-card border-thin bg-background p-inset-lg text-ui">
              <dt className="text-muted-foreground">Nombre</dt><dd>{a.name || <span className="text-destructive">Falta el nombre</span>}</dd>
              <dt className="text-muted-foreground">Color de marca</dt><dd className="font-code">{a.brand}</dd>
              <dt className="text-muted-foreground">Grises</dt><dd>{a.warmNeutral ? "Cálidos" : "Fríos"}</dd>
              <dt className="text-muted-foreground">Fuente</dt><dd>{a.font} · escala {a.scale}</dd>
              <dt className="text-muted-foreground">Radio y borde</dt><dd>{a.radius} px · {a.border} px</dd>
              <dt className="text-muted-foreground">Rejilla</dt><dd>{a.unit} px · densidad {a.density}</dd>
            </dl>
            {failing.length === 0
              ? <Alert><Check /><AlertTitle>Contraste correcto</AlertTitle><AlertDescription>Los {report.length} pares de texto y fondo cumplen AA (4,5:1) en claro y en oscuro.</AlertDescription></Alert>
              : <Alert variant="destructive"><TriangleAlert /><AlertTitle>{failing.length} pares no llegan a 4,5:1</AlertTitle>
                  <AlertDescription>
                    <p>{failing.map((r) => `${r.label}: ${r.ratio?.toFixed(2)}:1`).join(" · ")}.</p>
                    {(contrast("#ffffff", a.brand) ?? 0) < 4.5
                      ? <Button size="sm" variant="outline" className="mt-gap-sm" onClick={() => set({ brand: readableOnWhite(a.brand, contrast) })}>Oscurecer la marca a {readableOnWhite(a.brand, contrast)}</Button>
                      : <p>Puedes crearlo igual y corregirlo en el modo editor.</p>}
                  </AlertDescription></Alert>}
            {creating && <p className="flex items-center gap-gap-sm text-ui text-muted-foreground"><Loader2 className="size-icon-md animate-spin" />{creating}…</p>}
          </div>}

          <div className="flex justify-between border-t-thin pt-inset-xl">
            <Button variant="outline" disabled={step === 0 || !!creating} onClick={() => setStep(step - 1)}><ArrowLeft />Anterior</Button>
            {step < STEPS.length - 1
              ? <Button onClick={() => setStep(step + 1)}>Siguiente<ArrowRight /></Button>
              : <Button disabled={!!creating} onClick={create}>{creating ? <Loader2 className="animate-spin" /> : <Check />}Crear sistema</Button>}
          </div>
        </section>

        <aside className="border-l-thin bg-background p-inset-2xl">
          <div className="mb-gap-lg flex items-center justify-between">
            <p className="text-caption font-emphasis tracking-caps text-muted-foreground uppercase">Vista previa en vivo</p>
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList><TabsTrigger value="light">Claro</TabsTrigger><TabsTrigger value="dark">Oscuro</TabsTrigger></TabsList>
            </Tabs>
          </div>
          <div style={vars as React.CSSProperties} className={cn("space-y-gap-lg rounded-card border-thin bg-background p-inset-xl font-base text-foreground", mode === "dark" && "dark")}>
            <h2 className="text-h2 font-heavy tracking-heading">{a.name || "Tu sistema"}</h2>
            <p className="text-ui text-muted-foreground">{a.description || "Así se verán tus componentes con las decisiones que tomes."}</p>
            <div className="flex flex-wrap gap-gap-sm"><Button>Principal</Button><Button variant="secondary">Secundario</Button><Button variant="outline">Borde</Button><Badge>Nuevo</Badge></div>
            <Card className="shadow-raised">
              <CardHeader><CardTitle>Tarjeta de ejemplo</CardTitle><CardDescription>Con campos de formulario</CardDescription></CardHeader>
              <CardContent className="space-y-gap-md">
                <div className="grid gap-gap-xs"><Label>Correo</Label><Input placeholder="nombre@correo.com" /></div>
                <div className="flex items-center gap-gap-sm"><Switch defaultChecked /><Label>Recordarme</Label></div>
              </CardContent>
              <CardFooter><Button className="w-full">Continuar</Button></CardFooter>
            </Card>
            <Alert><Check /><AlertTitle>Todo listo</AlertTitle><AlertDescription>Un aviso con el estilo del sistema.</AlertDescription></Alert>
          </div>
        </aside>
      </div>
    </div>
  )
}

const INTRO = [
  "Cómo se llama y para qué es. Solo el nombre es obligatorio.",
  "Tres decisiones de tono que ajustan muchas cosas a la vez.",
  "Elige un color de marca: el resto de tonos y los grises se calculan solos.",
  "La fuente principal y el tamaño general del texto.",
  "Las esquinas y el grosor de los bordes.",
  "Cuánto aire hay entre y dentro de los elementos.",
  "Sombras y velocidad de las animaciones.",
  "Repasa y crea. Se guarda en tu carpeta y aparece en la biblioteca.",
]

function FontPicker({ value, onChange, scale, onScale }: { value: string; onChange: (f: string) => void; scale: Answers["scale"]; onScale: (s: Answers["scale"]) => void }) {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<FontCategory | "Todas">("Todas")
  const list = GOOGLE_FONTS.filter((f) => (cat === "Todas" || f.category === cat) && f.family.toLowerCase().includes(q.toLowerCase()))
  useEffect(() => loadFonts(GOOGLE_FONTS.map((f) => f.family)), [])
  return (
    <div className="space-y-gap-lg">
      <Field label="Escala de tamaños">
        <ToggleGroup type="single" variant="outline" value={scale} onValueChange={(v) => v && onScale(v as Answers["scale"])}>
          <ToggleGroupItem value="compacta">Compacta</ToggleGroupItem>
          <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
          <ToggleGroupItem value="amplia">Amplia</ToggleGroupItem>
        </ToggleGroup>
      </Field>
      <Field label={`Fuente principal: ${value}`}>
        <div className="flex flex-wrap gap-gap-sm">
          <div className="relative min-w-field-sm flex-1">
            <Search className="absolute top-1/2 left-inset-sm size-icon-md -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en Google Fonts" className="pl-inset-2xl" />
          </div>
          <Select value={cat} onValueChange={(v) => setCat(v as any)}>
            <SelectTrigger className="w-field-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["Todas", "Sans", "Serif", "Display", "Mono"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Field>
      <div className="grid max-h-dialog grid-cols-2 gap-gap-sm overflow-y-auto">
        {list.map((f) => (
          <button key={f.family} onClick={() => onChange(f.family)}
            className={cn("rounded-control border-thin p-inset-md text-left transition-colors hover:bg-accent", value === f.family && "border-primary bg-accent")}>
            <div className="text-title" style={{ fontFamily: `"${f.family}"` }}>Aa Bb 123</div>
            <div className="text-caption font-emphasis">{f.family}</div>
            <div className="text-caption text-muted-foreground">{f.note ?? f.category}</div>
          </button>
        ))}
        {!list.length && <p className="col-span-2 text-ui text-muted-foreground">Ninguna fuente coincide con «{q}».</p>}
      </div>
    </div>
  )
}

function ScaleStrip({ label, colors, highlight }: { label: string; colors: string[]; highlight?: number }) {
  return (
    <div>
      <Label className="mb-gap-sm block">{label}</Label>
      <div className="flex overflow-hidden rounded-control">
        {colors.map((c, i) => (
          <div key={i} className="flex h-control-lg flex-1 items-end justify-center pb-inset-2xs text-caption" style={{ background: c, color: i < 5 ? colors[10] : colors[0] }} title={`${SCALE[i]} · ${c}`}>
            {i === highlight ? "●" : SCALE[i]}
          </div>
        ))}
      </div>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-gap-sm"><Label>{label}</Label>{children}</div>
}
function Range({ label, value, onChange, hint }: { label: [string, string]; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="space-y-gap-sm">
      <div className="flex justify-between text-ui"><span>{label[0]}</span><span>{label[1]}</span></div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} max={100} />
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}
function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-control bg-muted px-inset-md py-inset-sm text-caption text-muted-foreground">{children}</p>
}
