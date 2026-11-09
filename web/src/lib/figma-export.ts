// Exportar a Figma: convierte los tokens de un sistema y las pantallas de un prototipo (tal como se ven en la web)
// en un archivo .json que el plugin «Design System Creator» (carpeta figma-plugin/) dibuja en Figma:
//   - tokens  → variables de Figma (Primitivos ocultos, Semánticos y Color con modos Claro / Oscuro) y estilos de sombra
//   - pantallas → marcos con auto layout, cada color, espacio, radio y texto enlazado a su variable
//   - componentes (button, input-group, checkbox…) → componentes de Figma con variantes; las pantallas usan instancias
// Los tokens de cada elemento salen de sus clases (class-tokens.json) y se comprueban contra el valor real calculado,
// así solo se enlaza un token si de verdad es el que se está viendo.
import classTokens from "../class-tokens.json"
import { flatten, resolve, type FlatToken, type Mode, type TokenFiles } from "./tokens"

export const FIGMA_FORMAT = "dsc-figma@1"

// ---------- Tokens → variables ----------
type VarValue = string | number | boolean | { alias: string }
export type FigmaVariable = { name: string; type: "COLOR" | "FLOAT" | "STRING"; values: Record<string, VarValue>; description?: string }
export type FigmaCollection = { name: string; modes: string[]; hidden?: boolean; variables: FigmaVariable[] }
export type FigmaEffect = { name: string; shadows: { color: string; x: number; y: number; blur: number; spread: number }[]; description?: string }

const REF = /^\{([^}]+)\}$/
/** Nombre de la variable en Figma: los puntos pasan a barras (Figma agrupa por «/»). */
export const varName = (path: string) => path.replace(/\./g, "/")

function px(v: unknown): number | null {
  if (typeof v === "number") return v
  if (typeof v !== "string") return null
  const m = v.trim().match(/^(-?\d*\.?\d+)(px)?$/)
  return m ? parseFloat(m[1]) : null
}

function figmaType(t: FlatToken): FigmaVariable["type"] | null {
  if (t.type === "color") return "COLOR"
  if (t.type === "fontFamily") return "STRING"
  if (t.type === "dimension" || t.type === "number" || t.type === "fontWeight") return "FLOAT"
  return null
}

function literal(t: FlatToken, v: unknown): VarValue | null {
  const type = figmaType(t)
  if (type === "COLOR") return typeof v === "string" && v.startsWith("#") ? v : null
  if (type === "STRING") return Array.isArray(v) ? String(v[0]) : typeof v === "string" ? v : null
  if (type === "FLOAT") return px(v)
  return null
}

function toVar(t: FlatToken, valueOf: (mode: string) => unknown, modes: string[], table: Record<string, FlatToken>): FigmaVariable | null {
  const type = figmaType(t)
  if (!type) return null
  const values: Record<string, VarValue> = {}
  for (const m of modes) {
    const raw = valueOf(m)
    const ref = typeof raw === "string" ? raw.match(REF) : null
    if (ref) {
      const target = table[ref[1]]
      // Solo se enlaza a otra variable si esa también existe en Figma (mismo tipo); si no, valor resuelto
      if (target && figmaType(target) === type && literal(target, resolve(target.value, table)) != null) { values[m] = { alias: varName(ref[1]) }; continue }
      const lit = literal(t, resolve(raw, table))
      if (lit == null) return null
      values[m] = lit
    } else {
      const lit = literal(t, raw)
      if (lit == null) return null
      values[m] = lit
    }
  }
  return { name: varName(t.path), type, values, description: t.description }
}

export function tokensToFigma(files: TokenFiles) {
  const prim = flatten(files.primitives), sem = flatten(files.semantic), light = flatten(files.light), dark = flatten(files.dark)
  const table = { ...prim, ...sem, ...light }
  const collections: FigmaCollection[] = [
    // Los primitivos solo son la capa de gestión: en Figma quedan ocultos de los selectores (no se usan al diseñar)
    { name: "Primitivos", modes: ["Valor"], hidden: true, variables: Object.values(prim).map((t) => toVar(t, () => t.value, ["Valor"], table)).filter(Boolean) as FigmaVariable[] },
    { name: "Semánticos", modes: ["Valor"], variables: Object.values(sem).map((t) => toVar(t, () => t.value, ["Valor"], table)).filter(Boolean) as FigmaVariable[] },
    { name: "Color", modes: ["Claro", "Oscuro"], variables: Object.values(light).map((t) => toVar(t, (m) => (m === "Oscuro" ? dark[t.path]?.value ?? t.value : t.value), ["Claro", "Oscuro"], { ...table })).filter(Boolean) as FigmaVariable[] },
  ]
  const effects: FigmaEffect[] = Object.values(sem).filter((t) => t.type === "shadow").map((t) => {
    const v = resolve(t.value, table)
    const list = (Array.isArray(v) ? v : [v]).filter((s: any) => s && typeof s === "object")
    return { name: varName(t.path), description: t.description, shadows: list.map((s: any) => ({ color: s.color, x: px(s.offsetX) ?? 0, y: px(s.offsetY) ?? 0, blur: px(s.blur) ?? 0, spread: px(s.spread) ?? 0 })) }
  })
  return { collections, effects }
}

// ---------- Pantallas → árbol de nodos ----------
type Bind = Record<string, string>                    // propiedad de Figma → variable
type Paint = { color: string; token?: string }
export type FNode = {
  type: "FRAME" | "TEXT" | "SVG"
  name: string
  x: number; y: number; w: number; h: number
  layout?: { mode: "HORIZONTAL" | "VERTICAL"; gap: number; pad: [number, number, number, number]; main: string; cross: string; wrap?: boolean }
  absolute?: boolean
  sizing?: { h: "FIXED" | "FILL" | "HUG"; v: "FIXED" | "FILL" | "HUG" }
  fill?: Paint
  stroke?: Paint & { weights: [number, number, number, number]; outside?: boolean }
  radius?: [number, number, number, number]
  effect?: string
  opacity?: number
  clip?: boolean
  bind?: Bind
  text?: { chars: string; family: string; weight: number; size: number; lineHeight?: number; letterSpacing?: number; align: string; upper?: boolean; color: Paint; bind: Bind; single: boolean }
  svg?: string
  icon?: string                                        // nombre del icono (lucide) → componente icon/<nombre>
  component?: { set: string; props: Record<string, string>; slot?: string }
  states?: Record<string, StatePatch>                 // solo mientras se mide: cómo cambia en cada estado // slot: lo que va en su slot (otro componente)
  link?: string                                        // al clicar, va a esta pantalla
  _h?: { grow: boolean; wClass: boolean; hClass: boolean; fillW: boolean; fillH: boolean } // solo mientras se mide
  children?: FNode[]
}

