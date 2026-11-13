// Pruebas «para probar en el móvil»: vienen del Laboratorio y se abren a pantalla completa en el teléfono.
// Los datos (qué prueba y qué opción) están en laboratorio/laboratorio.json, en «prototipos».
import lab from "../../../laboratorio/laboratorio.json"

export type MobileTest = { exp: string; opt: string; label: string; description: string }
export const MOBILE_TESTS: MobileTest[] = (lab as { prototipos?: MobileTest[] }).prototipos ?? []

/** Ruta (dentro de la web) de la prueba a pantalla completa, con el sistema y el modo elegidos. */
export function mobileTestPath(m: MobileTest, systemId: string, mode: "light" | "dark") {
  return `/laboratorio/${m.exp}/${m.opt}?sistema=${systemId}${mode === "dark" ? "&modo=oscuro" : ""}`
}
