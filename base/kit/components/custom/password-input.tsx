// Password Input: campo de contraseña con candado y botón para ver u ocultar lo escrito.
// Componente propio (base): lo tienen todos los sistemas. Estados: oculta, visible y error (aria-invalid).
"use client"
import * as React from "react"
import { Eye, EyeOff, LockKeyhole } from "lucide-react"
import { cn } from "../../lib/utils"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../ui/input-group"

function PasswordInput({ className, defaultVisible = false, ...props }: Omit<React.ComponentProps<"input">, "type"> & {
  /** Empieza mostrando la contraseña */
  defaultVisible?: boolean
}) {
  const [visible, setVisible] = React.useState(defaultVisible)
  return (
    <div data-slot="password-input" data-state={visible ? "visible" : "hidden"} className={cn("w-full", className)}>
      <InputGroup>
        <InputGroupAddon><LockKeyhole /></InputGroupAddon>
        <InputGroupInput type={visible ? "text" : "password"} autoComplete="current-password" {...props} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label={visible ? "Ocultar contraseña" : "Ver contraseña"} aria-pressed={visible} onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

export { PasswordInput }
