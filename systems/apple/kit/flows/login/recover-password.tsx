// Pantalla «Recuperar contraseña»: pide el email para enviar un enlace de cambio.
"use client"
import * as React from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "../../components/ui/field"
import { Input } from "../../components/ui/input"
import { Spinner } from "../../components/ui/spinner"
import { BackButton } from "../../components/custom/back-button"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RecoverPasswordScreen({ onSubmit, onBack, pending = false, defaultEmail = "", linkMinutes = 30 }: {
  /** Se llama con un email de formato válido. Por seguridad, responde igual exista o no la cuenta */
  onSubmit: (email: string) => void
  onBack: () => void
  pending?: boolean
  defaultEmail?: string
  /** Minutos que dura el enlace (sale en el texto) */
  linkMinutes?: number
}) {
  const [email, setEmail] = React.useState(defaultEmail)
  const [tried, setTried] = React.useState(false)
  const error = tried && !EMAIL.test(email) ? (email ? "Este email no parece correcto." : "Escribe tu email.") : ""
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (EMAIL.test(email)) onSubmit(email)
  }
  return (
    <Card>
      <CardHeader>
        <BackButton onClick={onBack} />
        <CardTitle className="text-title">Recupera tu contraseña</CardTitle>
        <CardDescription>Te enviamos un enlace para crear una nueva. Caduca en {linkMinutes} minutos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field data-invalid={!!error || undefined}>
              <FieldLabel htmlFor="recover-email">Email</FieldLabel>
              <Input id="recover-email" type="email" autoComplete="email" placeholder="tu@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error || undefined} />
              {error ? <FieldError>{error}</FieldError> : <FieldDescription>El mismo con el que entras.</FieldDescription>}
            </Field>
            <Button type="submit" className="w-full" disabled={pending}>{pending && <Spinner />}Enviar enlace</Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
