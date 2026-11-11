// Vistas de cada prueba del Laboratorio. Cada una recibe la opción elegida; los valores de la opción
// llegan como variables CSS (--lab-*) desde ../../../../laboratorio/laboratorio.json, así que aquí no hay valores escritos a mano.
import { useState, type CSSProperties, type ReactNode } from "react"
import { Bell, Calendar, ChevronRight, Heart, Home, Inbox, Mail, Plus, Search, Settings, Share2, Star, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { FloatingBarPreview } from "./floating-bar"

export type Option = { id: string; label: string; vars?: Record<string, string>; params?: Record<string, any> }
type P = { option: Option }

const Stage = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex min-h-popover flex-col items-center justify-center gap-gap-lg rounded-card bg-subtle p-inset-xl", className)}>{children}</div>
)

// ---------- Movimiento y material ----------

function Motion(_: P) {
  const [on, setOn] = useState(false)
  const [right, setRight] = useState(false)
  const effects: CSSProperties = { transitionDuration: "var(--lab-hover)", transitionTimingFunction: "var(--lab-ease-effects)" }
  const spatial: CSSProperties = { transitionDuration: "var(--lab-spatial)", transitionTimingFunction: "var(--lab-ease-spatial)" }
  return (
    <Stage>
      <div className="flex flex-wrap justify-center gap-gap-sm">
        <Button className="transition-colors" style={effects}>Principal</Button>
        <Button variant="outline" className="transition-colors" style={effects}>Secundario</Button>
        <Button variant="ghost" className="transition-colors" style={effects}>Fantasma</Button>
      </div>
      <div className="w-full max-w-popover rounded-card border-thin bg-card p-inset-lg shadow-flat transition-[translate,box-shadow] hover:translate-y-(--lab-lift) hover:shadow-overlay motion-reduce:transition-none"
        style={spatial}>
        <p className="font-strong">Tarjeta</p>
        <p className="text-ui text-muted-foreground">Se levanta al pasar el ratón.</p>
      </div>
      <div className="flex w-full max-w-popover items-center gap-gap-md">
        <button type="button" role="switch" aria-checked={on} aria-label="Interruptor de prueba" onClick={() => setOn(!on)}
          className={cn("relative h-control-sm w-fab-md shrink-0 rounded-pill p-inset-2xs transition-colors", on ? "bg-primary" : "bg-border-strong")} style={effects}>
          <span className="block aspect-square h-full rounded-pill bg-background shadow-flat transition-transform motion-reduce:transition-none"
            style={{ ...spatial, transform: on ? "translateX(calc(var(--size-fab-md) - var(--control-height-sm)))" : undefined }} />
        </button>
        <div className="relative h-control-sm flex-1 rounded-pill bg-muted">
          <span className="absolute top-0 left-0 size-control-sm rounded-pill bg-primary transition-[left] motion-reduce:transition-none"
            style={{ ...spatial, left: right ? "calc(100% - var(--control-height-sm))" : "0%" }} />
        </div>
        <Button size="sm" variant="outline" onClick={() => setRight(!right)}>Mover</Button>
      </div>
    </Stage>
  )
}

const MENU = [{ icon: Inbox, label: "Bandeja" }, { icon: Star, label: "Destacados" }, { icon: Calendar, label: "Agenda" }, { icon: User, label: "Contactos" }, { icon: Settings, label: "Ajustes" }]
const TABS = ["Todo", "Citas", "Pagos", "Notas"]

