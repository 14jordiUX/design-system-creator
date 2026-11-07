// Carga los sistemas de diseño desde las carpetas del proyecto:
//   base/            -> la plantilla de la que parten todos
//   systems/<id>/    -> cada sistema creado
// Cada carpeta tiene system.json (la ficha) y tokens/*.tokens.json.
import type { TokenFiles } from "./tokens"

export type Principle = { title: string; text: string }
export type SystemMeta = {
  id: string
  name: string
  description: string
  productType?: string
  origin: "plantilla" | "cuestionario" | "conversacion" | "url" | "figma"
  isTemplate?: boolean
  createdAt: string
  updatedAt: string
  principles?: Principle[]
  notes?: Record<string, string>
  sourceUrl?: string
}
export type DesignSystem = {
  meta: SystemMeta
  /** Captura de la web de la que salió (sistemas creados «Desde una web») */
  reference?: string
  tokens: TokenFiles
  files: { css?: string; figma?: string; kit: Record<string, string> }
}

const metas = {
  ...import.meta.glob("../../../base/system.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../../systems/*/system.json", { eager: true, import: "default" }),
} as Record<string, SystemMeta>
const tokenFiles = {
  ...import.meta.glob("../../../base/tokens/*.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../../systems/*/tokens/*.json", { eager: true, import: "default" }),
} as Record<string, any>
const rawFiles = {
  ...import.meta.glob(["../../../base/css/tokens.css", "../../../base/figma/tokens-studio.json"], { eager: true, query: "?raw", import: "default" }),
  ...import.meta.glob(["../../../systems/*/css/tokens.css", "../../../systems/*/figma/tokens-studio.json"], { eager: true, query: "?raw", import: "default" }),
} as Record<string, string>

// Captura de la web de origen (solo en los sistemas creados desde una web)
const references = import.meta.glob("../../../systems/*/referencia.jpg", { eager: true, query: "?inline", import: "default" }) as Record<string, string>

// Kit de proyecto (texto), para descargarlo como .zip desde la web
const kitFiles = {
  ...import.meta.glob("../../../base/kit/**/*", { eager: true, query: "?raw", import: "default" }),
  ...import.meta.glob("../../../systems/*/kit/**/*", { eager: true, query: "?raw", import: "default" }),
} as Record<string, string>

const dirOf = (p: string) => p.replace(/\/system\.json$/, "")

export const ORIGIN_LABEL: Record<SystemMeta["origin"], string> = {
  plantilla: "Plantilla",
  cuestionario: "Cuestionario",
  conversacion: "Conversación con Claude",
  url: "Desde una web",
  figma: "Desde Figma",
}

export const systems: DesignSystem[] = Object.entries(metas).map(([path, meta]) => {
  const dir = dirOf(path)
  const tk = (name: string) => tokenFiles[`${dir}/tokens/${name}.tokens.json`] ?? {}
  return {
    meta,
    reference: references[`${dir}/referencia.jpg`],
    tokens: { primitives: tk("primitives"), semantic: tk("semantic"), light: tk("color.light"), dark: tk("color.dark") },
    files: {
      css: rawFiles[`${dir}/css/tokens.css`],
      figma: rawFiles[`${dir}/figma/tokens-studio.json`],
      kit: Object.fromEntries(Object.entries(kitFiles)
        .filter(([p]) => p.startsWith(`${dir}/kit/`))
        .map(([p, c]) => [p.slice(`${dir}/kit/`.length), c])),
    },
  }
})

export function getSystem(id?: string) {
  return systems.find((s) => s.meta.id === id)
}
