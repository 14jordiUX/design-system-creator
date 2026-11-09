import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { AlertTriangle, Check, CheckCircle2, Play, Sparkles } from "lucide-react"
import { aliasOf, contrast, contrastReport, flatten, getAt, resolve, tableFor, toCss, type FlatToken } from "@/lib/tokens"
import { FOUNDATIONS } from "@/lib/nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { anchorOf, scaleFrom } from "@/lib/generator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Code, EmptyState, PageHeader, Section } from "@/components/app/common"
import { useDS } from "./context"
import TokenStructurePage from "./TokenStructure"

const INTRO: Record<string, string> = {
  estructura: "Cómo están construidos los tokens de este sistema: las capas, la norma de nombres con ejemplos reales y la lista completa con a qué apunta cada uno.",
  color: "Escalas de color en bruto (primitivos) y los roles que las usan (semánticos). Los componentes solo usan los semánticos.",
  tipografia: "Familias tipográficas y los estilos de texto del sistema.",
  espaciado: "Escala de espaciado (base 4 px) y los espacios de uso para rellenos y separaciones.",
  radios: "Redondeo de esquinas: la escala y a qué elementos se aplica cada radio.",
  elevacion: "Sombras para dar profundidad a tarjetas, menús y modales.",
  movimiento: "Duraciones y curvas de las animaciones.",
}

function useResolved() {
  const { tokens, mode } = useDS()
  return useMemo(() => {
    const table = tableFor(tokens, mode)
    return { table, val: (p: string) => resolve(table[p]?.value, table) }
  }, [tokens, mode])
}

function group(flat: Record<string, FlatToken>, prefix: string) {
  return Object.values(flat).filter((t) => t.path.startsWith(prefix + "."))
}

// ---------- Color ----------
function ColorSwatch({ path, hex, editable, anchor }: { path: string; hex: string; editable: boolean; anchor?: boolean }) {
  const { update } = useDS()
  const step = path.split(".").pop()
  return (
    <label className={cn("group relative block min-w-0 flex-1", editable && "cursor-pointer")}>
      <div className={cn("checker h-header overflow-hidden rounded-control border-thin", anchor && "focus-ring")}>
        <div className="size-full" style={{ background: hex }} />
      </div>
      <div className="mt-gap-2xs text-caption font-emphasis">{step}{anchor && <span className="text-muted-foreground"> · principal</span>}</div>
      <div className="truncate font-code text-caption text-muted-foreground">{hex}</div>
      {editable && <input type="color" value={hex.slice(0, 7)} onChange={(e) => update("primitives", path, e.target.value)}
        className="absolute inset-0 h-header w-full cursor-pointer opacity-0" aria-label={`Cambiar ${path}`} />}
    </label>
  )
}

