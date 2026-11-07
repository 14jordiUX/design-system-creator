// Inspector de tokens (solo en modo editor):
// - pasar el ratón por una parte del componente muestra qué tokens usa esa parte;
// - pasar el ratón por un token marca en el componente todos los sitios donde se usa.
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react"
import { core, tokensOfClass, TOKEN_GROUPS } from "@/lib/usedTokens"
import { cn } from "@/lib/utils"

// Capas que se abren fuera de la demo (menús, popovers, diálogos, drawers)
const PORTALS = "[data-radix-popper-content-wrapper], [role=dialog], [role=alertdialog], [data-vaul-drawer]"

type Inspector = { enabled: boolean; token: string | null; setToken: (t: string | null) => void }
const InspectorCtx = createContext<Inspector>({ enabled: false, token: null, setToken: () => {} })
export const useInspector = () => useContext(InspectorCtx)

const classesOf = (el: Element) => (el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean)
const cssVar = (token: string) => "--" + token.replace(/\./g, "-")

function stateLabel(cls: string) {
  const prefix = cls.slice(0, cls.length - core(cls).length)
  if (!prefix) return ""
  if (/svg/.test(prefix)) return "en iconos"
  if (/hover/.test(prefix)) return "al pasar"
  if (/focus/.test(prefix)) return "con foco"
  if (/disabled/.test(prefix)) return "desactivado"
  if (/invalid/.test(prefix)) return "con error"
  if (/placeholder/.test(prefix)) return "texto de ayuda"
  if (/state=closed/.test(prefix)) return "al cerrar"
  if (/state=(open|checked|active|on)|active|selected|checked|range/.test(prefix)) return "activo"
  if (/^(sm|md|lg|xl):/.test(prefix)) return "pantallas grandes"
  return "según el caso"
}

/** token -> estados en que se aplica ("" = siempre) */
function elementTokens(el: Element) {
  const out = new Map<string, Set<string>>()
  for (const c of classesOf(el)) {
    for (const t of tokensOfClass(c)) {
      if (!out.has(t)) out.set(t, new Set())
      out.get(t)!.add(stateLabel(c))
    }
  }
  return out
}

/** Solo cuentan las partes del componente (con data-slot o dentro de una), no las cajas que monta la demo */
function isPart(el: Element, root: Element | null) {
  const slotted = el.closest("[data-slot]")
  return !!slotted && (!root || root.contains(slotted))
}

const PARTS: Record<string, string> = { svg: "icono", span: "texto", img: "imagen", p: "párrafo", input: "campo" }

/** Nombre único, igual que en el código y en Figma: componente/variante/tamaño
 *  (la variante por defecto no se escribe). Ej.: button, button/destructive, button/outline/sm */
function partName(el: Element, root: Element | null) {
  let e: Element | null = el
  while (e && e !== root && !e.getAttribute("data-slot")) e = e.parentElement
  if (!e || !e.getAttribute("data-slot")) return el.tagName.toLowerCase()
  const bits = [e.getAttribute("data-slot")!]
  const v = e.getAttribute("data-variant"), sz = e.getAttribute("data-size")
  if (v && v !== "default") bits.push(v)
  if (sz && sz !== "default") bits.push(sz)
  let name = bits.join("/")
  if (e !== el) name += " › " + (PARTS[el.tagName.toLowerCase()] ?? el.tagName.toLowerCase())
  return name
}

function tokenValue(token: string) {
  if (typeof window === "undefined") return ""
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar(token)).trim()
}

/* ---------- proveedor + marcas sobre la pantalla ---------- */

export function InspectorProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  return (
    <InspectorCtx.Provider value={{ enabled, token, setToken }}>
      {children}
      {enabled && token && <TokenHighlights token={token} />}
    </InspectorCtx.Provider>
  )
}

