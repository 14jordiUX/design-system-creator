// Lectura y resolución de tokens en formato W3C DTCG.
export type Json = any
export type TokenFiles = { primitives: Json; semantic: Json; light: Json; dark: Json }
export type Mode = "light" | "dark"
export type FlatToken = { path: string; value: Json; type?: string; description?: string }

export function flatten(obj: Json, prefix: string[] = [], inherited?: string, out: Record<string, FlatToken> = {}) {
  const type = obj?.$type ?? inherited
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (k.startsWith("$")) continue
    const path = [...prefix, k]
    if (v && typeof v === "object" && "$value" in (v as Json)) {
      const t = v as Json
      out[path.join(".")] = { path: path.join("."), value: t.$value, type: t.$type ?? type, description: t.$description }
    } else if (v && typeof v === "object") {
      flatten(v, path, type, out)
    }
  }
  return out
}

export function tableFor(files: TokenFiles, mode: Mode) {
  return {
    ...flatten(files.primitives),
    ...flatten(files.semantic),
    ...flatten(mode === "dark" ? files.dark : files.light),
  }
}

const REF = /^\{([^}]+)\}$/
export function resolve(value: Json, table: Record<string, FlatToken>, depth = 0): Json {
  if (depth > 20) return value
  if (typeof value === "string") {
    const m = value.match(REF)
    if (m && table[m[1]]) return resolve(table[m[1]].value, table, depth + 1)
    return value
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v, table, depth + 1))
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, table, depth + 1)]))
  }
  return value
}

/** Devuelve la ruta del token al que apunta un alias, o null si es un valor directo. */
export function aliasOf(value: Json): string | null {
  return typeof value === "string" && REF.test(value) ? value.slice(1, -1) : null
}

export function fontFamilyCss(v: Json) {
  const list = Array.isArray(v) ? v : [v]
  return list.map((f: string) => (/\s/.test(f) && !f.startsWith("ui-") ? `"${f}"` : f)).join(", ")
}

export function shadowCss(v: Json) {
  const list = Array.isArray(v) ? v : [v]
  return list.map((s: Json) => `${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color}`).join(", ")
}

export function toCss(value: Json, type?: string): string | null {
  if (type === "fontFamily") return fontFamilyCss(value)
  if (type === "shadow") return shadowCss(value)
  if (type === "cubicBezier" && Array.isArray(value)) return `cubic-bezier(${value.join(", ")})`
  if (type === "typography") return null
  if (typeof value === "string" || typeof value === "number") return String(value)
  return null
}

export function cssVarName(path: string) {
  return "--" + path.replace(/\./g, "-")
}

/** Variables CSS de un sistema para un modo, incluidos los alias que espera shadcn/ui. */
export function cssVars(files: TokenFiles, mode: Mode): Record<string, string> {
  const table = tableFor(files, mode)
  const vars: Record<string, string> = {}
  const PROPS: Record<string, string> = { fontFamily: "font-family", fontSize: "font-size", fontWeight: "font-weight", lineHeight: "line-height", letterSpacing: "letter-spacing" }
  for (const t of Object.values(table)) {
    const v = resolve(t.value, table)
    // Estilos de texto: una variable por propiedad (--typography-h1-font-size…), como en tokens.css
    if (t.type === "typography" && v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) if (PROPS[k]) vars[`${cssVarName(t.path)}-${PROPS[k]}`] = k === "fontFamily" ? fontFamilyCss(x) : String(x)
      continue
    }
    const css = toCss(v, t.type)
    if (css != null) vars[cssVarName(t.path)] = css
  }
  const v = (p: string) => vars[cssVarName(p)]
  Object.assign(vars, {
    "--background": v("color.bg.default"),
    "--foreground": v("color.text.default"),
    "--card": v("color.surface.card"),
    "--card-foreground": v("color.text.default"),
    "--popover": v("color.surface.popover"),
    "--popover-foreground": v("color.text.default"),
    "--primary": v("color.bg.action.primary.default"),
    "--primary-foreground": v("color.text.on-action.primary"),
    "--secondary": v("color.bg.action.secondary.default"),
    "--secondary-foreground": v("color.text.on-action.secondary"),
    "--muted": v("color.bg.muted"),
    "--muted-foreground": v("color.text.muted"),
    "--accent": v("color.bg.action.ghost.hover"),
    "--accent-foreground": v("color.text.on-action.ghost"),
    "--destructive": v("color.bg.feedback.danger.default"),
    "--destructive-foreground": v("color.text.on-feedback.danger"),
    "--border": v("color.border.default"),
    "--input": v("color.border.input"),
    "--ring": v("color.border.focus"),
    "--radius": v("radius.control"),
    "--font-ds": v("font.family.sans"),
    "--font-ds-mono": v("font.family.mono"),
  })
  return vars
}

// ---------- Contraste WCAG ----------
function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "")
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) return null
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}
function luminance(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a: string, b: string) {
  const la = luminance(a), lb = luminance(b)
  if (la == null || lb == null) return null
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Pares de texto y fondo que deben cumplir AA (4.5:1). */
export const CONTRAST_PAIRS: [string, string, string][] = [
  ["Texto principal sobre fondo", "color.text.default", "color.bg.default"],
  ["Texto secundario sobre fondo", "color.text.muted", "color.bg.default"],
  ["Texto principal sobre tarjeta", "color.text.default", "color.surface.card"],
  ["Enlace sobre fondo", "color.text.link", "color.bg.default"],
  ["Texto en color principal", "color.text.action.primary", "color.bg.default"],
  ["Botón principal", "color.text.on-action.primary", "color.bg.action.primary.default"],
  ["Botón secundario", "color.text.on-action.secondary", "color.bg.action.secondary.default"],
  ["Éxito", "color.text.on-feedback.success", "color.bg.feedback.success.default"],
  ["Aviso", "color.text.on-feedback.warning", "color.bg.feedback.warning.default"],
  ["Error", "color.text.on-feedback.danger", "color.bg.feedback.danger.default"],
  ["Info", "color.text.on-feedback.info", "color.bg.feedback.info.default"],
]

export function contrastReport(files: TokenFiles, mode: Mode) {
  const table = tableFor(files, mode)
  return CONTRAST_PAIRS.map(([label, fg, bg]) => {
    const f = resolve(table[fg]?.value, table), b = resolve(table[bg]?.value, table)
    const ratio = contrast(f, b)
    return { label, fg, bg, fgValue: f, bgValue: b, ratio, ok: ratio != null && ratio >= 4.5 }
  })
}

// ---------- Edición ----------
export function getAt(obj: Json, path: string) {
  return path.split(".").reduce((o, k) => o?.[k], obj)
}
/** Cambia el valor de un token. Si no existe, lo crea (por ejemplo, una familia tipográfica nueva).
 *  Con `value === undefined` lo borra. */
export function setTokenValue(files: TokenFiles, file: keyof TokenFiles, path: string, value: Json): TokenFiles {
  const copy: TokenFiles = structuredClone(files)
  const keys = path.split(".")
  const last = keys.pop()!
  let parent = copy[file]
  for (const k of keys) {
    if (value === undefined && !parent?.[k]) return copy
    parent = parent[k] ??= {}
  }
  if (value === undefined) { delete parent[last]; return copy }
  const node = parent[last]
  if (node && typeof node === "object" && "$value" in node) node.$value = value
  else parent[last] = { $value: value }
  return copy
}
