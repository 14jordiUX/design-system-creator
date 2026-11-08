import { CalendarCheck, Euro, Users } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { StatCard } from "./stat-card"

export default {
  label: "Stat Card",
  description: "Tarjeta de métrica: un dato importante, su etiqueta y cómo ha cambiado. Para paneles y resúmenes.",
  examples: [
    { title: "Panel de resumen", render: (
      <div className="grid w-full gap-gap-lg md:grid-cols-3">
        <StatCard label="Citas esta semana" value="128" change="+12 %" trend="up" hint="frente a la anterior" icon={<CalendarCheck />} />
        <StatCard label="Pacientes nuevos" value="23" change="−4 %" trend="down" hint="frente a la anterior" icon={<Users />} />
        <StatCard label="Facturación" value="9.840 €" change="0 %" trend="flat" hint="igual que el mes pasado" icon={<Euro />} />
      </div>),
      code: `import { StatCard } from "@/components/custom/stat-card"\n\n<StatCard label="Citas esta semana" value="128" change="+12 %" trend="up" hint="frente a la anterior" icon={<CalendarCheck />} />` },
  ],
} satisfies CustomDemo