const CT = classTokens as Record<string, string[]>
// Componentes de shadcn/ui que pasan a ser componentes de Figma (las piezas «hoja»; los contenedores quedan como marcos)
const COMPONENT_SLOTS = new Set(["button", "badge", "checkbox", "input", "input-group", "avatar", "alert", "input-otp-slot", "separator", "label", "field-label", "switch", "kbd", "spinner", "steps",
  // piezas de shadcn/ui que salen en el catálogo (siempre con la misma forma)
  "textarea", "select-trigger", "native-select", "radio-group-item", "toggle", "toggle-group-item", "tabs-trigger", "slider",
  "progress", "skeleton", "pagination-link", "breadcrumb-link",
  // propios
  "choice-card", "setting-row", "password-input", "icon-badge", "brand", "back-button", "step-footer", "code-input",
  "stat-card", "appointment-card", "fab-button", "tab-trigger", "app-sidebar-item", "app-tab-bar-item",
  // piezas de shadcn/ui con forma fija (cambia el texto, no la estructura)
  "item", "accordion-item", "bubble", "attachment", "marker", "command-item", "sidebar-menu-button", "navigation-menu-link",
  // listas: en Figma son componentes con un slot donde van las pestañas u opciones (las que pida cada pantalla)
  "tabs-list", "toggle-group", "tab-list",
  // cajas que se llenan con lo que haga falta (slot sin preferido) y menús (slot con sus opciones)
  "card", "dialog-content", "alert-dialog-content", "sheet-content", "drawer-content", "popover-content", "hover-card-content",
  "dropdown-menu-content", "context-menu-content", "menubar-content", "tooltip-content",
  "dropdown-menu-item", "context-menu-item", "menubar-item", "select-item"])
/** Componentes lista → el componente que se mete en su slot (preferido en Figma); "" = caja sin preferido. */
const SLOT_LISTS: Record<string, string> = {
  "tabs-list": "tabs-trigger", "toggle-group": "toggle-group-item", "tab-list": "tab-trigger",
  "dropdown-menu-content": "dropdown-menu-item", "context-menu-content": "context-menu-item", "menubar-content": "menubar-item",
  card: "", "dialog-content": "", "alert-dialog-content": "", "sheet-content": "", "drawer-content": "", "popover-content": "", "hover-card-content": "",
}
/** Piezas con estados (al pasar el ratón, al pulsar, con el foco, desactivadas, con error): en el catálogo salen todas como variantes. */
const STATEFUL = new Set(["button", "toggle", "toggle-group-item", "tabs-trigger", "tab-trigger", "input", "textarea", "select-trigger", "native-select",
  "checkbox", "switch", "radio-group-item", "pagination-link", "breadcrumb-link", "back-button", "fab-button", "app-sidebar-item", "app-tab-bar-item",
  "sidebar-menu-button", "command-item", "navigation-menu-link", "choice-card", "dropdown-menu-item", "context-menu-item", "menubar-item", "select-item"])
const STATE_PREFIX: [string, string][] = [["hover", "hover"], ["active", "pulsado"], ["focus-visible", "foco"], ["focus", "foco"], ["disabled", "deshabilitado"], ["aria-invalid", "error"]]
type StatePatch = { fill?: Paint; text?: Paint; stroke?: Paint; opacity?: number; focusRing?: { color: Paint; width: number } }

function rgba(c: string): [number, number, number, number] | null {
  if (!c) return null
  if (c.startsWith("#")) {
    const h = c.slice(1)
    const full = h.length <= 4 ? h.split("").map((x) => x + x).join("") : h
    const n = [0, 2, 4, 6].map((i) => (i < full.length ? parseInt(full.slice(i, i + 2), 16) : 255))
    return [n[0], n[1], n[2], Math.round((n[3] / 255) * 100) / 100]
  }
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map((x) => (x.endsWith("%") ? parseFloat(x) / 100 : parseFloat(x)))
  return [Math.round(p[0]), Math.round(p[1]), Math.round(p[2]), p.length > 3 ? Math.round(p[3] * 100) / 100 : 1]
}
const hex = (c: [number, number, number, number]) =>
  "#" + c.slice(0, 3).map((n) => n.toString(16).padStart(2, "0")).join("") + (c[3] < 1 ? Math.round(c[3] * 255).toString(16).padStart(2, "0") : "")
const sameColor = (a: string, b: string) => {
  const x = rgba(a), y = rgba(b)
  return !!x && !!y && x.every((v, i) => Math.abs(v - y[i]) <= (i === 3 ? 0.02 : 1))
}
const transparent = (c: string) => { const v = rgba(c); return !v || v[3] === 0 }

/** Clase sin prefijos de estado (hover:, md:, data-[…]:) ni opacidad (/90). Devuelve null si depende de un estado. */
function coreClass(cls: string, allowConditional: boolean) {
  let depth = 0, idx = -1
  for (let i = 0; i < cls.length; i++) {
    const ch = cls[i]
    if (ch === "[" || ch === "(") depth++
    else if (ch === "]" || ch === ")") depth--
    else if (ch === ":" && depth === 0) idx = i
  }
  if (idx >= 0 && !allowConditional) return null
  return cls.slice(idx + 1).replace(/^!/, "").replace(/!$/, "").replace(/\/\d+$/, "")
}

type Ctx = { table: Record<string, FlatToken>; resolved: Record<string, unknown>; semanticColors: string[] }

function classesOf(el: Element) { return (el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean) }

/** Tokens candidatos para una propiedad, según el prefijo de las clases del elemento. */
function candidates(el: Element, prefix: RegExp, conditional = true) {
  const out: string[] = []
  for (const c of classesOf(el)) {
    const core = coreClass(c, conditional)
    if (core && prefix.test(core)) for (const t of CT[core] ?? []) out.push(t)
  }
  return out
}

