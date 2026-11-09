import { Check, MailCheck, Sparkles, TriangleAlert, Bell } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { IconBadge } from "./icon-badge"

export default {
  label: "Icon Badge",
  description: "Un icono dentro de un círculo de color. Encabeza mensajes de resultado, bienvenidas o pasos. Tiene tamaño fijo.",
  examples: [
    { title: "Colores", render: (
      <div className="flex flex-wrap items-center gap-gap-md">
        <IconBadge><Sparkles /></IconBadge>
        <IconBadge variant="accent"><MailCheck /></IconBadge>
        <IconBadge variant="success"><Check /></IconBadge>
        <IconBadge variant="danger"><TriangleAlert /></IconBadge>
        <IconBadge variant="muted"><Bell /></IconBadge>
      </div>),
      code: `import { IconBadge } from "@/components/custom/icon-badge"\n\n<IconBadge><Sparkles /></IconBadge>\n<IconBadge variant="accent"><MailCheck /></IconBadge>\n<IconBadge variant="success"><Check /></IconBadge>` },
    { title: "Tamaños", render: (
      <div className="flex flex-wrap items-center gap-gap-md">
        <IconBadge size="sm"><Sparkles /></IconBadge>
        <IconBadge size="md"><Sparkles /></IconBadge>
        <IconBadge size="lg"><Sparkles /></IconBadge>
      </div>),
      code: `<IconBadge size="sm"><Sparkles /></IconBadge>\n<IconBadge size="md"><Sparkles /></IconBadge>\n<IconBadge size="lg"><Sparkles /></IconBadge>` },
  ],
} satisfies CustomDemo
