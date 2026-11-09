// Choice Card: una opción en forma de tarjeta (icono, título, descripción y su control), para elegir entre varias.
// Componente propio (base). El control puede ser casilla (varias a la vez), radio (una, dentro de un RadioGroup)
// o interruptor. Estados: normal, marcada y deshabilitada.
"use client"
import * as React from "react"
import { cn } from "../../lib/utils"
import { Checkbox } from "../ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "../ui/field"
import { RadioGroupItem } from "../ui/radio-group"
import { Switch } from "../ui/switch"

type Control = "checkbox" | "radio" | "switch"

function ChoiceCard({ id, title, description, icon, control = "checkbox", value, checked, defaultChecked, onCheckedChange, disabled, className }: {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  control?: Control
  /** Para control="radio": el valor dentro del RadioGroup */
  value?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  const input = control === "radio"
    ? <RadioGroupItem id={id} value={value ?? id} disabled={disabled} />
    : control === "switch"
      ? <Switch id={id} checked={checked} defaultChecked={defaultChecked} onCheckedChange={onCheckedChange} disabled={disabled} />
      : <Checkbox id={id} checked={checked} defaultChecked={defaultChecked} onCheckedChange={(v) => onCheckedChange?.(v === true)} disabled={disabled} />
  return (
    <FieldLabel htmlFor={id} data-slot="choice-card" data-variant={control} data-disabled={disabled || undefined} className={className}>
      <Field orientation="horizontal" data-disabled={disabled || undefined}>
        {icon && <span className="text-muted-foreground [&_svg]:size-icon-md">{icon}</span>}
        <FieldContent>
          <FieldTitle>{title}</FieldTitle>
          {description && <FieldDescription>{description}</FieldDescription>}
        </FieldContent>
        {input}
      </Field>
    </FieldLabel>
  )
}

export { ChoiceCard }