function FollowBackground(_: P) {
  const [menu, setMenu] = useState<number | null>(null)
  const [tab, setTab] = useState<number | null>(null)
  const [active, setActive] = useState(0)
  const move: CSSProperties = { transitionDuration: "var(--lab-move), var(--motion-duration-micro)", transitionTimingFunction: "var(--lab-ease), var(--motion-easing-default)" }
  return (
    <Stage className="flex-row flex-wrap items-start">
      <div className="relative w-menu-wide rounded-overlay border-thin bg-popover p-inset-2xs shadow-overlay" onMouseLeave={() => setMenu(null)}>
        <span aria-hidden className={cn("absolute inset-x-inset-2xs top-inset-2xs h-control-md rounded-inner bg-accent transition-[transform,opacity]", menu === null && "opacity-0")}
          style={{ ...move, transform: `translateY(calc(${menu ?? 0} * 100%))` }} />
        {MENU.map(({ icon: Icon, label }, i) => (
          <button key={label} type="button" onMouseEnter={() => setMenu(i)} onFocus={() => setMenu(i)}
            className="relative flex h-control-md w-full items-center gap-gap-sm rounded-inner px-inset-sm text-ui outline-none">
            <Icon className="size-icon-md text-muted-foreground" />{label}
          </button>
        ))}
      </div>
      <div className="relative flex rounded-pill bg-muted p-inset-2xs" onMouseLeave={() => setTab(null)}>
        <span aria-hidden className="absolute inset-y-inset-2xs left-inset-2xs rounded-pill bg-background shadow-flat transition-transform"
          style={{ ...move, width: `calc((100% - var(--space-inset-2xs) * 2) / ${TABS.length})`, transform: `translateX(calc(${tab ?? active} * 100%))` }} />
        {TABS.map((t, i) => (
          <button key={t} type="button" onMouseEnter={() => setTab(i)} onClick={() => setActive(i)} aria-pressed={active === i}
            className={cn("relative h-control-sm w-field-xs rounded-pill text-ui", active === i ? "font-strong" : "text-muted-foreground")}>{t}</button>
        ))}
      </div>
    </Stage>
  )
}

function StretchIndicator(_: P) {
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const n = TABS.length
  const go = (k: number) => { setDir(k >= i ? 1 : -1); setI(k) }
  const lead = "var(--lab-lead) var(--lab-ease)", trail = "var(--lab-trail) var(--lab-ease)"
  return (
    <Stage>
      <div className="relative flex w-full max-w-popover border-b-thin">
        {TABS.map((t, k) => (
          <button key={t} type="button" onClick={() => go(k)} aria-pressed={i === k}
            className={cn("h-control-lg flex-1 text-ui transition-colors", i === k ? "font-strong text-foreground" : "text-muted-foreground")}>{t}</button>
        ))}
        <span aria-hidden className="absolute -bottom-line h-line rounded-pill bg-primary motion-reduce:transition-none"
          style={{ left: `calc(${i} * 100% / ${n})`, right: `calc(${n - 1 - i} * 100% / ${n})`,
            transition: dir > 0 ? `right ${lead}, left ${trail}` : `left ${lead}, right ${trail}` }} />
      </div>
      <div className="relative flex w-full max-w-popover rounded-pill bg-muted p-inset-2xs">
        <span aria-hidden className="absolute inset-y-inset-2xs rounded-pill bg-primary motion-reduce:transition-none"
          style={{ left: `calc(var(--space-inset-2xs) + ${i} * (100% - var(--space-inset-2xs) * 2) / ${n})`,
            right: `calc(var(--space-inset-2xs) + ${n - 1 - i} * (100% - var(--space-inset-2xs) * 2) / ${n})`,
            transition: dir > 0 ? `right ${lead}, left ${trail}` : `left ${lead}, right ${trail}` }} />
        {TABS.map((t, k) => (
          <button key={t} type="button" onClick={() => go(k)}
            className={cn("relative h-control-sm flex-1 rounded-pill text-ui transition-colors", i === k ? "font-strong text-primary-foreground" : "text-muted-foreground")}>{t}</button>
        ))}
      </div>
    </Stage>
  )
}

