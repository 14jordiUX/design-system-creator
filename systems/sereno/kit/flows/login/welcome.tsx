// Pantalla «Bienvenida»: sesión iniciada, saludo y acceso a la app.
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"

export function WelcomeScreen({ name, avatarUrl, news, onContinue, onSignOut }: {
  name: string
  avatarUrl?: string
  /** Novedades desde la última visita (si es 0 o no lo pasas, no se menciona) */
  news?: number
  onContinue: () => void
  onSignOut: () => void
}) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <Avatar className="mx-auto mb-gap-sm size-avatar-xl">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Badge variant="secondary" className="mx-auto">Sesión iniciada</Badge>
        <CardTitle className="text-title">Hola de nuevo, {name.split(/\s+/)[0]}</CardTitle>
        <CardDescription>Todo listo.{news ? ` Tienes ${news} ${news === 1 ? "novedad" : "novedades"} desde tu última visita.` : ""}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-gap-sm">
        <Button className="w-full" onClick={onContinue}>Ir al inicio</Button>
        <Button variant="ghost" className="w-full" onClick={onSignOut}>Cerrar sesión</Button>
      </CardContent>
    </Card>
  )
}
