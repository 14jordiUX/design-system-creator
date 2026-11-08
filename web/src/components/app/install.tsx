// Comando para instalar componentes del sistema en otro proyecto con el instalador de shadcn/ui.
// Los archivos del registro los genera scripts/build_registry.py y se publican con la web (…/r/<sistema>/<componente>.json).
import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { hostedRepo } from "@/lib/github"
import { Button } from "@/components/ui/button"

/** Dirección de la web publicada (en local, la de GitHub Pages del proyecto). */
export function siteUrl() {
  const r = hostedRepo()
  return r ? `${window.location.origin}/${r.repo}` : `https://14jordiux.github.io/design-system-creator`
}

export const installCommand = (system: string, items: string[]) =>
  `npx shadcn@latest add ${items.map((i) => `${siteUrl()}/r/${system}/${i}.json`).join(" ")}`

export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-start gap-gap-sm rounded-card border-thin bg-muted p-inset-sm">
      <code className="min-w-0 flex-1 px-inset-sm py-inset-xs font-code text-caption leading-prose break-all">{command}</code>
      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
        {copied ? <Check /> : <Copy />}{copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  )
}
