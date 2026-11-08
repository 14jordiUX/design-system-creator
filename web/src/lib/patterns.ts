// Patrones: pantallas hechas juntando componentes (sin inventar nada: solo componentes y tokens del sistema).
//   base/patterns/<slug>/<slug>.tsx          → los tienen todos los sistemas
//   systems/<id>/patterns/<slug>/<slug>.tsx  → solo ese sistema
// Cada archivo exporta `meta` ({ label, description }) y por defecto la pantalla. scripts/generate.py los copia a src/patterns/.
import type { ComponentType } from "react"

export type PatternMeta = { label: string; description: string }
export type Pattern = { slug: string; scope: string; meta: PatternMeta; Component: ComponentType; source: string }

const mods = import.meta.glob("../patterns/*/*/*.tsx", { eager: true }) as Record<string, { default: ComponentType; meta?: PatternMeta }>
const sources = import.meta.glob("../patterns/*/*/*.tsx", { eager: true, query: "?raw", import: "default" }) as Record<string, string>

const all: Pattern[] = Object.entries(mods).flatMap(([path, m]) => {
  const [, , scope, slug, file] = path.split("/")
  if (file !== `${slug}.tsx` || !m.meta) return []
  return [{ slug, scope, meta: m.meta, Component: m.default, source: sources[path] ?? "" }]
})

/** Patrones que tiene un sistema: los de base más los suyos. */
export function patternsFor(systemId: string): Pattern[] {
  const map = new Map<string, Pattern>()
  for (const p of all) if (p.scope === "base") map.set(p.slug, p)
  for (const p of all) if (p.scope === systemId && systemId !== "base") map.set(p.slug, p)
  return [...map.values()].sort((a, b) => a.meta.label.localeCompare(b.meta.label))
}
