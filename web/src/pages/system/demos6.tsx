// AI Elements de shadcn/ui: patrones para interfaces con IA, montados con los componentes del sistema
// (Trace, Code Block, Message, Bubble, Marker, Item, Input Group, Hover Card…). Son demos estáticas:
// el contenido no viene de una IA real, así que no necesitan el AI SDK.
import * as React from "react"
import {
  ArrowUpIcon, ArrowUpRight, Bot, Brain, Check, ChevronDown, ChevronRight, CircleAlert, CircleCheck, CircleDashed, CircleDot,
  Circle, Copy, File, FileCode, FlaskConical, Folder, Globe, Layers, ListChecks, ListTodo, LoaderCircle, Paperclip, Plus,
  RefreshCw, Route, Search, Terminal, ThumbsDown, ThumbsUp, X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { CodeBlock, CodeBlockContent, CodeBlockLine } from "@/components/ui/code-block"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { Message, MessageContent, MessageFooter } from "@/components/ui/message"
import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import {
  Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle,
} from "@/components/ui/attachment"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Trace, TraceCollapsible, TraceCollapsibleContent, TraceCollapsibleTrigger, TraceDescription, TraceIcon, TraceLine, TraceTitle,
} from "@/components/ui/trace"
import type { Demo } from "./demos"

const imp = (names: string, file: string) => `import { ${names} } from "@/components/ui/${file}"\n`
const FRAME = "flex w-full max-w-dialog flex-col gap-gap-lg text-ui"

function User({ children }: { children: React.ReactNode }) {
  return (
    <Message align="end"><MessageContent><Bubble variant="muted"><BubbleContent>{children}</BubbleContent></Bubble></MessageContent></Message>
  )
}
function Ai({ children }: { children: React.ReactNode }) {
  return <Message><MessageContent className="gap-gap-lg">{children}</MessageContent></Message>
}

// ---------- Chain of Thought ----------
function ChainOfThought() {
  return (
    <div className={FRAME}>
      <User>¿Qué tratamiento de ortodoncia me conviene?</User>
      <Ai>
        <Trace>
          <TraceCollapsible defaultOpen>
            <TraceCollapsibleTrigger><TraceLine><TraceIcon><Brain /></TraceIcon><TraceTitle>Investigado en 3 pasos</TraceTitle></TraceLine></TraceCollapsibleTrigger>
            <TraceCollapsibleContent>
              <Trace>
                <TraceLine><TraceIcon><Search /></TraceIcon><TraceTitle>Buscado «brackets o alineadores»</TraceTitle><Badge variant="secondary">4 fuentes</Badge></TraceLine>
                <TraceLine><TraceIcon><FileCode /></TraceIcon><TraceTitle>Leído tu historial</TraceTitle><TraceDescription>2 visitas</TraceDescription></TraceLine>
                <TraceLine><TraceIcon><CircleCheck /></TraceIcon><TraceTitle>Comparadas las opciones</TraceTitle></TraceLine>
              </Trace>
            </TraceCollapsibleContent>
          </TraceCollapsible>
        </Trace>
        <p>Por lo que cuentas, los alineadores transparentes encajan mejor: el apiñamiento es leve y quieres algo discreto.</p>
      </Ai>
    </div>
  )
}

