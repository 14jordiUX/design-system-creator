// Journey «Pedir la primera cita» (Clínica Dental Ejemplo, ficticia) con el sistema Sereno, en dos variantes:
//   A: lo que hay hoy (el «Pide cita» en móvil solo está dentro del menú, el precio solo en las preguntas del pie,
//      formulario de 9 campos y botón pequeño).
//   B: CTA visible arriba y fijo en móvil, precio junto al botón, próximo hueco y cancelación gratis, formulario corto.
//
// Reglas de un journey (además de las de prototipos: solo componentes del sistema y clases de tokens):
// - Recibe `pantalla` (id de journey.json) y `variante` ("A", "B"…). Las diferencias se escriben con `variante === "B"`.
// - Se exporta a HTML sin JavaScript: para ir a otra pantalla, <Ir a="id"> (enlace) o <Formulario a="id"> (envío falso).
//   Nada de onClick para navegar. Lo que se abre y se cierra, con <details> (menú móvil, preguntas frecuentes).
// - Anotaciones para el simulador: data-sim-accion (principal, secundaria, salida), data-sim-responde="<duda>"
//   data-sim-compromiso (datos-personales, pago) y data-sim-objetivo="<id>" en lo que cuenta como objetivo al pulsarlo
//   (los objetivos se declaran en journey.json › objetivos, con su pantalla). Las dudas son las de las misiones del cliente en el simulador.
import { CalendarCheck, Clock, Menu, ShieldCheck, Stethoscope } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { AppointmentCard } from "@/components/custom/appointment-card"
import { Brand } from "@/components/custom/brand"
import { IconBadge } from "@/components/custom/icon-badge"
import { Formulario, Ir } from "@/journey"

type Props = { pantalla: string; variante: string }

const CLINICA = "Clínica Dental Ejemplo"
const PRECIO = "La primera visita, con revisión y diagnóstico, es gratuita y sin compromiso."

export default function PedirCita({ pantalla, variante }: Props) {
  const b = variante === "B"
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {pantalla === "inicio" && <Inicio b={b} />}
      {pantalla === "primera-visita" && <PrimeraVisita b={b} />}
      {pantalla === "elegir-hora" && <ElegirHora b={b} />}
      {pantalla === "tus-datos" && <TusDatos b={b} />}
      {pantalla === "confirmacion" && <Confirmacion />}
    </div>
  )
}

// ------------------------------------------------------------------ piezas comunes

type Enlace = { a: string; texto: string; principal?: boolean; objetivo?: string }

function Cabecera({ enlaces = [] }: { enlaces?: Enlace[] }) {
  return (
    <header className="border-b-thin bg-card">
      <div className="mx-auto flex w-full max-w-page items-center justify-between gap-gap-md px-inset-lg py-inset-md">
        <Ir a="inicio" className="rounded-control focus-visible:focus-ring">
          <Brand name={CLINICA} icon={<Stethoscope />} />
        </Ir>
        {enlaces.length > 0 && (
          <>
            <nav className="hidden items-center gap-gap-lg md:flex" aria-label="Principal">
              {enlaces.map((e) => <EnlaceNav key={e.texto} {...e} />)}
            </nav>
            {/* En móvil, lo mismo dentro del menú ☰ (también en el HTML, como pide el contrato) */}
            <details className="group relative md:hidden">
              <summary className="flex size-control-md cursor-pointer list-none items-center justify-center rounded-control border-thin [&::-webkit-details-marker]:hidden" aria-label="Menú">
                <Menu className="size-icon-md" />
              </summary>
              <div className="absolute right-0 z-floating mt-gap-xs grid min-w-menu-wide gap-gap-xs rounded-card border-thin bg-popover p-inset-md shadow-overlay">
                {enlaces.map((e) => <EnlaceNav key={e.texto} {...e} />)}
              </div>
            </details>
          </>
        )}
      </div>
    </header>
  )
}

function EnlaceNav({ a, texto, principal, objetivo }: Enlace) {
  if (principal)
    return <Button asChild size="sm"><Ir a={a} data-sim-accion="principal" data-sim-objetivo={objetivo}>{texto}</Ir></Button>
  return <Ir a={a} className="py-inset-xs text-ui text-foreground hover:text-link">{texto}</Ir>
}

