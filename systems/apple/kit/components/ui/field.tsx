import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Label } from "./label"
import { Separator } from "./separator"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset data-slot="field-set"
      className={cn("flex flex-col gap-gap-xl", "has-[>[data-slot=checkbox-group]]:gap-gap-md has-[>[data-slot=radio-group]]:gap-gap-md", className)} {...props} />
  )
}

function FieldLegend({ className, variant = "legend", ...props }: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend data-slot="field-legend" data-variant={variant}
      className={cn("mb-gap-md font-emphasis", "data-[variant=legend]:text-body", "data-[variant=label]:text-ui", className)} {...props} />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field-group"
      className={cn("group/field-group flex w-full flex-col gap-gap-xl data-[slot=checkbox-group]:gap-gap-md [&>[data-slot=field-group]]:gap-gap-lg", className)} {...props} />
  )
}

const fieldVariants = cva("group/field flex w-full gap-gap-md data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
      horizontal: [
        "flex-row items-center",
        "[&>[data-slot=field-label]]:flex-auto",
        "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-thin",
      ],
      // En pantallas medianas o más, en fila (en la versión original de shadcn usa consultas de contenedor)
      responsive: [
        "flex-col md:flex-row md:items-center [&>*]:w-full md:[&>*]:w-auto [&>.sr-only]:w-auto",
        "md:[&>[data-slot=field-label]]:flex-auto",
        "md:has-[>[data-slot=field-content]]:items-start md:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-thin",
      ],
    },
  },
  defaultVariants: { orientation: "vertical" },
})

function Field({ className, orientation = "vertical", ...props }: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return <div role="group" data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} />
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-content" className={cn("group/field-content flex flex-1 flex-col gap-gap-xs leading-compact", className)} {...props} />
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-gap-sm leading-compact group-data-[disabled=true]/field:opacity-disabled",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-control has-[>[data-slot=field]]:border-thin [&>*]:data-[slot=field]:p-inset-lg",
        "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary-subtle",
        className
      )} {...props} />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field-label"
      className={cn("flex w-fit items-center gap-gap-sm text-ui leading-compact font-emphasis group-data-[disabled=true]/field:opacity-disabled", className)} {...props} />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="field-description"
      className={cn(
        "text-ui leading-body font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-gap-2xs [[data-variant=legend]+&]:-mt-gap-xs",
        "[&>a]:underline [&>a]:underline-offset-[var(--space-inset-2xs)] [&>a:hover]:text-primary",
        className
      )} {...props} />
  )
}

function FieldSeparator({ children, className, ...props }: React.ComponentProps<"div"> & { children?: React.ReactNode }) {
  return (
    <div data-slot="field-separator" data-content={!!children}
      className={cn("relative -my-gap-sm h-icon-lg text-ui group-data-[variant=outline]/field-group:-mb-gap-sm", className)} {...props}>
      <Separator className="absolute inset-0 top-1/2" />
      {children && <span className="relative mx-auto block w-fit bg-background px-inset-sm text-muted-foreground" data-slot="field-separator-content">{children}</span>}
    </div>
  )
}

function FieldError({ className, children, errors, ...props }: React.ComponentProps<"div"> & { errors?: Array<{ message?: string } | undefined> }) {
  const content = useMemo(() => {
    if (children) return children
    if (!errors?.length) return null
    const unique = [...new Map(errors.map((e) => [e?.message, e])).values()]
    if (unique.length == 1) return unique[0]?.message
    return (
      <ul className="ml-inset-lg flex list-disc flex-col gap-gap-2xs">
        {unique.map((e, i) => e?.message && <li key={i}>{e.message}</li>)}
      </ul>
    )
  }, [children, errors])
  if (!content) return null
  return <div role="alert" data-slot="field-error" className={cn("text-ui font-normal text-destructive", className)} {...props}>{content}</div>
}

export { Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldLegend, FieldSeparator, FieldSet, FieldContent, FieldTitle }