function PressShape(_: P) {
  const press: CSSProperties = {}
  const cls = "rounded-pill transition-[border-radius,scale,background-color] duration-(--lab-time) ease-(--lab-ease) active:rounded-(--lab-press-radius) active:scale-(--lab-press-scale) motion-reduce:transition-none"
  return (
    <Stage>
      <div className="flex flex-wrap items-center justify-center gap-gap-md">
        <Button size="lg" className={cls} style={press}>Mantén pulsado</Button>
        <Button size="lg" variant="secondary" className={cls} style={press}><Heart />Me gusta</Button>
        <Button size="icon" className={cn(cls, "size-fab-md")} style={press} aria-label="Añadir"><Plus /></Button>
      </div>
    </Stage>
  )
}

function Material(_: P) {
  const glass: CSSProperties = { background: "var(--lab-fill)", boxShadow: "var(--lab-edge), var(--lab-glow)" }
  const blocks = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-primary"]
  return (
    <div className="relative h-dialog overflow-hidden rounded-card border-thin bg-background">
      <div className="h-full overflow-y-auto p-inset-lg pb-section">
        <p className="mb-gap-sm text-title font-strong">Contenido</p>
        <div className="grid grid-cols-2 gap-gap-sm">
          {[...blocks, ...blocks].map((b, k) => (
            <div key={k} className={cn("flex h-field-xs items-end rounded-inner p-inset-sm text-caption font-strong text-primary-foreground", b)}>Foto {k + 1}</div>
          ))}
        </div>
      </div>
      <div className="absolute top-inset-md right-inset-md flex backdrop-blur-(--lab-blur) flex-col gap-gap-3xs rounded-overlay p-inset-2xs text-ui" style={glass}>
        {[Share2, Heart, Bell].map((Icon, k) => (
          <button key={k} type="button" aria-label="Acción" className="flex size-control-md items-center justify-center rounded-pill hover:bg-accent"><Icon className="size-icon-md" /></button>
        ))}
      </div>
      <nav aria-label="Barra de prueba" className="absolute inset-x-inset-xl bottom-inset-md flex backdrop-blur-(--lab-blur) justify-around rounded-pill p-inset-2xs" style={glass}>
        {[Home, Search, Mail, User].map((Icon, k) => (
          <span key={k} className={cn("flex h-control-md flex-1 items-center justify-center rounded-pill", k === 0 && "bg-primary text-primary-foreground")}><Icon className="size-icon-md" /></span>
        ))}
      </nav>
    </div>
  )
}

function LiquidFusion({ option }: P) {
  const [open, setOpen] = useState(false)
  const goo = !!option.params?.goo
  const items = [Mail, Calendar, Star]
  const move = (k: number): CSSProperties => ({
    transitionProperty: "transform", transitionDuration: "var(--lab-time)", transitionTimingFunction: "var(--lab-ease)",
    transitionDelay: open ? `calc(${k} * var(--motion-duration-micro) / 3)` : "0ms",
    transform: open ? `translateY(calc(${-(k + 1)} * (var(--size-fab-md) + var(--space-gap-sm))))` : "translateY(0%)",
  })
  const layer = (icons: boolean) => (
    <div className="absolute inset-0 flex items-end justify-center pb-inset-xl" style={!icons && goo ? { filter: "url(#lab-goo)" } : undefined} aria-hidden={!icons}>
      <div className="relative size-fab-md">
        {items.map((Icon, k) => (
          <span key={k} className={cn("absolute inset-0 m-auto flex size-fab-sm items-center justify-center rounded-pill motion-reduce:transition-none", !icons && "bg-primary")} style={move(k)}>
            {icons && <Icon className="size-icon-md text-primary-foreground" />}
          </span>
        ))}
        {icons
          ? <button type="button" onClick={() => setOpen(!open)} aria-label={open ? "Cerrar" : "Abrir"} aria-expanded={open}
              className="absolute inset-0 flex items-center justify-center rounded-pill text-primary-foreground">
              <Plus className={cn("size-icon-lg transition-transform duration-default", open && "rotate-tilt")} />
            </button>
          : <span className="absolute inset-0 rounded-pill bg-primary" />}
      </div>
    </div>
  )
  return (
    <div className="relative h-dialog overflow-hidden rounded-card bg-subtle">
      {goo && (
        <svg aria-hidden className="absolute size-0">
          <filter id="lab-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation={option.params?.blur} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values={option.params?.matrix} result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </svg>
      )}
      {layer(false)}
      {layer(true)}
    </div>
  )
}

