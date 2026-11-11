// Página de Tipografía: familias (Google Fonts), estilos de texto y escalas.
// Cada estilo (typography.h1, typography.body…) es lo que aplica la clase text-h1, text-body… en los componentes,
// y lo que el plugin de Figma dibuja como estilo de texto texto/h1/…
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, ChevronDown, Plus, Search, Trash2 } from "lucide-react"
import { aliasOf, flatten, resolve, tableFor, toCss, type TokenFiles } from "@/lib/tokens"
import { ALL_GOOGLE_FONTS, CATEGORY_LABEL, GOOGLE_FONTS, familyStack, googleFont, type GoogleCategory } from "@/lib/fonts"
import { loadFonts } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Section } from "@/components/app/common"
import { cn } from "@/lib/utils"
import { useDS } from "./context"

const keys = (o: any) => Object.keys(o ?? {}).filter((k) => !k.startsWith("$"))
const FAMILY_LABEL: Record<string, string> = { base: "Principal", code: "Código" }
const familyLabel = (k: string) => FAMILY_LABEL[k] ?? k.charAt(0).toUpperCase() + k.slice(1)
const SAMPLE: Record<string, string> = {
  display: "128 sonrisas", h1: "Tu clínica, en orden", h2: "Próximas citas", h3: "Datos del paciente",
  title: "Revisión anual", lead: "Todo lo que necesitas para tu próxima visita, en un solo sitio.",
  body: "Te enviaremos un recordatorio el día antes de la cita con la dirección y las indicaciones.",
  ui: "Guardar cambios", caption: "Actualizado hace 5 minutos",
}
const selectCls = "h-control-sm min-w-0 rounded-control border-thin bg-background px-inset-sm font-code text-caption"
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

function firstFamily(v: any): string {
  return Array.isArray(v) ? v[0] : String(v ?? "")
}

// ---------- Selector de fuentes de Google Fonts ----------
const CATS: (GoogleCategory | "todas")[] = ["todas", "sans", "serif", "display", "handwriting", "mono"]
const RECOMMENDED = new Set(GOOGLE_FONTS.map((f) => f.family))