// ---------- Chat ----------
const CHAT: [boolean, string][] = [
  [true, "Hola, quería cambiar mi cita del viernes."],
  [false, "Claro. Tienes cita el viernes a las 17:30 con la Dra. Ruiz. ¿Qué día te va mejor?"],
  [true, "¿Puede ser el lunes por la tarde?"],
  [false, "El lunes tengo libre a las 16:00 y a las 18:30. ¿Cuál prefieres?"],
  [true, "A las 18:30."],
  [false, "Hecho. Te he movido la cita al lunes a las 18:30 y te llegará un SMS de confirmación."],
]
function Chat() {
  return (
    <div className="flex h-sheet w-full max-w-dialog flex-col overflow-hidden rounded-card border-thin">
      <MessageScrollerProvider>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-gap-lg p-inset-lg">
              {CHAT.map(([me, text], i) => (
                <MessageScrollerItem key={i}>{me ? <User>{text}</User> : <Ai><p>{text}</p></Ai>}</MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="p-inset-md">
        <InputGroup>
          <InputGroupTextarea placeholder="Escribe un mensaje…" />
          <InputGroupAddon align="block-end">
            <InputGroupButton size="icon-xs" variant="default" className="ms-auto" aria-label="Enviar"><ArrowUpIcon /></InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  )
}

// ---------- Checkpoint ----------
function Checkpoint() {
  return (
    <div className={FRAME}>
      <User>Prepárame un plan de limpieza dental para todo el año.</User>
      <Ai><p>Te propongo cuatro limpiezas: enero, abril, julio y octubre.</p></Ai>
      <Marker variant="separator">
        <MarkerContent className="inline-flex items-center gap-gap-sm">Plan creado<Button size="xs" variant="outline">Volver aquí</Button></MarkerContent>
      </Marker>
      <User>Mejor solo dos.</User>
      <Ai><p>De acuerdo: enero y julio.</p></Ai>
      <Marker variant="separator"><MarkerContent>Plan cambiado</MarkerContent></Marker>
    </div>
  )
}

// ---------- Confirmation ----------
function Confirmation() {
  const [answer, setAnswer] = React.useState<null | boolean>(null)
  return (
    <div className={FRAME}>
      <User>Cancela todas mis citas de diciembre.</User>
      <Ai>
        {answer === null ? (
          <Item variant="outline" size="sm">
            <ItemMedia variant="icon"><CircleAlert /></ItemMedia>
            <ItemContent><ItemTitle>¿Cancelar 3 citas?</ItemTitle><ItemDescription>Se avisará a la clínica y no se puede deshacer.</ItemDescription></ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline" onClick={() => setAnswer(false)}>No</Button>
              <Button size="sm" onClick={() => setAnswer(true)}>Cancelar citas</Button>
            </ItemActions>
          </Item>
        ) : (
          <Trace>
            <TraceLine status={answer ? undefined : "error"}>
              <TraceIcon>{answer ? <CircleCheck /> : <X />}</TraceIcon>
              <TraceTitle>{answer ? "3 citas canceladas" : "Has dicho que no"}</TraceTitle>
              <Button size="xs" variant="ghost" onClick={() => setAnswer(null)}>Repetir</Button>
            </TraceLine>
          </Trace>
        )}
      </Ai>
    </div>
  )
}

// ---------- Context ----------
const USAGE = { entrada: 8420, salida: 1260, razonamiento: 980, limite: 128000 }
const USED = USAGE.entrada + USAGE.salida + USAGE.razonamiento
const PERCENT = Math.round((USED / USAGE.limite) * 100)
const k = (v: number) => (v < 1000 ? String(v) : `${(v / 1000).toFixed(1).replace(/\.0$/, "").replace(".", ",")} mil`)
function Context() {
  return (
    <HoverCard openDelay={10} closeDelay={100}>
      <HoverCardTrigger asChild><Button variant="outline" size="sm">{PERCENT} % del contexto</Button></HoverCardTrigger>
      <HoverCardContent className="flex flex-col gap-gap-md">
        <div className="flex items-center justify-between gap-gap-md text-ui"><span className="font-emphasis">Contexto</span><span className="text-muted-foreground">{k(USED)} / {k(USAGE.limite)}</span></div>
        <Progress value={PERCENT} aria-label="Contexto usado" />
        <div className="flex flex-col gap-gap-2xs text-ui">
          {([["Entrada", USAGE.entrada], ["Salida", USAGE.salida], ["Razonamiento", USAGE.razonamiento]] as const).map(([l, v]) => (
            <div key={l} className="flex justify-between gap-gap-md"><span className="text-muted-foreground">{l}</span><span>{k(v)}</span></div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// ---------- File Tree ----------
type Node = { name: string; children?: Node[] }
const TREE: Node[] = [
  { name: "src", children: [
    { name: "components", children: [{ name: "reservar.tsx" }, { name: "agenda.tsx" }] },
    { name: "app.tsx" },
  ]},
  { name: "package.json" },
]
function TreeNode({ node, sel, onSel }: { node: Node; sel: string; onSel: (n: string) => void }) {
  if (node.children) return (
    <Collapsible defaultOpen className="group/folder">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start font-normal">
          <ChevronRight className="transition-transform group-data-[state=open]/folder:rotate-turn" /><Folder />{node.name}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent><div className="ms-gap-lg flex flex-col">{node.children.map((c) => <TreeNode key={c.name} node={c} sel={sel} onSel={onSel} />)}</div></CollapsibleContent>
    </Collapsible>
  )
  return (
    <Button variant="ghost" size="sm" aria-current={sel === node.name || undefined} onClick={() => onSel(node.name)}
      className="w-full justify-start font-normal aria-[current]:bg-accent aria-[current]:text-accent-foreground"><File />{node.name}</Button>
  )
}
function FileTree() {
  const [sel, setSel] = React.useState("reservar.tsx")
  return <div className="flex w-full max-w-popover flex-col text-ui">{TREE.map((n) => <TreeNode key={n.name} node={n} sel={sel} onSel={setSel} />)}</div>
}

// ---------- Inline Citation ----------
function Cite({ n, title, url, text }: { n: number; title: string; url: string; text: string }) {
  return (
    <HoverCard openDelay={10} closeDelay={100}>
      <HoverCardTrigger asChild><Button variant="secondary" size="xs" className="align-baseline">{n}</Button></HoverCardTrigger>
      <HoverCardContent className="flex flex-col gap-gap-xs">
        <span className="text-caption text-muted-foreground">{url}</span>
        <span className="font-emphasis">{title}</span>
        <span className="text-ui text-muted-foreground">{text}</span>
      </HoverCardContent>
    </HoverCard>
  )
}
function InlineCitation() {
  return (
    <p className="max-w-dialog text-ui leading-prose">
      Se recomienda una limpieza profesional cada seis meses <Cite n={1} title="Higiene bucodental" url="consejodentistas.es" text="Recomendaciones generales para adultos sanos." /> y
      usar hilo dental a diario <Cite n={2} title="Guía de salud oral" url="who.int" text="La OMS recomienda limpiar entre los dientes una vez al día." />.
    </p>
  )
}

// ---------- Message (turno de la IA) ----------
export function AiTurn() {
  return (
    <div className={FRAME}>
      <User>¿A qué hora abrís los sábados?</User>
      <Ai>
        <p>Los sábados abrimos de 9:00 a 14:00. Por la tarde está cerrado.</p>
        <MessageFooter className="gap-gap-2xs px-0">
          {([[Copy, "Copiar"], [ThumbsUp, "Me gusta"], [ThumbsDown, "No me gusta"], [RefreshCw, "Repetir"]] as const).map(([Icon, label]) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild><Button size="icon-xs" variant="ghost" aria-label={label}><Icon /></Button></TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </MessageFooter>
      </Ai>
    </div>
  )
}

// ---------- Model Selector ----------
const MODELS: { group: string; items: [string, string][] }[] = [
  { group: "Rápidos", items: [["mini", "Mini"], ["ligero", "Ligero"]] },
  { group: "Potentes", items: [["pro", "Pro"], ["maximo", "Máximo"]] },
]
const EFFORT = [["bajo", "Bajo"], ["medio", "Medio"], ["alto", "Alto"]] as const
function ModelSelector() {
  const [model, setModel] = React.useState<string>("pro")
  const [effort, setEffort] = React.useState<string>("medio")
  const label = MODELS.flatMap((g) => g.items).find(([id]) => id === model)?.[1]
  return (
    <InputGroup className="max-w-dialog">
      <InputGroupTextarea placeholder="Pregunta lo que quieras…" />
      <InputGroupAddon align="block-end">
        <InputGroupButton size="icon-xs" variant="outline" aria-label="Añadir"><Plus /></InputGroupButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><InputGroupButton size="xs" variant="ghost">{label}<ChevronDown /></InputGroupButton></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={model} onValueChange={setModel}>
              {MODELS.map((g, i) => (
                <React.Fragment key={g.group}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{g.group}</DropdownMenuLabel>
                    {g.items.map(([id, name]) => <DropdownMenuRadioItem key={id} value={id}>{name}</DropdownMenuRadioItem>)}
                  </DropdownMenuGroup>
                </React.Fragment>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><InputGroupButton size="xs" variant="ghost">Esfuerzo: {EFFORT.find(([id]) => id === effort)?.[1]}<ChevronDown /></InputGroupButton></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Cuánto piensa</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={effort} onValueChange={setEffort}>
              {EFFORT.map(([id, name]) => <DropdownMenuRadioItem key={id} value={id}>{name}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <InputGroupButton size="icon-xs" variant="default" className="ms-auto" aria-label="Enviar"><ArrowUpIcon /></InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

// ---------- Plan ----------
const STEPS: [string, "done" | "running" | "pending"][] = [
  ["Revisar tu historial", "done"], ["Buscar huecos con la Dra. Ruiz", "done"], ["Reservar la cita", "running"], ["Enviar el recordatorio", "pending"],
]
function StepIcon({ s }: { s: string }) {
  return s === "done" ? <CircleCheck /> : s === "running" ? <CircleDot /> : <Circle />
}
function Plan() {
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger>
          <TraceLine status="running"><TraceIcon><Route /></TraceIcon><TraceTitle>Plan para mover tu cita</TraceTitle><TraceDescription>2 de 4 hechos</TraceDescription></TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            {STEPS.map(([t, s]) => (
              <TraceLine key={t} status={s === "pending" ? "pending" : s === "running" ? "running" : undefined}>
                <TraceIcon><StepIcon s={s} /></TraceIcon><TraceTitle>{t}</TraceTitle>
              </TraceLine>
            ))}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

// ---------- Prompt Input ----------
function PromptInput() {
  return (
    <InputGroup className="max-w-dialog">
      <InputGroupAddon align="block-start">
        <AttachmentGroup>
          <Attachment size="sm">
            <AttachmentMedia><File /></AttachmentMedia>
            <AttachmentContent><AttachmentTitle>radiografia.pdf</AttachmentTitle><AttachmentDescription>1,2 MB</AttachmentDescription></AttachmentContent>
            <AttachmentActions><AttachmentAction aria-label="Quitar"><X /></AttachmentAction></AttachmentActions>
          </Attachment>
        </AttachmentGroup>
      </InputGroupAddon>
      <InputGroupTextarea placeholder="¿Qué quieres saber de este informe?" />
      <InputGroupAddon align="block-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><InputGroupButton size="icon-xs" variant="outline" aria-label="Añadir"><Plus /></InputGroupButton></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Añadir</DropdownMenuLabel>
            <DropdownMenuItem><Paperclip />Archivo o foto</DropdownMenuItem>
            <DropdownMenuItem><Globe />Buscar en la web</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <InputGroupText className="ms-auto">1 adjunto</InputGroupText>
        <InputGroupButton size="icon-xs" variant="default" aria-label="Enviar"><ArrowUpIcon /></InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

// ---------- Queue ----------
const TODO: [string, "done" | "running" | "pending"][] = [
  ["Pedir el informe al laboratorio", "running"], ["Llamar al seguro", "pending"], ["Preparar el presupuesto", "pending"],
  ["Confirmar la cita", "done"], ["Revisar las radiografías", "done"],
]
function Queue() {
  const pending = TODO.filter(([, s]) => s !== "done")
  const done = TODO.filter(([, s]) => s === "done")
  const list = (items: typeof TODO) => (
    <Trace>{items.map(([t, s]) => (
      <TraceLine key={t} status={s === "running" ? "running" : undefined}><TraceIcon><StepIcon s={s} /></TraceIcon><TraceTitle>{t}</TraceTitle></TraceLine>
    ))}</Trace>
  )
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger><TraceLine><TraceIcon><ListTodo /></TraceIcon><TraceTitle>{pending.length} por hacer</TraceTitle></TraceLine></TraceCollapsibleTrigger>
        <TraceCollapsibleContent>{list(pending)}</TraceCollapsibleContent>
      </TraceCollapsible>
      <TraceCollapsible>
        <TraceCollapsibleTrigger><TraceLine><TraceIcon><ListChecks /></TraceIcon><TraceTitle>{done.length} hechas</TraceTitle></TraceLine></TraceCollapsibleTrigger>
        <TraceCollapsibleContent>{list(done)}</TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

// ---------- Reasoning ----------
function Reasoning({ running = false }: { running?: boolean }) {
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen={running}>
        <TraceCollapsibleTrigger>
          <TraceLine status={running ? "running" : undefined}><TraceTitle>{running ? "Pensando…" : "Ha pensado durante 6 segundos"}</TraceTitle></TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="text-muted-foreground leading-prose">
          La persona quiere cambiar la cita sin perder la prioridad. Primero miro si la Dra. Ruiz tiene huecos esta semana;
          si no, propongo la semana que viene a la misma hora.
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

// ---------- Sources ----------
const SOURCES = [
  ["Higiene bucodental en adultos", "consejodentistas.es"],
  ["Guía de salud oral", "who.int"],
  ["Cada cuánto hacerse una limpieza", "sepa.es"],
]
function Sources() {
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger><TraceLine><TraceIcon><Globe /></TraceIcon><TraceTitle>Ha usado {SOURCES.length} fuentes</TraceTitle></TraceLine></TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            {SOURCES.map(([t, d]) => (
              <TraceLine key={t}>
                <TraceIcon><ArrowUpRight /></TraceIcon>
                <TraceTitle><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">{t}</a></TraceTitle>
                <TraceDescription>{d}</TraceDescription>
              </TraceLine>
            ))}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

// ---------- Stack Trace ----------
const STACK = `TypeError: Cannot read properties of undefined (reading 'hora')
    at formatearCita (src/lib/citas.ts:42:18)
    at Agenda (src/components/agenda.tsx:17:9)
    at renderWithHooks (react-dom.development.js:16305:18)`
function StackTrace() {
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger><TraceLine status="error"><TraceIcon><Terminal /></TraceIcon><TraceTitle>npm run build ha fallado</TraceTitle></TraceLine></TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            <TraceLine><TraceIcon><FileCode /></TraceIcon><TraceTitle>src/lib/citas.ts</TraceTitle><TraceDescription>línea 42</TraceDescription></TraceLine>
            <TraceCollapsible>
              <TraceCollapsibleTrigger><TraceLine><TraceIcon><Layers /></TraceIcon><TraceTitle>3 llamadas</TraceTitle></TraceLine></TraceCollapsibleTrigger>
              <TraceCollapsibleContent>
                <CodeBlock size="sm" variant="destructive"><CodeBlockContent wrap>{STACK}</CodeBlockContent></CodeBlock>
              </TraceCollapsibleContent>
            </TraceCollapsible>
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

// ---------- Subagent ----------
function Subagent() {
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger>
          <TraceLine><TraceIcon><Bot /></TraceIcon><TraceTitle>Agente de investigación</TraceTitle><Badge variant="secondary">3 pasos</Badge></TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            <TraceLine><TraceIcon><Search /></TraceIcon><TraceTitle>Buscado «precio de alineadores»</TraceTitle></TraceLine>
            <TraceCollapsible>
              <TraceCollapsibleTrigger><TraceLine><TraceIcon><Terminal /></TraceIcon><TraceTitle>Ejecutado un comando</TraceTitle></TraceLine></TraceCollapsibleTrigger>
              <TraceCollapsibleContent>
                <CodeBlock size="sm"><CodeBlockContent wrap>{`$ grep -c alineador tarifas.csv\n12`}</CodeBlockContent></CodeBlock>
              </TraceCollapsibleContent>
            </TraceCollapsible>
            <TraceLine status="running"><TraceIcon><LoaderCircle className="animate-spin" /></TraceIcon><TraceTitle>Resumiendo los resultados</TraceTitle></TraceLine>
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

// ---------- Suggestion ----------
const SUGGESTIONS = ["¿Cuándo es mi próxima cita?", "Cambiar mi cita", "¿Qué cubre mi seguro?", "Horarios del sábado"]
function Suggestion() {
  const [text, setText] = React.useState("")
  return (
    <div className="flex w-full max-w-dialog flex-col gap-gap-md">
      <div className="flex flex-wrap gap-gap-sm">
        {SUGGESTIONS.map((s) => <Button key={s} variant="outline" size="sm" className="rounded-pill" onClick={() => setText(s)}>{s}</Button>)}
      </div>
      <InputGroup>
        <InputGroupTextarea placeholder="Pregunta lo que quieras…" value={text} onChange={(e) => setText(e.target.value)} />
        <InputGroupAddon align="block-end">
          <InputGroupButton size="icon-xs" variant="default" className="ms-auto" aria-label="Enviar"><ArrowUpIcon /></InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

// ---------- Task ----------
function Task() {
  return (
    <Trace className="max-w-dialog">
      <TraceLine><TraceIcon><Search /></TraceIcon><TraceTitle>Buscando huecos el lunes</TraceTitle></TraceLine>
      <TraceLine><TraceIcon><FileCode /></TraceIcon><TraceTitle>Leída la agenda de la Dra. Ruiz</TraceTitle><TraceDescription>2 huecos</TraceDescription></TraceLine>
      <TraceLine status="running"><TraceIcon><LoaderCircle className="animate-spin" /></TraceIcon><TraceTitle>Reservando a las 18:30</TraceTitle></TraceLine>
    </Trace>
  )
}

// ---------- Terminal ----------
function TerminalDemo({ failed = false }: { failed?: boolean }) {
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger>
          <TraceLine status={failed ? "error" : undefined}><TraceIcon><Terminal /></TraceIcon><TraceTitle>{failed ? "npm install (error)" : "npm run build"}</TraceTitle></TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <CodeBlock size="sm" variant={failed ? "destructive" : "default"}>
            <CodeBlockContent wrap>{failed
              ? `$ npm install\nnpm ERR! code ERESOLVE\nnpm ERR! No se pueden resolver las dependencias`
              : `$ npm run build\nvite v6.0.0 compilando para producción…\n✓ 412 módulos\n✓ listo en 1,4 s`}</CodeBlockContent>
          </CodeBlock>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

// ---------- Test Results ----------
const SUITES: { file: string; tests: [string, boolean][] }[] = [
  { file: "citas.test.ts", tests: [["crea una cita", true], ["no permite dos citas a la vez", true], ["formatea la hora", false]] },
  { file: "pacientes.test.ts", tests: [["busca por nombre", true], ["valida el teléfono", true]] },
]
function TestResults() {
  const failed = SUITES.flatMap((s) => s.tests).filter(([, ok]) => !ok).length
  const total = SUITES.flatMap((s) => s.tests).length
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger>
          <TraceLine status={failed ? "error" : undefined}><TraceIcon><FlaskConical /></TraceIcon><TraceTitle>{total - failed} de {total} pruebas pasan</TraceTitle></TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            {SUITES.map((s) => {
              const bad = s.tests.filter(([, ok]) => !ok).length
              return (
                <TraceCollapsible key={s.file} defaultOpen={bad > 0}>
                  <TraceCollapsibleTrigger>
                    <TraceLine status={bad ? "error" : undefined}><TraceIcon><FileCode /></TraceIcon><TraceTitle>{s.file}</TraceTitle><TraceDescription>{s.tests.length - bad}/{s.tests.length}</TraceDescription></TraceLine>
                  </TraceCollapsibleTrigger>
                  <TraceCollapsibleContent>
                    <Trace>
                      {s.tests.map(([t, ok]) => (
                        <TraceLine key={t} status={ok ? undefined : "error"}><TraceIcon>{ok ? <Check /> : <X />}</TraceIcon><TraceTitle>{t}</TraceTitle></TraceLine>
                      ))}
                      {bad > 0 && (
                        <CodeBlock size="sm" variant="destructive">
                          <CodeBlockContent wrap>
                            <CodeBlockLine variant="removed">{`Esperado: "17:30"`}</CodeBlockLine>
                            <CodeBlockLine variant="added">{`Recibido: "5:30 PM"`}</CodeBlockLine>
                          </CodeBlockContent>
                        </CodeBlock>
                      )}
                    </Trace>
                  </TraceCollapsibleContent>
                </TraceCollapsible>
              )
            })}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

// ---------- Tool ----------
function Tool({ state = "done" }: { state?: "done" | "running" | "error" }) {
  return (
    <Trace className="max-w-dialog">
      <TraceCollapsible defaultOpen={state !== "running"}>
        <TraceCollapsibleTrigger>
          <TraceLine status={state === "done" ? undefined : state}>
            <TraceIcon>{state === "running" ? <LoaderCircle className="animate-spin" /> : state === "error" ? <CircleAlert /> : <CircleDashed />}</TraceIcon>
            <TraceTitle>buscarHuecos</TraceTitle>
            <TraceDescription>{state === "running" ? "en marcha" : state === "error" ? "error" : "0,4 s"}</TraceDescription>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <CodeBlock size="sm" variant={state === "error" ? "destructive" : "default"}>
            <CodeBlockContent wrap>{state === "error"
              ? `{ "error": "La agenda no está disponible" }`
              : `// Entrada\n{ "doctora": "Ruiz", "dia": "lunes" }\n\n// Salida\n{ "huecos": ["16:00", "18:30"] }`}</CodeBlockContent>
          </CodeBlock>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

const T = (names: string) => imp(names, `trace`)
const TRACE_ALL = `Trace, TraceCollapsible, TraceCollapsibleContent, TraceCollapsibleTrigger, TraceIcon, TraceLine, TraceTitle`

export const DEMOS6: Record<string, Demo> = {
  [`chain-of-thought`]: {
    description: "Una línea de resumen («Investigado en 3 pasos») que se despliega para ver los pasos que ha dado la IA.",
    examples: [{ title: "Resumen desplegable", render: <ChainOfThought />, code: T(TRACE_ALL) + `\n<Trace>\n  <TraceCollapsible defaultOpen>\n    <TraceCollapsibleTrigger>\n      <TraceLine><TraceIcon><Brain /></TraceIcon><TraceTitle>Investigado en 3 pasos</TraceTitle></TraceLine>\n    </TraceCollapsibleTrigger>\n    <TraceCollapsibleContent>\n      <Trace>\n        <TraceLine>…</TraceLine>\n      </Trace>\n    </TraceCollapsibleContent>\n  </TraceCollapsible>\n</Trace>` }],
  },
  chat: {
    description: "La conversación entera: mensajes dentro de un Message Scroller (baja solo con cada respuesta) y el campo para escribir.",
    examples: [{ title: "Conversación con la clínica", render: <Chat />, code: `<MessageScrollerProvider>\n  <MessageScroller>\n    <MessageScrollerViewport>\n      <MessageScrollerContent>\n        {mensajes.map((m) => (\n          <MessageScrollerItem key={m.id}>\n            <Message align={m.mio ? "end" : "start"}>…</Message>\n          </MessageScrollerItem>\n        ))}\n      </MessageScrollerContent>\n    </MessageScrollerViewport>\n    <MessageScrollerButton />\n  </MessageScroller>\n</MessageScrollerProvider>\n<InputGroup>\n  <InputGroupTextarea placeholder="Escribe un mensaje…" />\n  <InputGroupAddon align="block-end">…</InputGroupAddon>\n</InputGroup>` }],
  },
  checkpoint: {
    description: "Un punto de la conversación al que se puede volver, con una marca y un botón.",
    examples: [{ title: "Volver a un punto", render: <Checkpoint />, code: imp(`Marker, MarkerContent`, `marker`) + `\n<Marker variant="separator">\n  <MarkerContent>\n    Plan creado\n    <Button size="xs" variant="outline">Volver aquí</Button>\n  </MarkerContent>\n</Marker>` }],
  },
  confirmation: {
    description: "Pide permiso antes de que la IA haga algo importante. Prueba a contestar.",
    examples: [{ title: "Aprobar o rechazar", render: <Confirmation />, code: imp(`Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle`, `item`) + `\n<Item variant="outline" size="sm">\n  <ItemMedia variant="icon"><CircleAlert /></ItemMedia>\n  <ItemContent>\n    <ItemTitle>¿Cancelar 3 citas?</ItemTitle>\n    <ItemDescription>No se puede deshacer.</ItemDescription>\n  </ItemContent>\n  <ItemActions>\n    <Button size="sm" variant="outline">No</Button>\n    <Button size="sm">Cancelar citas</Button>\n  </ItemActions>\n</Item>` }],
  },
  context: {
    description: "Cuánta «memoria» de la conversación se ha gastado. Pasa el ratón por el botón.",
    examples: [{ title: "Uso del contexto", render: <Context />, code: imp(`HoverCard, HoverCardContent, HoverCardTrigger`, `hover-card`) + `\n<HoverCard>\n  <HoverCardTrigger asChild><Button variant="outline" size="sm">9 % del contexto</Button></HoverCardTrigger>\n  <HoverCardContent>\n    <Progress value={9} />\n    …\n  </HoverCardContent>\n</HoverCard>` }],
  },
  [`file-tree`]: {
    description: "Los archivos que ha tocado la IA, como un árbol de carpetas que se abre y se cierra.",
    examples: [{ title: "Árbol de archivos", render: <FileTree />, code: imp(`Collapsible, CollapsibleContent, CollapsibleTrigger`, `collapsible`) + `\n<Collapsible defaultOpen className="group/folder">\n  <CollapsibleTrigger asChild>\n    <Button variant="ghost" size="sm"><ChevronRight /><Folder />src</Button>\n  </CollapsibleTrigger>\n  <CollapsibleContent>\n    <Button variant="ghost" size="sm"><File />app.tsx</Button>\n  </CollapsibleContent>\n</Collapsible>` }],
  },
  [`inline-citation`]: {
    description: "Una fuente dentro del texto: un numerito que, al pasar el ratón, enseña de dónde sale el dato.",
    examples: [{ title: "Citas en un párrafo", render: <InlineCitation />, code: `<HoverCard>\n  <HoverCardTrigger asChild><Button variant="secondary" size="xs">1</Button></HoverCardTrigger>\n  <HoverCardContent>\n    <span>consejodentistas.es</span>\n    <span>Higiene bucodental</span>\n  </HoverCardContent>\n</HoverCard>` }],
  },
  [`model-selector`]: {
    description: "Dos menús en el campo de texto: uno elige el modelo de IA y el otro cuánto piensa.",
    examples: [{ title: "Modelo y esfuerzo", render: <ModelSelector />, code: `<InputGroupAddon align="block-end">\n  <DropdownMenu>\n    <DropdownMenuTrigger asChild><InputGroupButton size="xs" variant="ghost">Pro<ChevronDown /></InputGroupButton></DropdownMenuTrigger>\n    <DropdownMenuContent>\n      <DropdownMenuRadioGroup value={modelo} onValueChange={setModelo}>\n        <DropdownMenuRadioItem value="pro">Pro</DropdownMenuRadioItem>\n      </DropdownMenuRadioGroup>\n    </DropdownMenuContent>\n  </DropdownMenu>\n</InputGroupAddon>` }],
  },
  plan: {
    description: "Los pasos que la IA piensa dar y por cuál va.",
    examples: [{ title: "Plan en marcha", render: <Plan />, code: T(TRACE_ALL + `, TraceDescription`) + `\n<TraceCollapsible defaultOpen>\n  <TraceCollapsibleTrigger>\n    <TraceLine status="running"><TraceIcon><Route /></TraceIcon><TraceTitle>Plan</TraceTitle><TraceDescription>2 de 4 hechos</TraceDescription></TraceLine>\n  </TraceCollapsibleTrigger>\n  <TraceCollapsibleContent>\n    <Trace>\n      <TraceLine><TraceIcon><CircleCheck /></TraceIcon><TraceTitle>Hecho</TraceTitle></TraceLine>\n      <TraceLine status="running">…</TraceLine>\n      <TraceLine status="pending">…</TraceLine>\n    </Trace>\n  </TraceCollapsibleContent>\n</TraceCollapsible>` }],
  },
  [`prompt-input`]: {
    description: "El campo para escribir a la IA, con adjuntos, menú de «añadir» y botón de enviar.",
    examples: [{ title: "Con un adjunto", render: <PromptInput />, code: `<InputGroup>\n  <InputGroupAddon align="block-start">\n    <Attachment size="sm">…</Attachment>\n  </InputGroupAddon>\n  <InputGroupTextarea placeholder="¿Qué quieres saber?" />\n  <InputGroupAddon align="block-end">\n    <InputGroupButton size="icon-xs" variant="outline"><Plus /></InputGroupButton>\n    <InputGroupButton size="icon-xs" variant="default"><ArrowUpIcon /></InputGroupButton>\n  </InputGroupAddon>\n</InputGroup>` }],
  },
  queue: {
    description: "La lista de tareas de la IA, separada en lo que falta y lo que ya está hecho.",
    examples: [{ title: "Pendientes y hechas", render: <Queue />, code: `<Trace>\n  <TraceCollapsible defaultOpen>\n    <TraceCollapsibleTrigger><TraceLine><TraceIcon><ListTodo /></TraceIcon><TraceTitle>3 por hacer</TraceTitle></TraceLine></TraceCollapsibleTrigger>\n    <TraceCollapsibleContent>…</TraceCollapsibleContent>\n  </TraceCollapsible>\n  <TraceCollapsible>\n    <TraceCollapsibleTrigger><TraceLine><TraceIcon><ListChecks /></TraceIcon><TraceTitle>2 hechas</TraceTitle></TraceLine></TraceCollapsibleTrigger>\n    <TraceCollapsibleContent>…</TraceCollapsibleContent>\n  </TraceCollapsible>\n</Trace>` }],
  },
  reasoning: {
    description: "Lo que va pensando la IA. Mientras piensa brilla; al acabar se pliega y dice cuánto ha tardado.",
    examples: [
      { title: "Pensando", render: <Reasoning running />, code: `<TraceCollapsible defaultOpen>\n  <TraceCollapsibleTrigger>\n    <TraceLine status="running"><TraceTitle>Pensando…</TraceTitle></TraceLine>\n  </TraceCollapsibleTrigger>\n  <TraceCollapsibleContent>…</TraceCollapsibleContent>\n</TraceCollapsible>` },
      { title: "Terminado", render: <Reasoning />, code: `<TraceLine><TraceTitle>Ha pensado durante 6 segundos</TraceTitle></TraceLine>` },
    ],
  },
  sources: {
    description: "Los enlaces que ha usado la IA para responder.",
    examples: [{ title: "Fuentes", render: <Sources />, code: `<TraceCollapsible defaultOpen>\n  <TraceCollapsibleTrigger><TraceLine><TraceIcon><Globe /></TraceIcon><TraceTitle>Ha usado 3 fuentes</TraceTitle></TraceLine></TraceCollapsibleTrigger>\n  <TraceCollapsibleContent>\n    <Trace>\n      <TraceLine><TraceIcon><ArrowUpRight /></TraceIcon><TraceTitle><a href="…">Título</a></TraceTitle><TraceDescription>web.es</TraceDescription></TraceLine>\n    </Trace>\n  </TraceCollapsibleContent>\n</TraceCollapsible>` }],
  },
  [`stack-trace`]: {
    description: "Un error de código con el archivo donde ha pasado y la lista de llamadas.",
    examples: [{ title: "Error al compilar", render: <StackTrace />, code: `<TraceLine status="error"><TraceIcon><Terminal /></TraceIcon><TraceTitle>npm run build ha fallado</TraceTitle></TraceLine>\n…\n<CodeBlock size="sm" variant="destructive">\n  <CodeBlockContent wrap>{error}</CodeBlockContent>\n</CodeBlock>` }],
  },
  subagent: {
    description: "Otra IA a la que la principal le encarga una parte del trabajo, con sus pasos dentro.",
    examples: [{ title: "Agente de investigación", render: <Subagent />, code: `<TraceCollapsible defaultOpen>\n  <TraceCollapsibleTrigger>\n    <TraceLine><TraceIcon><Bot /></TraceIcon><TraceTitle>Agente de investigación</TraceTitle><Badge variant="secondary">3 pasos</Badge></TraceLine>\n  </TraceCollapsibleTrigger>\n  <TraceCollapsibleContent>\n    <Trace>…</Trace>\n  </TraceCollapsibleContent>\n</TraceCollapsible>` }],
  },
  suggestion: {
    description: "Frases cortas que se mandan con un clic. Pulsa una y verás que pasa al campo.",
    examples: [{ title: "Sugerencias", render: <Suggestion />, code: `{sugerencias.map((s) => (\n  <Button key={s} variant="outline" size="sm" className="rounded-pill" onClick={() => enviar(s)}>{s}</Button>\n))}` }],
  },
  task: {
    description: "Los pasos que da la IA, uno a uno, mientras los va dando.",
    examples: [{ title: "Pasos en directo", render: <Task />, code: T(`Trace, TraceDescription, TraceIcon, TraceLine, TraceTitle`) + `\n<Trace>\n  <TraceLine><TraceIcon><Search /></TraceIcon><TraceTitle>Buscando huecos</TraceTitle></TraceLine>\n  <TraceLine status="running">…</TraceLine>\n</Trace>` }],
  },
  terminal: {
    description: "Un comando que ejecuta la IA y lo que va saliendo por pantalla.",
    examples: [
      { title: "Correcto", render: <TerminalDemo />, code: `<TraceCollapsible defaultOpen>\n  <TraceCollapsibleTrigger><TraceLine><TraceIcon><Terminal /></TraceIcon><TraceTitle>npm run build</TraceTitle></TraceLine></TraceCollapsibleTrigger>\n  <TraceCollapsibleContent>\n    <CodeBlock size="sm"><CodeBlockContent wrap>{salida}</CodeBlockContent></CodeBlock>\n  </TraceCollapsibleContent>\n</TraceCollapsible>` },
      { title: "Con error", render: <TerminalDemo failed />, code: `<TraceLine status="error">…</TraceLine>\n<CodeBlock size="sm" variant="destructive">…</CodeBlock>` },
    ],
  },
  [`test-results`]: {
    description: "El resultado de las pruebas de código: cuántas pasan, por archivo, y qué ha fallado.",
    examples: [{ title: "Una prueba falla", render: <TestResults />, code: `<TraceLine status="error"><TraceIcon><FlaskConical /></TraceIcon><TraceTitle>4 de 5 pruebas pasan</TraceTitle></TraceLine>\n…\n<CodeBlockLine variant="removed">Esperado: "17:30"</CodeBlockLine>\n<CodeBlockLine variant="added">Recibido: "5:30 PM"</CodeBlockLine>` }],
  },
  tool: {
    description: "Una herramienta que usa la IA, con lo que le pide (entrada) y lo que le devuelve (salida).",
    examples: [
      { title: "Terminada", render: <Tool />, code: `<TraceCollapsible defaultOpen>\n  <TraceCollapsibleTrigger><TraceLine><TraceIcon><CircleDashed /></TraceIcon><TraceTitle>buscarHuecos</TraceTitle><TraceDescription>0,4 s</TraceDescription></TraceLine></TraceCollapsibleTrigger>\n  <TraceCollapsibleContent>\n    <CodeBlock size="sm"><CodeBlockContent wrap>{entradaYSalida}</CodeBlockContent></CodeBlock>\n  </TraceCollapsibleContent>\n</TraceCollapsible>` },
      { title: "En marcha", render: <Tool state="running" />, code: `<TraceLine status="running">…</TraceLine>` },
      { title: "Con error", render: <Tool state="error" />, code: `<TraceLine status="error">…</TraceLine>` },
    ],
  },
}

// Ejemplo extra para Message: el turno de la IA con sus acciones
export const AI_TURN_EXAMPLE = {
  title: "Turno de la IA con acciones (AI Elements)",
  render: <AiTurn />,
  code: `<Message>\n  <MessageContent>\n    <p>Los sábados abrimos de 9:00 a 14:00.</p>\n    <MessageFooter>\n      <Tooltip>\n        <TooltipTrigger asChild><Button size="icon-xs" variant="ghost"><Copy /></Button></TooltipTrigger>\n        <TooltipContent>Copiar</TooltipContent>\n      </Tooltip>\n      …\n    </MessageFooter>\n  </MessageContent>\n</Message>`,
}