function pickNum(ctx: Ctx, cands: string[], value: number) {
  return cands.find((t) => { const v = px(ctx.resolved[t]); return v != null && Math.abs(v - value) < 0.5 })
}
function pickColor(ctx: Ctx, cands: string[], value: string, family?: RegExp) {
  const hit = cands.find((t) => ctx.table[t]?.type === "color" && typeof ctx.resolved[t] === "string" && sameColor(ctx.resolved[t] as string, value))
  if (hit || !family) return hit
  // Sin clase que lo diga (p. ej. el color de borde por defecto): el token semántico de esa familia con ese valor
  return ctx.semanticColors.find((t) => family.test(t) && sameColor(String(ctx.resolved[t]), value))
}
/** Para propiedades que se heredan (color y tipografía del texto): busca también en los padres. */
function inherited(el: Element | null, stop: Element, prefix: RegExp, test: (t: string) => boolean) {
  for (let e = el; e; e = e.parentElement) {
    const hit = candidates(e, prefix).find(test)
    if (hit) return hit
    if (e === stop) break
  }
  return undefined
}

const num = (v: string) => parseFloat(v) || 0
// Componentes que no escalan nunca: van con ancho y alto fijos en el auto layout (no «hug» ni «fill»)
const FIXED_SIZE = new Set(["switch", "checkbox", "avatar", "input-otp-slot", "spinner", "icon-badge", "radio-group-item"])
const fixedSize = (c: FNode) => !!c.component && (FIXED_SIZE.has(c.component.set) || (c.component.set === "button" && c.component.props.tamaño.startsWith("icon")))
// Desplazado en horizontal con transform (la barra de Progress, la bolita de Switch): en Figma va suelto en su sitio, si no el auto layout lo recoloca
const moved = (cs: CSSStyleDeclaration) => {
  // Solo en horizontal (los iconos llevan pequeños ajustes verticales que no cuentan).
  // Tailwind usa la propiedad `translate`; los componentes con style={{transform}}, `transform`.
  const tr = cs.translate && cs.translate !== "none" ? parseFloat(cs.translate) : 0
  const m = cs.transform.match(/^matrix\(([^)]+)\)$/)
  const tx = m ? parseFloat(m[1].split(",")[4]) : 0
  return Math.abs(tr) > 0.5 || Math.abs(tx) > 0.5
}
const visible = (el: Element, cs: CSSStyleDeclaration, r: DOMRect) =>
  !classesOf(el).includes("sr-only") && cs.opacity !== "0" && cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0 && !(r.width <= 1 && r.height <= 1)

function iconName(svg: Element) {
  const c = classesOf(svg).find((x) => x.startsWith("lucide-") && x !== "lucide")
  return c ? c.slice(7) : undefined
}

function slotName(el: Element) {
  let slot = el.getAttribute("data-slot")
  // Un botón que abre algo (menú, diálogo, popover…) lleva el data-slot del disparador, pero sigue siendo un Button
  // (lo mismo con los de cerrar o confirmar de un diálogo: dialog-close, alert-dialog-action…)
  if (slot && !COMPONENT_SLOTS.has(slot) && el.hasAttribute("data-variant") && el.hasAttribute("data-size") && (el.tagName === "BUTTON" || el.tagName === "A")) slot = "button"
  if (!slot || !COMPONENT_SLOTS.has(slot)) return null
  // Una etiqueta que envuelve un campo entero es una tarjeta de opción (con su casilla o interruptor), no una etiqueta
  if (slot === "field-label" && el.querySelector(":scope > [data-slot=field]")) return "choice-card"
  return slot === "field-label" ? "label" : slot
}

function serializeSvg(el: SVGElement, color: string) {
  const clone = el.cloneNode(true) as SVGElement
  const r = el.getBoundingClientRect()
  clone.setAttribute("width", String(Math.round(r.width)))
  clone.setAttribute("height", String(Math.round(r.height)))
  clone.removeAttribute("class")
  return clone.outerHTML.replace(/currentColor/g, hex(rgba(color) ?? [0, 0, 0, 1]))
}

function textStyle(ctx: Ctx, holder: Element, root: Element, chars: string, r: DOMRect) {
  const cs = getComputedStyle(holder)
  const size = num(cs.fontSize), weight = num(cs.fontWeight) || 400
  const lh = cs.lineHeight === "normal" ? undefined : num(cs.lineHeight)
  const color = cs.color
  const bind: Bind = {}
  const sizeTok = inherited(holder, root, /^text-/, (t) => ctx.table[t]?.type === "dimension" && Math.abs((px(ctx.resolved[t]) ?? -1) - size) < 0.5)
  if (sizeTok) bind.fontSize = sizeTok
  const weightTok = inherited(holder, root, /^font-/, (t) => Math.abs((px(ctx.resolved[t]) ?? -1) - weight) < 1)
  if (weightTok) bind.fontWeight = weightTok
  const famTok = inherited(holder, root, /^font-/, (t) => ctx.table[t]?.type === "fontFamily")
  const family = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim()
  const baseFam = ctx.resolved["text.family.base"]
  if (famTok) bind.fontFamily = famTok
  else if ((Array.isArray(baseFam) ? baseFam[0] : baseFam) === family) bind.fontFamily = "text.family.base"
  const colorTok = inherited(holder, root, /^(text|placeholder)-/, (t) => ctx.table[t]?.type === "color" && sameColor(String(ctx.resolved[t]), color))
    ?? ctx.semanticColors.find((t) => /^color\.text\./.test(t) && sameColor(String(ctx.resolved[t]), color))
  return {
    chars, size, weight, lineHeight: lh, letterSpacing: cs.letterSpacing === "normal" ? undefined : num(cs.letterSpacing),
    family,
    align: cs.textAlign === "center" ? "CENTER" : cs.textAlign === "right" || cs.textAlign === "end" ? "RIGHT" : "LEFT",
    upper: cs.textTransform === "uppercase" || undefined,
    color: { color: hex(rgba(color) ?? [0, 0, 0, 1]), token: colorTok }, bind,
    single: lh ? r.height < lh * 1.6 : r.height < size * 2,
  }
}

