// Demos de los componentes que faltaban de shadcn/ui (noviembre 2026): Typography, Code Block, Trace, Questionnaire y Direction.
import * as React from "react"
import { toast } from "sonner"
import { CircleAlert, CircleCheck, FileCode, Globe, LoaderCircle, Search, WrapText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  CodeBlock, CodeBlockActions, CodeBlockContent, CodeBlockCopyButton, CodeBlockFooter, CodeBlockHeader, CodeBlockLine, CodeBlockTitle,
} from "@/components/ui/code-block"
import {
  Trace, TraceCollapsible, TraceCollapsibleContent, TraceCollapsibleTrigger, TraceDescription, TraceIcon, TraceLine, TraceTitle,
} from "@/components/ui/trace"
import {
  Questionnaire, QuestionnaireActions, QuestionnaireChoice, QuestionnaireChoices, QuestionnaireDescription, QuestionnaireError,
  QuestionnaireInput, QuestionnaireItem, QuestionnaireNext, QuestionnairePrevious, QuestionnaireProgress, QuestionnaireSkip,
  QuestionnaireSubmit, QuestionnaireTitle,
} from "@/components/ui/questionnaire"
import { DirectionProvider } from "@/components/ui/direction"
import type { Demo } from "./demos"

const imp = (name: string, file: string) => `import { ${name} } from "@/components/ui/${file}"\n\n`

// ---------- Typography ----------
function TypographyDemo() {
  return (
    <article className="max-w-prose">
      <h1 className="text-h1 font-heavy tracking-heading text-balance">El cuidado empieza por escuchar</h1>
      <p className="mt-gap-lg text-lead text-muted-foreground">Una guía breve sobre cómo preparamos tu primera visita.</p>
      <h2 className="mt-gap-3xl border-b-thin pb-inset-sm text-h2 font-strong tracking-heading">Antes de venir</h2>
      <p className="mt-gap-lg text-body leading-prose">
        Te pediremos tu historial y cualquier prueba reciente. Si tomas medicación, tráenos la lista: nos ayuda a
        decidir el tratamiento con más seguridad.
      </p>
      <blockquote className="mt-gap-xl border-s-thick ps-inset-xl text-body italic">
        «Lo que más valoro es que me explicaran cada paso antes de hacerlo.»
      </blockquote>
      <h3 className="mt-gap-2xl text-h3 font-strong tracking-heading">Qué traer</h3>
      <ul className="my-gap-lg ms-gap-xl list-disc text-body [&>li]:mt-gap-xs">
        <li>Documento de identidad</li>
        <li>Tarjeta del seguro, si tienes</li>
        <li>Informes o radiografías anteriores</li>
      </ul>
      <p className="text-body leading-prose">
        Para cambiar la cita, escribe <code className="rounded-inner bg-muted px-inset-2xs py-inset-3xs font-code text-ui font-strong">CAMBIAR</code> en el chat.
      </p>
      <p className="mt-gap-lg text-ui text-muted-foreground">Última actualización: noviembre de 2026.</p>
    </article>
  )
}

const TYPE_ROWS: [string, string, string][] = [
  ["h1", "text-h1 font-heavy tracking-heading", "Título de página"],
  ["h2", "border-b-thin pb-inset-sm text-h2 font-strong tracking-heading", "Título de sección"],
  ["h3", "text-h3 font-strong tracking-heading", "Subsección"],
  ["h4", "text-title font-strong tracking-heading", "Bloque"],
  ["Entradilla", "text-lead text-muted-foreground", "Una frase que presenta el contenido."],
  ["Párrafo", "text-body leading-prose", "El texto de lectura, con interlineado cómodo."],
  ["Grande", "text-lead font-strong", "Un dato que destaca"],
  ["Pequeño", "text-ui font-emphasis leading-compact", "Etiqueta o nota corta"],
  ["Apagado", "text-ui text-muted-foreground", "Información secundaria"],
]

// ---------- Code Block ----------
const CODE = `import { Button } from "@/components/ui/button"

export function Reservar() {
  return <Button>Reservar cita</Button>
}`

