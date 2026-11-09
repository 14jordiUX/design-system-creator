import { Bell, MessagesSquare, Moon } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { FieldGroup } from "@/components/ui/field"
import { SettingRow } from "./setting-row"

export default {
  label: "Setting Row",
  description: "Fila de ajuste: icono, título, descripción e interruptor. Para pantallas de preferencias, avisos o privacidad.",
  examples: [
    { title: "Activado, desactivado y deshabilitado", render: (
      <FieldGroup className="w-full max-w-sheet">
        <SettingRow id="sr-1" icon={<Bell />} title="Avisos en el móvil" description="Recordatorios y cambios importantes." defaultChecked />
        <SettingRow id="sr-2" icon={<MessagesSquare />} title="Resumen por email" description="Una vez a la semana, los lunes." />
        <SettingRow id="sr-3" icon={<Moon />} title="No molestar" description="Lo gestiona tu organización." disabled />
      </FieldGroup>),
      code: `import { SettingRow } from "@/components/custom/setting-row"\n\n<SettingRow id="avisos" icon={<Bell />} title="Avisos en el móvil"\n  description="Recordatorios y cambios importantes." checked={…} onCheckedChange={…} />` },
  ],
} satisfies CustomDemo
