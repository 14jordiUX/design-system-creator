// Fundamentos › Estructura: cómo se nombran y se encadenan los tokens, con ejemplos reales del sistema.
import { useMemo, useState, type ReactNode } from "react"
import { ArrowRight, Search } from "lucide-react"
import { aliasOf, flatten, resolve, toCss, type FlatToken, type Json } from "@/lib/tokens"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Code, Section } from "@/components/app/common"
import { useDS } from "./context"

type Table = Record<string, FlatToken>

// Colores para cada pieza del nombre (posición 1, 2, 3, 4).
const PIECE = ["text-foreground", "text-success-text", "text-info-text", "text-warning-text", "text-danger-text"]

const CATEGORY: Record<string, string> = {
  color: "Color", space: "Espaciado", radius: "Radios", "border-width": "Grosor de borde", font: "Tipografía (valores)",
  typography: "Estilos de texto", text: "Texto", shadow: "Sombras", elevation: "Elevación", duration: "Duraciones",
  easing: "Curvas", motion: "Movimiento", opacity: "Opacidad", state: "Estados", breakpoint: "Puntos de corte",
  dimension: "Medidas fijas", viewport: "Pantalla", scale: "Escala", "z-index": "Capas (z-index)", angle: "Ángulos",
  control: "Controles", size: "Tamaños", layout: "Maquetación", layer: "Capas", chart: "Gráficos",
}

/** Valor final ya resuelto, listo para enseñar. */
function finalValue(t: FlatToken | undefined, table: Table): { text: string; color?: string } {
  if (!t) return { text: "—" }
  const v = resolve(t.value, table)
  if (t.type === "color" && typeof v === "string") return { text: v, color: v }
  if (t.type === "typography" && v && typeof v === "object") {
    return { text: [v.fontSize, v.fontWeight, v.lineHeight].filter((x) => x != null).join(" · ") }
  }
  const css = toCss(v, t.type)
  if (css != null) return { text: css }
  return { text: typeof v === "object" ? JSON.stringify(v) : String(v) }
}

function Swatch({ color, className }: { color?: string; className?: string }) {
  if (!color) return null
  return <span className={cn("checker inline-block size-icon-md shrink-0 overflow-hidden rounded-inner border-thin align-middle", className)}><span className="block size-full" style={{ background: color }} /></span>
}

/** Nombre de token con cada pieza en su color. */
function Pieces({ path }: { path: string }) {
  const parts = path.split(".")
  return (
    <span className="font-code text-caption">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground">.</span>}
          <span className={cn("font-emphasis", PIECE[Math.min(i, PIECE.length - 1)])}>{p}</span>
        </span>
      ))}
    </span>
  )
}

/** Cadena de alias: token → token → … → valor. */
function Chain({ path, table }: { path: string; table: Table }) {
  const steps: string[] = []
  let cur: string | null = path
  while (cur && table[cur] && steps.length < 8) {
    steps.push(cur)
    cur = aliasOf(table[cur].value)
  }
  const end = finalValue(table[path], table)
  return (
    <span className="inline-flex flex-wrap items-center gap-gap-2xs font-code text-caption">
      {steps.map((s, i) => (
        <span key={s} className="inline-flex items-center gap-gap-2xs">
          {i > 0 && <ArrowRight className="size-icon-sm text-muted-foreground" />}
          <span className={i === 0 ? "font-emphasis" : "text-muted-foreground"}>{s}</span>
        </span>
      ))}
      <ArrowRight className="size-icon-sm text-muted-foreground" />
      <Swatch color={end.color} />
      <span>{end.text}</span>
    </span>
  )
}

