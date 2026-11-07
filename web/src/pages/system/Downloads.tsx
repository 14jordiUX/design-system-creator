import { Bot, FileCode2, Palette, Package, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/app/common"
import { zipSync, strToU8 } from "fflate"
import { useDS } from "./context"

function download(name: string, content: string | Uint8Array, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content as BlobPart], { type }))
  const a = document.createElement("a")
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadKit(id: string, files: Record<string, string>) {
  const tree = Object.fromEntries(Object.entries(files).map(([p, c]) => [`kit-${id}/${p}`, strToU8(c)]))
  download(`kit-${id}.zip`, zipSync(tree), "application/zip")
}

export default function Downloads() {
  const { ds, dirty } = useDS()
  const id = ds.meta.id
  const kitCount = Object.keys(ds.files.kit).length
  const items = [
    { icon: Package, title: "Kit de proyecto", desc: `Carpeta para empezar un proyecto nuevo con el sistema aplicado: componentes, estilos, tema de Tailwind y SKILL.md (${kitCount} archivos, en .zip).`, ready: kitCount > 0,
      action: () => downloadKit(id, ds.files.kit) },
    { icon: Bot, title: "Skill para Claude", desc: "El SKILL.md del kit: instrucciones para que Claude respete este sistema en cualquier conversación.", ready: !!ds.files.kit["SKILL.md"],
      action: () => download("SKILL.md", ds.files.kit["SKILL.md"], "text/markdown") },
    { icon: Palette, title: "Tokens para Figma", desc: "Archivo para el plugin Tokens Studio, con los temas claro y oscuro.", ready: !!ds.files.figma,
      action: () => download(`${id}-tokens-studio.json`, ds.files.figma!) },
    { icon: FileCode2, title: "CSS con variables", step: "", desc: "Todas las variables del sistema, con los alias que espera shadcn/ui y las clases tipográficas.", ready: !!ds.files.css,
      action: () => download(`${id}-tokens.css`, ds.files.css!, "text/css") },
    { icon: FileJson, title: "Tokens (formato W3C)", desc: "Los cuatro archivos de tokens juntos en un JSON: primitivos, semánticos, claro y oscuro.", ready: true,
      action: () => download(`${id}-tokens.json`, JSON.stringify(ds.tokens, null, 2)) },
    { icon: Bot, title: "Paquete Claude Design", step: "Fase 3", desc: "El sistema en el formato que acepte Claude Design.", ready: false },
  ]
  return (
    <div>
      <PageHeader eyebrow="Descargas" title="Descargas" description={`Todo lo necesario para usar ${ds.meta.name} en código, en Figma y con Claude.`} />
      {dirty && <Alert className="mb-gap-xl"><AlertDescription>Tienes cambios sin guardar en el editor. Las descargas usan la versión guardada en tu carpeta.</AlertDescription></Alert>}
      <div className="grid gap-gap-lg md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.title} className={it.ready ? "" : "opacity-disabled"}>
            <CardHeader>
              <div className="flex items-center justify-between"><it.icon className="size-icon-lg text-primary" />{!it.ready && <Badge variant="outline">{it.step}</Badge>}</div>
              <CardTitle>{it.title}</CardTitle>
              <CardDescription>{it.desc}</CardDescription>
            </CardHeader>
            <CardFooter>
              {it.ready ? <Button onClick={it.action}>Descargar</Button> : <Button variant="outline" disabled>Todavía no disponible</Button>}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
