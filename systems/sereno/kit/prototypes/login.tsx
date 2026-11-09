// Prototipo «Iniciar sesión»: un flujo de varias pantallas que se puede clicar, montado SOLO con lo que ya tiene el sistema.
// Componentes: Card, Field, Input, Button, Checkbox, Alert, Avatar y Badge (shadcn/ui) y los propios Brand, Password Input,
// Back Button, Code Input e Icon Badge. Ninguna clase fuera de los tokens.
//
// Cómo funciona un prototipo: recibe `screen` (la pantalla que toca) y `go(id)` (para ir a otra).
// La web se encarga de recordar el camino, del botón «Atrás» del navegador, del mapa y de las descargas.
import { useState } from "react"
import { Mail, MailCheck, ShieldCheck, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Avatar, AvatarFallback } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Checkbox } from "../components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "../components/ui/field"
import { Input } from "../components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/ui/input-group"
import { BackButton } from "../components/custom/back-button"
import { Brand } from "../components/custom/brand"
import { CodeInput } from "../components/custom/code-input"
import { IconBadge } from "../components/custom/icon-badge"
import { PasswordInput } from "../components/custom/password-input"

export const meta = {
  label: "Iniciar sesión",
  description: "Entrar con email y contraseña, error de contraseña, recuperar la contraseña, verificación en dos pasos y bienvenida.",
  // Pantallas en el orden del flujo (el mapa las enseña así). La primera es la de inicio.
  screens: [
    { id: "entrar", label: "Entrar" },
    { id: "error", label: "Contraseña incorrecta" },
    { id: "recuperar", label: "Recuperar contraseña" },
    { id: "enviado", label: "Revisa tu correo" },
    { id: "codigo", label: "Código de verificación" },
    { id: "bienvenida", label: "Bienvenida" },
  ],
  // A dónde lleva cada botón (para conectar las pantallas como prototipo en Figma)
  links: [
    { from: "entrar", text: "¿La has olvidado?", to: "recuperar" },
    { from: "entrar", text: "Entrar con una llave", to: "codigo" },
    { from: "entrar", text: "Entrar", to: "error" },
    { from: "error", text: "¿La has olvidado?", to: "recuperar" },
    { from: "error", text: "Entrar con una llave", to: "codigo" },
    { from: "error", text: "Entrar", to: "codigo" },
    { from: "recuperar", text: "Volver", to: "entrar" },
    { from: "recuperar", text: "Enviar enlace", to: "enviado" },
    { from: "enviado", text: "Volver a entrar", to: "entrar" },
    { from: "enviado", text: "No me ha llegado", to: "recuperar" },
    { from: "codigo", text: "Volver", to: "entrar" },
    { from: "codigo", text: "Reenviar el código", to: "bienvenida" },
    { from: "bienvenida", text: "Cerrar sesión", to: "entrar" },
  ],
  // Lo que conviene saber para probarlo (sale junto al prototipo)
  hints: [
    "Una contraseña de menos de 6 caracteres da el error de contraseña.",
    "Cualquier código de 6 cifras sirve, menos 000000.",
  ],
}

type Props = { screen: string; go: (id: string) => void }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEMO_EMAIL = "lucia@ejemplo.com"

export default function Login({ screen, go }: Props) {
  return (
    <div className="flex min-h-full w-full items-center justify-center bg-muted p-inset-lg">
      <div className="w-full max-w-sheet">
        {screen === "entrar" && <SignIn go={go} />}
        {screen === "error" && <SignIn go={go} failed />}
        {screen === "recuperar" && <Recover go={go} />}
        {screen === "enviado" && <Sent go={go} />}
        {screen === "codigo" && <Code go={go} />}
        {screen === "bienvenida" && <Welcome go={go} />}
      </div>
    </div>
  )
}