/** Deduce el auto layout de un elemento: flex directamente; bloque o grid si sus hijos van en fila o en columna. */
function layoutOf(cs: CSSStyleDeclaration, kids: DOMRect[], box: DOMRect): FNode["layout"] | undefined {
  // Solo el padding: el borde lo suma Figma (strokesIncludedInLayout, como box-sizing: border-box)
  const pad: [number, number, number, number] = [num(cs.paddingTop), num(cs.paddingRight), num(cs.paddingBottom), num(cs.paddingLeft)]
  const bw = [num(cs.borderTopWidth), num(cs.borderRightWidth), num(cs.borderBottomWidth), num(cs.borderLeftWidth)]
  const main = (v: string) => (v === "center" ? "CENTER" : v === "flex-end" || v === "end" ? "MAX" : v === "space-between" ? "SPACE_BETWEEN" : "MIN")
  const cross = (v: string) => (v === "center" ? "CENTER" : v === "flex-end" || v === "end" ? "MAX" : v === "baseline" ? "BASELINE" : v === "stretch" || v === "normal" ? "STRETCH" : "MIN")
  if (cs.display.includes("flex")) {
    const row = cs.flexDirection.startsWith("row")
    return { mode: row ? "HORIZONTAL" : "VERTICAL", gap: num(row ? cs.columnGap : cs.rowGap), pad, main: main(cs.justifyContent), cross: cross(cs.alignItems), wrap: cs.flexWrap === "wrap" || undefined }
  }
  if (kids.length === 0) return { mode: "VERTICAL", gap: 0, pad, main: "MIN", cross: "MIN" }
  const stacked = kids.every((r, i) => i === 0 || r.top >= kids[i - 1].bottom - 1)
  const inRow = !stacked && kids.every((r, i) => i === 0 || r.left >= kids[i - 1].right - 1)
  const gaps = kids.slice(1).map((r, i) => (stacked ? r.top - kids[i].bottom : r.left - kids[i].right))
  const even = gaps.every((g) => Math.abs(g - (gaps[0] ?? 0)) < 1.5)
  if (!even || (!stacked && !inRow)) return undefined
  // Alineación: si los hijos que no ocupan todo el ancho están centrados, el auto layout centra
  const left = box.left + pad[3] + bw[3], right = box.right - pad[1] - bw[1], top = box.top + pad[0] + bw[0], bottom = box.bottom - pad[2] - bw[2]
  let al = "MIN"
  if (stacked) {
    const narrow = kids.filter((k) => k.width < right - left - 1.5)
    if (narrow.length && narrow.every((k) => Math.abs((k.left - left) - (right - k.right)) < 2)) al = "CENTER"
    else if (narrow.length && narrow.every((k) => Math.abs(k.right - right) < 2)) al = "MAX"
  } else {
    if (kids.every((k) => Math.abs((k.top - top) - (bottom - k.bottom)) < 2)) al = "CENTER"
  }
  // Eje principal: si el bloque de hijos queda centrado (la marca de la casilla), el auto layout centra
  const first = kids[0], lastK = kids[kids.length - 1]
  const before = stacked ? first.top - top : first.left - left, after = stacked ? bottom - lastK.bottom : right - lastK.right
  const mainAl = before > 0.5 && Math.abs(before - after) < 1.5 ? "CENTER" : "MIN"
  return { mode: stacked ? "VERTICAL" : "HORIZONTAL", gap: Math.max(0, gaps[0] ?? 0), pad, main: mainAl, cross: al }
}

const NO_BOX = { display: "block", paddingTop: "0", paddingRight: "0", paddingBottom: "0", paddingLeft: "0", borderTopWidth: "0", borderRightWidth: "0", borderBottomWidth: "0", borderLeftWidth: "0" } as unknown as CSSStyleDeclaration
type Kid = { rect: DOMRect; absolute: boolean; make: () => FNode | null }

/** Agrupa los hijos de una rejilla en columnas (o filas) apiladas; cada grupo con más de un hijo pasa a ser un marco con auto layout. */
function gridGroups(ctx: Ctx, el: Element, kids: Kid[], box: DOMRect): Kid[] | null {
  const flow = kids.filter((k) => !k.absolute)
  if (flow.length < 2) return null
  const cs = getComputedStyle(el)
  const contentRight = box.right - num(cs.paddingRight) - num(cs.borderRightWidth)
  const contentBottom = box.bottom - num(cs.paddingBottom) - num(cs.borderBottomWidth)
  for (const axis of ["col", "row"] as const) {
    const lo = (k: Kid) => (axis === "col" ? k.rect.left : k.rect.top), hi = (k: Kid) => (axis === "col" ? k.rect.right : k.rect.bottom)
    let groups: Kid[][] = []
    let end = -Infinity
    for (const k of [...flow].sort((a, b) => lo(a) - lo(b))) {
      if (lo(k) >= end - 1) { groups.push([k]); end = hi(k) } else { groups[groups.length - 1].push(k); end = Math.max(end, hi(k)) }
    }
    let stack = false
    if (groups.length === flow.length && axis === "row") {
      stack = true
      // Una pila con huecos distintos (por ejemplo un margen extra bajo el icono): se corta por el hueco mayor
      // y los trozos con su hueco más pequeño van en otro auto layout dentro
      const gaps = groups.slice(1).map((g, i) => g[0].rect.top - groups[i][0].rect.bottom)
      const big = Math.max(...gaps)
      const cut: Kid[][] = [[groups[0][0]]]
      gaps.forEach((gp, i) => { if (Math.abs(gp - big) < 1.5) cut.push([groups[i + 1][0]]); else cut[cut.length - 1].push(groups[i + 1][0]) })
      groups = cut
    }
    if (groups.length < 2 || groups.length === flow.length) continue
    const inner = groups.map((g) => {
      const vertical = axis === "col" || stack
      g.sort((a, b) => (vertical ? a.rect.top - b.rect.top : a.rect.left - b.rect.left))
      const u = new DOMRect(Math.min(...g.map((k) => k.rect.left)), Math.min(...g.map((k) => k.rect.top)), 0, 0)
      const rect = new DOMRect(u.x, u.y, Math.max(...g.map((k) => k.rect.right)) - u.x, Math.max(...g.map((k) => k.rect.bottom)) - u.y)
      return { g, rect, layout: g.length > 1 ? layoutOf(NO_BOX, g.map((k) => k.rect), rect) : undefined }
    })
    if (inner.some((x) => x.g.length > 1 && (!x.layout || x.layout.mode !== (axis === "col" || stack ? "VERTICAL" : "HORIZONTAL")))) continue
    const gapTok = (v: number) => pickNum(ctx, candidates(el, /^(gap|space-[xy])/), v)
    const wrapped: Kid[] = inner.map(({ g, rect, layout }, i) => {
      if (g.length === 1) return g[0]
      const last = i === inner.length - 1
      return {
        rect, absolute: false, make: () => {
          const children = g.map((k) => k.make()).filter(Boolean) as FNode[]
          const dx = Math.round(rect.left - box.left), dy = Math.round(rect.top - box.top)
          for (const c of children) { c.x -= dx; c.y -= dy }
          const n: FNode = { type: "FRAME", name: stack ? "grupo" : axis === "col" ? "columna" : "fila", x: dx, y: dy, w: Math.round(rect.width), h: Math.round(rect.height), layout: layout!, children }
          const t = layout!.gap > 0 ? gapTok(layout!.gap) : undefined
          if (t) n.bind = { itemSpacing: t }
          sizeChildren(n, layout!, rect.width, rect.height)
          // La última columna que llega hasta el borde ocupa el resto (como 1fr)
          const grow = !stack && last && (axis === "col" ? Math.abs(rect.right - contentRight) < 1.5 : Math.abs(rect.bottom - contentBottom) < 1.5)
          n._h = { grow, wClass: false, hClass: false, fillW: false, fillH: false }
          return n
        },
      }
    })
    return [...wrapped, ...kids.filter((k) => k.absolute)]
  }
  return null
}

