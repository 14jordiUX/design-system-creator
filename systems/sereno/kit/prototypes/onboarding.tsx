// Prototipo «Onboarding»: 3 pantallas para dar la bienvenida, elegir intereses y activar avisos.
// Componentes: Card, Field, Button y Badge (shadcn/ui) y los propios Steps, Icon Badge, Choice Card, Setting Row y Step Footer. Ninguna clase fuera de los tokens.
//
// Cómo funciona un prototipo: recibe `screen` (la pantalla que toca) y `go(id)` (para ir a otra).
import { useState } from "react"
import { Bell, CalendarDays, ChartLine, MessagesSquare, Sparkles, UsersRound } from "lucide-react"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { FieldError, FieldGroup } from "../components/ui/field"
import { ChoiceCard } from "../components/custom/choice-card"
import { IconBadge } from "../components/custom/icon-badge"
import { SettingRow } from "../components/custom/setting-row"
import { StepFooter } from "../components/custom/step-footer"
import { Steps } from "../components/custom/steps"

export const meta = {
  label: "Onboarding",
  description: "Primera vez en la app: bienvenida, elegir qué te interesa y activar los avisos.",
  screens: [
    { id: "bienvenida", label: "Bienvenida" },
    { id: "intereses", label: "Tus intereses" },
    { id: "avisos", label: "Avisos" },
  ],
  links: [
    { from: "bienvenida", text: "Empezar", to: "intereses" },
    { from: "bienvenida", text: "Saltar", to: "avisos" },
    { from: "intereses", text: "Atrás", to: "bienvenida" },
    { from: "intereses", text: "Continuar", to: "avisos" },
    { from: "avisos", text: "Atrás", to: "intereses" },
    { from: "avisos", text: "Terminar", to: "bienvenida" },
  ],
  hints: [
    "En «Tus intereses» hay que elegir al menos uno para continuar.",
    "«Terminar» vuelve al principio para poder repetir el flujo.",
  ],
}

type Props = { screen: string; go: (id: string) => void }

const INTERESTS = [
  { id: "agenda", icon: CalendarDays, title: "Organizar mi agenda", text: "Citas, recordatorios y tareas." },
  { id: "equipo", icon: UsersRound, title: "Trabajar en equipo", text: "Compartir y repartir el trabajo." },
  { id: "datos", icon: ChartLine, title: "Ver mis números", text: "Informes claros cada semana." },
  { id: "clientes", icon: MessagesSquare, title: "Hablar con clientes", text: "Mensajes en un solo sitio." },
]

export default function Onboarding({ screen, go }: Props) {
  // Lo elegido se recuerda entre pantallas
  const [picked, setPicked] = useState<string[]>(["agenda"])
  return (
    <div className="flex min-h-full w-full items-center justify-center bg-muted p-inset-lg">
      <div className="w-full max-w-sheet">
        {screen === "bienvenida" && <Welcome go={go} />}
        {screen === "intereses" && <Interests go={go} picked={picked} setPicked={setPicked} />}
        {screen === "avisos" && <Notifications go={go} count={picked.length} />}
      </div>
    </div>
  )
}

function Welcome({ go }: { go: Props["go"] }) {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <IconBadge className="mx-auto mb-gap-sm"><Sparkles /></IconBadge>
        <Badge variant="secondary" className="mx-auto">Nuevo</Badge>
        <CardTitle className="text-title">Te damos la bienvenida</CardTitle>
        <CardDescription>En menos de un minuto dejamos la app a tu medida. Puedes cambiarlo todo más tarde.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-gap-sm">
        <Steps current={1} total={3} />
      </CardContent>
      <CardFooter className="flex flex-col gap-gap-sm">
        <Button className="w-full" onClick={() => go("intereses")}>Empezar</Button>
        <Button variant="ghost" className="w-full" onClick={() => go("avisos")}>Saltar</Button>
      </CardFooter>
    </Card>
  )
}

function Interests({ go, picked, setPicked }: { go: Props["go"]; picked: string[]; setPicked: (v: string[]) => void }) {
  const [tried, setTried] = useState(false)
  const toggle = (id: string, on: boolean) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id))
  const empty = tried && picked.length === 0
  return (
    <Card>
      <CardHeader>
        <Steps current={2} total={3} />
        <CardTitle className="text-title">¿Para qué la vas a usar?</CardTitle>
        <CardDescription>Elige lo que quieras. Así te enseñamos primero lo que te sirve.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-gap-sm">
          {INTERESTS.map(({ id, icon: Icon, title, text }) => (
            <ChoiceCard key={id} id={`interes-${id}`} icon={<Icon />} title={title} description={text}
              checked={picked.includes(id)} onCheckedChange={(v) => toggle(id, v)} />
          ))}
          {empty && <FieldError>Elige al menos uno para continuar.</FieldError>}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <StepFooter onBack={() => go("bienvenida")} onNext={() => { setTried(true); if (picked.length) go("avisos") }} />
      </CardFooter>
    </Card>
  )
}

function Notifications({ go, count }: { go: Props["go"]; count: number }) {
  return (
    <Card>
      <CardHeader>
        <Steps current={3} total={3} />
        <CardTitle className="text-title">¿Te avisamos?</CardTitle>
        <CardDescription>
          {count ? `Has elegido ${count} ${count === 1 ? "interés" : "intereses"}. ` : ""}Solo te escribimos cuando haya algo que hacer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <SettingRow id="aviso-movil" icon={<Bell />} title="Avisos en el móvil" description="Recordatorios y cambios importantes." defaultChecked />
          <SettingRow id="aviso-email" icon={<MessagesSquare />} title="Resumen por email" description="Una vez a la semana, los lunes." />
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <StepFooter onBack={() => go("intereses")} onNext={() => go("bienvenida")} nextLabel="Terminar" />
      </CardFooter>
    </Card>
  )
}