function SignIn({ go, failed = false }: { go: Props["go"]; failed?: boolean }) {
  const [email, setEmail] = useState(failed ? DEMO_EMAIL : "")
  const [password, setPassword] = useState(failed ? "1234" : "")
  const [tried, setTried] = useState(failed)
  const emailError = tried && !EMAIL.test(email) ? (email ? "Este email no parece correcto." : "Escribe tu email.") : ""
  const passError = tried && !password ? "Escribe tu contraseña." : ""
  const wrong = failed

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!EMAIL.test(email) || !password) return
    go(password.length < 6 ? "error" : "codigo")
  }

  return (
    <>
      <Brand className="mb-gap-lg" />
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-title">Entra en tu cuenta</CardTitle>
          <CardDescription>Usa el email con el que te registraste.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate>
            <FieldGroup>
              {wrong && (
                <Alert variant="destructive">
                  <TriangleAlert />
                  <AlertTitle>La contraseña no es correcta</AlertTitle>
                  <AlertDescription>Vuelve a intentarlo o recupérala si no la recuerdas.</AlertDescription>
                </Alert>
              )}
              <Field data-invalid={!!emailError || undefined}>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon><Mail /></InputGroupAddon>
                  <InputGroupInput id="login-email" type="email" autoComplete="email" placeholder="tu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError || undefined} />
                </InputGroup>
                {emailError && <FieldError>{emailError}</FieldError>}
              </Field>
              <Field data-invalid={!!passError || wrong || undefined}>
                <div className="flex items-center justify-between gap-gap-sm">
                  <FieldLabel htmlFor="login-pass">Contraseña</FieldLabel>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => go("recuperar")}>
                    ¿La has olvidado?
                  </Button>
                </div>
                <PasswordInput id="login-pass" value={password} onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!passError || wrong || undefined} />
                {passError && <FieldError>{passError}</FieldError>}
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="login-remember" defaultChecked />
                <FieldLabel htmlFor="login-remember" className="font-normal">Recordarme en este dispositivo</FieldLabel>
              </Field>
              <Button type="submit" className="w-full">Entrar</Button>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">o</FieldSeparator>
              <Button type="button" variant="outline" className="w-full" onClick={() => go("codigo")}>
                <ShieldCheck />Entrar con una llave de acceso
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-ui text-muted-foreground">
            ¿No tienes cuenta? <Button variant="link" size="sm" className="h-auto p-0">Crear una</Button>
          </p>
        </CardFooter>
      </Card>
    </>
  )
}

function Recover({ go }: { go: Props["go"] }) {
  const [email, setEmail] = useState("")
  const [tried, setTried] = useState(false)
  const error = tried && !EMAIL.test(email) ? (email ? "Este email no parece correcto." : "Escribe tu email.") : ""
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (EMAIL.test(email)) go("enviado")
  }
  return (
    <>
      <Brand className="mb-gap-lg" />
      <Card>
        <CardHeader>
          <BackButton onClick={() => go("entrar")} />
          <CardTitle className="text-title">Recupera tu contraseña</CardTitle>
          <CardDescription>Te enviamos un enlace para crear una nueva. Caduca en 30 minutos.</CardDescription>
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
              <Button type="submit" className="w-full">Enviar enlace</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

function Sent({ go }: { go: Props["go"] }) {
  return (
    <>
      <Brand className="mb-gap-lg" />
      <Card>
        <CardHeader className="items-center text-center">
          <IconBadge variant="accent" className="mx-auto mb-gap-sm"><MailCheck /></IconBadge>
          <CardTitle className="text-title">Revisa tu correo</CardTitle>
          <CardDescription>
            Si hay una cuenta con ese email, te llegará un enlace en unos minutos. Mira también en la carpeta de spam.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-gap-sm">
          <Button className="w-full" onClick={() => go("entrar")}>Volver a entrar</Button>
          <Button variant="ghost" className="w-full" onClick={() => go("recuperar")}>No me ha llegado</Button>
        </CardContent>
      </Card>
    </>
  )
}

function Code({ go }: { go: Props["go"] }) {
  const [code, setCode] = useState("")
  const [tried, setTried] = useState(false)
  const bad = tried && code === "000000"
  const check = (value: string) => {
    setCode(value)
    if (value.length < 6) { setTried(false); return }
    setTried(true)
    if (value !== "000000") go("bienvenida")
  }
  return (
    <>
      <Brand className="mb-gap-lg" />
      <Card>
        <CardHeader className="text-center">
          <BackButton onClick={() => go("entrar")} />
          <CardTitle className="text-title">Confirma que eres tú</CardTitle>
          <CardDescription>Escribe el código de 6 cifras que te hemos enviado a {DEMO_EMAIL}.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <CodeInput id="login-code" value={code} onChange={check} autoFocus
              description="Se comprueba solo al escribir la última cifra."
              error={bad ? "Ese código no es válido. Prueba otra vez." : undefined} />
            <Button variant="outline" className="w-full" onClick={() => { setCode(""); setTried(false) }}>Reenviar el código</Button>
          </FieldGroup>
        </CardContent>
      </Card>
    </>
  )
}

function Welcome({ go }: { go: Props["go"] }) {
  return (
    <>
      <Brand className="mb-gap-lg" />
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="mx-auto mb-gap-sm size-avatar-xl"><AvatarFallback>LR</AvatarFallback></Avatar>
          <Badge variant="secondary" className="mx-auto">Sesión iniciada</Badge>
          <CardTitle className="text-title">Hola de nuevo, Lucía</CardTitle>
          <CardDescription>Todo listo. Tienes 3 novedades desde tu última visita.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-gap-sm">
          <Button className="w-full">Ir al inicio</Button>
          <Button variant="ghost" className="w-full" onClick={() => go("entrar")}>Cerrar sesión</Button>
        </CardContent>
      </Card>
    </>
  )
}