function useRects(find: () => Element[], deps: unknown[]) {
  const [rects, setRects] = useState<DOMRect[]>([])
  useEffect(() => {
    const calc = () => setRects(find().map((e) => e.getBoundingClientRect()).filter((r) => r.width || r.height))
    calc()
    window.addEventListener("scroll", calc, true)
    window.addEventListener("resize", calc)
    return () => { window.removeEventListener("scroll", calc, true); window.removeEventListener("resize", calc) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return rects
}

type Kind = "outline" | "padding" | "margin" | "gap"
type Shape = { top: number; left: number; width: number; height: number; kind: Kind }

const SIDES: Record<string, ("t" | "r" | "b" | "l")[]> = {
  "": ["t", "r", "b", "l"], x: ["l", "r"], y: ["t", "b"], t: ["t"], r: ["r"], b: ["b"], l: ["l"], s: ["l"], e: ["r"],
}

/** Como el inspector de Chrome: el padding y el margen se pintan como bandas, el gap como el hueco entre hijos */
function shapesFor(el: Element, cls: string): Shape[] {
  const c = core(cls).replace(/^-/, "")
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const px = (v: string) => parseFloat(v) || 0
  const box = (m: RegExpMatchArray | null, kind: "padding" | "margin") => {
    const sides = SIDES[m![1]]
    const w = { t: px(cs[`${kind}Top`]), r: px(cs[`${kind}Right`]), b: px(cs[`${kind}Bottom`]), l: px(cs[`${kind}Left`]) }
    const out: Shape[] = []
    // padding: por dentro del borde; margen: por fuera
    const o = kind === "padding"
      ? { top: r.top + px(cs.borderTopWidth), left: r.left + px(cs.borderLeftWidth), right: r.right - px(cs.borderRightWidth), bottom: r.bottom - px(cs.borderBottomWidth) }
      : { top: r.top - w.t, left: r.left - w.l, right: r.right + w.r, bottom: r.bottom + w.b }
    const h = o.bottom - o.top, wd = o.right - o.left
    if (sides.includes("t") && w.t) out.push({ top: o.top, left: o.left, width: wd, height: w.t, kind })
    if (sides.includes("b") && w.b) out.push({ top: o.bottom - w.b, left: o.left, width: wd, height: w.b, kind })
    if (sides.includes("l") && w.l) out.push({ top: o.top, left: o.left, width: w.l, height: h, kind })
    if (sides.includes("r") && w.r) out.push({ top: o.top, left: o.right - w.r, width: w.r, height: h, kind })
    return out
  }
  let m = c.match(/^p([xytrblse]?)-/)
  if (m) return box(m, "padding")
  m = c.match(/^m([xytrblse]?)-/)
  if (m) return box(m, "margin")
  if (/^(gap|gap-x|gap-y|space-x|space-y)-/.test(c)) {
    const kids = [...el.children].map((k) => k.getBoundingClientRect()).filter((k) => k.width || k.height)
    const out: Shape[] = []
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i], b = kids[i + 1]
      if (b.left >= a.right - 1 && b.top < a.bottom) // al lado
        out.push({ top: Math.min(a.top, b.top), left: a.right, width: b.left - a.right, height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top), kind: "gap" })
      else if (b.top >= a.bottom - 1) // debajo
        out.push({ top: a.bottom, left: r.left, width: r.width, height: b.top - a.bottom, kind: "gap" })
    }
    return out.filter((x) => x.width > 0 && x.height > 0)
  }
  return [{ top: r.top, left: r.left, width: r.width, height: r.height, kind: "outline" }]
}

function TokenHighlights({ token }: { token: string }) {
  const [shapes, setShapes] = useState<Shape[]>([])
  useEffect(() => {
    const calc = () => {
      const roots = [...document.querySelectorAll("[data-demo-area]"), ...document.querySelectorAll(PORTALS)]
      const seen = new Set<Element>()
      const out: Shape[] = []
      for (const r of roots) for (const el of [r, ...r.querySelectorAll("*")]) {
        if (seen.has(el) || !isPart(el, r)) continue
        seen.add(el)
        for (const c of classesOf(el)) if (tokensOfClass(c).includes(token)) out.push(...shapesFor(el, c))
      }
      setShapes(out.filter((x) => x.width || x.height))
    }
    calc()
    window.addEventListener("scroll", calc, true)
    window.addEventListener("resize", calc)
    return () => { window.removeEventListener("scroll", calc, true); window.removeEventListener("resize", calc) }
  }, [token])
  return <>{shapes.map((sh, i) => <ShapeBox key={i} shape={sh} />)}</>
}

// Colores como en Chrome: padding verde, margen naranja, gap morado/azul
const FILL: Record<Exclude<Kind, "outline">, string> = { padding: "bg-success", margin: "bg-warning", gap: "bg-info" }

function ShapeBox({ shape }: { shape: Shape }) {
  // La posición es la del elemento en pantalla (se calcula al vuelo, no es una medida de diseño)
  const pos = { top: shape.top, left: shape.left, width: shape.width, height: shape.height }
  if (shape.kind === "outline")
    return <div className="pointer-events-none fixed z-50 rounded-fine border-thick border-ring" style={pos} />
  return <div className={cn("pointer-events-none fixed z-50 opacity-disabled", FILL[shape.kind])} style={pos} />
}

function Box({ rect }: { rect: DOMRect }) {
  const pos = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  return <div className="pointer-events-none fixed z-50 rounded-fine border-thin border-dashed border-ring" style={pos} />
}

/* ---------- chip de token (se puede usar en cualquier lista) ---------- */

export function TokenChip({ token, states }: { token: string; states?: string[] }) {
  const { enabled, token: active, setToken } = useInspector()
  const value = enabled ? tokenValue(token) : ""
  const on = states?.filter(Boolean) ?? []
  return (
    <span
      onMouseEnter={() => enabled && setToken(token)}
      onMouseLeave={() => enabled && setToken(null)}
      title={value || undefined}
      className={cn("inline-flex flex-wrap items-center gap-x-gap-xs rounded-inner bg-muted px-inset-xs py-inset-3xs font-code text-caption transition-colors",
        enabled && "cursor-default hover:bg-accent", active === token && "bg-primary-subtle")}>
      {token.startsWith("color.") && <span className="size-icon-sm shrink-0 rounded-fine border-thin" style={{ background: `var(${cssVar(token)})` }} />}
      {token}
      {on.length > 0 && <span className="font-base whitespace-nowrap text-muted-foreground">· {on.join(", ")}</span>}
    </span>
  )
}

