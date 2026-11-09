import type { CustomDemo } from "@/lib/custom"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { PasswordInput } from "./password-input"

export default {
  label: "Password Input",
  description: "Campo de contraseña con candado y un botón para ver u ocultar lo escrito. Estados: oculta, visible y error.",
  examples: [
    { title: "Estados", render: (
      <div className="flex w-full max-w-sheet flex-col gap-gap-lg">
        <Field><FieldLabel htmlFor="pi-1">Contraseña</FieldLabel><PasswordInput id="pi-1" defaultValue="secreta123" /></Field>
        <Field><FieldLabel htmlFor="pi-2">Visible</FieldLabel><PasswordInput id="pi-2" defaultValue="secreta123" defaultVisible /></Field>
        <Field data-invalid><FieldLabel htmlFor="pi-3">Con error</FieldLabel><PasswordInput id="pi-3" defaultValue="1234" aria-invalid /><FieldError>La contraseña no es correcta.</FieldError></Field>
      </div>),
      code: `import { PasswordInput } from "@/components/custom/password-input"\n\n<PasswordInput id="password" />\n<PasswordInput id="password" aria-invalid />` },
  ],
} satisfies CustomDemo
