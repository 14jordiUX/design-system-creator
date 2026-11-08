// Calcula qué tokens usa un componente leyendo sus clases (cada clase apunta a uno o más tokens).
import CLASS_TOKENS from "../class-tokens.json"

const SOURCES = import.meta.glob("../components/ui/*.tsx", { eager: true, query: "?raw", import: "default" }) as Record<string, string>
const MAP = CLASS_TOKENS as Record<string, string[]>

export function core(token: string) {
  let depth = 0, idx = -1
  for (let i = 0; i < token.length; i++) {
    const c = token[i]
    if (c === "[" || c === "(") depth++
    else if (c === "]" || c === ")") depth--
    else if (c === ":" && depth === 0) idx = i
  }
  return token.slice(idx + 1).replace(/^!|!$/g, "")
}

export const TOKEN_GROUPS: [string, RegExp][] = [
  ["Color", /^color\./],
  ["Tipografía", /^(font|typography)\./],
  ["Espaciado y tamaños", /^(space|size|layout|control\.height)\./],
  ["Radios", /^radius\./],
  ["Sombras", /^(elevation|shadow)\./],
  ["Bordes y foco", /^control\.(border-width|focus-ring)/],
  ["Movimiento", /^(motion|duration|easing)\./],
  ["Opacidad", /^opacity\./],
]

// Componentes que no tienen archivo propio: se montan juntando otros
export const COMPOSED: Record<string, string[]> = {
  combobox: ["popover", "command", "button"],
  "date-picker": ["popover", "calendar", "button"],
  "data-table": ["table", "input", "button"],
  "chain-of-thought": ["trace", "badge", "message", "bubble"],
  "chat": ["message-scroller", "message", "bubble", "input-group"],
  "checkpoint": ["marker", "button", "message", "bubble"],
  "confirmation": ["item", "button", "trace", "message", "bubble"],
  "context": ["hover-card", "progress", "button"],
  "file-tree": ["collapsible", "button"],
  "inline-citation": ["hover-card", "button"],
  "model-selector": ["dropdown-menu", "input-group"],
  "prompt-input": ["input-group", "attachment", "dropdown-menu"],
  "stack-trace": ["trace", "code-block"],
  "subagent": ["trace", "code-block", "badge"],
  "suggestion": ["button", "input-group"],
  "terminal": ["trace", "code-block"],
  "test-results": ["trace", "code-block"],
  "tool": ["trace", "code-block"],
  ...Object.fromEntries(["plan", "queue", "reasoning", "sources", "task"].map((s) => [s, ["trace"]])),
  ...Object.fromEntries(["area-chart", "bar-chart", "line-chart", "pie-chart", "radar-chart", "radial-chart", "chart-tooltip"].map((s) => [s, ["chart"]])),
}

export function usedTokens(slug: string, customSource?: string) {
  const files = COMPOSED[slug] ?? [slug]
  const srcs = customSource != null ? [customSource] : files.map((f) => SOURCES[`../components/ui/${f}.tsx`])
  if (srcs.some((s) => !s)) return null
  const src = srcs.join("\n")
  const found = new Set<string>()
  for (const [, lit] of src.matchAll(/"([^"\n]+)"/g)) {
    for (const tok of lit.split(/\s+/)) {
      for (const p of MAP[core(tok)] ?? []) found.add(p)
    }
  }
  const groups = TOKEN_GROUPS.map(([name, re]) => [name, [...found].filter((p) => re.test(p)).sort()] as const)
  return groups.filter(([, list]) => list.length)
}

/** Tokens de una sola clase (con o sin variantes como hover:, focus-visible:…) */
export function tokensOfClass(cls: string): string[] {
  return MAP[core(cls)] ?? []
}