export function FontPicker({ value, onChange, className }: { value: string; onChange: (family: string) => void; className?: string }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<GoogleCategory | "todas">("todas")
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const all = ALL_GOOGLE_FONTS.filter((f) => (cat === "todas" || f.category === cat) && (!s || f.family.toLowerCase().includes(s)))
    // Sin búsqueda, primero las recomendadas para interfaces
    if (!s) all.sort((a, b) => Number(RECOMMENDED.has(b.family)) - Number(RECOMMENDED.has(a.family)))
    return all
  }, [q, cat])
  const shown = list.slice(0, 60)
  // Cada nombre se ve con su propia fuente: se cargan solo las que están en pantalla
  useEffect(() => { if (open) loadFonts(shown.map((f) => f.family)) }, [open, shown])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-between", className)} aria-label="Elegir fuente de Google Fonts">
          <span className="truncate" style={value ? { fontFamily: `"${value}"` } : undefined}>{value || "Elige una fuente"}</span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-sheet p-0">
        <div className="space-y-gap-sm border-b-thin p-inset-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-inset-sm size-icon-sm -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar entre ${ALL_GOOGLE_FONTS.length} fuentes`} className="pl-inset-2xl" />
          </div>
          <div className="flex flex-wrap gap-gap-2xs">
            {CATS.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)}
                className={cn("rounded-pill border-thin px-inset-sm py-inset-3xs text-caption", cat === c ? "border-primary bg-primary-subtle font-emphasis" : "text-muted-foreground hover:bg-muted")}>
                {c === "todas" ? "Todas" : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-list-max overflow-y-auto p-inset-2xs" role="listbox">
          {shown.map((f) => (
            <button key={f.family} type="button" role="option" aria-selected={f.family === value}
              onClick={() => { onChange(f.family); setOpen(false); setQ("") }}
              className="flex w-full items-center gap-gap-sm rounded-inner px-inset-sm py-inset-xs text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
              <span className="min-w-0 flex-1 truncate text-body" style={{ fontFamily: `"${f.family}", ${f.category === "serif" ? "serif" : "sans-serif"}` }}>{f.family}</span>
              <span className="shrink-0 text-caption text-muted-foreground">{CATEGORY_LABEL[f.category]} · {f.weights.length} {f.weights.length === 1 ? "peso" : "pesos"}</span>
              {f.family === value && <Check className="size-icon-sm shrink-0" />}
            </button>
          ))}
          {list.length > shown.length && <p className="px-inset-sm py-inset-xs text-caption text-muted-foreground">Y {list.length - shown.length} más: escribe para afinar la búsqueda.</p>}
          {!list.length && <p className="px-inset-sm py-inset-md text-ui text-muted-foreground">No hay ninguna fuente con ese nombre en Google Fonts.</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function weightRange(ws: number[]) {
  if (ws.length === 1) return `solo ${ws[0]}`
  const contiguous = ws.every((w, i) => i === 0 || w - ws[i - 1] === 100)
  return contiguous ? `${ws[0]} a ${ws[ws.length - 1]}` : ws.join(", ")
}

// ---------- Familias ----------
function Families({ tokens, editor }: { tokens: TokenFiles; editor: boolean }) {
  const { updateMany } = useDS()
  const fam = tokens.semantic.text?.family ?? {}
  const typo = tokens.semantic.typography ?? {}
  const [adding, setAdding] = useState<{ name: string; font: string } | null>(null)
  const used = (k: string) => keys(typo).filter((r) => typo[r].$value?.fontFamily === `{text.family.${k}}`)
  const setFont = (k: string, family: string) => {
    const prim = aliasOf(fam[k].$value)
    if (prim) updateMany([["primitives", prim, familyStack(family)]])
  }
  const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const add = () => {
    if (!adding) return
    let k = slug(adding.name) || slug(adding.font)
    while (fam[k] || tokens.primitives.font.family[k]) k += "-2"
    updateMany([["primitives", `font.family.${k}`, familyStack(adding.font)], ["semantic", `text.family.${k}`, `{font.family.${k}}`]])
    setAdding(null)
  }
  const remove = (k: string) => {
    const prim = aliasOf(fam[k].$value)
    updateMany([["semantic", `text.family.${k}`, undefined], ...(prim ? [["primitives", prim, undefined] as ["primitives", string, undefined]] : [])])
  }
  return (
    <Section title="Familias" description={editor
      ? "Elige cualquier fuente de Google Fonts. Después, en cada estilo de texto, decides qué familia usa. Si necesitas una tercera (por ejemplo para titulares), añádela."
      : "Las fuentes del sistema (de Google Fonts). Cada estilo de texto usa una de ellas."}>
      <div className="grid gap-gap-lg md:grid-cols-3">
        {keys(fam).map((k) => {
          const prim = aliasOf(fam[k].$value)
          const list: string[] = prim ? resolve(fam[k].$value, tableFor(tokens, "light")) : fam[k].$value
          const name = firstFamily(list)
          const g = googleFont(name)
          const users = used(k)
          return (
            <div key={k} className="flex flex-col gap-gap-md rounded-card border-thin p-inset-lg">
              <div className="flex items-start justify-between gap-gap-sm">
                <div>
                  <div className="text-ui font-strong">{familyLabel(k)}</div>
                  <div className="font-code text-caption text-muted-foreground">text.family.{k}{prim && ` → ${prim}`}</div>
                </div>
                {editor && !FAMILY_LABEL[k] && !users.length && (
                  <Button size="icon-sm" variant="ghost" aria-label={`Quitar la familia ${familyLabel(k)}`} onClick={() => remove(k)}><Trash2 /></Button>
                )}
              </div>
              <div className="text-h1 font-strong tracking-body" style={{ fontFamily: toCss(list, "fontFamily")! }}>Aa</div>
              {editor ? <FontPicker value={name} onChange={(f) => setFont(k, f)} /> : <div className="font-emphasis">{name}</div>}
              <div className="text-caption text-muted-foreground">
                {g ? <>Google Fonts · {CATEGORY_LABEL[g.category]} · pesos {weightRange(g.weights)}</> : "Fuente del sistema (no es de Google Fonts)"}
                <br />{users.length ? `La usan: ${users.join(", ")}` : "Ningún estilo la usa todavía"}
              </div>
            </div>
          )
        })}
        {editor && (adding ? (
          <div className="flex flex-col gap-gap-md rounded-card border-thin border-dashed p-inset-lg">
            <div className="text-ui font-strong">Nueva familia</div>
            <Input autoFocus value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} placeholder="Nombre de uso, p. ej. titulares" aria-label="Nombre de la familia" />
            <FontPicker value={adding.font} onChange={(f) => setAdding({ ...adding, font: f })} />
            <div className="flex gap-gap-sm">
              <Button size="sm" onClick={add} disabled={!adding.font}>Añadir</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding({ name: "", font: "" })}
            className="flex min-h-area-min flex-col items-center justify-center gap-gap-sm rounded-card border-thin border-dashed p-inset-lg text-ui text-muted-foreground hover:bg-muted">
            <Plus className="size-icon-lg" />Añadir familia
          </button>
        ))}
      </div>
    </Section>
  )
}

