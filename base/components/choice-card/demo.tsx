import { CalendarDays, ChartLine, UsersRound } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { FieldGroup } from "@/components/ui/field"
import { RadioGroup } from "@/components/ui/radio-group"
import { ChoiceCard } from "./choice-card"

export default {
  label: "Choice Card",
  description: "Una opción en forma de tarjeta: icono, título, descripción y su control. Con casilla (varias a la vez), radio (solo una) o interruptor.",
  examples: [
    { title: "Con casilla: normal, marcada y deshabilitada", render: (
      <FieldGroup className="w-full max-w-sheet gap-gap-sm">
        <ChoiceCard id="cc-1" icon={<CalendarDays />} title="Organizar mi agenda" description="Citas, recordatorios y tareas." defaultChecked />
        <ChoiceCard id="cc-2" icon={<UsersRound />} title="Trabajar en equipo" description="Compartir y repartir el trabajo." />
        <ChoiceCard id="cc-3" icon={<ChartLine />} title="Ver mis números" description="Disponible en el plan Pro." disabled />
      </FieldGroup>),
      code: `import { ChoiceCard } from "@/components/custom/choice-card"\n\n<ChoiceCard id="agenda" icon={<CalendarDays />} title="Organizar mi agenda"\n  description="Citas, recordatorios y tareas." checked={…} onCheckedChange={…} />` },
    { title: "Con radio (solo una)", render: (
      <RadioGroup defaultValue="mensual" className="w-full max-w-sheet gap-gap-sm">
        <ChoiceCard id="cc-mensual" control="radio" value="mensual" title="Mensual" description="9 € al mes, cancela cuando quieras." />
        <ChoiceCard id="cc-anual" control="radio" value="anual" title="Anual" description="90 € al año: dos meses gratis." />
      </RadioGroup>),
      code: `<RadioGroup defaultValue="mensual">\n  <ChoiceCard id="mensual" control="radio" value="mensual" title="Mensual" description="…" />\n  <ChoiceCard id="anual" control="radio" value="anual" title="Anual" description="…" />\n</RadioGroup>` },
  ],
} satisfies CustomDemo
