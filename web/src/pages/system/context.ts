import { createContext, useContext } from "react"
import type { DesignSystem } from "@/lib/systems"
import type { Mode, TokenFiles } from "@/lib/tokens"

export type SystemCtx = {
  ds: DesignSystem
  tokens: TokenFiles          // tokens actuales (con los cambios del editor)
  mode: Mode
  editor: boolean
  base: string                // ruta base: /s/id o /s/id/editar
  update: (file: keyof TokenFiles, path: string, value: any) => void
  /** Varios cambios a la vez (un solo paso de deshacer). Con `key`, los cambios seguidos con la misma clave se juntan. */
  updateMany: (changes: [keyof TokenFiles, string, any][], key?: string) => void
  dirty: boolean
}
export const Ctx = createContext<SystemCtx | null>(null)
export function useDS() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useDS fuera de un sistema")
  return c
}
