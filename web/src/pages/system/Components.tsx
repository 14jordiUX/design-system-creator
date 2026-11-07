import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Check, Copy, Puzzle } from "lucide-react"
import { ALL_COMPONENTS, COMPONENT_GROUPS } from "@/lib/nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, EmptyState, PageHeader, Section, Soon } from "@/components/app/common"
import { useDS } from "./context"
import { DEMOS } from "./demos"
import { usedTokens, COMPOSED } from "@/lib/usedTokens"
import { InspectableDemo, InspectorProvider, TokenChip } from "./inspector"

export function ComponentsIndex() {
  const { base, ds } = useDS()
  const ready = ALL_COMPONENTS.filter((c) => c.ready).length
  return (
    <div>
      <PageHeader eyebrow="Componentes" title="Todos los componentes"
        description={`Los componentes de shadcn/ui con el estilo de ${ds.meta.name}. ${ready === ALL_COMPONENTS.length ? `Los ${ready} están listos, cada uno con su demo, su código y los tokens que usa.` : `Hay ${ready} de ${ALL_COMPONENTS.length} listos.`}`} />
      {COMPONENT_GROUPS.map((g) => (
        <Section key={g.group} title={g.group}>
          <div className="grid gap-gap-md sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((i) => (
              <Link key={i.slug} to={`${base}/componentes/${i.slug}`}
                className="flex items-center justify-between rounded-card border-thin p-inset-lg text-ui transition-colors hover:bg-accent">
                <span className={i.ready ? "font-emphasis" : "text-muted-foreground"}>{i.label}</span>
                {i.ready ? <Badge variant="secondary">Listo</Badge> : <Soon step="Paso 1.3" />}
              </Link>
            ))}
          </div>
        </Section>
      ))}
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="rounded-b-card border-thin border-t-0 bg-muted">
      <div className="flex justify-end p-inset-sm pb-0">
        <Button size="sm" variant="ghost"
          onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
          {copied ? <Check /> : <Copy />}{copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <pre className="overflow-x-auto px-inset-lg pb-inset-lg font-code text-caption leading-prose">{code}</pre>
    </div>
  )
}

export function ComponentPage() {
  const { slug } = useParams()
  const item = ALL_COMPONENTS.find((c) => c.slug === slug)
  const demo = slug ? DEMOS[slug] : undefined
  const tokens = slug ? usedTokens(slug) : null
  const { editor } = useDS()
  if (!item) return <EmptyState title="Este componente no existe" />
  return (
    <InspectorProvider key={slug} enabled={editor}>
      <PageHeader eyebrow={`Componentes · ${item.group}`} title={item.label} description={demo?.description} />
      {!demo ? (
        <EmptyState icon={<Puzzle className="size-icon-lg" />} title="No hay nada todavía"
          text={`La página de ${item.label}, con sus variantes, estados y código, llega en el paso 1.3.`} />
      ) : (
        <>
          {demo.examples.map((ex) => (
            <Section key={ex.title} title={ex.title} description={ex.description}>
              <InspectableDemo all={tokens}>{ex.render}</InspectableDemo>
              <CodeBlock code={ex.code} />
            </Section>
          ))}
          <Section title="Tokens que usa" description={(editor ? "Pasa el ratón por un token para ver dónde se aplica en las demos. " : "") + (COMPOSED[slug!] ? `Se monta juntando ${COMPOSED[slug!].join(", ")}. ` : "") + "Lista calculada a partir del código del componente: cada clase apunta a un token. No hay ningún valor escrito a mano."}>
            {tokens?.length ? (
              <div className="grid gap-gap-lg md:grid-cols-2">
                {tokens.map(([group, list]) => (
                  <div key={group} className="rounded-card border-thin p-inset-lg">
                    <div className="mb-gap-sm text-ui font-strong">{group}</div>
                    <div className="flex flex-wrap gap-gap-xs">{list.map((t) => <TokenChip key={t} token={t} />)}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-ui text-muted-foreground">{tokens ? "Este componente no tiene estilos propios: solo añade comportamiento. Los tokens los ponen los elementos que metas dentro." : "No se ha podido leer el código de este componente."}</p>}
          </Section>
        </>
      )}
    </InspectorProvider>
  )
}