/** Color principal de una escala: al cambiarlo se regeneran los 11 tonos al momento. */
function ScaleBase({ scale }: { scale: string }) {
  const { tokens, updateMany } = useDS()
  const anchor = anchorOf(scale)
  const hex: string = tokens.primitives.color[scale][anchor].$value
  const apply = (value: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return
    const steps = Object.keys(tokens.primitives.color[scale]).filter((k) => !k.startsWith("$"))
    const colors = scaleFrom(scale, value.toLowerCase())
    updateMany(steps.map((st, i) => ["primitives", `color.${scale}.${st}`, colors[i]] as [any, string, string]), `scale:${scale}`)
  }
  return (
    <div className="flex items-center gap-gap-sm">
      <label className="relative block size-control-md shrink-0 cursor-pointer overflow-hidden rounded-control border-thin" title="Cambiar el color principal">
        <div className="size-full" style={{ background: hex }} />
        <input type="color" value={hex.slice(0, 7)} onChange={(e) => apply(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={`Color principal de ${scale}`} />
      </label>
      <Input key={hex} defaultValue={hex} onBlur={(e) => apply(e.target.value.trim())} onKeyDown={(e) => e.key === "Enter" && apply((e.target as HTMLInputElement).value.trim())}
        className="h-control-sm w-field-xs font-code text-caption" aria-label={`Valor del color principal de ${scale}`} />
    </div>
  )
}


// ---------- Arreglar un contraste ----------
type Report = ReturnType<typeof contrastReport>[number]
const short = (p: string) => p.replace(/^color\./, "")

/** Tonos entre los que se puede elegir para un rol: los de su misma escala (o blanco, negro y grises). */
function candidates(tokens: any, alias: string): string[] {
  const scale = alias.split(".")[1]
  const steps = (s: string) => Object.keys(tokens.primitives.color[s] ?? {}).filter((k) => !k.startsWith("$")).map((k) => `color.${s}.${k}`)
  return tokens.primitives.color[scale]?.$value !== undefined ? ["color.white", ...steps("neutral"), "color.black"] : steps(scale)
}

function ContrastFix({ r, report }: { r: Report; report: Report[] }) {
  const { tokens, mode, updateMany } = useDS()
  const semFile = mode === "dark" ? "dark" : "light"
  const table = tableFor(tokens, mode)
  const hexOf = (p: string) => resolve(table[p]?.value, table)

  const all = ([["bg", r.bg, r.fgValue, "el fondo"], ["fg", r.fg, r.bgValue, "el texto"]] as const).flatMap(([side, token, other, what]) => {
    const alias = aliasOf(getAt(tokens[semFile], token)?.$value)
    if (!alias) return []
    const list = candidates(tokens, alias)
    const cur = list.indexOf(alias)
    const options = list.map((p, i) => {
      const hex = hexOf(p), ratio = contrast(side === "bg" ? other : hex, side === "bg" ? hex : other) ?? 0
      return { p, i, hex, ratio, ok: ratio >= 4.5, dist: Math.abs(i - cur) }
    })
    const shared = report.filter((o) => o.label !== r.label && (o.fg === token || o.bg === token)).map((o) => o.label)
    return [{ side, token, other, what, alias, cur, options, shared }]
  })
  // Solo se ofrecen los roles propios de este caso; los compartidos (p. ej. el fondo de la página) únicamente si no queda otro.
  const own = all.filter((s) => !s.shared.length)
  const sides = own.length ? own : all

  // Cambia solo este rol; si es el color «normal» de un botón o estado, sus variantes (encima, pulsado) se mueven igual.
  const apply = (token: string, alias: string, newAlias: string) => {
    const changes: [any, string, string][] = [[semFile, token, `{${newAlias}}`]]
    const [, scale, step] = alias.split("."), [, nScale, nStep] = newAlias.split(".")
    const parent = token.split(".").slice(0, -1).join(".")
    if (/\.(default|solid)$/.test(token) && scale === nScale) {
      const steps = Object.keys(tokens.primitives.color[scale]).filter((k) => !k.startsWith("$"))
      const delta = steps.indexOf(nStep) - steps.indexOf(step)
      for (const sib of ["hover", "active"]) {
        const a = aliasOf(getAt(tokens[semFile], `${parent}.${sib}`)?.$value)
        if (!a || a.split(".")[1] !== scale) continue
        const j = Math.min(steps.length - 1, Math.max(0, steps.indexOf(a.split(".")[2]) + delta))
        changes.push([semFile, `${parent}.${sib}`, `{color.${scale}.${steps[j]}}`])
      }
    }
    updateMany(changes)
  }

  // Recomendación: el cambio más pequeño que ya cumple, mejor en un rol que no compartan otros pares.
  const best = sides.flatMap((s) => s.options.filter((o) => o.ok).map((o) => ({ s, o, score: o.dist + (s.shared.length ? 3 : 0) })))
    .sort((a, b) => a.score - b.score || b.o.ratio - a.o.ratio)[0]

  return (
    <div className="mt-gap-md space-y-gap-lg border-t-thin pt-gap-md">
      {best ? (
        <div className="flex flex-wrap items-center gap-gap-sm text-ui">
          <Sparkles className="size-icon-md text-primary" />
          <span className="flex-1">Te recomiendo cambiar solo {best.s.what}{best.s.shared.length ? "" : " de este caso"}: <b className="font-code">{short(best.s.alias)}</b> → <b className="font-code">{short(best.o.p)}</b> ({best.o.ratio.toFixed(2)}:1).</span>
          <Button size="sm" onClick={() => apply(best.s.token, best.s.alias, best.o.p)}>Aplicar</Button>
        </div>
      ) : (
        <p className="text-ui text-muted-foreground">Ningún tono de estas escalas llega a 4,5:1. Prueba a cambiar el color principal de la escala.</p>
      )}
      {sides.map((s) => (
        <div key={s.side}>
          <div className="mb-gap-xs text-caption text-muted-foreground">
            O elige otro tono para {s.what} (<span className="font-code">{short(s.token)}</span>). Solo cambia este rol, no la escala ni los demás {s.side === "bg" ? "fondos" : "textos"}.
          </div>
          <div className="flex flex-wrap gap-gap-2xs">
            {s.options.map((o) => (
              <button key={o.p} type="button" onClick={() => o.i !== s.cur && apply(s.token, s.alias, o.p)} title={`${short(o.p)} · ${o.ratio.toFixed(2)}:1`}
                className={cn("flex flex-col items-center gap-gap-3xs rounded-inner p-inset-3xs", o.i === s.cur ? "focus-ring" : "hover:bg-muted", !o.ok && "opacity-disabled")}>
                <span className="flex size-control-md items-center justify-center rounded-inner border-thin text-caption font-strong"
                  style={s.side === "bg" ? { background: o.hex, color: s.other } : { background: s.other, color: o.hex }}>Aa</span>
                <span className="font-code text-caption">{o.p.split(".").pop()}</span>
                <span className="flex items-center text-caption text-muted-foreground">{o.ok && <Check className="size-icon-sm" />}{o.ratio.toFixed(1)}</span>
              </button>
            ))}
          </div>
          {s.shared.length > 0 && <p className="mt-gap-xs text-caption text-danger-text">Ojo: este color también lo usa{s.shared.length > 1 ? "n" : ""} {s.shared.join(", ").toLowerCase()}.</p>}
        </div>
      ))}
    </div>
  )
}

function ColorPage() {
  const { tokens, editor, mode, update } = useDS()
  const [fine, setFine] = useState(false)
  const { val } = useResolved()
  const prim = flatten(tokens.primitives)
  const scales = Object.keys(tokens.primitives.color).filter((k) => !k.startsWith("$") && !tokens.primitives.color[k].$value)
  const colorOptions = Object.values(prim).filter((t) => t.type === "color").map((t) => t.path)
  const semFile = mode === "dark" ? "dark" : "light"
  const semantic = flatten(tokens[semFile])
  const groups = ["bg", "surface", "text", "border", "action", "feedback"]
  const report = contrastReport(tokens, mode)
  const fails = report.filter((r) => !r.ok)
  const GROUP_LABEL: Record<string, string> = { bg: "Fondos", surface: "Superficies", text: "Texto", border: "Bordes", action: "Acciones", feedback: "Estados" }

  return (
    <>
      <Section title="Primitivos" description={editor
        ? (fine ? "Ajuste fino: pulsa cualquier tono para cambiarlo a mano." : "Cambia el color principal de cada escala y el resto de tonos se genera solo, al momento.")
        : "Los valores en bruto. Cada escala va de 50 (más claro) a 950 (más oscuro)."}>
        {editor && (
          <div className="mb-gap-lg flex items-center gap-gap-sm text-ui">
            <Switch id="fine" checked={fine} onCheckedChange={setFine} />
            <Label htmlFor="fine">Ajuste fino (editar cada tono a mano)</Label>
          </div>
        )}
        <div className="space-y-gap-xl">
          {scales.map((s) => (
            <div key={s}>
              <div className="mb-gap-sm flex items-center justify-between gap-gap-md">
                <span className="text-ui font-emphasis capitalize">{s}</span>
                {editor && !fine && <ScaleBase scale={s} />}
              </div>
              <div className="flex gap-gap-xs">
                {Object.keys(tokens.primitives.color[s]).filter((k) => !k.startsWith("$")).map((step) => (
                  <ColorSwatch key={step} path={`color.${s}.${step}`} hex={tokens.primitives.color[s][step].$value}
                    editable={editor && fine} anchor={editor && !fine && step === anchorOf(s)} />
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-gap-xl text-ui">
            {["white", "black"].map((k) => (
              <div key={k} className="flex items-center gap-gap-sm"><div className="size-avatar-sm rounded-inner border-thin" style={{ background: tokens.primitives.color[k].$value }} />{k}</div>
            ))}
          </div>
        </div>
      </Section>

      <Section title={`Semánticos · modo ${mode === "dark" ? "oscuro" : "claro"}`}
        description={editor ? "Elige a qué primitivo apunta cada rol. Se edita por separado en claro y en oscuro (usa el botón de la luna)." : "Cada rol apunta a un primitivo. Cambia entre claro y oscuro con el botón de arriba."}>
        <div className="space-y-gap-2xl">
          {groups.map((g) => (
            <div key={g}>
              <h3 className="mb-gap-sm text-ui font-strong">{GROUP_LABEL[g]}</h3>
              <div className="[&>*+*]:border-t-thin rounded-card border-thin">
                {group(semantic, `color.${g}`).map((t) => {
                  const hex = val(t.path)
                  const alias = aliasOf(t.value)
                  return (
                    <div key={t.path} className="flex items-center gap-gap-lg px-inset-lg py-inset-sm">
                      <div className="checker size-control-md shrink-0 overflow-hidden rounded-control border-thin"><div className="size-full" style={{ background: hex }} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="font-code text-caption">{t.path.replace(/^color\./, "")}</div>
                        {t.description && <div className="text-caption text-muted-foreground">{t.description}</div>}
                      </div>
                      {editor && alias ? (
                        <select value={alias} onChange={(e) => update(semFile, t.path, `{${e.target.value}}`)}
                          className="h-control-sm rounded-control border-thin bg-background px-inset-sm font-code text-caption">
                          {colorOptions.map((o) => <option key={o} value={o}>{o.replace(/^color\./, "")}</option>)}
                        </select>
                      ) : (
                        <span className="font-code text-caption text-muted-foreground">{alias ? `→ ${alias.replace(/^color\./, "")}` : ""}</span>
                      )}
                      <span className="w-field-xs text-right font-code text-caption">{hex}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Contraste" description="Comprobación WCAG AA: el texto necesita al menos 4,5:1 sobre su fondo.">
        {fails.length ? (
          <Alert variant="destructive" className="mb-gap-lg"><AlertTriangle /><AlertTitle>{fails.length} {fails.length > 1 ? "pares no llegan" : "par no llega"} al mínimo en modo {mode === "dark" ? "oscuro" : "claro"}</AlertTitle>
            <AlertDescription>{editor ? "Están marcados abajo, con una propuesta para arreglar cada uno. El cambio solo afecta a ese caso." : "Están marcados abajo. Pasa a modo editor para arreglarlos."}</AlertDescription></Alert>
        ) : (
          <Alert className="mb-gap-lg"><CheckCircle2 /><AlertTitle>Todos los pares cumplen AA en modo {mode === "dark" ? "oscuro" : "claro"}</AlertTitle></Alert>
        )}
        <div className="grid gap-gap-sm sm:grid-cols-2">
          {[...fails, ...report.filter((r) => r.ok)].map((r) => (
            <div key={r.label} className={cn("rounded-card border-thin p-inset-md", !r.ok && "border-danger-border sm:col-span-2")}>
              <div className="flex items-center gap-gap-md">
                <div className="flex size-control-lg items-center justify-center rounded-control text-ui font-strong" style={{ background: r.bgValue, color: r.fgValue }}>Aa</div>
                <div className="flex-1 text-ui">{r.label}</div>
                <span className="font-code text-caption">{r.ratio ? r.ratio.toFixed(2) : "–"}:1</span>
                <Badge variant={r.ok ? "secondary" : "destructive"}>{r.ok ? "AA" : "Falla"}</Badge>
              </div>
              {!r.ok && editor && <ContrastFix r={r} report={report} />}
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

// ---------- Tipografía ----------
function TypographyPage() {
  const { tokens, editor, update } = useDS()
  const { val } = useResolved()
  const fam = tokens.primitives.font.family
  const styles = Object.values(flatten(tokens.semantic)).filter((t) => t.type === "typography")
  return (
    <>
      <Section title="Familias" description={editor ? "Escribe el nombre exacto de una fuente de Google Fonts (por ejemplo «Nunito» o «Fraunces»)." : undefined}>
        <div className="grid gap-gap-lg md:grid-cols-3">
          {Object.keys(fam).filter((k) => !k.startsWith("$")).map((k) => {
            const list: string[] = fam[k].$value
            return (
              <div key={k} className="rounded-card border-thin p-inset-lg">
                <div className="mb-gap-md text-caption text-muted-foreground">font.family.{k}</div>
                <div className="mb-gap-md text-h1" style={{ fontFamily: toCss(list, "fontFamily")! }}>Aa</div>
                {editor ? (
                  <Input defaultValue={list[0]} onBlur={(e) => e.target.value !== list[0] && update("primitives", `font.family.${k}`, [e.target.value, ...list.slice(1)])} />
                ) : <div className="font-emphasis">{list[0]}</div>}
                <div className="mt-gap-2xs truncate font-code text-caption text-muted-foreground">{list.slice(1).join(", ")}</div>
              </div>
            )
          })}
        </div>
      </Section>
      <Section title="Estilos de texto">
        <div className="[&>*+*]:border-t-thin rounded-card border-thin">
          {styles.map((t) => {
            const v = val(t.path)
            return (
              <div key={t.path} className="grid gap-gap-sm px-inset-lg py-inset-lg md:grid-cols-[1fr_var(--size-popover)] md:items-center">
                <div className="truncate" style={{ fontFamily: toCss(v.fontFamily, "fontFamily")!, fontSize: v.fontSize, fontWeight: v.fontWeight, lineHeight: v.lineHeight, letterSpacing: v.letterSpacing }}>
                  {t.path.includes("code") ? "const sonrisa = true" : "Una sonrisa sana"}
                </div>
                <div className="text-caption">
                  <div className="font-code">{t.path.replace(/^typography\./, "")}</div>
                  <div className="text-muted-foreground">{v.fontSize} · {v.fontWeight} · interlineado {v.lineHeight}</div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </>
  )
}

// ---------- Medidas (espaciado / radios) ----------
function PxEditor({ path, value, max }: { path: string; value: string; max: number }) {
  const { update } = useDS()
  const n = parseFloat(value)
  return <Slider className="w-field-sm" min={0} max={max} step={1} value={[n]} onValueChange={([x]) => update("primitives", path, `${x}px`)} />
}

function SpacingPage() {
  const { tokens, editor } = useDS()
  const { val } = useResolved()
  const prim = group(flatten(tokens.primitives), "space")
  const sem = group(flatten(tokens.semantic), "space")
  return (
    <>
      <Section title="Escala">
        <div className="[&>*+*]:border-t-thin rounded-card border-thin">
          {prim.map((t) => (
            <div key={t.path} className="flex items-center gap-gap-lg px-inset-lg py-inset-sm">
              <span className="w-field-sm font-code text-caption">{t.path}</span>
              <span className="w-avatar-xl text-right font-code text-caption text-muted-foreground">{t.value}</span>
              <div className="h-icon-md rounded-inner bg-primary" style={{ width: t.value }} />
              <div className="flex-1" />
              {editor && <PxEditor path={t.path} value={t.value} max={160} />}
            </div>
          ))}
        </div>
      </Section>
      <Section title="Espacios de uso">
        <div className="[&>*+*]:border-t-thin rounded-card border-thin">
          {sem.map((t) => (
            <div key={t.path} className="flex items-center gap-gap-lg px-inset-lg py-inset-sm">
              <span className="w-field-xs font-code text-caption">{t.path}</span>
              <span className="w-field-sm font-code text-caption text-muted-foreground">→ {aliasOf(t.value)}</span>
              <div className="h-icon-md rounded-inner bg-border-strong" style={{ width: val(t.path) }} />
              <span className="text-caption text-muted-foreground">{t.description}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

function RadiusPage() {
  const { tokens, editor } = useDS()
  const { val } = useResolved()
  const prim = group(flatten(tokens.primitives), "radius")
  const sem = group(flatten(tokens.semantic), "radius")
  return (
    <>
      <Section title="Escala">
        <div className="grid grid-cols-2 gap-gap-lg sm:grid-cols-4">
          {prim.map((t) => (
            <div key={t.path} className="space-y-gap-sm rounded-card border-thin p-inset-lg">
              <div className="size-avatar-2xl border-thick border-primary bg-primary-subtle" style={{ borderRadius: t.value }} />
              <div className="font-code text-caption">{t.path}</div>
              <div className="font-code text-caption text-muted-foreground">{t.value}</div>
              {editor && t.path !== "radius.full" && <PxEditor path={t.path} value={t.value} max={40} />}
            </div>
          ))}
        </div>
      </Section>
      <Section title="Radios de uso">
        <div className="grid gap-gap-lg sm:grid-cols-2">
          {sem.map((t) => (
            <div key={t.path} className="flex items-center gap-gap-lg rounded-card border-thin p-inset-lg">
              <div className="h-avatar-xl w-field-xs bg-muted" style={{ borderRadius: val(t.path) }} />
              <div className="text-ui">
                <div className="font-code text-caption">{t.path} → {aliasOf(t.value)}</div>
                <div className="text-muted-foreground">{t.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

function ElevationPage() {
  const { tokens, editor } = useDS()
  const { val } = useResolved()
  const sem = group(flatten(tokens.semantic), "elevation")
  return (
    <Section title="Niveles de elevación" description={editor ? "Las sombras se podrán editar más adelante (paso 1.4)." : undefined}>
      <div className="grid gap-gap-xl rounded-card bg-muted p-inset-xl sm:grid-cols-2 lg:grid-cols-4">
        {sem.map((t) => (
          <div key={t.path} className="rounded-card bg-card p-inset-xl" style={{ boxShadow: toCss(val(t.path), "shadow")! }}>
            <div className="font-code text-caption">{t.path.replace("elevation.", "")}</div>
            <div className="text-caption text-muted-foreground">→ {aliasOf(t.value)}</div>
            {t.description && <div className="mt-gap-sm text-caption text-muted-foreground">{t.description}</div>}
          </div>
        ))}
      </div>
    </Section>
  )
}

function MotionPage() {
  const { tokens, editor, update } = useDS()
  const { val } = useResolved()
  const [on, setOn] = useState(false)
  const prim = group(flatten(tokens.primitives), "duration")
  const easing = toCss(val("motion.easing.default"), "cubicBezier")!
  return (
    <>
      <Section title="Duraciones" description="Pulsa «Probar» para ver cada velocidad con la curva por defecto.">
        <button onClick={() => setOn(!on)} className="mb-gap-lg inline-flex items-center gap-gap-sm rounded-control bg-primary px-inset-md py-inset-xs text-ui text-primary-foreground"><Play className="size-icon-md" />Probar</button>
        <div className="[&>*+*]:border-t-thin rounded-card border-thin">
          {prim.map((t) => (
            <div key={t.path} className="flex items-center gap-gap-lg px-inset-lg py-inset-md">
              <span className="w-field-xs font-code text-caption">{t.path}</span>
              <span className="w-avatar-xl font-code text-caption text-muted-foreground">{t.value}</span>
              <div className="relative h-control-sm flex-1 rounded-control bg-muted">
                <div className="absolute top-inset-2xs size-avatar-sm rounded-control bg-primary" style={{ left: on ? "calc(100% - var(--size-avatar-sm) - var(--space-inset-2xs))" : "var(--space-inset-2xs)", transition: `left ${t.value} ${easing}` }} />
              </div>
              {editor && <Slider className="w-field-xs" min={0} max={1000} step={10} value={[parseFloat(t.value)]} onValueChange={([x]) => update("primitives", t.path, `${x}ms`)} />}
            </div>
          ))}
        </div>
      </Section>
      <Section title="Curvas">
        <div className="[&>*+*]:border-t-thin rounded-card border-thin">
          {group(flatten(tokens.primitives), "easing").map((t) => (
            <div key={t.path} className="flex items-center gap-gap-lg px-inset-lg py-inset-md">
              <span className="w-field-sm font-code text-caption">{t.path}</span>
              <Code>{toCss(t.value, "cubicBezier")}</Code>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

export default function Foundation() {
  const { page } = useParams()
  const { editor } = useDS()
  const item = FOUNDATIONS.find((f) => f.slug === page)
  if (!item) return <EmptyState title="Esta página no existe" />
  const Page = { estructura: TokenStructurePage, color: ColorPage, tipografia: TypographyPage, espaciado: SpacingPage, radios: RadiusPage, elevacion: ElevationPage, movimiento: MotionPage }[item.slug]!
  return (
    <div>
      <PageHeader eyebrow={editor ? "Fundamentos · editando" : "Fundamentos"} title={item.label} description={INTRO[item.slug]} />
      <Page />
    </div>
  )
}
