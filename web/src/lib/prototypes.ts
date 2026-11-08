// Prototipos: flujos de varias pantallas que se pueden clicar, hechos solo con componentes y tokens del sistema.
//   base/prototypes/<slug>/<slug>.tsx          → los tienen todos los sistemas
//   systems/<id>/prototypes/<slug>/<slug>.tsx  → solo ese sistema
// Cada archivo exporta `meta` ({ label, description, screens, hints? }) y por defecto el flujo, que recibe
// `screen` (id de la pantalla que se ve) y `go(id)` (para pasar a otra). scripts/generate.py los copia a src/prototypes/.
import type { ComponentType } from "react"

export type Screen = { id: string; label: string }
// links: a qué pantalla lleva cada botón (por su texto); sirve para conectar las pantallas como prototipo en Figma
export type PrototypeLink = { from: string; text: string; to: string }
export type PrototypeMeta = { label: string; description: string; screens: Screen[]; hints?: string[]; links?: PrototypeLink[] }
export type FlowProps = { screen: string; go: (id: string) => void }
export type Prototype = { slug: string; scope: string; meta: PrototypeMeta; Component: ComponentType<FlowProps>; source: string }

const mods = import.meta.glob("../prototypes/*/*/*.tsx", { eager: true }) as Record<string, { default: ComponentType<FlowProps>; meta?: PrototypeMeta }>
const sources = import.meta.glob("../prototypes/*/*/*.tsx", { eager: true, query: "?raw", import: "default" }) as Record<string, string>

const all: Prototype[] = Object.entries(mods).flatMap(([path, m]) => {
  const [, , scope, slug, file] = path.split("/")
  if (file !== `${slug}.tsx` || !m.meta?.screens?.length) return []
  return [{ slug, scope, meta: m.meta, Component: m.default, source: sources[path] ?? "" }]
})

/** Prototipos que tiene un sistema: los de base más los suyos. */
export function prototypesFor(systemId: string): Prototype[] {
  const map = new Map<string, Prototype>()
  for (const p of all) if (p.scope === "base") map.set(p.slug, p)
  for (const p of all) if (p.scope === systemId && systemId !== "base") map.set(p.slug, p)
  return [...map.values()].sort((a, b) => a.meta.label.localeCompare(b.meta.label))
}

/** Dirección pública del prototipo a pantalla completa (para test con usuarios o para incrustar). */
export function prototypeUrl(systemId: string, slug: string, opts: { mode?: "light" | "dark"; screen?: string } = {}) {
  const q = new URLSearchParams()
  if (opts.mode === "dark") q.set("modo", "oscuro")
  if (opts.screen) q.set("pantalla", opts.screen)
  const qs = q.toString()
  return `${location.origin}${location.pathname}#/p/${systemId}/${slug}${qs ? "?" + qs : ""}`
}
