import { useEffect } from "react"
import { cssVars, type Mode, type TokenFiles } from "./tokens"

const SYSTEM_FONTS = ["ui-sans-serif", "system-ui", "sans-serif", "serif", "monospace", "ui-serif", "ui-monospace", "Georgia", "Arial", "Helvetica"]
const loaded = new Set<string>()

/** Carga de Google Fonts la primera familia de cada lista, si no es del sistema. */
export function loadFonts(families: string[]) {
  for (const f of families) {
    if (!f || SYSTEM_FONTS.includes(f) || loaded.has(f)) continue
    loaded.add(f)
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.crossOrigin = "anonymous" // para poder leer las fuentes al descargar pantallas en PNG
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;500;600;700&display=swap`
    document.head.appendChild(link)
  }
}

/** Aplica el tema de un sistema a toda la página mientras se está viendo. */
export function useSystemTheme(tokens: TokenFiles, mode: Mode) {
  useEffect(() => {
    const root = document.documentElement
    const vars = cssVars(tokens, mode)
    for (const [k, v] of Object.entries(vars)) if (v != null) root.style.setProperty(k, v)
    root.classList.toggle("dark", mode === "dark")
    const fam = tokens.primitives?.font?.family ?? {}
    loadFonts(Object.values(fam).map((t: any) => (Array.isArray(t.$value) ? t.$value[0] : t.$value)))
    return () => {
      for (const k of Object.keys(vars)) root.style.removeProperty(k)
      root.classList.remove("dark")
    }
  }, [tokens, mode])
}
