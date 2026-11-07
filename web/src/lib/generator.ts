// Generador del cuestionario (paso 1.5): convierte las respuestas en tokens.
// Parte siempre de los tokens del sistema base y solo cambia PRIMITIVOS;
// los semánticos siguen apuntando a ellos, así que todo el sistema se actualiza solo.
// Tiene un gemelo en Python (scripts/new_system.py) que usa Claude en conversación: si cambias uno, cambia el otro
// y comprueba con `python scripts/check_generator.py`.
import type { TokenFiles } from "./tokens"

export const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const

export type Answers = {
  name: string
  description: string
  productType: string
  sober: number      // 0 sobrio … 100 expresivo
  serious: number    // 0 serio … 100 cercano
  dense: number      // 0 denso … 100 espacioso
  brand: string      // color de marca (será el tono 600, el de los botones)
  warmNeutral: boolean
  font: string
  scale: "compacta" | "normal" | "amplia"
  radius: number     // px del radio de controles (radius.md)
  border: number     // px del borde fino
  unit: "4" | "8"
  density: number    // 0 compacto … 100 amplio
  shadow: number     // 0 suaves … 100 marcadas
  speed: number      // 0 rápidas … 100 lentas
}

export const DEFAULT_ANSWERS: Omit<Answers, "brand"> = {
  name: "", description: "", productType: "",
  sober: 40, serious: 50, dense: 50,
  warmNeutral: false, font: "Inter", scale: "normal",
  radius: 6, border: 1, unit: "4", density: 50, shadow: 50, speed: 50,
}

/** Los deslizadores de carácter mueven a la vez varios controles de los pasos siguientes. */
export function fromCharacter(a: Answers, key: "sober" | "serious" | "dense", v: number): Partial<Answers> {
  if (key === "serious") return { serious: v, radius: Math.round(2 + v * 0.14), warmNeutral: v >= 60 }
  if (key === "dense") return { dense: v, density: v, scale: v < 34 ? "compacta" : v > 66 ? "amplia" : "normal" }
  return { sober: v, shadow: Math.round(25 + v * 0.6), speed: Math.round(70 - v * 0.4) }
}

// ---------- color: OKLCH ----------
type Lch = [number, number, number]
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function hexToOklch(hex: string): Lch {
  const [r, g, b] = [1, 3, 5].map((i) => toLin(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360]
}

function oklchToRgb([L, C, H]: Lch): [number, number, number] {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** Pasa a hex reduciendo el croma hasta que el color existe en pantalla (sRGB). */
export function oklchToHex([L, C, H]: Lch): string {
  let c = C
  for (let i = 0; i < 30; i++) {
    const rgb = oklchToRgb([L, c, H])
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) break
    c *= 0.92
  }
  return "#" + oklchToRgb([L, c, H]).map((v) => Math.round(Math.min(1, Math.max(0, toSrgb(Math.min(1, Math.max(0, v))))) * 255).toString(16).padStart(2, "0")).join("")
}

// Luminosidad de cada tono (de 50 a 950). El 600 se sustituye por el color elegido.
const L_TARGET = [0.975, 0.94, 0.885, 0.81, 0.72, 0.63, 0.54, 0.46, 0.39, 0.32, 0.24]
// Croma relativo: los extremos más apagados, el centro con todo el color.
const C_CURVE = [0.12, 0.25, 0.45, 0.7, 0.9, 1, 1, 0.92, 0.8, 0.66, 0.5]

/** Escala de 11 tonos a partir de un color, que queda exactamente como tono 600. */
export function brandScale(hex: string): string[] {
  const [L0, C0, H] = hexToOklch(hex)
  const anchor = 6
  return STEPS.map((_, i) => {
    if (i === anchor) return hex.toLowerCase()
    // Reparte la luminosidad respetando la del color elegido
    const t = L_TARGET[i]
    const L = i < anchor
      ? L0 + (t - L_TARGET[anchor]) * ((L_TARGET[0] - L0) / (L_TARGET[0] - L_TARGET[anchor]))
      : L0 + (t - L_TARGET[anchor]) * ((L0 - 0.2) / (L_TARGET[anchor] - L_TARGET[10]))
    return oklchToHex([Math.min(0.985, Math.max(0.16, L)), C0 * C_CURVE[i], H])
  })
}

/** Grises: fríos (azulados) o cálidos (piedra); cuanto más expresivo, más se tiñen del color de marca. */
export function neutralScale(warm: boolean, brandHex: string, expressive: number): string[] {
  const brandHue = hexToOklch(brandHex)[2]
  const hue = expressive > 60 ? brandHue : warm ? 60 : 265
  const chroma = (warm ? 0.008 : 0.006) + Math.max(0, expressive - 60) / 40 * 0.01
  const L = [0.985, 0.967, 0.92, 0.87, 0.71, 0.55, 0.44, 0.37, 0.27, 0.21, 0.145]
  return L.map((l, i) => oklchToHex([l, chroma * C_CURVE[Math.min(i + 2, 10)] * 1.1, hue]))
}

// ---------- utilidades ----------
const px = (v: string) => parseFloat(v)
const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step)
const each = (group: any, fn: (k: string, t: any) => void) =>
  Object.entries(group).forEach(([k, t]) => { if (!k.startsWith("$")) fn(k, t) })

