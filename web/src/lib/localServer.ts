// Conexión con el servidor local (servidor.mjs), que es quien escribe en la carpeta del proyecto.
// Si la web se abre con doble clic («Abrir la web.html») no hay servidor y no se puede guardar.
import type { TokenFiles } from "./tokens"

export type SaveStatus = { state: "idle" | "working" | "done" | "error"; step: string; log: string[] }

let ping: Promise<boolean> | null = null
export function hasLocalServer(): Promise<boolean> {
  if (!window.location.protocol.startsWith("http")) return Promise.resolve(false)
  ping ??= fetch("/api/ping", { cache: "no-store" }).then((r) => r.ok).catch(() => false)
  return ping
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function saveSystem(id: string, tokens: TokenFiles, onStep: (step: string) => void): Promise<SaveStatus> {
  const r = await fetch(`/api/systems/${encodeURIComponent(id)}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens }),
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.error || `Error ${r.status}`)
  }
  return waitJob(onStep)
}

/** Crea un sistema nuevo en systems/<id>/ (cuestionario). Devuelve el id final (puede llevar -2, -3… si ya existía). */
export async function createSystem(meta: Record<string, any>, tokens: TokenFiles, answers: unknown, onStep: (step: string) => void): Promise<string> {
  const r = await fetch("/api/systems/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meta, tokens, answers }),
  })
  const res = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(res.error || `Error ${r.status}`)
  const s = await waitJob(onStep)
  if (s.state === "error") throw new Error(s.log.at(-1) || "Algo ha fallado")
  return res.id
}

async function waitJob(onStep: (step: string) => void): Promise<SaveStatus> {
  for (;;) {
    await wait(800)
    const s: SaveStatus = await fetch("/api/status", { cache: "no-store" }).then((r) => r.json())
    if (s.state === "done" || s.state === "error") return s
    onStep(s.step)
  }
}
