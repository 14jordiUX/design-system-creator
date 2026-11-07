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
  dirty: boolean
}
export const Ctx = createContext<SystemCtx | null>(null)
export function useDS() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useDS fuera de un sistema")
  return c
}