function CodeBlockDemo({ variant = "full" }: { variant?: "full" | "basic" | "numbers" | "diff" | "error" | "small" }) {
  const [wrap, setWrap] = React.useState(false)
  if (variant === "basic") return (
    <CodeBlock className="max-w-dialog"><CodeBlockContent>{`npx shadcn@latest add button`}</CodeBlockContent></CodeBlock>
  )
  if (variant === "small") return (
    <CodeBlock size="sm" className="max-w-dialog">
      <CodeBlockActions><CodeBlockCopyButton value="npm install" /></CodeBlockActions>
      <CodeBlockContent>{`npm install`}</CodeBlockContent>
    </CodeBlock>
  )
  if (variant === "error") return (
    <CodeBlock variant="destructive" className="max-w-dialog">
      <CodeBlockHeader><CodeBlockTitle><CircleAlert />Error al instalar</CodeBlockTitle></CodeBlockHeader>
      <CodeBlockContent wrap>{`ERR_PNPM_OUTDATED_LOCKFILE  No se puede instalar: pnpm-lock.yaml no coincide con package.json`}</CodeBlockContent>
    </CodeBlock>
  )
  if (variant === "diff") return (
    <CodeBlock className="max-w-dialog">
      <CodeBlockHeader><CodeBlockTitle><FileCode />reservar.tsx</CodeBlockTitle></CodeBlockHeader>
      <CodeBlockContent>
        <CodeBlockLine>{`export function Reservar() {`}</CodeBlockLine>
        <CodeBlockLine variant="removed">{`  return <button className="btn">Reservar</button>`}</CodeBlockLine>
        <CodeBlockLine variant="added">{`  return <Button>Reservar cita</Button>`}</CodeBlockLine>
        <CodeBlockLine>{`}`}</CodeBlockLine>
      </CodeBlockContent>
    </CodeBlock>
  )
  return (
    <CodeBlock className="max-w-dialog">
      <CodeBlockHeader>
        <CodeBlockTitle><FileCode />components/reservar.tsx</CodeBlockTitle>
        <CodeBlockActions>
          <Button variant="ghost" size="icon-xs" aria-label="Ajustar líneas" aria-pressed={wrap} onClick={() => setWrap(!wrap)}><WrapText /></Button>
          <CodeBlockCopyButton value={CODE} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent wrap={wrap} lineNumbers={variant === "numbers" || variant === "full"}>{CODE}</CodeBlockContent>
      {variant === "full" && <CodeBlockFooter>TypeScript · 5 líneas</CodeBlockFooter>}
    </CodeBlock>
  )
}

// ---------- Trace ----------
function TraceDemo({ variant = "steps" }: { variant?: "steps" | "status" | "collapsible" }) {
  if (variant === "status") return (
    <Trace className="max-w-dialog">
      <TraceLine><TraceIcon><CircleCheck /></TraceIcon><TraceTitle>Buscar huecos libres</TraceTitle><TraceDescription>0,8 s</TraceDescription></TraceLine>
      <TraceLine status="running"><TraceIcon><LoaderCircle className="animate-spin" /></TraceIcon><TraceTitle>Reservando la cita</TraceTitle></TraceLine>
      <TraceLine status="pending"><TraceIcon><Globe /></TraceIcon><TraceTitle>Enviar recordatorio</TraceTitle></TraceLine>
      <TraceLine status="error"><TraceIcon><CircleAlert /></TraceIcon><TraceTitle>Cobro con tarjeta</TraceTitle><TraceDescription>falló</TraceDescription></TraceLine>
    </Trace>
  )
  if (variant === "collapsible") return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger><TraceTitle>Investigado en 3 pasos</TraceTitle></TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            <TraceLine><TraceIcon><Search /></TraceIcon><TraceTitle>Buscado «tratamientos de ortodoncia»</TraceTitle></TraceLine>
            <TraceLine><TraceIcon><Globe /></TraceIcon><TraceTitle>Leídas 4 páginas</TraceTitle><TraceDescription>1,2 s</TraceDescription></TraceLine>
            <TraceLine><TraceIcon><CircleCheck /></TraceIcon><TraceTitle>Resumen preparado</TraceTitle></TraceLine>
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
  return (
    <Trace className="max-w-dialog">
      <TraceLine><TraceIcon><Search /></TraceIcon><TraceTitle>Buscar disponibilidad del viernes</TraceTitle></TraceLine>
      <TraceLine><TraceIcon><Globe /></TraceIcon><TraceTitle>Consultar la agenda de la Dra. Ruiz</TraceTitle><TraceDescription>2 resultados</TraceDescription></TraceLine>
      <TraceLine><TraceIcon><CircleCheck /></TraceIcon><TraceTitle>Proponer 17:30</TraceTitle></TraceLine>
    </Trace>
  )
}