// ---------- 1. Las tres capas ----------
function Layers({ light, dark }: { light: Table; dark: Table }) {
  const sem = "color.bg.action.primary.default"
  const prim = aliasOf(light[sem]?.value)
  const primDark = aliasOf(dark[sem]?.value)
  const boxes: { n: string; t: string; d: ReactNode; ex: ReactNode }[] = [
    { n: "1", t: "Primitivos", d: "Los valores en bruto: la paleta, la escala de espacios, los radios… Es la capa de gestión: aquí se cambia un color y todo lo que depende de él se actualiza.",
      ex: prim ? <><Pieces path={prim} /><div className="mt-gap-2xs flex items-center gap-gap-xs font-code text-caption"><Swatch color={finalValue(light[prim], light).color} />{finalValue(light[prim], light).text}</div></> : null },
    { n: "2", t: "Semánticos", d: "Dicen para qué sirve cada valor. Apuntan a un primitivo, nunca llevan un valor escrito a mano. Los colores existen dos veces: uno para el modo claro y otro para el oscuro, con el mismo nombre.",
      ex: <><Pieces path={sem} /><div className="mt-gap-2xs text-caption text-muted-foreground">claro → {prim} · oscuro → {primDark}</div></> },
    { n: "3", t: "Componentes", d: "Los botones, tarjetas, campos… solo usan semánticos. Así un cambio de paleta nunca rompe el significado.",
      ex: <><Code>Button</Code><div className="mt-gap-2xs text-caption text-muted-foreground">fondo = {sem}</div></> },
  ]
  return (
    <div className="grid items-stretch gap-gap-md md:grid-cols-3">
      {boxes.map((b) => (
        <div key={b.n} className="flex flex-col gap-gap-sm rounded-card border-thin bg-card p-inset-lg">
          <div className="flex items-center gap-gap-sm">
            <span className="flex size-avatar-sm shrink-0 items-center justify-center rounded-pill bg-muted text-caption font-strong text-foreground">{b.n}</span>
            <span className="text-body font-strong">{b.t}</span>
          </div>
          <p className="text-ui text-muted-foreground">{b.d}</p>
          <div className="mt-auto rounded-control bg-muted p-inset-sm">{b.ex}</div>
        </div>
      ))}
    </div>
  )
}

// ---------- 2. La norma de nombres ----------
type Example = { path: string; labels: string[]; note: string }
const PRIMITIVE_RULE = ["categoría", "escala", "paso"]
const SEMANTIC_RULE = ["categoría", "dónde", "función", "variante", "estado"]

const PRIMITIVE_EXAMPLES: Example[] = [
  { path: "color.brand.600", labels: ["categoría", "escala", "paso"], note: "Tono 600 de la escala de marca (de 50, muy claro, a 950, muy oscuro)." },
  { path: "color.neutral.200", labels: ["categoría", "escala", "paso"], note: "Gris claro de la escala neutra." },
  { path: "space.4", labels: ["categoría", "paso"], note: "Paso 4 de la escala de espacios (base 4 px)." },
  { path: "font.size.lg", labels: ["categoría", "propiedad", "paso"], note: "Un tamaño de letra de la escala." },
  { path: "radius.md", labels: ["categoría", "paso"], note: "Un radio de la escala." },
]
const SEMANTIC_EXAMPLES: Example[] = [
  { path: "color.bg.action.primary.hover", labels: ["categoría", "dónde", "función", "variante", "estado"], note: "Fondo de una acción principal (botón primario) al pasar el ratón." },
  { path: "color.text.on-action.primary", labels: ["categoría", "dónde", "función", "variante"], note: "Texto o icono encima de una acción principal. «on» = lo que va encima de ese fondo." },
  { path: "color.text.action.primary", labels: ["categoría", "dónde", "función", "variante"], note: "Texto en color principal sobre el fondo normal (enlaces de acción, iconos activos)." },
  { path: "color.border.action.primary", labels: ["categoría", "dónde", "función", "variante"], note: "Borde en color principal (casilla marcada, opción elegida)." },
  { path: "color.bg.feedback.danger.default", labels: ["categoría", "dónde", "función", "tipo", "estado"], note: "Fondo lleno de un aviso de error." },
  { path: "color.border.feedback.danger.subtle", labels: ["categoría", "dónde", "función", "tipo", "variante"], note: "Borde suave de una alerta de error. «default» es el borde fuerte (un campo con error)." },
  { path: "color.text.muted", labels: ["categoría", "dónde", "variante"], note: "Texto secundario, menos importante." },
  { path: "space.inset.md", labels: ["categoría", "uso", "tamaño"], note: "Relleno interior mediano (padding). «gap» es la separación entre elementos." },
  { path: "radius.card", labels: ["categoría", "elemento"], note: "Redondeo de las tarjetas." },
  { path: "text.size.body", labels: ["categoría", "propiedad", "rol"], note: "Tamaño de letra del texto normal." },
  { path: "typography.heading.h2", labels: ["categoría", "grupo", "nivel"], note: "Estilo completo de un título: familia, tamaño, peso, interlineado." },
]