function hasSizeClass(el: Element, axis: "w" | "h") {
  return classesOf(el).some((c) => { const k = coreClass(c, false); return !!k && (k.startsWith("size-") || k.startsWith(axis + "-")) && !/-(full|auto|fit)$/.test(k) })
}

/** Tamaño de cada hijo dentro del auto layout (cw/ch: el hueco de dentro, sin padding ni borde). */
function sizeChildren(node: FNode, layout: NonNullable<FNode["layout"]>, cw: number, ch: number) {
  for (const c of node.children!) {
    const h = c._h ?? { grow: false, wClass: true, hClass: true, fillW: false, fillH: false }
    delete c._h
    if (c.absolute) continue
    if (fixedSize(c)) { c.sizing = { h: "FIXED", v: "FIXED" }; continue }
    const hugs = c.type === "TEXT" || !!c.layout
    // Un marco que abraza su contenido no puede tener hijos que lo rellenan: en Figma se encogería hasta casi nada
    // (el formulario del catálogo salía con los campos estrechos). En ese eje va con su ancho/alto fijo.
    const fills = (axis: "h" | "v") => !!c.children?.some((k) => !k.absolute && k.sizing?.[axis] === "FILL")
    const hug = (fixedClass: boolean, axis: "h" | "v") => (hugs && !fixedClass && !fills(axis) ? "HUG" : "FIXED")
    const textW = c.type === "TEXT" ? (c.text!.single ? "HUG" : "FIXED") : null
    if (layout.mode === "VERTICAL") {
      c.sizing = {
        h: h.fillW || Math.abs(c.w - cw) < 1.5 ? "FILL" : textW ?? hug(h.wClass, "h"),
        v: h.grow || h.fillH ? "FILL" : c.type === "TEXT" ? "HUG" : hug(h.hClass, "v"),
      }
    } else {
      c.sizing = {
        h: h.grow || h.fillW ? "FILL" : textW ?? hug(h.wClass, "h"),
        v: h.fillH || (layout.cross === "STRETCH" && Math.abs(c.h - ch) < 1.5 && !h.hClass) ? "FILL" : c.type === "TEXT" ? "HUG" : hug(h.hClass, "v"),
      }
    }
  }
}