// ---------- Questionnaire ----------
const ITEMS = [
  { name: "motivo", required: true, choices: [{ value: "revision" }, { value: "dolor" }, { value: "estetica" }] },
  { name: "horario", choices: [{ value: "manana" }, { value: "tarde" }, { value: "sabado" }] },
  { name: "aviso", required: true, choices: [{ value: "sms" }, { value: "correo" }, { value: "llamada" }] },
] as const

function QuestionnaireDemo() {
  const [item, setItem] = React.useState<string>(ITEMS[0].name)
  const n = ITEMS.findIndex((i) => i.name === item) + 1
  return (
    <Questionnaire className="max-w-dialog" item={item} onItemChange={setItem} items={ITEMS} shortcuts="letters"
      onSubmit={(e) => { e.preventDefault(); toast("Respuestas guardadas", { description: "Te escribiremos con una propuesta de cita." }) }}>
      <QuestionnaireProgress>Pregunta {n} de {ITEMS.length}</QuestionnaireProgress>
      <QuestionnaireItem name="motivo" required>
        <QuestionnaireTitle>¿Por qué quieres venir?</QuestionnaireTitle>
        <QuestionnaireDescription>Elige una opción o cuéntanoslo con tus palabras.</QuestionnaireDescription>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="revision"><span className="font-emphasis">Revisión</span><span className="text-muted-foreground">Una visita de control.</span></QuestionnaireChoice>
          <QuestionnaireChoice value="dolor"><span className="font-emphasis">Tengo dolor</span><span className="text-muted-foreground">Te damos prioridad.</span></QuestionnaireChoice>
          <QuestionnaireChoice value="estetica"><span className="font-emphasis">Estética</span><span className="text-muted-foreground">Blanqueamiento, carillas…</span></QuestionnaireChoice>
          <QuestionnaireInput aria-label="Otro motivo" placeholder="Otro motivo…" />
        </QuestionnaireChoices>
        <QuestionnaireError>Elige una respuesta para continuar.</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireItem name="horario" multiple>
        <QuestionnaireTitle>¿Qué horarios te van bien?</QuestionnaireTitle>
        <QuestionnaireDescription>Marca todos los que quieras, o sáltate la pregunta.</QuestionnaireDescription>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="manana">Mañanas</QuestionnaireChoice>
          <QuestionnaireChoice value="tarde">Tardes</QuestionnaireChoice>
          <QuestionnaireChoice value="sabado">Sábados</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="aviso" required>
        <QuestionnaireTitle>¿Cómo te avisamos?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="sms">SMS</QuestionnaireChoice>
          <QuestionnaireChoice value="correo">Correo</QuestionnaireChoice>
          <QuestionnaireChoice value="llamada">Llamada</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError>Elige una respuesta para continuar.</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious>Atrás</QuestionnairePrevious>
        <QuestionnaireSkip>Saltar</QuestionnaireSkip>
        <QuestionnaireNext>Siguiente</QuestionnaireNext>
        <QuestionnaireSubmit>Enviar</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  )
}

