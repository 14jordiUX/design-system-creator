import type { CustomDemo } from "@/lib/custom"
import { AppointmentCard } from "./appointment-card"

export default {
  label: "Appointment Card",
  description: "Tarjeta de cita: lo que ve el paciente de su próxima visita, con su estado y las acciones que puede hacer.",
  examples: [
    { title: "Estados", render: (
      <div className="grid w-full gap-gap-lg md:grid-cols-3">
        <AppointmentCard treatment="Limpieza dental" doctor="Dra. Marta Ruiz" date="Viernes, 14 de noviembre" time="17:30 · 45 min" place="Consulta 2" />
        <AppointmentCard treatment="Revisión" doctor="Dr. Pablo Gil" date="Lunes, 17 de noviembre" time="10:00 · 30 min" status="pendiente" />
        <AppointmentCard treatment="Ortodoncia" doctor="Dra. Marta Ruiz" date="Martes, 4 de noviembre" time="12:00" status="cancelada" />
      </div>),
      code: `import { AppointmentCard } from "@/components/custom/appointment-card"\n\n<AppointmentCard\n  treatment="Limpieza dental"\n  doctor="Dra. Marta Ruiz"\n  date="Viernes, 14 de noviembre"\n  time="17:30 · 45 min"\n  status="pendiente"\n  onConfirm={() => …}\n/>` },
  ],
} satisfies CustomDemo
