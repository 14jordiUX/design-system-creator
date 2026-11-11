// Sección «Laboratorio»: pruebas que todavía no están en ningún sistema (movimiento, material, estructura…).
// Jordi las prueba con cualquier sistema y marca cada una: Incluir, Descartar o Ajustar (con una nota).
// Las pruebas viven en ../laboratorio/laboratorio.json y las decisiones en ../laboratorio/decisiones.json.
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Check, FlaskConical, Loader2, Moon, Pencil, Save, Sun, X } from "lucide-react"
import { toast } from "sonner"
import lab from "../../../laboratorio/laboratorio.json"
import saved from "../../../laboratorio/decisiones.json"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { systems } from "@/lib/systems"
import { loadFonts, useSystemTheme } from "@/lib/theme"
import { commitFiles, hostedRepo, readFile } from "@/lib/github"
import { toFileText } from "@/lib/orderedJson"
import { useGitHubConnect } from "@/components/app/github-connect"
import type { Mode } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { PREVIEWS, type Option } from "./lab/previews"

type Experiment = { id: string; group: string; title: string; source: string; text: string; try: string; options: Option[] }
type State = "incluir" | "descartar" | "ajustar"
type Decision = { estado: State; opcion: string; nota?: string; fecha: string }
type Decisions = Record<string, Decision>

const EXPERIMENTS = lab.experiments as Experiment[]
const GROUPS = lab.groups as Record<string, string>
const LOCAL = "dsc.laboratorio.decisiones"
const SAVED = (saved as { decisiones: Decisions }).decisiones ?? {}
const PATH = "laboratorio/decisiones.json"

const STATES: { id: State; label: string; icon: typeof Check }[] = [
  { id: "incluir", label: "Incluir", icon: Check },
  { id: "ajustar", label: "Ajustar", icon: Pencil },
  { id: "descartar", label: "Descartar", icon: X },
]
const STATE_LABEL: Record<State, string> = { incluir: "Incluida", ajustar: "Por ajustar", descartar: "Descartada" }

function ExperimentCard({ exp, decision, onDecide }: { exp: Experiment; decision?: Decision; onDecide: (d: Decision | null) => void }) {
  const [optId, setOptId] = useState(decision?.opcion ?? exp.options[0].id)
  const option = exp.options.find((o) => o.id === optId) ?? exp.options[0]
  const Preview = PREVIEWS[exp.id]
  useEffect(() => { if (option.params?.font) loadFonts([option.params.font]) }, [option])
  const today = new Date().toISOString().slice(0, 10)

  const decide = (estado: State) => {
    if (decision?.estado === estado && decision.opcion === option.id) onDecide(null)
    else onDecide({ estado, opcion: option.id, nota: decision?.nota, fecha: today })
  }

  return (
    <article id={exp.id} className="flex flex-col gap-gap-md rounded-card border-thin bg-background p-inset-lg">
      <div className="flex flex-wrap items-start justify-between gap-gap-sm">
        <div className="min-w-0">
          <h3 className="text-lead font-strong">{exp.title}</h3>
          <p className="text-caption text-muted-foreground">Idea: {exp.source}</p>
        </div>
        {decision && (
          <Badge variant={decision.estado === "incluir" ? "default" : decision.estado === "descartar" ? "secondary" : "outline"}>
            {STATE_LABEL[decision.estado]} · {exp.options.find((o) => o.id === decision.opcion)?.label}
          </Badge>
        )}
      </div>
      <p className="text-ui text-muted-foreground">{exp.text}</p>

      <div className="flex flex-wrap gap-gap-xs" role="group" aria-label="Opciones">
        {exp.options.map((o) => (
          <Button key={o.id} size="sm" variant={o.id === option.id ? "default" : "outline"} aria-pressed={o.id === option.id} onClick={() => setOptId(o.id)}>{o.label}</Button>
        ))}
      </div>

      <div style={option.vars as CSSProperties}>{Preview ? <Preview option={option} /> : null}</div>
      <p className="text-caption text-muted-foreground">{exp.try}</p>

      <div className="mt-auto grid gap-gap-sm border-t-thin pt-inset-md">
        <div className="flex flex-wrap gap-gap-xs">
          {STATES.map(({ id, label, icon: Icon }) => {
            const on = decision?.estado === id && decision.opcion === option.id
            return (
              <Button key={id} size="sm" variant={on ? (id === "descartar" ? "secondary" : "default") : "outline"} aria-pressed={on} onClick={() => decide(id)}>
                <Icon />{label}{id !== "descartar" && <span className="max-sm:hidden">«{option.label}»</span>}
              </Button>
            )
          })}
        </div>
        {decision && (
          <Textarea value={decision.nota ?? ""} placeholder={decision.estado === "ajustar" ? "¿Qué cambiarías? Por ejemplo: rebote más corto, hover algo más rápido…" : "Nota (opcional)"}
            onChange={(e) => onDecide({ ...decision, nota: e.target.value, fecha: today })} />
        )}
      </div>
    </article>
  )
}