function RuleLine({ pieces }: { pieces: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-gap-xs font-code text-ui">
      {pieces.map((p, i) => (
        <span key={p} className="inline-flex items-center gap-gap-xs">
          {i > 0 && <span className="text-muted-foreground">.</span>}
          <span className={cn("rounded-inner bg-muted px-inset-xs py-inset-3xs font-emphasis", PIECE[i])}>{p}</span>
        </span>
      ))}
    </div>
  )
}

function ExampleRow({ ex, table }: { ex: Example; table: Table }) {
  const parts = ex.path.split(".")
  return (
    <div className="flex flex-col gap-gap-xs px-inset-lg py-inset-md">
      <div className="flex flex-wrap items-start gap-gap-sm">
        {parts.map((p, i) => (
          <span key={i} className="flex flex-col">
            <span className={cn("font-code text-ui font-strong", PIECE[Math.min(i, PIECE.length - 1)])}>{p}</span>
            <span className="text-caption text-muted-foreground">{ex.labels[i]}</span>
          </span>
        ))}
      </div>
      <p className="text-ui text-muted-foreground">{ex.note}</p>
      <Chain path={ex.path} table={table} />
    </div>
  )
}

const GLOSSARY: [string, string][] = [
  ["bg · text · border", "Dónde se aplica el color: fondo, texto (e iconos) o borde."],
  ["surface", "Fondos de superficies que flotan o se apilan: tarjetas, menús, barra lateral."],
  ["action · on-action", "Colores de acciones (botones…); «on-action» es el texto que va encima de su fondo."],
  ["feedback · on-feedback", "Colores de avisos; «on-feedback» es el texto encima del fondo lleno."],
  ["primary · secondary · ghost · disabled", "Variantes de acción: principal, secundaria, sin fondo y desactivada."],
  ["success · warning · danger · info", "Tipos de aviso: bien, cuidado, error e información."],
  ["default · hover · active", "Estados: normal, al pasar el ratón, al pulsar."],
  ["subtle · strong · muted", "Versiones más suaves o más marcadas de un color."],
  ["inset · gap", "Espacios: relleno interior (padding) y separación entre elementos."],
  ["3xs … 4xl", "Tallas de menor a mayor."],
]

// ---------- 3. Listado de todos los tokens ----------
function Group({ title, count, open, children }: { title: string; count: number; open: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-card border-thin bg-card">
      <summary className="flex cursor-pointer items-center justify-between gap-gap-md px-inset-lg py-inset-md text-ui font-strong">
        <span>{title}</span>
        <Badge variant="secondary">{count}</Badge>
      </summary>
      <div className="[&>*+*]:border-t-thin border-t-thin">{children}</div>
    </details>
  )
}

function ColorRow({ path, light, dark, description }: { path: string; light: Table; dark: Table; description?: string }) {
  const side = (table: Table, label: string) => {
    const a = aliasOf(table[path]?.value)
    const v = finalValue(table[path], table)
    return (
      <div className="flex min-w-0 items-center gap-gap-xs font-code text-caption">
        <span className="shrink-0 text-muted-foreground">{label}</span>
        <ArrowRight className="size-icon-sm shrink-0 text-muted-foreground" />
        <span className="truncate">{a ?? "valor directo"}</span>
        <ArrowRight className="size-icon-sm shrink-0 text-muted-foreground" />
        <Swatch color={v.color} />
        <span className="text-muted-foreground">{v.text}</span>
      </div>
    )
  }
  return (
    <div className="grid gap-gap-xs px-inset-lg py-inset-sm lg:grid-cols-3 lg:items-center">
      <div className="min-w-0">
        <Pieces path={path} />
        {description && <div className="text-caption text-muted-foreground">{description}</div>}
      </div>
      {side(light, "Claro")}
      {side(dark, "Oscuro")}
    </div>
  )
}

