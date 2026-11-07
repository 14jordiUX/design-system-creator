import type { ReactNode } from "react"
import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmptyState({ title = "No hay nada todavía", text, icon, children, className }: {
  title?: string; text?: ReactNode; icon?: ReactNode; children?: ReactNode; className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-gap-md rounded-card border-thin border-dashed px-inset-xl py-inset-4xl text-center", className)}>
      <div className="flex size-avatar-xl items-center justify-center rounded-pill bg-muted text-muted-foreground">
        {icon ?? <Inbox className="size-icon-lg" />}
      </div>
      <h3 className="text-body font-strong">{title}</h3>
      {text && <p className="max-w-sheet text-ui text-muted-foreground">{text}</p>}
      {children}
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode
}) {
  return (
    <div className="mb-gap-2xl flex flex-wrap items-end justify-between gap-gap-lg">
      <div className="space-y-gap-sm">
        {eyebrow && <p className="text-caption font-emphasis tracking-caps text-muted-foreground uppercase">{eyebrow}</p>}
        <h1 className="text-h2 font-heavy tracking-heading">{title}</h1>
        {description && <p className="max-w-prose text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-gap-sm">{actions}</div>}
    </div>
  )
}

export function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-gap-3xl">
      <h2 className="mb-gap-2xs text-title font-strong">{title}</h2>
      {description && <p className="mb-gap-lg text-ui text-muted-foreground">{description}</p>}
      <div className={description ? "" : "mt-gap-lg"}>{children}</div>
    </section>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-inner bg-muted px-inset-xs py-inset-3xs font-code text-caption">{children}</code>
}

export function Soon({ step }: { step: string }) {
  return <span className="rounded-pill bg-muted px-inset-sm py-inset-3xs text-caption font-emphasis text-muted-foreground">{step}</span>
}