export default function Lab() {
  const [sysId, setSysId] = useState(systems.find((s) => s.meta.id === "base")?.meta.id ?? systems[0].meta.id)
  const [mode, setMode] = useState<Mode>("light")
  const sys = systems.find((s) => s.meta.id === sysId) ?? systems[0]
  useSystemTheme(sys.tokens, mode)

  const [decisions, setDecisions] = useState<Decisions>(() => {
    try { return { ...SAVED, ...JSON.parse(localStorage.getItem(LOCAL) ?? "{}") } } catch { return { ...SAVED } }
  })
  const [saving, setSaving] = useState(false)
  const { ask, dialog } = useGitHubConnect()
  const dirty = useMemo(() => JSON.stringify(decisions) !== JSON.stringify(SAVED), [decisions])

  const update = (id: string, d: Decision | null) => {
    setDecisions((prev) => {
      const next = { ...prev }
      if (d) next[id] = d; else delete next[id]
      localStorage.setItem(LOCAL, JSON.stringify(next))
      return next
    })
  }

  const save = async () => {
    if (!hostedRepo()) { toast.info("Tus decisiones quedan guardadas en este navegador. Para enviármelas, guárdalas desde la web publicada."); return }
    if (!(await ask())) return
    setSaving(true)
    try {
      const prevText = await readFile(PATH)
      const prev = prevText ? JSON.parse(prevText) : { $comment: (saved as any).$comment }
      await commitFiles([{ path: PATH, content: toFileText({ ...prev, decisiones: decisions }, prevText) }], "Laboratorio: decisiones de Jordi")
      localStorage.removeItem(LOCAL)
      toast.success("Decisiones guardadas. Ya puedo leerlas en GitHub.")
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const counts = STATES.map((s) => ({ ...s, n: Object.values(decisions).filter((d) => d.estado === s.id).length }))

  return (
    <div className="min-h-screen bg-subtle">
      <header className="sticky top-0 z-sticky border-b-thin bg-background">
        <div className="mx-auto flex min-h-header max-w-page flex-wrap items-center justify-between gap-gap-sm px-inset-xl py-inset-xs">
          <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft />Tus sistemas</Link></Button>
          <div className="flex flex-wrap items-center gap-gap-sm">
            <Select value={sysId} onValueChange={setSysId}>
              <SelectTrigger className="min-w-menu-wide" aria-label="Probar con el sistema"><SelectValue /></SelectTrigger>
              <SelectContent>{systems.map((s) => <SelectItem key={s.meta.id} value={s.meta.id}>Con {s.meta.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" aria-label={mode === "light" ? "Ver en oscuro" : "Ver en claro"} onClick={() => setMode(mode === "light" ? "dark" : "light")}>
              {mode === "light" ? <Moon /> : <Sun />}
            </Button>
            <Button disabled={!dirty || saving} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <Save />}Guardar decisiones</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-page px-inset-xl py-inset-3xl">
        <div className="mb-gap-2xl space-y-gap-sm">
          <h1 className="flex items-center gap-gap-sm text-h2 font-heavy tracking-heading"><FlaskConical className="size-icon-lg" />Laboratorio</h1>
          <p className="max-w-prose text-muted-foreground">
            Pruebas que todavía no están en ningún sistema. Elige una opción, pruébala con distintos sistemas y márcala:
            <b> Incluir</b> la convierte en una opción del generador, <b>Ajustar</b> me dice qué cambiar y <b>Descartar</b> la deja aquí como historial.
          </p>
          <div className="flex flex-wrap gap-gap-xs">
            {counts.map((c) => <Badge key={c.id} variant="secondary">{c.label}: {c.n}</Badge>)}
            <Badge variant="outline">Sin decidir: {EXPERIMENTS.length - Object.keys(decisions).length}</Badge>
          </div>
        </div>

        {Object.entries(GROUPS).map(([g, label]) => (
          <section key={g} className="mb-gap-4xl">
            <h2 className="mb-gap-lg text-title font-strong">{label}</h2>
            <div className="grid gap-gap-xl lg:grid-cols-2">
              {EXPERIMENTS.filter((e) => e.group === g).map((e) => (
                <ExperimentCard key={e.id} exp={e} decision={decisions[e.id]} onDecide={(d) => update(e.id, d)} />
              ))}
            </div>
          </section>
        ))}

        <p className="text-caption text-muted-foreground">¿Quieres probar otra idea? Pídemela en el chat y la añado aquí.</p>
      </main>
      {dialog}
    </div>
  )
}