function serialize(ctx: Ctx, el: Element, root: Element, parentRect: DOMRect): FNode | null {
  const cs = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  if (!visible(el, cs, r)) return null
  const base = { x: Math.round(r.left - parentRect.left), y: Math.round(r.top - parentRect.top), w: Math.round(r.width), h: Math.round(r.height) }

  if (el instanceof SVGElement && el.tagName.toLowerCase() === "svg") {
    const icon = iconName(el)
    const colorTok = inherited(el, root, /^(text|stroke|fill)-/, (t) => ctx.table[t]?.type === "color" && sameColor(String(ctx.resolved[t]), cs.color))
    return { type: "SVG", name: icon ? `icon/${icon}` : "svg", ...base, svg: serializeSvg(el, cs.color), icon, fill: { color: hex(rgba(cs.color) ?? [0, 0, 0, 1]), token: colorTok } }
  }

  const node: FNode = { type: "FRAME", name: el.getAttribute("data-slot") ?? el.tagName.toLowerCase(), ...base }
  if (cs.position === "absolute" || cs.position === "fixed" || moved(cs)) node.absolute = true

  // Caja: fondo, borde, radio, sombra, opacidad
  const bind: Bind = {}
  if (!transparent(cs.backgroundColor)) {
    node.fill = { color: hex(rgba(cs.backgroundColor)!), token: pickColor(ctx, candidates(el, /^bg-/), cs.backgroundColor, /^color\.(bg|surface)\./) }
  }
  const bw: [number, number, number, number] = [num(cs.borderTopWidth), num(cs.borderRightWidth), num(cs.borderBottomWidth), num(cs.borderLeftWidth)]
  if (bw.some((w) => w > 0) && !transparent(cs.borderTopColor)) {
    node.stroke = { color: hex(rgba(cs.borderTopColor)!), token: pickColor(ctx, candidates(el, /^border/), cs.borderTopColor, /^color\.border\./), weights: bw }
    const wt = pickNum(ctx, candidates(el, /^border/), Math.max(...bw))
    if (wt) bind.strokeWeight = wt
  }
  const rad: [number, number, number, number] = [num(cs.borderTopLeftRadius), num(cs.borderTopRightRadius), num(cs.borderBottomRightRadius), num(cs.borderBottomLeftRadius)]
  if (rad.some((v) => v > 0)) {
    node.radius = rad.map((v) => Math.min(v, Math.min(r.width, r.height) / 2)) as typeof rad
    const rt = pickNum(ctx, candidates(el, /^rounded/), rad[0])
    if (rt) bind.radius = rt
  }
  if (cs.boxShadow && cs.boxShadow !== "none") {
    const sh = candidates(el, /^shadow-/, false).find((t) => ctx.table[t]?.type === "shadow")
    if (sh) node.effect = varName(sh)
  }
  if (num(cs.opacity) < 1 && cs.opacity !== "") node.opacity = num(cs.opacity)
  if (cs.overflow === "hidden" || cs.overflow === "clip") node.clip = true

  // Contenido: texto suelto, campos, iconos y elementos hijos
  const kids: Kid[] = []
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    // Campos ocultos o invisibles (como el que hay debajo de las casillas del código) no se dibujan
    if (el.type === "checkbox" || el.type === "radio" || el.type === "hidden" || transparent(cs.color)) return null
    const val = el.value ? (el.type === "password" ? "•".repeat(el.value.length) : el.value) : el.placeholder
    if (val) {
      const ph = !el.value
      const pcs = getComputedStyle(el, "::placeholder")
      const left = r.left + num(cs.paddingLeft) + num(cs.borderLeftWidth)
      const tr = new DOMRect(left, r.top, Math.max(1, r.right - left - num(cs.paddingRight)), r.height)
      kids.push({ rect: tr, absolute: false, make: () => {
        const t = textStyle(ctx, el, root, val, tr)
        if (ph) {
          // placeholder:text-… → al quitar el prefijo queda text-…
          const tok = candidates(el, /^text-/).find((x) => ctx.table[x]?.type === "color" && sameColor(String(ctx.resolved[x]), pcs.color))
          t.color = { color: hex(rgba(pcs.color) ?? [0, 0, 0, 1]), token: tok }
        }
        return { type: "TEXT", name: ph ? "placeholder" : "valor", x: Math.round(tr.left - r.left), y: 0, w: Math.round(tr.width), h: Math.round(r.height), text: { ...t, single: true } }
      } })
    }
  } else {
    // Los trozos de texto seguidos (por ejemplo «… a {email}.») van juntos en un solo texto
    let run: Text[] = []
    const flush = () => {
      if (!run.length) return
      const first = run[0], last = run[run.length - 1]
      const chars = run.map((t) => t.textContent ?? "").join("").replace(/\s+/g, " ").trim()
      run = []
      if (!chars) return
      const range = document.createRange()
      range.setStart(first, 0); range.setEnd(last, (last.textContent ?? "").length)
      const tr = range.getBoundingClientRect()
      if (tr.width < 1) return
      kids.push({ rect: tr, absolute: false, make: () => ({ type: "TEXT", name: chars.slice(0, 40), x: Math.round(tr.left - r.left), y: Math.round(tr.top - r.top), w: Math.ceil(tr.width), h: Math.round(tr.height), text: textStyle(ctx, el, root, chars, tr) }) })
    }
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) { run.push(child as Text); continue }
      flush()
      if (child instanceof Element) {
        const ccs = getComputedStyle(child)
        const cr = child.getBoundingClientRect()
        if (!visible(child, ccs, cr)) continue
        kids.push({ rect: cr, absolute: ccs.position === "absolute" || ccs.position === "fixed" || moved(ccs), make: () => serialize(ctx, child, root, r) })
      }
    }
    flush()
  }

  const hints = {
    grow: num(cs.flexGrow) > 0, wClass: hasSizeClass(el, "w"), hClass: hasSizeClass(el, "h"),
    fillW: classesOf(el).some((c) => ["w-full", "size-full"].includes(coreClass(c, false) ?? "")),
    fillH: classesOf(el).some((c) => ["h-full", "min-h-full", "size-full"].includes(coreClass(c, false) ?? "")),
  }

  // Un elemento que solo tiene texto y no tiene caja propia se queda en un nodo de texto
  if (!node.fill && !node.stroke && !node.radius && !node.effect && kids.length === 1 && !(el instanceof HTMLInputElement) && num(cs.paddingTop) + num(cs.paddingLeft) === 0 && !slotName(el)) {
    const only = kids[0].make()
    if (only?.type === "TEXT") return { ...only, ...base, absolute: node.absolute, _h: hints }
  }

  let layout = layoutOf(cs, kids.filter((k) => !k.absolute).map((k) => k.rect), r)
  if (!layout) {
    // Rejilla (grid) en dos dimensiones, como el Alert (icono | título y descripción): en Figma, auto layout anidado.
    // Se agrupan los hijos por columnas (o por filas) y cada grupo es otro auto layout dentro.
    const grouped = gridGroups(ctx, el, kids, r)
    if (grouped) {
      kids.splice(0, kids.length, ...grouped)
      layout = layoutOf(cs, kids.filter((k) => !k.absolute).map((k) => k.rect), r)
    }
  }
  if (layout) {
    node.layout = layout
    const pc = (side: string) => candidates(el, new RegExp(`^p[${side}]?-`))
    const pads: [string, string, number][] = [["paddingTop", "ty", layout.pad[0]], ["paddingRight", "rx", layout.pad[1]], ["paddingBottom", "by", layout.pad[2]], ["paddingLeft", "lx", layout.pad[3]]]
    for (const [prop, sides, v] of pads) { if (v > 0) { const t = pickNum(ctx, pc(sides), v); if (t) bind[prop] = t } }
    if (layout.gap > 0) {
      // El hueco puede venir de gap-… del padre o del margen (mb-…, mt-…) de los hijos
      const fromKids = Array.from(el.children).flatMap((c) => candidates(c, /^m[tbyxlr]?-/))
      const t = pickNum(ctx, candidates(el, /^(gap|space-[xy])/).concat(fromKids), layout.gap)
      if (t) bind.itemSpacing = t
    }
  }
  if (Object.keys(bind).length) node.bind = bind
  node._h = hints

  node.children = kids.map((k) => k.make()).filter(Boolean) as FNode[]
  // Una capa encima que no pinta nada (sin fondo, borde ni contenido) sobra en Figma
  if (node.absolute && !node.fill && !node.stroke && !node.children.length) return null
  // Tamaño de cada hijo dentro del auto layout: rellenar (FILL), abrazar el contenido (HUG) o fijo (FIXED)
  if (layout) sizeChildren(node, layout, r.width - layout.pad[1] - layout.pad[3] - bw[1] - bw[3], r.height - layout.pad[0] - layout.pad[2] - bw[0] - bw[2])
  else for (const c of node.children) delete c._h

  const slot = slotName(el)
  if (slot) {
    // Siempre las mismas propiedades, para que las variantes encajen en Figma (y se reconozcan al volver a dibujar)
    const icons = (node.children ?? []).filter((c) => c.type === "SVG").length
    const texts = countText(node)
    const props: Record<string, string> = {
      variante: el.getAttribute("data-variant") || "default",
      tamaño: el.getAttribute("data-size") || "default",
      contenido: icons && texts ? "icono y texto" : icons ? "icono" : texts ? "texto" : "vacío",
      estado: stateOf(el, slot),
    }
    node.component = { set: slot, props }
    if (slot in SLOT_LISTS) { node.component.slot = SLOT_LISTS[slot]; props.contenido = SLOT_LISTS[slot] ? "lista" : "caja" }
    if (STATEFUL.has(slot) && props.estado === "normal") { const st = statePatches(ctx, el); if (Object.keys(st).length) node.states = st }
    node.name = slot
  }
  return node
}