/** Aplica las respuestas a una copia de los tokens base. */
export function buildTokens(base: TokenFiles, a: Answers): TokenFiles {
  const t: TokenFiles = structuredClone(base)
  const p = t.primitives

  // Color
  brandScale(a.brand).forEach((c, i) => (p.color.brand[STEPS[i]].$value = c))
  neutralScale(a.warmNeutral, a.brand, a.sober).forEach((c, i) => (p.color.neutral[STEPS[i]].$value = c))

  // Tipografía
  const stack = (f: string) => [f, "ui-sans-serif", "system-ui", "sans-serif"]
  p.font.family.sans.$value = stack(a.font)
  const f = { compacta: 0.92, normal: 1, amplia: 1.08 }[a.scale]
  each(base.primitives.font.size, (k, tk) => {
    const v = px(tk.$value)
    p.font.size[k].$value = `${v <= 16 ? Math.round(v * (f < 1 ? 0.95 : 1)) : roundTo(v * f, 2)}px`
  })
  // Expresivo: titulares más gruesos
  if (a.sober > 66) p.font.weight.semibold.$value = 700

  // Forma
  const r = a.radius
  const radius: Record<string, number> = { xs: r / 3, sm: (r * 2) / 3, md: r, lg: r * 1.4, xl: r * 2, "2xl": r * 2.6 }
  Object.entries(radius).forEach(([k, v]) => (p.radius[k].$value = `${Math.round(v)}px`))
  p["border-width"]["1"].$value = `${a.border}px`
  p["border-width"]["2"].$value = `${a.border + 1}px`

  // Espaciado: densidad (×0,85 … ×1,2) y rejilla de 4 u 8 px
  const d = 0.85 + (a.density / 100) * 0.35
  const unit = Number(a.unit)
  each(base.primitives.space, (k, tk) => {
    const v = px(tk.$value)
    if (v === 0) return
    const step = v < 8 ? 2 : v < 16 ? 4 : unit
    p.space[k].$value = `${roundTo(v * d, step)}px`
  })

  // Profundidad: opacidad de las sombras (×0,5 … ×1,8)
  const s = 0.5 + (a.shadow / 100) * 1.3
  each(base.primitives.shadow, (k, tk) => {
    const col: string = tk.$value.color
    const alpha = Math.min(255, Math.round(parseInt(col.slice(7, 9), 16) * s))
    p.shadow[k].$value = { ...tk.$value, color: col.slice(0, 7) + alpha.toString(16).padStart(2, "0") }
  })

  // Movimiento: duración (×0,7 … ×1,5), sin tocar instant ni el bucle
  const m = 0.7 + (a.speed / 100) * 0.8
  each(base.primitives.duration, (k, tk) => {
    if (k === "instant" || k === "loop") return
    p.duration[k].$value = `${Math.round((px(tk.$value) * m) / 10) * 10}ms`
  })
  return t
}

/** Nombre de carpeta a partir del nombre: «Clínica Sol» → clinica-sol */
export function slugify(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "sistema"
}

/** Oscurece el color (mismo tono y croma) lo justo para que el texto blanco encima se lea (AA 4,5:1). */
export function readableOnWhite(hex: string, contrast: (a: string, b: string) => number | null): string {
  let [L, C, H] = hexToOklch(hex)
  let out = hex
  while ((contrast("#ffffff", out) ?? 0) < 4.5 && L > 0.2) { L -= 0.01; out = oklchToHex([L, C, H]) }
  return out
}
