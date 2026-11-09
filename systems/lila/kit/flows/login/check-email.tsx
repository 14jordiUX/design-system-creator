// Pantalla «Revisa tu correo»: confirma que se ha enviado el enlace de recuperación.
import { MailCheck } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { IconBadge } from "../../components/custom/icon-badge"

export function CheckEmailScreen({ onBackToSignIn, onNotReceived }: {
  onBackToSignIn: () => void
  /** «No me ha llegado»: normalmente vuelve a la pantalla de recuperar */
  onNotReceived: () => void
}) {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <IconBadge variant="accent" className="mx-auto mb-gap-sm"><MailCheck /></IconBadge>
        <CardTitle className="text-title">Revisa tu correo</CardTitle>
        <CardDescription>
          Si hay una cuenta con ese email, te llegará un enlace en unos minutos. Mira también en la carpeta de spam.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-gap-sm">
        <Button className="w-full" onClick={onBackToSignIn}>Volver a entrar</Button>
        <Button variant="ghost" className="w-full" onClick={onNotReceived}>No me ha llegado</Button>
      </CardContent>
    </Card>
  )
}