function Contenido({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-page flex-1 px-inset-lg py-inset-2xl ${className}`}>{children}</main>
}

function Pregunta({ pregunta, children, responde }: { pregunta: string; children: React.ReactNode; responde?: string }) {
  return (
    <details className="group border-b-thin py-inset-sm" data-sim-responde={responde}>
      <summary className="cursor-pointer text-ui font-emphasis">{pregunta}</summary>
      <p className="pt-inset-xs text-ui text-muted-foreground">{children}</p>
    </details>
  )
}

function Pie({ contacto = true }: { contacto?: boolean }) {
  return (
    <footer className="border-t-thin bg-muted" id="contacto">
      <div className="mx-auto grid w-full max-w-page gap-gap-md px-inset-lg py-inset-2xl">
        {contacto && <p className="text-ui text-muted-foreground">Calle Ejemplo, 1 · 900 000 000 · Lunes a viernes de 9 a 20 h</p>}
        <h2 className="text-title">Preguntas frecuentes</h2>
        <div className="max-w-prose">
          <Pregunta pregunta="¿Cuánto cuesta la primera visita?" responde="precio">{PRECIO}</Pregunta>
          <Pregunta pregunta="¿Trabajáis con seguros?">Sí, con las principales aseguradoras.</Pregunta>
        </div>
      </div>
    </footer>
  )
}

function Tarjetas({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-gap-md sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([titulo, texto]) => (
        <Card key={titulo} className="gap-gap-xs p-inset-lg">
          <CardTitle className="text-body font-strong">{titulo}</CardTitle>
          <CardDescription>{texto}</CardDescription>
        </Card>
      ))}
    </div>
  )
}

function Destacado({ children, responde }: { children: React.ReactNode; responde: string }) {
  return (
    <p className="flex flex-wrap items-center gap-gap-sm rounded-card bg-accent px-inset-md py-inset-sm text-ui text-accent-foreground" data-sim-responde={responde}>
      {children}
    </p>
  )
}

const TRATAMIENTOS: [string, string][] = [
  ["Revisión y limpieza", "Revisión completa y limpieza profesional."],
  ["Ortodoncia", "Brackets y alineadores invisibles."],
  ["Implantes", "Recupera tus dientes con garantía."],
  ["Estética dental", "Blanqueamiento y carillas."],
]

// ------------------------------------------------------------------ pantallas

function Inicio({ b }: { b: boolean }) {
  const enlaces: Enlace[] = [
    { a: "primera-visita", texto: "Primera visita" },
    { a: "inicio#tratamientos", texto: "Tratamientos" },
    { a: "inicio#contacto", texto: "Contacto" },
    ...(b ? [] : [{ a: "elegir-hora", texto: "Pedir cita", principal: true, objetivo: "pulsa-pedir-cita" }]),
  ]
  return (
    <>
      <Cabecera enlaces={enlaces} />
      <Contenido className="grid gap-section">
        <section className="grid max-w-prose gap-gap-lg">
          <h1 className="text-h1">Tu sonrisa, en las mejores manos</h1>
          <p className="text-lead text-muted-foreground">
            {b ? "Más de veinte años cuidando de la salud dental de toda la familia, con un equipo cercano."
              : "Más de veinte años cuidando de la salud dental de toda la familia, con la tecnología más avanzada y un equipo cercano."}
          </p>
          {b ? (
            <div className="grid justify-items-start gap-gap-md">
              <Button asChild size="lg"><Ir a="elegir-hora" data-sim-accion="principal" data-sim-objetivo="pulsa-pedir-cita">Pide tu primera cita</Ir></Button>
              <Destacado responde="precio">
                <strong>Primera visita gratuita y sin compromiso.</strong> Incluye revisión y diagnóstico.
                <Ir a="primera-visita" className="text-link underline" data-sim-accion="secundaria">Qué incluye</Ir>
              </Destacado>
            </div>
          ) : (
            <div>
              <Button asChild variant="outline"><Ir a="primera-visita" data-sim-accion="secundaria">Conoce la clínica</Ir></Button>
            </div>
          )}
        </section>

        <div className="flex aspect-video w-full items-center justify-center rounded-card bg-muted text-ui text-muted-foreground">
          [ Imagen {b ? "de la clínica" : "grande de la clínica"} ]
        </div>

        <section className="grid gap-gap-lg" id="tratamientos">
          <h2 className="text-h2">Tratamientos</h2>
          <Tarjetas items={TRATAMIENTOS} />
        </section>
      </Contenido>

      {b && (
        <div className="sticky bottom-0 z-sticky border-t-thin bg-card p-inset-md md:hidden">
          <Button asChild size="lg" className="w-full"><Ir a="elegir-hora" data-sim-accion="principal" data-sim-objetivo="pulsa-pedir-cita">Pide tu primera cita · gratis</Ir></Button>
        </div>
      )}
      <Pie />
    </>
  )
}

function PrimeraVisita({ b }: { b: boolean }) {
  const enlaces: Enlace[] = [
    { a: "primera-visita", texto: "Primera visita" },
    { a: "inicio#tratamientos", texto: "Tratamientos" },
    ...(b ? [] : [{ a: "elegir-hora", texto: "Pedir cita", principal: true }]),
  ]
  return (
    <>
      <Cabecera enlaces={enlaces} />
      <Contenido className="grid gap-section">
        <section className="grid max-w-prose gap-gap-lg">
          <h1 className="text-h1">Tu primera visita</h1>
          <p className="text-lead text-muted-foreground">
            En la primera visita conocemos tu caso y te explicamos con calma las opciones de tratamiento.
          </p>
          {b && <Destacado responde="precio"><strong>Gratuita y sin compromiso.</strong></Destacado>}
        </section>
        <section className="grid gap-gap-lg" data-sim-responde="que-incluye">
          <h2 className="text-h2">Qué incluye</h2>
          <Tarjetas items={[
            ["Revisión completa", "Exploración de dientes y encías."],
            ["Radiografía", "Si hace falta, en la misma visita."],
            ["Diagnóstico y presupuesto", "Por escrito, para que lo pienses."],
          ]} />
        </section>
        <section>
          {b ? <Button asChild size="lg"><Ir a="elegir-hora" data-sim-accion="principal">Pide tu primera cita</Ir></Button>
            : <Button asChild size="sm"><Ir a="elegir-hora" data-sim-accion="principal">Reservar</Ir></Button>}
        </section>
      </Contenido>
      <Pie contacto={false} />
    </>
  )
}

const DIAS = ["Lun 30", "Mar 1", "Mié 2", "Jue 3", "Vie 4"]
const HORAS = ["10:00", "11:30", "17:00", "18:30"]

function ElegirHora({ b }: { b: boolean }) {
  return (
    <>
      <Cabecera />
      <Contenido className="grid max-w-content content-start gap-gap-xl">
        <h1 className="text-h1">Elige día y hora</h1>
        {b && (
          <Destacado responde="disponibilidad">
            <CalendarCheck className="size-icon-md" /><strong>Próximo hueco: mañana a las 10:00.</strong>
          </Destacado>
        )}
        <section className="grid gap-gap-md">
          <h2 className="text-h3">Día</h2>
          <div className="flex flex-wrap gap-gap-sm">
            {DIAS.map((d, i) => (
              <Button key={d} type="button" variant={i === 0 ? "default" : "outline"} aria-pressed={i === 0}>{d}</Button>
            ))}
          </div>
        </section>
        <section className="grid gap-gap-md">
          <h2 className="text-h3">Hora</h2>
          <div className="grid grid-cols-2 gap-gap-sm sm:grid-cols-4">
            {HORAS.map((h) => (
              <Button key={h} asChild variant="outline" size="lg">
                <Ir a="tus-datos" data-sim-accion="principal"><Clock />{h}</Ir>
              </Button>
            ))}
          </div>
        </section>
        {b && (
          <p className="flex items-center gap-gap-sm text-ui text-muted-foreground" data-sim-responde="cancelar">
            <ShieldCheck className="size-icon-md text-success-text" />Puedes cambiarla o cancelarla gratis hasta 24 horas antes.
          </p>
        )}
        <div>
          <Button asChild variant="link" className="p-0"><Ir a="inicio" data-sim-accion="salida">Volver</Ir></Button>
        </div>
      </Contenido>
    </>
  )
}

function Campo({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
    </Field>
  )
}

function TusDatos({ b }: { b: boolean }) {
  return (
    <>
      <Cabecera />
      <Contenido className="max-w-content">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="mb-gap-xs w-fit">Lun 30 · 10:00</Badge>
            <CardTitle className="text-h2">Tus datos</CardTitle>
            {b && <CardDescription>Solo lo necesario para confirmarte la cita. El resto lo vemos en la clínica.</CardDescription>}
          </CardHeader>
          <CardContent>
            {/* Formulario falso: no envía nada (los campos no llevan «name»), solo pasa a la confirmación */}
            <Formulario a="confirmacion" data-sim-compromiso="datos-personales">
              <FieldGroup>
                <Campo id="nombre" label="Nombre"><Input id="nombre" autoComplete="given-name" required /></Campo>
                {!b && <Campo id="apellidos" label="Apellidos"><Input id="apellidos" autoComplete="family-name" required /></Campo>}
                {!b && <Campo id="dni" label="DNI"><Input id="dni" required /></Campo>}
                {!b && <Campo id="nacimiento" label="Fecha de nacimiento"><Input id="nacimiento" type="date" required /></Campo>}
                <Campo id="telefono" label="Teléfono"><Input id="telefono" type="tel" autoComplete="tel" required /></Campo>
                <Campo id="email" label="Correo electrónico"><Input id="email" type="email" autoComplete="email" required /></Campo>
                {!b && <Campo id="direccion" label="Dirección"><Input id="direccion" autoComplete="street-address" required /></Campo>}
                {!b && (
                  <Campo id="conocido" label="¿Cómo nos has conocido?">
                    <NativeSelect id="conocido" required className="w-full" defaultValue="">
                      <NativeSelectOption value="">Elige una opción</NativeSelectOption>
                      <NativeSelectOption>Internet</NativeSelectOption>
                      <NativeSelectOption>Un amigo</NativeSelectOption>
                      <NativeSelectOption>Otro</NativeSelectOption>
                    </NativeSelect>
                  </Campo>
                )}
                {!b && <Campo id="comentarios" label="Comentarios"><Textarea id="comentarios" rows={3} /></Campo>}
                <Field orientation="horizontal" data-sim-responde={b ? "datos-seguros" : undefined}>
                  <input id="privacidad" type="checkbox" required className="mt-gap-3xs size-icon-md shrink-0 accent-primary" />
                  {b ? (
                    <FieldLabel htmlFor="privacidad" className="font-normal">
                      Acepto la política de privacidad. Solo usaremos tus datos para tu cita.
                    </FieldLabel>
                  ) : (
                    <FieldDescription>
                      <label htmlFor="privacidad" className="text-caption">
                        He leído y acepto la política de privacidad y el tratamiento de mis datos conforme a la normativa vigente.
                      </label>
                    </FieldDescription>
                  )}
                </Field>
                {b ? <Button type="submit" size="lg" className="w-full" data-sim-accion="principal" data-sim-objetivo="pulsa-confirmar">Confirmar cita</Button>
                  : <div><Button type="submit" size="sm" data-sim-accion="principal" data-sim-objetivo="pulsa-confirmar">Confirmar</Button></div>}
              </FieldGroup>
            </Formulario>
          </CardContent>
        </Card>
      </Contenido>
    </>
  )
}

function Confirmacion() {
  return (
    <>
      <Cabecera />
      <Contenido className="grid max-w-content content-start justify-items-center gap-gap-lg text-center">
        <IconBadge variant="success" size="lg"><CalendarCheck /></IconBadge>
        <h1 className="text-h1">¡Cita confirmada!</h1>
        <p className="text-body text-muted-foreground">Te hemos enviado un correo con los detalles. (Es un ejemplo: no se ha enviado nada.)</p>
        <AppointmentCard className="w-full text-left" treatment="Primera visita" doctor="Dra. Marta Ruiz" date="Lunes 30" time="10:00" place={CLINICA} />
        <Button asChild variant="link"><Ir a="inicio">Volver al inicio</Ir></Button>
      </Contenido>
    </>
  )
}