// ---------- Estructura ----------

function ColorShare({ option }: P) {
  const o = option.id
  return (
    <div className="flex h-dialog overflow-hidden rounded-card border-thin bg-background">
      <aside className={cn("flex w-menu-wide shrink-0 flex-col gap-gap-3xs p-inset-sm text-ui",
        o === "poco" && "border-e-thin bg-sidebar text-sidebar-foreground", o === "bastante" && "bg-primary-subtle", o === "mucho" && "bg-primary text-primary-foreground")}>
        <p className="mb-gap-sm px-inset-sm font-heavy">Clínica</p>
        {MENU.slice(0, 4).map(({ icon: Icon, label }, k) => (
          <span key={label} className={cn("flex h-control-sm items-center gap-gap-sm rounded-inner px-inset-sm",
            k === 0 && o === "poco" && "bg-sidebar-accent font-strong", k === 0 && o === "bastante" && "bg-primary text-primary-foreground font-strong", k === 0 && o === "mucho" && "bg-primary-hover font-strong")}>
            <Icon className="size-icon-sm" />{label}
          </span>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn("flex h-header items-center justify-between border-b-thin px-inset-lg", o === "mucho" ? "bg-primary-subtle" : "bg-background")}>
          <span className="font-strong">Hoy</span>
          <Button size="sm"><Plus />Nueva cita</Button>
        </header>
        <div className="grid gap-gap-sm p-inset-lg">
          {["09:00 · Ana Martín", "10:30 · Luis Pérez"].map((t, k) => (
            <div key={t} className={cn("flex items-center justify-between rounded-card border-thin p-inset-md", o !== "poco" && k === 0 && "border-primary bg-primary-subtle")}>
              <span className="text-ui">{t}</span>
              {o === "poco" ? <Badge variant="secondary">Confirmada</Badge> : <Badge>Confirmada</Badge>}
            </div>
          ))}
          <a className="text-ui text-link hover:underline" href="#/laboratorio" onClick={(e) => e.preventDefault()}>Ver todas las citas</a>
        </div>
      </div>
    </div>
  )
}

function Background(_: P) {
  const card = { background: "var(--lab-card)" }
  return (
    <div className="grid gap-gap-md rounded-card border-thin p-inset-lg" style={{ background: "var(--lab-page)" }}>
      <p className="text-title font-strong">Buenos días, Marta</p>
      <div className="grid grid-cols-2 gap-gap-md">
        {[["Citas hoy", "12"], ["Pendientes", "3"]].map(([l, v]) => (
          <div key={l} className="rounded-card border-thin p-inset-lg" style={card}>
            <p className="text-caption text-muted-foreground">{l}</p><p className="text-h3 font-heavy">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-card border-thin p-inset-lg" style={card}>
        <div><p className="font-strong">Revisión anual</p><p className="text-ui text-muted-foreground">Mañana a las 10:00</p></div>
        <Button size="sm">Confirmar</Button>
      </div>
    </div>
  )
}

function Accent(_: P) {
  const bars = [6, 9, 5, 11, 8, 12, 7]
  return (
    <Stage className="items-stretch">
      <div className="flex items-center gap-gap-sm">
        <span className="rounded-pill px-inset-sm py-inset-3xs text-caption font-strong text-primary-foreground" style={{ background: "var(--lab-accent)" }}>Nuevo</span>
        <span className="text-ui">Ya puedes pagar con el móvil</span>
      </div>
      <div className="rounded-card border-thin bg-card p-inset-lg">
        <p className="text-caption text-muted-foreground">Reservas esta semana</p>
        <div className="mt-gap-md flex h-field-xs items-end gap-gap-xs">
          {bars.map((b, k) => (
            <span key={k} className={cn("flex-1 rounded-fine", k % 2 ? "bg-primary" : undefined)}
              style={{ height: `calc(${b} / 12 * 100%)`, ...(k % 2 ? {} : { background: "var(--lab-accent)" }) }} />
          ))}
        </div>
      </div>
      <div className="flex gap-gap-sm">
        <Button>Reservar</Button>
        <Button variant="outline"><Star style={{ color: "var(--lab-accent)", fill: "var(--lab-accent)" }} />Favorito</Button>
      </div>
    </Stage>
  )
}

function HeadingFont(_: P) {
  return (
    <div className="grid gap-gap-md rounded-card bg-subtle p-inset-xl">
      <p className="text-caption font-strong tracking-caps text-muted-foreground">CLÍNICA DENTAL</p>
      <h3 className="text-h1 font-heavy leading-compact" style={{ fontFamily: "var(--lab-heading)" }}>Sonríe sin prisas</h3>
      <h4 className="text-h3 font-strong" style={{ fontFamily: "var(--lab-heading)" }}>Primera visita gratis</h4>
      <p className="text-body text-muted-foreground">Este texto usa la fuente del sistema. Los titulares de arriba usan la fuente de prueba para ver cómo combinan.</p>
      <div><Button>Pedir cita</Button></div>
    </div>
  )
}

function TypeScale(_: P) {
  const h = (r: string): CSSProperties => ({ fontSize: `calc(var(--text-size-body) * var(${r}))`, fontWeight: "var(--lab-weight)", letterSpacing: "var(--lab-track)", lineHeight: "var(--text-leading-compact)" })
  return (
    <div className="grid gap-gap-sm rounded-card bg-subtle p-inset-xl">
      <p style={h("--lab-r3")}>Titular principal</p>
      <p style={h("--lab-r2")}>Subtítulo de sección</p>
      <p style={h("--lab-r1")}>Título de tarjeta</p>
      <p className="text-body text-muted-foreground">Texto normal del sistema, para comparar con los titulares.</p>
    </div>
  )
}

function Caps(_: P) {
  const caps: CSSProperties = { textTransform: "var(--lab-case)" as CSSProperties["textTransform"], letterSpacing: "var(--lab-caps-track)" }
  return (
    <Stage>
      <div className="flex flex-wrap justify-center gap-gap-sm">
        <Button style={caps}>Guardar cambios</Button><Button variant="outline" style={caps}>Cancelar</Button>
      </div>
      <div className="flex gap-gap-lg border-b-thin">
        {TABS.slice(0, 3).map((t, k) => <span key={t} className={cn("pb-inset-sm text-ui", k === 0 ? "border-b-thin border-primary font-strong" : "text-muted-foreground")} style={caps}>{t}</span>)}
      </div>
      <div className="flex gap-gap-sm"><Badge style={caps}>Pagado</Badge><Badge variant="secondary" style={caps}>Pendiente</Badge></div>
      <div className="grid w-full max-w-popover gap-gap-xs"><Label style={caps}>Correo electrónico</Label><Input placeholder="nombre@correo.com" /></div>
    </Stage>
  )
}

function ControlShape(_: P) {
  const r: CSSProperties = { borderRadius: "var(--lab-control-radius)" }
  return (
    <Stage>
      <div className="grid w-full max-w-popover gap-gap-md rounded-card border-thin bg-card p-inset-lg">
        <p className="font-strong">Iniciar sesión</p>
        <Input placeholder="Correo" style={r} />
        <Input placeholder="Contraseña" type="password" style={r} />
        <Button style={r}>Entrar</Button>
        <div className="flex flex-wrap gap-gap-xs">
          {["Hoy", "Mañana", "Esta semana"].map((t, k) => <Button key={t} size="sm" variant={k === 0 ? "default" : "outline"} style={r}>{t}</Button>)}
        </div>
      </div>
    </Stage>
  )
}

function Surface({ option }: P) {
  const o = option.id
  const card = cn("rounded-card p-inset-lg", o === "bordes" && "border-thin bg-card", o === "sombras" && "bg-card shadow-raised", o === "tonal" && "bg-muted")
  return (
    <div className={cn("grid gap-gap-md rounded-card p-inset-lg", o === "tonal" ? "bg-background" : "bg-subtle")}>
      <div className={card}>
        <div className="flex items-center gap-gap-md">
          <span className="flex size-avatar-md items-center justify-center rounded-pill bg-primary text-primary-foreground"><User className="size-icon-md" /></span>
          <div><p className="font-strong">Ana Martín</p><p className="text-ui text-muted-foreground">Paciente desde 2021</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-gap-md">
        {[["Próxima cita", "12 dic"], ["Saldo", "0 €"]].map(([l, v]) => (
          <div key={l} className={card}><p className="text-caption text-muted-foreground">{l}</p><p className="text-title font-strong">{v}</p></div>
        ))}
      </div>
    </div>
  )
}

function Density(_: P) {
  const field: CSSProperties = { height: "var(--lab-h)" }
  return (
    <div className="grid gap-gap-lg rounded-card bg-subtle p-inset-lg sm:grid-cols-2">
      <div className="grid content-start" style={{ gap: "var(--lab-gap)" }}>
        <Label>Nombre</Label><Input style={field} placeholder="Ana" />
        <Label>Correo</Label><Input style={field} placeholder="ana@correo.com" />
        <Button style={field}>Guardar</Button>
      </div>
      <div className="rounded-card border-thin bg-card">
        {["Ana Martín", "Luis Pérez", "Marta Gil", "Jon Ruiz"].map((n) => (
          <div key={n} className="flex items-center justify-between border-b-thin px-inset-md text-ui last:border-b-0" style={{ paddingBlock: "var(--lab-pad)" }}>
            {n}<ChevronRight className="size-icon-sm text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ShadowShape(_: P) {
  return (
    <Stage>
      <div className="w-full max-w-popover rounded-card border-thin bg-card p-inset-lg transition-transform duration-default hover:-translate-y-inset-2xs" style={{ boxShadow: "var(--lab-shadow)" }}>
        <p className="font-strong">Plan anual</p>
        <p className="text-ui text-muted-foreground">Revisiones y limpiezas incluidas.</p>
        <Button className="mt-gap-md" size="sm" style={{ boxShadow: "var(--lab-shadow)" }}>Contratar</Button>
      </div>
    </Stage>
  )
}

function Icons(_: P) {
  const all = [Home, Search, Calendar, Mail, Bell, Heart, Star, Settings, User, Share2, Inbox, X]
  return (
    <Stage className="[&_svg]:[stroke-width:var(--lab-stroke)]">
      <div className="grid grid-cols-6 gap-gap-lg">{all.map((Icon, k) => <Icon key={k} className="size-icon-lg" />)}</div>
      <div className="flex gap-gap-sm"><Button><Plus />Añadir</Button><Button variant="outline"><Settings />Ajustes</Button></div>
    </Stage>
  )
}

export const PREVIEWS: Record<string, (p: P) => ReactNode> = {
  "barra-flotante": FloatingBarPreview,
  "movimiento": Motion,
  "fondo-sigue": FollowBackground,
  "indicador-estira": StretchIndicator,
  "forma-al-pulsar": PressShape,
  "material": Material,
  "fusion-liquida": LiquidFusion,
  "reparto-color": ColorShare,
  "fondo": Background,
  "acento": Accent,
  "fuente-titulares": HeadingFont,
  "escala-tipografica": TypeScale,
  "mayusculas": Caps,
  "forma-controles": ControlShape,
  "superficie": Surface,
  "densidad": Density,
  "forma-sombra": ShadowShape,
  "iconos": Icons,
}
