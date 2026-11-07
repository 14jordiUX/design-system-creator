// Ventana para conectar la web publicada con el repositorio de GitHub (solo la primera vez en cada navegador).
import { useCallback, useRef, useState } from "react"
import { ExternalLink, KeyRound, Loader2 } from "lucide-react"
import { checkToken, getToken, hostedRepo, newTokenUrl, setToken } from "@/lib/github"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/** Devuelve la ventana y una función que la abre si hace falta: resuelve true cuando ya hay una llave válida. */
export function useGitHubConnect() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const done = useRef<(ok: boolean) => void>(() => {})

  const ask = useCallback(() => {
    if (getToken()) return Promise.resolve(true)
    setValue(""); setError(null); setOpen(true)
    return new Promise<boolean>((resolve) => { done.current = resolve })
  }, [])

  const close = (ok: boolean) => { setOpen(false); done.current(ok) }
  const submit = async () => {
    setChecking(true); setError(null)
    const err = await checkToken(value)
    setChecking(false)
    if (err) { setError(err); return }
    setToken(value); close(true)
  }
  const repo = hostedRepo()

  const dialog = (
    <Dialog open={open} onOpenChange={(o) => !o && close(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-gap-sm"><KeyRound className="size-icon-md" />Conectar con GitHub</DialogTitle>
          <DialogDescription>
            Para guardar, la web necesita una llave que le deje escribir en tu repositorio
            {repo && <> <code className="font-code">{repo.owner}/{repo.repo}</code></>}. Solo hace falta una vez en este navegador.
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-gap-xs pl-inset-xl text-ui">
          <li>Abre GitHub con el botón de abajo. Llega con casi todo rellenado.</li>
          <li>En <b>Repository access</b> elige <b>Only select repositories</b> y marca <code className="font-code">{repo?.repo ?? "tu repositorio"}</code>.</li>
          <li>En <b>Permissions → Repository permissions → Contents</b> elige <b>Read and write</b> (si no lo está ya).</li>
          <li>Pulsa <b>Generate token</b>, cópialo y pégalo aquí.</li>
        </ol>
        <Button variant="outline" asChild><a href={newTokenUrl()} target="_blank" rel="noreferrer"><ExternalLink />Crear la llave en GitHub</a></Button>
        <div className="grid gap-gap-xs">
          <Label htmlFor="llave">Llave (empieza por github_pat_)</Label>
          <Input id="llave" type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="github_pat_…" className="font-code" />
          {error && <p className="text-caption text-destructive">{error}</p>}
          <p className="text-caption text-muted-foreground">Se guarda solo en este navegador. Solo sirve para este repositorio y puedes borrarla en GitHub cuando quieras.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)}>Cancelar</Button>
          <Button disabled={!value.trim() || checking} onClick={submit}>{checking && <Loader2 className="animate-spin" />}Conectar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
  return { ask, dialog }
}
