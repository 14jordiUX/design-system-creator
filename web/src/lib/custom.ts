// Componentes propios (paso 2.3): los que no vienen de shadcn/ui.
//   base/components/<slug>/          → los tienen todos los sistemas
//   systems/<id>/components/<slug>/  → solo ese sistema (si se llama igual que uno de base, manda este)
// Cada carpeta tiene <slug>.tsx (el componente) y demo.tsx (sus ejemplos). scripts/generate.py los copia a src/custom/.
import type { ReactNode } from "react"

export type CustomDemo = { label: string; description: string; examples: { title: string; description?: string; render: ReactNode; code: string }[] }
export type Custom = { slug: string; label: string; scope: string; demo: CustomDemo; source: string }

const demos = import.meta.glob("../custom/*/*/demo.tsx", { eager: true, import: "default" }) as Record<string, CustomDemo>
const sources = import.meta.glob("../custom/*/*/*.tsx", { eager: true, query: "?raw", import: "default" }) as Record<string, string>

const all: Custom[] = Object.entries(demos).map(([path, demo]) => {
  const [, , scope, slug] = path.split("/")
  return { slug, scope, label: demo.label, demo, source: sources[`../custom/${scope}/${slug}/${slug}.tsx`] ?? "" }
})

/** Componentes propios que tiene un sistema: los de base más los suyos. */
export function customFor(systemId: string): Custom[] {
  const map = new Map<string, Custom>()
  for (const c of all) if (c.scope === "base") map.set(c.slug, c)
  for (const c of all) if (c.scope === systemId && systemId !== "base") map.set(c.slug, c)
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}
