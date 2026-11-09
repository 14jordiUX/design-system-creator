// Setting Row: una fila de ajuste con icono, título, descripción y un interruptor a la derecha.
// Componente propio (base). Estados: activado, desactivado y deshabilitado.
"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

function SettingRow({ id, title, description, icon, checked, defaultChecked, onCheckedChange, disabled, className }: {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Field orientation="horizontal" data-slot="setting-row" data-disabled={disabled || undefined} className={cn(className)}>
      {icon && <span className="text-muted-foreground [&_svg]:size-icon-md">{icon}</span>}
      <FieldContent>
        <FieldLabel htmlFor={id}>{title}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch id={id} checked={checked} defaultChecked={defaultChecked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </Field>
  )
}

export { SettingRow }