function SemanticRow({ t, table }: { t: FlatToken; table: Table }) {
  const isObj = t.value && typeof t.value === "object" && !Array.isArray(t.value)
  const v = finalValue(t, table)
  return (
    <div className="grid gap-gap-xs px-inset-lg py-inset-sm lg:grid-cols-3 lg:items-center">
      <div className="min-w-0">
        <Pieces path={t.path} />
        {t.description && <div className="text-caption text-muted-foreground">{t.description}</div>}
      </div>
      <div className="flex min-w-0 flex-col gap-gap-3xs font-code text-caption lg:col-span-2">
        {isObj ? Object.entries(t.value as Json).map(([k, ref]) => (
          <div key={k} className="flex flex-wrap items-center gap-gap-xs">
            <span className="w-field-xs shrink-0 text-muted-foreground">{k}</span>
            <ArrowRight className="size-icon-sm text-muted-foreground" />
            <span>{aliasOf(ref) ?? String(ref)}</span>
            <ArrowRight className="size-icon-sm text-muted-foreground" />
            <span className="text-muted-foreground">{String(toCss(resolve(ref, table), undefined) ?? resolve(ref, table))}</span>
          </div>
        )) : (
          <div className="flex flex-wrap items-center gap-gap-xs">
            <ArrowRight className="size-icon-sm text-muted-foreground" />
            <span>{aliasOf(t.value) ?? "valor directo"}</span>
            <ArrowRight className="size-icon-sm text-muted-foreground" />
            <Swatch color={v.color} />
            <span className="text-muted-foreground">{v.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function PrimitiveRow({ t, table, users }: { t: FlatToken; table: Table; users: string[] }) {
  const v = finalValue(t, table)
  return (
    <div className="grid gap-gap-xs px-inset-lg py-inset-sm lg:grid-cols-3 lg:items-center">
      <div className="flex min-w-0 items-center gap-gap-sm">
        <Swatch color={v.color} />
        <Pieces path={t.path} />
      </div>
      <div className="truncate font-code text-caption text-muted-foreground">{v.text}</div>
      <div className="text-caption text-muted-foreground">
        {users.length ? <details><summary className="cursor-pointer">Lo usan {users.length} semántico{users.length > 1 ? "s" : ""}</summary>
          <div className="mt-gap-2xs flex flex-col font-code">{users.map((u) => <span key={u}>{u}</span>)}</div></details>
          : <span>Sin uso directo (de reserva)</span>}
      </div>
    </div>
  )
}

/** Agrupa por la primera pieza; los colores primitivos, por escala. */
function groupBy(list: FlatToken[], depth: (t: FlatToken) => number) {
  const out = new Map<string, FlatToken[]>()
  for (const t of list) {
    const key = t.path.split(".").slice(0, depth(t)).join(".")
    out.set(key, [...(out.get(key) ?? []), t])
  }
  return [...out.entries()]
}
const label = (key: string) => {
  const [c, ...rest] = key.split(".")
  return (CATEGORY[c] ?? c) + (rest.length ? ` · ${rest.join(".")}` : "") + `  (${key})`
}

export default function TokenStructurePage() {
  const { tokens } = useDS()
  const [q, setQ] = useState("")
  const data = useMemo(() => {
    const prim = flatten(tokens.primitives), sem = flatten(tokens.semantic)
    const lightOnly = flatten(tokens.light), darkOnly = flatten(tokens.dark)
    const light: Table = { ...prim, ...sem, ...lightOnly }, dark: Table = { ...prim, ...sem, ...darkOnly }
    // Quién usa cada primitivo (en claro, oscuro o en semánticos).
    const users: Record<string, Set<string>> = {}
    const add = (from: string, v: Json) => {
      const refs = typeof v === "object" && v ? Object.values(v) : [v]
      for (const r of refs) { const a = aliasOf(r); if (a) (users[a] ??= new Set()).add(from) }
    }
    for (const t of [...Object.values(sem), ...Object.values(lightOnly), ...Object.values(darkOnly)]) add(t.path, t.value)
    return { prim, sem, lightOnly, light, dark, users }
  }, [tokens])

  const match = (p: string) => !q || p.toLowerCase().includes(q.toLowerCase())
  const colors = Object.values(data.lightOnly).filter((t) => match(t.path))
  const sems = Object.values(data.sem).filter((t) => match(t.path))
  const prims = Object.values(data.prim).filter((t) => match(t.path))
  const open = !!q
  const exists = (e: Example) => !!data.light[e.path]

  return (
    <>
      <Section title="Las tres capas" description="Cada valor del sistema pasa por tres capas. Un componente nunca usa un primitivo directamente.">
        <Layers light={data.light} dark={data.dark} />
      </Section>

      <Section title="La norma de nombres" description="Los nombres se leen de lo general a lo concreto y cada pieza se separa con un punto. En código el punto pasa a ser guion: color.bg.action.primary.hover → --color-bg-action-primary-hover.">
        <div className="grid gap-gap-md md:grid-cols-2">
          <div className="flex flex-col gap-gap-sm rounded-card border-thin bg-card p-inset-lg">
            <div className="text-ui font-strong">Primitivos</div>
            <RuleLine pieces={PRIMITIVE_RULE} />
            <p className="text-ui text-muted-foreground">Qué es y en qué punto de la escala está. No dicen dónde se usan.</p>
          </div>
          <div className="flex flex-col gap-gap-sm rounded-card border-thin bg-card p-inset-lg">
            <div className="text-ui font-strong">Semánticos</div>
            <RuleLine pieces={SEMANTIC_RULE} />
            <p className="text-ui text-muted-foreground">En los colores, la segunda pieza dice dónde se aplica: bg (fondo), text (texto e iconos) o border (bordes). Así nunca se usa un fondo como color de texto. Las piezas que no hacen falta se omiten (color.text.muted no tiene función; radius.card no tiene estado).</p>
          </div>
        </div>
      </Section>

      <Section title="Ejemplos reales" description="Sacados de este sistema. Debajo de cada pieza, qué significa; y la cadena completa hasta el valor final (modo claro).">
        <div className="grid gap-gap-lg lg:grid-cols-2">
          <div>
            <div className="mb-gap-sm text-ui font-strong">Primitivos</div>
            <div className="[&>*+*]:border-t-thin rounded-card border-thin bg-card">
              {PRIMITIVE_EXAMPLES.filter(exists).map((e) => <ExampleRow key={e.path} ex={e} table={data.light} />)}
            </div>
          </div>
          <div>
            <div className="mb-gap-sm text-ui font-strong">Semánticos</div>
            <div className="[&>*+*]:border-t-thin rounded-card border-thin bg-card">
              {SEMANTIC_EXAMPLES.filter(exists).map((e) => <ExampleRow key={e.path} ex={e} table={data.light} />)}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Vocabulario" description="Las palabras que se repiten en los nombres.">
        <div className="[&>*+*]:border-t-thin rounded-card border-thin bg-card">
          {GLOSSARY.map(([w, d]) => (
            <div key={w} className="grid gap-gap-xs px-inset-lg py-inset-sm sm:grid-cols-3">
              <span className="font-code text-caption font-emphasis">{w}</span>
              <span className="text-ui text-muted-foreground sm:col-span-2">{d}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Todos los tokens" description={`${Object.keys(data.prim).length} primitivos · ${Object.keys(data.sem).length} semánticos · ${Object.keys(data.lightOnly).length} colores semánticos con versión clara y oscura. Cada fila muestra a qué apunta y su valor final.`}>
        <div className="relative mb-gap-lg max-w-sheet">
          <Search className="absolute top-1/2 left-inset-sm size-icon-sm -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar un token, p. ej. primary o inset" className="pl-inset-2xl" aria-label="Buscar token" />
        </div>

        <h3 className="mb-gap-sm text-body font-strong">Colores semánticos (claro y oscuro)</h3>
        <div className="mb-gap-xl flex flex-col gap-gap-sm">
          {groupBy(colors, () => 2).map(([k, list]) => (
            <Group key={k + open} title={label(k)} count={list.length} open={open}>
              {list.map((t) => <ColorRow key={t.path} path={t.path} light={data.light} dark={data.dark} description={t.description} />)}
            </Group>
          ))}
          {!colors.length && <p className="text-ui text-muted-foreground">Ninguno coincide.</p>}
        </div>

        <h3 className="mb-gap-sm text-body font-strong">Otros semánticos</h3>
        <div className="mb-gap-xl flex flex-col gap-gap-sm">
          {groupBy(sems, () => 1).map(([k, list]) => (
            <Group key={k + open} title={label(k)} count={list.length} open={open}>
              {list.map((t) => <SemanticRow key={t.path} t={t} table={data.light} />)}
            </Group>
          ))}
          {!sems.length && <p className="text-ui text-muted-foreground">Ninguno coincide.</p>}
        </div>

        <h3 className="mb-gap-sm text-body font-strong">Primitivos (capa de gestión)</h3>
        <div className="flex flex-col gap-gap-sm">
          {groupBy(prims, (t) => (t.path.startsWith("color.") || t.path.startsWith("font.") ? 2 : 1)).map(([k, list]) => (
            <Group key={k + open} title={label(k)} count={list.length} open={open}>
              {list.map((t) => <PrimitiveRow key={t.path} t={t} table={data.light} users={[...(data.users[t.path] ?? [])]} />)}
            </Group>
          ))}
          {!prims.length && <p className="text-ui text-muted-foreground">Ninguno coincide.</p>}
        </div>
      </Section>
    </>
  )
}
