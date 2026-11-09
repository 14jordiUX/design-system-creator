// Pantalla «Entrar»: email, contraseña, recordarme, entrar con llave de acceso y enlace a crear cuenta.
// La comprobación de formato (email válido, campos vacíos) la hace la pantalla; la de la contraseña, tu servidor (prop `error`).
"use client"
import * as React from "react"
import { Mail, ShieldCheck, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { PasswordInput } from "@/components/custom/password-input"

export type SignInValues = { email: string; password: string; remember: boolean }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignInScreen({ onSubmit, onForgotPassword, onPasskey, onCreateAccount, error, pending = false, defaultEmail = "" }: {
  /** Se llama con los datos ya comprobados (email con formato válido y contraseña no vacía) */
  onSubmit: (values: SignInValues) => void
  onForgotPassword?: () => void
  /** Si no lo pasas, no sale el botón de llave de acceso */
  onPasskey?: () => void
  /** Si no lo pasas, no sale «¿No tienes cuenta? Crear una» */
  onCreateAccount?: () => void
  /** Error del servidor. "wrongPassword" muestra el aviso de contraseña incorrecta; cualquier otro texto, ese texto */
  error?: "wrongPassword" | (string & {}) | null
  /** Mientras se comprueba: el botón se desactiva y muestra un indicador */
  pending?: boolean
  defaultEmail?: string
}) {
  const [email, setEmail] = React.useState(defaultEmail)
  const [password, setPassword] = React.useState("")
  const [remember, setRemember] = React.useState(true)
  const [tried, setTried] = React.useState(false)
  const emailError = tried && !EMAIL.test(email) ? (email ? "Este email no parece correcto." : "Escribe tu email.") : ""
  const passError = tried && !password ? "Escribe tu contraseña." : ""
  const wrong = error === "wrongPassword"

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!EMAIL.test(email) || !password) return
    onSubmit({ email, password, remember })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-title">Entra en tu cuenta</CardTitle>
        <CardDescription>Usa el email con el que te registraste.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>{wrong ? "La contraseña no es correcta" : "No hemos podido entrar"}</AlertTitle>
                <AlertDescription>{wrong ? "Vuelve a intentarlo o recupérala si no la recuerdas." : error}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={!!emailError || undefined}>
              <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon><Mail /></InputGroupAddon>
                <InputGroupInput id="sign-in-email" type="email" autoComplete="email" placeholder="tu@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError || undefined} />
              </InputGroup>
              {emailError && <FieldError>{emailError}</FieldError>}
            </Field>
            <Field data-invalid={!!passError || wrong || undefined}>
              <div className="flex items-center justify-between gap-gap-sm">
                <FieldLabel htmlFor="sign-in-password">Contraseña</FieldLabel>
                {onForgotPassword && (
                  <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onForgotPassword}>¿La has olvidado?</Button>
                )}
              </div>
              <PasswordInput id="sign-in-password" value={password} onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passError || wrong || undefined} />
              {passError && <FieldError>{passError}</FieldError>}
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="sign-in-remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
              <FieldLabel htmlFor="sign-in-remember" className="font-normal">Recordarme en este dispositivo</FieldLabel>
            </Field>
            <Button type="submit" className="w-full" disabled={pending}>{pending && <Spinner />}Entrar</Button>
            {onPasskey && (
              <>
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">o</FieldSeparator>
                <Button type="button" variant="outline" className="w-full" onClick={onPasskey} disabled={pending}>
                  <ShieldCheck />Entrar con una llave de acceso
                </Button>
              </>
            )}
          </FieldGroup>
        </form>
      </CardContent>
      {onCreateAccount && (
        <CardFooter className="justify-center">
          <p className="text-ui text-muted-foreground">
            ¿No tienes cuenta? <Button variant="link" size="sm" className="h-auto p-0" onClick={onCreateAccount}>Crear una</Button>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
