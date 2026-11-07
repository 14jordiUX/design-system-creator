import { Link } from "react-router-dom"
import { ArrowRight, Download, ExternalLink, Puzzle, Shapes } from "lucide-react"
import { ORIGIN_LABEL } from "@/lib/systems"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Section } from "@/components/app/common"
import { notYet } from "../Library"
import { useDS } from "./context"

const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]

export default function SystemHome() {
  const { ds, tokens, base, editor } = useDS()
  const brand = tokens.primitives.color.brand
  const family = tokens.primitives.font.family.sans.$value
  return (
    <div>
      <div className="mb-gap-3xl space-y-gap-lg">
        <div className="flex flex-wrap gap-gap-sm">
          <Badge variant="secondary">{ORIGIN_LABEL[ds.meta.origin]}</Badge>
          {ds.meta.productType && <Badge variant="outline">{ds.meta.productType}</Badge>}
        </div>
        <h1 className="text-display font-heavy tracking-heading">{ds.meta.name}</h1>
        <p className="max-w-prose text-lead text-muted-foreground">{ds.meta.description}</p>
        {editor && <Button variant="outline" size="sm" onClick={() => notYet("Editar la descripción y las notas", "1.4")}>Editar descripción</Button>}
      </div>

      {ds.meta.sourceUrl && (
        <Section title="Web de origen" description="El sistema se creó a partir de esta web. Es un punto de partida: ajusta lo que haga falta en el modo editor.">
          <a href={ds.meta.sourceUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-card border-thin transition-shadow hover:shadow-overlay">
            {ds.reference && <img src={ds.reference} alt={`Captura de ${ds.meta.sourceUrl}`} className="block w-full" />}
            <div className="flex items-center gap-gap-sm px-inset-lg py-inset-md text-ui"><ExternalLink className="size-icon-md" />{ds.meta.sourceUrl}</div>
          </a>
        </Section>
      )}

      <Section title="Principios">
        {ds.meta.principles?.length ? (
          <div className="grid gap-gap-lg md:grid-cols-3">
            {ds.meta.principles.map((p) => (
              <Card key={p.title}><CardHeader><CardTitle>{p.title}</CardTitle><CardDescription>{p.text}</CardDescription></CardHeader></Card>
            ))}
          </div>
        ) : <p className="text-ui text-muted-foreground">Este sistema todavía no tiene principios escritos.</p>}
      </Section>

      <Section title="Notas de uso">
        {ds.meta.notes && Object.keys(ds.meta.notes).length ? (
          <dl className="[&>*+*]:border-t-thin rounded-card border-thin">
            {Object.entries(ds.meta.notes).map(([k, v]) => (
              <div key={k} className="grid gap-gap-2xs px-inset-lg py-inset-md md:grid-cols-[var(--size-menu-min)_1fr]">
                <dt className="text-ui font-emphasis capitalize">{k}</dt>
                <dd className="text-ui text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="text-ui text-muted-foreground">Este sistema todavía no tiene notas de uso.</p>}
      </Section>

      <Section title="Vista rápida">
        <div className="grid gap-gap-lg md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Color de marca</CardTitle></CardHeader>
            <CardContent>
              <div className="flex h-header overflow-hidden rounded-control">
                {STEPS.map((s) => <div key={s} className="flex-1" style={{ background: brand[s].$value }} title={`brand.${s}`} />)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tipografía</CardTitle><CardDescription>{family[0]}</CardDescription></CardHeader>
            <CardContent>
              <p className="text-h1 font-heavy tracking-heading">Aa Bb Cc 123</p>
              <p className="mt-gap-sm text-ui text-muted-foreground">El veloz murciélago hindú comía feliz cardillo y kiwi.</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Componentes</CardTitle><CardDescription>Así se ven con el estilo de {ds.meta.name}.</CardDescription></CardHeader>
            <CardContent className="grid gap-gap-xl md:grid-cols-2">
              <div className="flex flex-wrap items-center gap-gap-sm">
                <Button>Pedir cita</Button>
                <Button variant="secondary">Ver horarios</Button>
                <Button variant="outline">Cancelar</Button>
                <Badge>Nuevo</Badge>
                <Badge variant="secondary">Confirmado</Badge>
              </div>
              <div className="space-y-gap-md">
                <div className="space-y-gap-xs"><Label htmlFor="mail">Correo electrónico</Label><Input id="mail" placeholder="nombre@correo.com" /></div>
                <div className="flex items-center gap-gap-sm"><Switch id="rem" defaultChecked /><Label htmlFor="rem">Recordarme la cita</Label></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Explora el sistema">
        <div className="grid gap-gap-lg md:grid-cols-3">
          {[
            { to: "fundamentos/color", icon: Shapes, t: "Fundamentos", d: "Color, tipografía, espaciado, radios, elevación y movimiento." },
            { to: "componentes", icon: Puzzle, t: "Componentes", d: "Los componentes de shadcn/ui con este estilo." },
            { to: "descargas", icon: Download, t: "Descargas", d: "CSS, archivo para Figma y, pronto, el kit de proyecto." },
          ].map((x) => (
            <Card key={x.t}>
              <CardHeader><x.icon className="size-icon-lg text-primary" /><CardTitle>{x.t}</CardTitle><CardDescription>{x.d}</CardDescription></CardHeader>
              <CardFooter><Button variant="link" className="px-0" asChild><Link to={`${base}/${x.to}`}>Abrir<ArrowRight /></Link></Button></CardFooter>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  )
}
