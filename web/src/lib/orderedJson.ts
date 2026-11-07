// Escribe JSON con el mismo formato que Python (2 espacios) y respetando el orden de claves de un archivo existente.
// Hace falta porque JavaScript pone primero las claves que parecen números (space: 0, 1, 2… antes que $type y 0-5),
// y eso desordenaría las escalas en Figma y en la vista previa.

type Order = { keys: string[]; children: Record<string, Order> }

/** Lee el orden de las claves de un texto JSON (sin perder el orden original). */
export function readOrder(text: string): Order | null {
  let i = 0
  const ws = () => { while (/\s/.test(text[i])) i++ }
  const str = () => {
    let out = ""; i++
    while (text[i] !== '"') {
      if (text[i] === "\\") { out += JSON.parse(`"${text.slice(i, text[i + 1] === "u" ? i + 6 : i + 2)}"`); i += text[i + 1] === "u" ? 6 : 2 }
      else out += text[i++]
    }
    i++; return out
  }
  const value = (): Order | null => {
    ws()
    if (text[i] === "{") {
      i++; const o: Order = { keys: [], children: {} }
      ws(); if (text[i] === "}") { i++; return o }
      for (;;) {
        ws(); const k = str(); ws(); i++ // ':'
        const child = value()
        o.keys.push(k); if (child) o.children[k] = child
        ws(); if (text[i] === ",") { i++; continue }
        i++; return o
      }
    }
    if (text[i] === "[") {
      i++; ws(); if (text[i] === "]") { i++; return null }
      for (;;) { value(); ws(); if (text[i] === ",") { i++; continue } i++; return null }
    }
    if (text[i] === '"') { str(); return null }
    while (i < text.length && !/[,\]}\s]/.test(text[i])) i++
    return null
  }
  try { return value() } catch { return null }
}

/** JSON.stringify con 2 espacios, pero con las claves en el orden del archivo original (las nuevas, al final). */
export function stringifyOrdered(value: unknown, order: Order | null, indent = ""): string {
  const next = indent + "  "
  if (Array.isArray(value)) {
    if (!value.length) return "[]"
    return "[\n" + value.map((v) => next + stringifyOrdered(v, null, next)).join(",\n") + "\n" + indent + "]"
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const own = Object.keys(obj)
    if (!own.length) return "{}"
    const keys = order ? [...order.keys.filter((k) => k in obj), ...own.filter((k) => !order.keys.includes(k))] : own
    return "{\n" + keys.map((k) => `${next}${JSON.stringify(k)}: ${stringifyOrdered(obj[k], order?.children[k] ?? null, next)}`).join(",\n") + "\n" + indent + "}"
  }
  return JSON.stringify(value)
}

export const toFileText = (value: unknown, previousText?: string | null) =>
  stringifyOrdered(value, previousText ? readOrder(previousText) : null) + "\n"