// ---------- Direction ----------
function DirectionDemo() {
  const [rtl, setRtl] = React.useState(true)
  return (
    <div className="grid w-full max-w-dialog gap-gap-lg">
      <div className="flex items-center gap-gap-sm"><Switch id="rtl" checked={rtl} onCheckedChange={setRtl} /><Label htmlFor="rtl">De derecha a izquierda (árabe, hebreo)</Label></div>
      <DirectionProvider dir={rtl ? "rtl" : "ltr"}>
        <div dir={rtl ? "rtl" : "ltr"} className="grid gap-gap-md rounded-card border-thin p-inset-lg">
          <Label htmlFor="nombrertl">{rtl ? "الاسم" : "Nombre"}</Label>
          <Input id="nombrertl" placeholder={rtl ? "اكتب اسمك" : "Escribe tu nombre"} />
          <div className="flex gap-gap-sm"><Button>{rtl ? "احجز موعدًا" : "Reservar cita"}</Button><Button variant="outline">{rtl ? "إلغاء" : "Cancelar"}</Button></div>
        </div>
      </DirectionProvider>
    </div>
  )
}

export const DEMOS5: Record<string, Demo> = {
  typography: {
    description: "Estilos para títulos, párrafos, listas y citas. No es un componente: son clases de tokens (text-h1, text-body, leading-prose…) que se aplican a las etiquetas normales.",
    examples: [
      { title: "Un texto completo", render: <TypographyDemo />,
        code: `<h1 className="text-h1 font-heavy tracking-heading">…</h1>\n<p className="text-lead text-muted-foreground">…</p>\n<h2 className="border-b-thin pb-inset-sm text-h2 font-strong tracking-heading">…</h2>\n<p className="text-body leading-prose">…</p>\n<blockquote className="border-s-thick ps-inset-xl italic">…</blockquote>\n<ul className="ms-gap-xl list-disc [&>li]:mt-gap-xs">…</ul>` },
      { title: "Cada estilo", render: (
        <div className="grid w-full gap-gap-lg">
          {TYPE_ROWS.map(([n, cls, t]) => (
            <div key={n} className="grid items-baseline gap-gap-xs sm:grid-cols-4">
              <span className="text-caption text-muted-foreground">{n}<br /><code className="font-code">{cls}</code></span>
              <span className={`sm:col-span-3 ${cls}`}>{t}</span>
            </div>
          ))}
        </div>),
        code: TYPE_ROWS.map(([n, cls]) => `// ${n}\nclassName="${cls}"`).join("\n") },
    ],
  },
  [`code-block`]: {
    description: "Muestra código, la salida de un terminal o cambios (diff), con cabecera, números de línea y botón de copiar.",
    examples: [
      { title: "Completo", render: <CodeBlockDemo />, code: imp(`CodeBlock, CodeBlockHeader, CodeBlockTitle, CodeBlockActions, CodeBlockCopyButton, CodeBlockContent, CodeBlockFooter`, `code-block`) + `<CodeBlock>\n  <CodeBlockHeader>\n    <CodeBlockTitle><FileCode />components/reservar.tsx</CodeBlockTitle>\n    <CodeBlockActions><CodeBlockCopyButton value={code} /></CodeBlockActions>\n  </CodeBlockHeader>\n  <CodeBlockContent lineNumbers>{code}</CodeBlockContent>\n  <CodeBlockFooter>TypeScript · 5 líneas</CodeBlockFooter>\n</CodeBlock>` },
      { title: "Básico", render: <CodeBlockDemo variant="basic" />, code: `<CodeBlock>\n  <CodeBlockContent>{"npx shadcn@latest add button"}</CodeBlockContent>\n</CodeBlock>` },
      { title: "Cambios (diff)", render: <CodeBlockDemo variant="diff" />, code: `<CodeBlockLine variant="removed">…</CodeBlockLine>\n<CodeBlockLine variant="added">…</CodeBlockLine>` },
      { title: "Error", render: <CodeBlockDemo variant="error" />, code: `<CodeBlock variant="destructive">…</CodeBlock>` },
      { title: "Pequeño con copiar flotante", render: <CodeBlockDemo variant="small" />, code: `<CodeBlock size="sm">\n  <CodeBlockActions><CodeBlockCopyButton value="npm install" /></CodeBlockActions>\n  <CodeBlockContent>{"npm install"}</CodeBlockContent>\n</CodeBlock>` },
    ],
  },
  trace: {
    description: "La pieza base para enseñar lo que hace una IA: pasos, herramientas, fuentes y razonamiento, línea a línea.",
    examples: [
      { title: "Pasos", render: <TraceDemo />, code: imp(`Trace, TraceLine, TraceIcon, TraceTitle, TraceDescription`, `trace`) + `<Trace>\n  <TraceLine>\n    <TraceIcon><Search /></TraceIcon>\n    <TraceTitle>Buscar disponibilidad del viernes</TraceTitle>\n  </TraceLine>\n  <TraceLine>\n    <TraceIcon><Globe /></TraceIcon>\n    <TraceTitle>Consultar la agenda</TraceTitle>\n    <TraceDescription>2 resultados</TraceDescription>\n  </TraceLine>\n</Trace>` },
      { title: "Estados", render: <TraceDemo variant="status" />, code: `<TraceLine status="running">…</TraceLine>   // con brillo mientras trabaja\n<TraceLine status="pending">…</TraceLine>\n<TraceLine status="error">…</TraceLine>` },
      { title: "Plegable", render: <TraceDemo variant="collapsible" />, code: `<TraceCollapsible>\n  <TraceCollapsibleTrigger><TraceTitle>Investigado en 3 pasos</TraceTitle></TraceCollapsibleTrigger>\n  <TraceCollapsibleContent>\n    <Trace>…</Trace>\n  </TraceCollapsibleContent>\n</TraceCollapsible>` },
    ],
  },
  questionnaire: {
    description: "Cuestionario por pasos: preguntas de una o varias respuestas, respuesta libre, preguntas que se pueden saltar y atajos de teclado (A, B, C…).",
    examples: [
      { title: "Tres preguntas", render: <QuestionnaireDemo />, code: imp(`Questionnaire, QuestionnaireProgress, QuestionnaireItem, QuestionnaireTitle, QuestionnaireDescription, QuestionnaireChoices, QuestionnaireChoice, QuestionnaireInput, QuestionnaireError, QuestionnaireActions, QuestionnairePrevious, QuestionnaireSkip, QuestionnaireNext, QuestionnaireSubmit`, `questionnaire`) + `<Questionnaire items={items} defaultItem="motivo" shortcuts="letters" onSubmit={…}>\n  <QuestionnaireProgress>Pregunta {n} de 3</QuestionnaireProgress>\n  <QuestionnaireItem name="motivo" required>\n    <QuestionnaireTitle>¿Por qué quieres venir?</QuestionnaireTitle>\n    <QuestionnaireChoices>\n      <QuestionnaireChoice value="revision">Revisión</QuestionnaireChoice>\n      <QuestionnaireInput placeholder="Otro motivo…" />\n    </QuestionnaireChoices>\n    <QuestionnaireError>Elige una respuesta para continuar.</QuestionnaireError>\n  </QuestionnaireItem>\n  …\n  <QuestionnaireActions>\n    <QuestionnairePrevious>Atrás</QuestionnairePrevious>\n    <QuestionnaireSkip>Saltar</QuestionnaireSkip>\n    <QuestionnaireNext>Siguiente</QuestionnaireNext>\n    <QuestionnaireSubmit>Enviar</QuestionnaireSubmit>\n  </QuestionnaireActions>\n</Questionnaire>` },
    ],
  },
  direction: {
    description: "Indica a los componentes si el texto va de izquierda a derecha o de derecha a izquierda (árabe, hebreo). Los componentes del sistema usan márgenes lógicos, así que se dan la vuelta solos.",
    examples: [
      { title: "Cambiar la dirección", render: <DirectionDemo />, code: imp(`DirectionProvider`, `direction`) + `<DirectionProvider dir="rtl">\n  <html dir="rtl">…</html>\n</DirectionProvider>` },
    ],
  },
}