// ---------- Estilos de texto ----------
type Opt = { value: string; label: string }
function options(tokens: TokenFiles, file: "primitives" | "semantic", group: string, table: Record<string, any>): Opt[] {
  const node = group.split(".").reduce((o: any, k) => o?.[k], tokens[file])
  return keys(node).map((k) => {
    const path = `${group}.${k}`
    const v = resolve(table[path]?.value, table)
    return { value: path, label: `${k} · ${Array.isArray(v) ? v[0] : v}` }
  })
}

function Styles({ tokens, editor }: { tokens: TokenFiles; editor: boolean }) {
  const { update } = useDS()
  const table = useMemo(() => tableFor(tokens, "light"), [tokens])
  const typo = tokens.semantic.typography ?? {}
  const roles = keys(typo)
  const opts = {
    fontFamily: options(tokens, "semantic", "text.family", table).map((o) => ({ ...o, label: `${familyLabel(o.value.split(".").pop()!)} · ${o.label.split(" · ")[1]}` })),
    fontSize: options(tokens, "primitives", "font.size", table),
    fontWeight: options(tokens, "semantic", "text.weight", table),
    lineHeight: options(tokens, "semantic", "text.leading", table),
    letterSpacing: options(tokens, "semantic", "text.tracking", table),
  }
  const FIELDS: [keyof typeof opts, string][] = [["fontFamily", "Familia"], ["fontSize", "Tamaño"], ["fontWeight", "Peso"], ["lineHeight", "Interlineado"], ["letterSpacing", "Espaciado"]]
  const setProp = (role: string, prop: keyof typeof opts, path: string) => {
    if (prop === "fontSize") {
      // El tamaño vive en text.size.<estilo> (lo usan también las clases text-*): el estilo apunta ahí
      const sizeTok = aliasOf(typo[role].$value.fontSize)
      if (sizeTok?.startsWith("text.size.")) return update("semantic", sizeTok, `{${path}}`)
    }
    update("semantic", `typography.${role}`, { ...typo[role].$value, [prop]: `{${path}}` })
  }
  const current = (role: string, prop: keyof typeof opts) => {
    const ref = aliasOf(typo[role].$value[prop])
    if (prop === "fontSize" && ref?.startsWith("text.size.")) return aliasOf(table[ref]?.value) ?? ref
    return ref ?? ""
  }
  return (
    <Section title="Estilos de texto" description={editor
      ? "Cada estilo es lo que aplica su clase (text-h1, text-body…) en todos los componentes y el estilo de texto de Figma con el mismo nombre (texto/h1/…). Los textos que piden un peso concreto, como un botón en negrita, lo mantienen."
      : "Cada estilo es lo que aplica su clase (text-h1, text-body…) en los componentes y en Figma."}>
      <div className="[&>*+*]:border-t-thin rounded-card border-thin">
        {roles.map((role) => {
          const v = resolve(typo[role].$value, table)
          const fam = firstFamily(v.fontFamily)
          const g = googleFont(fam)
          const w = Number(v.fontWeight)
          const missing = g && !g.weights.includes(w)
          return (
            <div key={role} className="space-y-gap-md px-inset-lg py-inset-lg">
              <div className="flex flex-wrap items-baseline justify-between gap-gap-sm">
                <div className="flex items-baseline gap-gap-sm">
                  <span className="font-code text-ui font-strong">text-{role}</span>
                  {typo[role].$description && <span className="text-caption text-muted-foreground">{typo[role].$description}</span>}
                </div>
                <span className="font-code text-caption text-muted-foreground">{fam} · {v.fontSize} · {v.fontWeight} · {v.lineHeight} · {v.letterSpacing}</span>
              </div>
              <div className="truncate" style={{ fontFamily: toCss(v.fontFamily, "fontFamily")!, fontSize: v.fontSize, fontWeight: v.fontWeight, lineHeight: v.lineHeight, letterSpacing: v.letterSpacing }}>
                {SAMPLE[role] ?? "Una sonrisa sana"}
              </div>
              {editor && (
                <div className="grid grid-cols-2 gap-gap-sm md:grid-cols-5">
                  {FIELDS.map(([prop, label]) => (
                    <label key={prop} className="flex min-w-0 flex-col gap-gap-2xs">
                      <span className="text-caption text-muted-foreground">{label}</span>
                      <select className={selectCls} value={current(role, prop)} onChange={(e) => setProp(role, prop, e.target.value)}>
                        {opts[prop].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              {missing && (
                <p className="flex items-center gap-gap-xs text-caption text-warning-text">
                  <AlertTriangle className="size-icon-sm shrink-0" />{fam} no tiene el peso {w} (tiene {weightRange(g.weights)}): se verá con el más parecido.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ---------- Escalas ----------
function NumberField({ path, value, unit, step, label }: { path: string; value: string | number; unit?: string; step: number; label: string }) {
  const { update } = useDS()
  const n = parseFloat(String(value))
  return (
    <Input key={`${path}:${value}`} type="number" step={step} defaultValue={n} aria-label={label} className="h-control-sm w-field-xs font-code text-caption"
      onBlur={(e) => {
        const x = parseFloat(e.target.value)
        if (!Number.isNaN(x) && x !== n) update("primitives", path, unit ? `${x}${unit}` : x)
      }} />
  )
}

function Scales({ tokens, editor }: { tokens: TokenFiles; editor: boolean }) {
  const { update } = useDS()
  const table = useMemo(() => tableFor(tokens, "light"), [tokens])
  const font = tokens.primitives.font
  const rows: { title: string; group: string; field: (k: string, v: any) => React.ReactNode; named?: string }[] = [
    { title: "Tamaños", group: "size", field: (k, v) => <NumberField path={`font.size.${k}`} value={v} unit="px" step={1} label={`Tamaño ${k} en px`} /> },
    { title: "Pesos", group: "weight", named: "text.weight", field: (k, v) => (
      <select className={selectCls} value={v} aria-label={`Peso ${k}`} onChange={(e) => update("primitives", `font.weight.${k}`, Number(e.target.value))}>
        {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
      </select>
    ) },
    { title: "Interlineados", group: "line-height", named: "text.leading", field: (k, v) => <NumberField path={`font.line-height.${k}`} value={v} step={0.05} label={`Interlineado ${k}`} /> },
    { title: "Espaciado entre letras", group: "letter-spacing", named: "text.tracking", field: (k, v) => <NumberField path={`font.letter-spacing.${k}`} value={v} unit="em" step={0.01} label={`Espaciado ${k} en em`} /> },
  ]
  return (
    <Section title="Escalas" description={editor
      ? "Los valores de base (primitivos) y los nombres de uso que eligen los estilos. Si cambias un valor aquí, cambian todos los estilos que lo usan."
      : "Los valores de base (primitivos) y los nombres de uso que eligen los estilos."}>
      <div className="grid gap-gap-lg md:grid-cols-2">
        {rows.map((r) => {
          const named = r.named ? r.named.split(".").reduce((o: any, k) => o?.[k], tokens.semantic) : null
          return (
            <div key={r.group} className="rounded-card border-thin">
              <div className="border-b-thin px-inset-lg py-inset-sm text-ui font-strong">{r.title}</div>
              <div className="[&>*+*]:border-t-thin">
                {keys(font[r.group]).map((k) => (
                  <div key={k} className="flex items-center gap-gap-md px-inset-lg py-inset-xs">
                    <span className="flex-1 font-code text-caption">font.{r.group}.{k}</span>
                    {editor ? r.field(k, font[r.group][k].$value) : <span className="font-code text-caption text-muted-foreground">{String(font[r.group][k].$value)}</span>}
                  </div>
                ))}
              </div>
              {named && (
                <>
                  <div className="border-y-thin bg-muted px-inset-lg py-inset-2xs text-caption text-muted-foreground">Nombres de uso ({r.named}.*)</div>
                  <div className="[&>*+*]:border-t-thin">
                    {keys(named).map((k) => {
                      const path = `${r.named}.${k}`
                      const ref = aliasOf(named[k].$value)
                      return (
                        <div key={k} className="flex items-center gap-gap-md px-inset-lg py-inset-xs">
                          <span className="flex-1 font-code text-caption">{k}{named[k].$description && <span className="text-muted-foreground"> · {named[k].$description}</span>}</span>
                          {editor && ref ? (
                            <select className={selectCls} value={ref} aria-label={`${r.title}: ${k}`} onChange={(e) => update("semantic", path, `{${e.target.value}}`)}>
                              {options(tokens, "primitives", `font.${r.group}`, table).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ) : <span className="font-code text-caption text-muted-foreground">→ {ref ?? String(named[k].$value)}</span>}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export default function TypographyPage() {
  const { tokens, editor } = useDS()
  // Fuentes de todas las familias del sistema (también las recién añadidas)
  useEffect(() => {
    loadFonts(Object.values(flatten(tokens.primitives)).filter((t) => t.type === "fontFamily").map((t) => firstFamily(t.value)))
  }, [tokens])
  return (
    <>
      <Families tokens={tokens} editor={editor} />
      <Styles tokens={tokens} editor={editor} />
      <Scales tokens={tokens} editor={editor} />
    </>
  )
}
