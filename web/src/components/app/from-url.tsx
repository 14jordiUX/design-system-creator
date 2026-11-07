// «Nuevo sistema → Desde una web» (paso 2.1).
// La web online deja una petición en el repositorio (peticiones/<id>.json). GitHub abre esa web con un navegador,
// mide sus estilos, crea el sistema y deja el resultado en peticiones/resultados/<id>.json. Aquí se espera ese resultado.
import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Globe, Loader2, XCircle } from "lucide-react"
import { commitFiles, hostedRepo, readFile } from "@/lib/github"
import { slugify } from "@/lib/generator"
import { useGitHubConnect } from "@/components/app/github-connect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type State =
  | { step: "form" }
  | { step: "sending" }
  | { step: "waiting"; reqId: string; since: number }
  | { step: "done"; id: string }
  | { step: "error"; message: string }

const PENDING = "dsc.fromUrl.pending"
const normalizeUrl = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`)
const validUrl = (u: string) => { try { return !!new URL(normalizeUrl(u)).hostname.includes(".") } catch { return false } }

export function FromUrlDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [state, setState] = useState<State>(() => {
    const p = localStorage.getItem(PENDING)
    return p ? { step: "waiting", ...JSON.parse(p) } : { step: "form" }
  })
  const [now, setNow] = useState(Date.now())
  const { ask, dialog } = useGitHubConnect()
  const hosted = !!hostedRepo()
  const timer = useRef<number>(undefined)

  // Mientras GitHub trabaja, mira cada 10 segundos si ya ha dejado el resultado
  useEffect(() => {
    if (state.step !== "waiting") return
    const check = async () => {
      setNow(Date.now())
      const text = await readFile(`peticiones/resultados/${state.reqId}.json`).catch(() => null)
      if (!text) return
      localStorage.removeItem(PENDING)
      const r = JSON.parse(text)
      setState(r.ok ? { step: "done", id: r.id } : { step: "error", message: r.error || "No se pudo analizar la web." })
    }
    check()
    timer.current = window.setInterval(check, 10000)
    return () => window.clearInterval(timer.current)
  }, [state])

  const send = async () => {
    if (!(await ask())) return
    setState({ step: "sending" })
    const reqId = `${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}-${slugify(name || new URL(normalizeUrl(url)).hostname)}`
    try {
      await commitFiles([{ path: `peticiones/${reqId}.json`, content: JSON.stringify({ url: normalizeUrl(url), name: name.trim() || undefined }, null, 2) + "\n" }],
        `Petición: sistema desde ${new URL(normalizeUrl(url)).hostname}`)
      const pending = { reqId, since: Date.now() }
      localStorage.setItem(PENDING, JSON.stringify(pending))
      setState({ step: "waiting", ...pending })
    } catch (e: any) {
      setState({ step: "error", message: e.message })
    }
  }

  const reset = () => { localStorage.removeItem(PENDING); setState({ step: "form" }); setUrl(""); setName("") }
  const mins = state.step === "waiting" ? Math.floor((now - state.since) / 60000) : 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-gap-sm"><Globe className="size-icon-md" />Crear desde una web</DialogTitle>
            <DialogDescription>
              Escribe la dirección de una web. Se abre, se miran sus colores, su fuente, sus esquinas y sus botones, y se crea un sistema
              parecido. Es un punto de partida que luego ajustas en el modo editor.
            </DialogDescription>
          </DialogHeader>

          {!hosted ? (
            <p className="text-ui text-muted-foreground">
              Esto funciona en la web online (la de GitHub Pages). Desde aquí, pídemelo en el chat: «crea un sistema a partir de ejemplo.com».
            </p>
          ) : state.step === "form" || state.step === "sending" ? (
            <div className="grid gap-gap-lg">
              <div className="grid gap-gap-xs">
                <Label htmlFor="direccion">Dirección de la web</Label>
                <Input id="direccion" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ejemplo.com" autoFocus
                  onKeyDown={(e) => e.key === "Enter" && validUrl(url) && send()} />
              </div>
              <div className="grid gap-gap-xs">
                <Label htmlFor="nombre">Nombre del sistema (opcional)</Label>
                <Input id="nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Si lo dejas vacío, se usa el nombre de la web" />
              </div>
            </div>
          ) : state.step === "waiting" ? (
            <div className="flex items-start gap-gap-md rounded-card border-thin p-inset-lg text-ui">
              <Loader2 className="mt-gap-3xs size-icon-md shrink-0 animate-spin" />
              <div className="space-y-gap-2xs">
                <p className="font-emphasis">GitHub está analizando la web y creando el sistema…</p>
                <p className="text-muted-foreground">
                  Suele tardar entre 3 y 5 minutos{mins > 0 ? ` (llevamos ${mins} min)` : ""}. Puedes cerrar esta ventana: al volver a abrirla verás cómo va.
                </p>
              </div>
            </div>
          ) : state.step === "done" ? (
            <div className="flex items-start gap-gap-md rounded-card border-thin p-inset-lg text-ui">
              <CheckCircle2 className="mt-gap-3xs size-icon-md shrink-0 text-success-text" />
              <div className="space-y-gap-2xs">
                <p className="font-emphasis">¡Creado!</p>
                <p className="text-muted-foreground">La web se está publicando de nuevo con el sistema nuevo. Recarga la página en un minuto para verlo.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-gap-md rounded-card border-thin border-danger-border p-inset-lg text-ui">
              <XCircle className="mt-gap-3xs size-icon-md shrink-0 text-danger-text" />
              <div className="space-y-gap-2xs">
                <p className="font-emphasis">No se ha podido crear</p>
                <p className="text-muted-foreground">{state.message}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            {hosted && (state.step === "form" || state.step === "sending") && (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button disabled={!validUrl(url) || state.step === "sending"} onClick={send}>
                  {state.step === "sending" && <Loader2 className="animate-spin" />}Crear sistema
                </Button>
              </>
            )}
            {state.step === "waiting" && <Button variant="ghost" onClick={reset}>Dejar de esperar</Button>}
            {state.step === "done" && <><Button variant="ghost" onClick={reset}>Crear otro</Button><Button onClick={() => window.location.reload()}>Recargar</Button></>}
            {state.step === "error" && <Button onClick={reset}>Probar otra vez</Button>}
            {!hosted && <Button onClick={() => onOpenChange(false)}>Entendido</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialog}
    </>
  )
}
