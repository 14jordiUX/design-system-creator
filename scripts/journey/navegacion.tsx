// Navegación de los journeys: enlaces y formularios «de verdad» entre pantallas.
// Lo usan los journeys de systems/<id>/journeys/ (import { Ir, Formulario } from "@/journey").
// scripts/export_journey.mjs lo convierte en HTML normal: <a href="tus-datos.html"> y <form action="confirmacion.html">,
// que es lo que sigue el simulador de usuarios sintéticos (no ejecuta clics en JavaScript).
import * as React from "react"

type Contexto = { archivo: (pantalla: string) => string }

/** Qué archivo tiene cada pantalla. Lo pone el exportador; por defecto, <id>.html. */
export const JourneyContexto = React.createContext<Contexto>({ archivo: (id) => `${id}.html` })

function useArchivo() {
  return React.useContext(JourneyContexto).archivo
}

/** Enlace a otra pantalla del journey. `a` es el id de la pantalla (y opcionalmente #ancla: "inicio#tratamientos").
 *  Para que parezca un botón: <Button asChild><Ir a="elegir-hora">Pide cita</Ir></Button> */
export function Ir({ a, ...props }: Omit<React.ComponentProps<"a">, "href"> & { a: string }) {
  const archivo = useArchivo()
  const [pantalla, ancla] = a.split("#")
  return <a href={(pantalla ? archivo(pantalla) : "") + (ancla ? `#${ancla}` : "")} {...props} />
}

/** Formulario falso: no envía nada a ningún sitio, solo pasa a la pantalla `a`. Los campos `required` se comprueban igual. */
export function Formulario({ a, ...props }: Omit<React.ComponentProps<"form">, "action" | "method"> & { a: string }) {
  const archivo = useArchivo()
  return <form action={archivo(a)} method="get" {...props} />
}