/* ---------- demo inspeccionable ---------- */

let activeDemo: string | null = null   // a qué demo pertenecen los menús/diálogos abiertos

type Sel = { name: string; tokens: [string, string[]][] }

export function InspectableDemo({ children, all }: { children: ReactNode; all?: (readonly [string, string[]])[] | null }) {
  const { enabled, token } = useInspector()
  const id = useId()
  const area = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState<Sel | null>(null)
  const [hovered, setHovered] = useState<Element | null>(null)
  const [pinned, setPinned] = useState(false)
  const pinnedRef = useRef(false)
  pinnedRef.current = pinned

  useEffect(() => {
    if (!enabled) return
    const pick = (e: MouseEvent) => {
      const t = e.target as Element
      const inArea = !!area.current?.contains(t)
      if (inArea) activeDemo = id
      const inPortal = !inArea && activeDemo === id && !!t.closest?.(PORTALS)
      if (!inArea && !inPortal) { setHovered(null); return }
      const stop = inArea ? area.current : t.closest(PORTALS)
      let el: Element | null = t
      const ok = (e: Element) => isPart(e, stop) && elementTokens(e).size > 0
      while (el && el !== stop && !ok(el)) el = el.parentElement
      if (!el || !ok(el)) return
      setHovered(el)
      return { name: partName(el, stop), tokens: [...elementTokens(el)].map(([k, v]) => [k, [...v]]) } as Sel
    }
    const onMove = (e: MouseEvent) => { const s = pick(e); if (s && !pinnedRef.current) setSel(s) }
    const onClick = (e: MouseEvent) => { const s = pick(e); if (s) { setSel(s); setPinned(true) } }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("click", onClick, true)
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("click", onClick, true) }
  }, [enabled, id])

  const hoverRects = useRects(() => (hovered && !token ? [hovered] : []), [hovered, token])

  if (!enabled)
    return <div data-demo-area className="flex min-h-area-min items-center justify-center rounded-t-card border-thin p-inset-2xl">{children}</div>

  const groups = TOKEN_GROUPS.map(([g, re]) => [g, (sel?.tokens ?? []).filter(([t]) => re.test(t)).sort()] as const)
    .filter(([, l]) => l.length)
  return (
    <div className="flex flex-col rounded-t-card border-thin md:flex-row">
      <div ref={area} data-demo-area className="min-w-0 flex-1">
        {/* Siempre en el mismo sitio y pegado arriba al hacer scroll, aunque el panel crezca */}
        <div className="sticky top-inset-lg flex min-h-area-min items-center justify-center p-inset-2xl">{children}</div>
      </div>
      <aside className="shrink-0 border-t-thin bg-subtle p-inset-lg text-ui md:w-popover md:border-t-0 md:border-l-thin">
        <div className="mb-gap-2xs text-caption font-strong tracking-caps text-muted-foreground uppercase">Inspector de tokens</div>
        {!sel ? (
          <div className="grid gap-gap-md">
            <p className="text-muted-foreground">Pasa el ratón por el componente para ver qué tokens usa cada parte (haz clic para fijarla). Pasa el ratón por un token para ver dónde se aplica.</p>
            {all?.length ? <div className="font-code text-caption">Todo el componente</div> : null}
            {all?.map(([g, list]) => (
              <div key={g}>
                <div className="mb-gap-2xs text-caption font-emphasis">{g}</div>
                <div className="flex flex-wrap gap-gap-2xs">{list.map((t) => <TokenChip key={t} token={t} />)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-gap-md">
            <div className="flex items-center justify-between gap-gap-sm">
              <span className="font-code text-ui font-strong">{sel.name}</span>
              {pinned
                ? <button className="text-caption text-link hover:underline" onClick={() => setPinned(false)}>Fijado · soltar</button>
                : <button className="text-caption text-muted-foreground hover:underline" onClick={() => { setSel(null); setHovered(null) }}>Ver todo</button>}
            </div>
            {groups.map(([g, list]) => (
              <div key={g}>
                <div className="mb-gap-2xs text-caption font-emphasis">{g}</div>
                <div className="flex flex-wrap gap-gap-2xs">{list.map(([t, st]) => <TokenChip key={t} token={t} states={st} />)}</div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-gap-lg flex flex-wrap gap-gap-md border-t-thin pt-inset-md text-caption text-muted-foreground">
          <span className="flex items-center gap-gap-2xs"><span className="size-indicator rounded-fine bg-success opacity-disabled" />padding</span>
          <span className="flex items-center gap-gap-2xs"><span className="size-indicator rounded-fine bg-warning opacity-disabled" />margen</span>
          <span className="flex items-center gap-gap-2xs"><span className="size-indicator rounded-fine bg-info opacity-disabled" />gap</span>
          <span className="flex items-center gap-gap-2xs"><span className="size-indicator rounded-fine border-thin border-ring" />resto</span>
        </div>
      </aside>
      {hoverRects.map((r, i) => <Box key={i} rect={r} />)}
    </div>
  )
}
