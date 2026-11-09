// Pantalla «Código de verificación» (segundo paso): 6 cifras; se envía sola al escribir la última.
"use client"
import * as React from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { FieldGroup } from "../../components/ui/field"
import { BackButton } from "../../components/custom/back-button"
import { CodeInput } from "../../components/custom/code-input"

export function VerifyCodeScreen({ email, onComplete, onResend, onBack, error, pending = false }: {
  /** A dónde se ha enviado el código (sale en el texto) */
  email: string
  /** Se llama al escribir la sexta cifra */
  onComplete: (code: string) => void
  onResend: () => void
  onBack: () => void
  /** Error del servidor, p. ej. "Ese código no es válido. Prueba otra vez." Se borra al volver a escribir */
  error?: string | null
  pending?: boolean
}) {
  const [code, setCode] = React.useState("")
  const [dirty, setDirty] = React.useState(false)
  const change = (value: string) => {
    setCode(value)
    setDirty(value.length < 6)
    if (value.length === 6) onComplete(value)
  }
  return (
    <Card>
      <CardHeader className="text-center">
        <BackButton onClick={onBack} />
        <CardTitle className="text-title">Confirma que eres tú</CardTitle>
        <CardDescription>Escribe el código de 6 cifras que te hemos enviado a {email}.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <CodeInput id="verify-code" value={code} onChange={change} autoFocus
            description={pending ? "Comprobando…" : "Se comprueba solo al escribir la última cifra."}
            error={!dirty && error ? error : undefined} />
          <Button variant="outline" className="w-full" disabled={pending} onClick={() => { setCode(""); setDirty(false); onResend() }}>
            Reenviar el código
          </Button>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