// Componentes que llevan dentro su control (casilla, interruptor…): su estado es el del control
const CONTAINS_CONTROL = new Set(["choice-card", "setting-row"])
/** Cómo cambia una pieza en cada estado, leyendo sus clases (hover:bg-…, focus-visible:focus-ring, disabled:opacity-…). */
function statePatches(ctx: Ctx, el: Element): Record<string, StatePatch> {
  const color = (t: string): Paint => ({ color: hex(rgba(String(ctx.resolved[t])) ?? [0, 0, 0, 1]), token: t })
  const out: Record<string, StatePatch> = {}
  for (const c of classesOf(el)) {
    const i = c.lastIndexOf(":")
    if (i < 0) continue
    const pre = c.slice(0, i), core = c.slice(i + 1)
    const st = STATE_PREFIX.find(([p]) => p === pre)?.[1]
    if (!st) continue
    const toks = CT[core] ?? []
    const col = toks.find((t) => ctx.table[t]?.type === "color")
    const patch = (out[st] = out[st] ?? {})
    if (core === "focus-ring" || core === "focus-ring-inset") {
      const w = px(ctx.resolved["control.focus-ring-width"]) ?? 2
      if (col) patch.focusRing = { color: color(col), width: w }
    } else if (core.startsWith("bg-") && col) patch.fill = color(col)
    else if (core.startsWith("text-") && col) patch.text = color(col)
    else if (core.startsWith("border-") && col) patch.stroke = color(col)
    else if (core.startsWith("opacity-")) { const v = Number(ctx.resolved[toks[0]]); if (!isNaN(v)) patch.opacity = v }
  }
  for (const k of Object.keys(out)) if (!Object.keys(out[k]).length) delete out[k]
  return out
}

