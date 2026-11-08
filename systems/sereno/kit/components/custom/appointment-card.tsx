// Tarjeta de cita: lo que ve el paciente de su próxima cita. Componente propio de Sereno (solo está en este sistema).
import * as React from "react"
import { CalendarDays, Clock, MapPin } from "lucide-react"
import { cn } from "../../lib/utils"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card } from "../ui/card"

type Status = "confirmada" | "pendiente" | "cancelada"
const STATUS: Record<Status, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  confirmada: { label: "Confirmada", variant: "secondary" },
  pendiente: { label: "Sin confirmar", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "destructive" },
}

function AppointmentCard({ treatment, doctor, date, time, place, status = "confirmada", onReschedule, onConfirm, className, ...props }: React.ComponentProps<"div"> & {
  treatment: string
  doctor: string
  date: string
  time: string
  place?: string
  status?: Status
  onReschedule?: () => void
  onConfirm?: () => void
}) {
  const s = STATUS[status]
  const initials = doctor.replace(/^Dr[a]?\.\s*/, "").split(" ").map((w) => w[0]).slice(0, 2).join("")
  return (
    <Card data-slot="appointment-card" data-status={status} className={cn("gap-gap-lg p-inset-lg data-[status=cancelada]:opacity-disabled", className)} {...props}>
      <div className="flex items-start justify-between gap-gap-md">
        <div className="flex items-center gap-gap-md">
          <Avatar className="size-avatar-lg"><AvatarFallback>{initials}</AvatarFallback></Avatar>
          <div>
            <div className="text-body font-strong">{treatment}</div>
            <div className="text-ui text-muted-foreground">{doctor}</div>
          </div>
        </div>
        <Badge variant={s.variant}>{s.label}</Badge>
      </div>
      <div className="grid gap-gap-xs text-ui [&_svg]:size-icon-md [&_svg]:text-muted-foreground">
        <span className="flex items-center gap-gap-sm"><CalendarDays />{date}</span>
        <span className="flex items-center gap-gap-sm"><Clock />{time}</span>
        {place && <span className="flex items-center gap-gap-sm"><MapPin />{place}</span>}
      </div>
      {status !== "cancelada" && (
        <div className="flex flex-wrap gap-gap-sm">
          {status === "pendiente" && <Button size="sm" onClick={onConfirm}>Confirmar</Button>}
          <Button size="sm" variant="outline" onClick={onReschedule}>Cambiar cita</Button>
        </div>
      )}
    </Card>
  )
}

export { AppointmentCard }
