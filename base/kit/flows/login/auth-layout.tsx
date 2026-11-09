// Marco común de las pantallas de acceso: fondo, centrado, ancho máximo y la marca encima de la tarjeta.
import * as React from "react"
import { Brand } from "../../components/custom/brand"

export function AuthLayout({ brand, children }: {
  /** Lo que va encima de la tarjeta. Por defecto, <Brand />; pásale tu logo y nombre: <Brand name="…" icon={…} /> */
  brand?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-muted p-inset-lg">
      <div className="w-full max-w-sheet">
        <div className="mb-gap-lg">{brand ?? <Brand />}</div>
        {children}
      </div>
    </div>
  )
}