function applyState(n: FNode, p: StatePatch) {
  if (p.fill) n.fill = { ...p.fill }
  if (p.stroke) n.stroke = { ...p.stroke, weights: n.stroke?.weights ?? [1, 1, 1, 1] }
  if (p.focusRing) { const w = p.focusRing.width; n.stroke = { ...p.focusRing.color, weights: [w, w, w, w], outside: true } }
  if (p.opacity !== undefined) n.opacity = p.opacity
  if (p.text) {
    const walk = (k: FNode) => {
      if (k.type === "TEXT" && k.text) k.text.color = { ...p.text! }
      if (k.type === "SVG" && k.fill) k.fill = { ...p.text! }
      if (!k.component || k === n) (k.children ?? []).forEach(walk)
    }
    walk(n)
  }
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

/** Sección más en una tarjeta del catálogo («Estados», «Abierto»…): título y una fila de piezas. */
function addSection(screen: FNode, title: string, items: FNode[]) {
  if (!items.length || !screen.layout) return
  const proto = findText(screen, 2)
  const gap = 16, inner = screen.w - screen.layout.pad[1] - screen.layout.pad[3]
  // Fila con salto de línea: se calcula el alto que tendrá
  let x = 0, rowH = 0, h = 0
  for (const it of items) {
    it.x = 0; it.y = 0; delete it.absolute
    it.sizing = { h: it.sizing?.h === "FILL" ? "FIXED" : it.sizing?.h ?? "FIXED", v: it.sizing?.v === "FILL" ? "FIXED" : it.sizing?.v ?? "FIXED" }
    if (x > 0 && x + it.w > inner) { h += rowH + gap; x = 0; rowH = 0 }
    x += it.w + gap; rowH = Math.max(rowH, it.h)
  }
  h += rowH
  const row: FNode = { type: "FRAME", name: title.toLowerCase(), x: 0, y: 0, w: inner, h, sizing: { h: "FILL", v: "HUG" },
    layout: { mode: "HORIZONTAL", gap, pad: [0, 0, 0, 0], main: "MIN", cross: "CENTER", wrap: true }, children: items }
  const kids: FNode[] = []
  if (proto) { const t = clone(proto); t.text!.chars = title; t.name = title; t.sizing = { h: "HUG", v: "HUG" }; t.text!.single = true; kids.push(t) }
  kids.push(row)
  const th = proto ? proto.h + 8 : 0
  const sec: FNode = { type: "FRAME", name: title, x: 0, y: 0, w: inner, h: h + th, sizing: { h: "FILL", v: "HUG" },
    layout: { mode: "VERTICAL", gap: 8, pad: [0, 0, 0, 0], main: "MIN", cross: "MIN" }, children: kids }
  screen.children = [...(screen.children ?? []), sec]
  screen.h += sec.h + screen.layout.gap
}

function findText(n: FNode, depth: number): FNode | undefined {
  if (n.type === "TEXT" && depth <= 0) return n
  for (const c of n.children ?? []) { const t = depth > 0 ? findText(c, depth - 1) : undefined; if (t) return t }
  return undefined
}

/** En el catálogo: cada pieza con estados sale también en hover, pulsado, foco… (una vez por variante) */
function addStates(screen: FNode, seen: Set<string>) {
  const items: FNode[] = []
  const walk = (n: FNode) => {
    if (n.states && n.component) {
      const key = n.component.set + "|" + JSON.stringify(n.component.props)
      if (!seen.has(key)) {
        seen.add(key)
        for (const [st, patch] of Object.entries(n.states)) {
          const c = clone(n); delete c.states; delete c.link
          c.component!.props.estado = st
          stripStates(c)
          applyState(c, patch)
          items.push(c)
        }
      }
    }
    for (const c of n.children ?? []) walk(c)
  }
  walk(screen)
  addSection(screen, "Estados", items)
}

function stripStates(n: FNode) { delete n.states; for (const c of n.children ?? []) stripStates(c) }

function stateOf(el: Element, slot: string) {
  const step = el.getAttribute("data-step")
  if (step) return `paso ${step} de ${el.getAttribute("data-total")}`
  if (el.getAttribute("aria-invalid") === "true" || el.querySelector("[aria-invalid=true]") || el.closest("[data-invalid=true]")) return "error"
  if (el.hasAttribute("data-disabled") || el.hasAttribute("disabled")) return "deshabilitado"
  if (el.getAttribute("data-state") === "checked" || (CONTAINS_CONTROL.has(slot) && el.querySelector("[data-state=checked]"))) return "marcado"
  if (el.getAttribute("data-state") === "visible") return "visible"
  if (el.getAttribute("data-active") === "true" || el.getAttribute("data-state") === "active" || el.getAttribute("data-state") === "on" || el.getAttribute("aria-current") === "page") return "activo"
  return "normal"
}

function countText(n: FNode): number { return (n.type === "TEXT" ? 1 : 0) + (n.children ?? []).reduce((s, c) => s + countText(c), 0) }

/** Marca los botones y enlaces que llevan a otra pantalla (según `links` del prototipo). */
function markLinks(n: FNode, links: { text: string; to: string }[]) {
  const txt = allText(n).replace(/\s+/g, " ").trim()
  if (n.component && (n.component.set === "button")) {
    const hit = links.find((l) => txt === l.text) ?? links.find((l) => txt.startsWith(l.text))
    if (hit) n.link = hit.to
  }
  for (const c of n.children ?? []) markLinks(c, links)
}
function allText(n: FNode): string { return (n.text?.chars ?? "") + (n.children ?? []).map(allText).join(" ") }

export type PrototypeLink = { from: string; text: string; to: string }
export type FigmaExport = {
  format: typeof FIGMA_FORMAT
  system: { id: string; name: string }
  prototype: { slug: string; label: string; description: string }
  mode: "Claro" | "Oscuro"
  view: "mobile" | "desktop"
  createdAt: string
  collections: FigmaCollection[]
  effects: FigmaEffect[]
  screens: { id: string; label: string; node: FNode }[]
}

/** Recorre las pantallas ya dibujadas en la web (un elemento por pantalla) y arma el archivo para el plugin. */
type FlowInput = { view?: "mobile" | "desktop"; prototype: { slug: string; label: string; description: string; links?: PrototypeLink[] }; screens: { id: string; label: string; el: HTMLElement; open?: FNode[] }[] }

function flowScreens(ctx: Ctx, flow: FlowInput) {
  return flow.screens.flatMap((s) => {
    try { return [oneScreen(ctx, flow, s)] } catch (e) { console.warn("No se ha podido medir", s.label, e); return [] }
  })
}

function oneScreen(ctx: Ctx, flow: FlowInput, s: FlowInput["screens"][number]) {
  {
    const r = s.el.getBoundingClientRect()
    const node = serialize(ctx, s.el, s.el, r) ?? { type: "FRAME", name: s.label, x: 0, y: 0, w: Math.round(r.width), h: Math.round(r.height) }
    node.name = s.label
    node.x = 0; node.y = 0
    node.h = Math.max(node.h, Math.round(s.el.scrollHeight))
    node.sizing = { h: "FIXED", v: "FIXED" }
    delete node._h
    markLinks(node, (flow.prototype.links ?? []).filter((l) => l.from === s.id))
    if (s.open?.length) addSection(node, "Abierto", s.open.map(clone))
    return { id: s.id, label: s.label, node }
  }
}

/** Una pieza que se abre encima (diálogo, menú, panel…) medida aparte, para añadirla al catálogo. */
export function measureOpen(tokens: TokenFiles, mode: Mode, el: HTMLElement): FNode | null {
  try {
    const r = el.getBoundingClientRect()
    const n = serialize(makeCtx(tokens, mode), el, el, r)
    if (!n) return null
    delete n.absolute; delete n._h
    n.x = 0; n.y = 0
    n.sizing = { h: "FIXED", v: n.layout ? "HUG" : "FIXED" }
    return n
  } catch (e) { console.warn("No se ha podido medir", e); return null }
}

function makeCtx(tokens: TokenFiles, mode: Mode): Ctx {
  const table = { ...flatten(tokens.primitives), ...flatten(tokens.semantic), ...flatten(mode === "dark" ? tokens.dark : tokens.light) }
  const resolved: Record<string, unknown> = {}
  for (const t of Object.values(table)) resolved[t.path] = resolve(t.value, table)
  return { table, resolved, semanticColors: Object.keys(flatten(mode === "dark" ? tokens.dark : tokens.light)) }
}

export function buildFigmaExport(opts: {
  tokens: TokenFiles; mode: Mode; system: { id: string; name: string }
  prototype: { slug: string; label: string; description: string; links?: PrototypeLink[] }
  view: "mobile" | "desktop"
  screens: { id: string; label: string; el: HTMLElement }[]
}): FigmaExport {
  const { collections, effects } = tokensToFigma(opts.tokens)
  const screens = flowScreens(makeCtx(opts.tokens, opts.mode), opts)
  for (const s of screens) stripStates(s.node)
  return {
    format: FIGMA_FORMAT, system: opts.system,
    prototype: { slug: opts.prototype.slug, label: opts.prototype.label, description: opts.prototype.description },
    mode: opts.mode === "dark" ? "Oscuro" : "Claro", view: opts.view, createdAt: new Date().toISOString(),
    collections, effects, screens,
  }
}

export const FIGMA_BUNDLE_FORMAT = "dsc-figma-bundle@1"

/** Todo el sistema en un archivo: tokens una vez y todos los flujos (cada uno con sus pantallas). */
export function buildFigmaBundle(opts: {
  tokens: TokenFiles; mode: Mode; system: { id: string; name: string }; view: "mobile" | "desktop"; flows: FlowInput[]
}) {
  const { collections, effects } = tokensToFigma(opts.tokens)
  const ctx = makeCtx(opts.tokens, opts.mode)
  const seenStates = new Set<string>()
  return {
    format: FIGMA_BUNDLE_FORMAT, system: opts.system,
    mode: opts.mode === "dark" ? "Oscuro" : "Claro", view: opts.view, createdAt: new Date().toISOString(),
    collections, effects,
    flows: opts.flows.map((f) => {
      const screens = flowScreens(ctx, f)
      // Cada variante con sus estados una sola vez, aunque el catálogo vaya en varias páginas
      if (f.prototype.slug.startsWith("catalogo")) for (const s of screens) addStates(s.node, seenStates)
      for (const s of screens) stripStates(s.node)
      return { view: f.view, prototype: { slug: f.prototype.slug, label: f.prototype.label, description: f.prototype.description }, screens }
    }),
  }
}
