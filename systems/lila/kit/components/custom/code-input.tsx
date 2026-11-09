// Code Input: el código de verificación de 6 cifras (3 + 3), con su texto de ayuda o su error.
// Componente propio (base). Por dentro usa Input OTP y Field.
"use client"
import * as React from "react"
import { cn } from "../../lib/utils"
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../ui/input-otp"

function CodeInput({ id, value, onChange, label = "Código de verificación", description, error, autoFocus, className }: {
  id?: string
  value?: string
  onChange?: (value: string) => void
  /** Solo lo leen los lectores de pantalla */
  label?: string
  description?: React.ReactNode
  /** Si hay error, se muestra en lugar de la descripción */
  error?: React.ReactNode
  autoFocus?: boolean
  className?: string
}) {
  const invalid = !!error
  return (
    <Field data-slot="code-input" data-invalid={invalid || undefined} className={cn("items-center", className)}>
      <FieldLabel htmlFor={id} className="sr-only">{label}</FieldLabel>
      <InputOTP id={id} maxLength={6} value={value} onChange={onChange} autoFocus={autoFocus} aria-invalid={invalid || undefined}>
        <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /></InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
      </InputOTP>
      {invalid ? <FieldError className="text-center">{error}</FieldError> : description ? <FieldDescription className="text-center">{description}</FieldDescription> : null}
    </Field>
  )
}

export { CodeInput }
