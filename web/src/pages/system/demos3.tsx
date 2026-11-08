// Demos de los componentes que shadcn/ui añadió después (2026): formularios, estructura y chat de IA.
import { ArrowUpIcon, BadgeCheck, ChevronRight, Copy, FileText, Inbox, Paperclip, Search, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from "@/components/ui/item"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from "@/components/ui/message"
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble"
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller"
import type { Demo } from "./demos"

const imp = (name: string, file: string) => `import { ${name} } from "@/components/ui/${file}"\n\n`

const CHAT = [
  { me: false, text: "Hola, ¿en qué te puedo ayudar?" },
  { me: true, text: "Quiero cambiar mi cita del jueves." },
  { me: false, text: "Claro. Tengo hueco el viernes a las 10:00 o a las 17:30." },
  { me: true, text: "El viernes a las 17:30, por favor." },
  { me: false, text: "Hecho: te he pasado la cita al viernes a las 17:30. Te llegará un recordatorio el día antes." },
  { me: true, text: "¡Gracias!" },
]

export const DEMOS3: Record<string, Demo> = {
  "button-group": {
    description: "Junta varios botones relacionados en un solo bloque, con los bordes unidos.",
    examples: [
      { title: "Acciones juntas", render: (
        <ButtonGroup>
          <Button variant="outline">Anterior</Button>
          <Button variant="outline">Hoy</Button>
          <Button variant="outline">Siguiente</Button>
        </ButtonGroup>),
        code: imp("ButtonGroup", "button-group") + `<ButtonGroup>\n  <Button variant="outline">Anterior</Button>\n  <Button variant="outline">Hoy</Button>\n  <Button variant="outline">Siguiente</Button>\n</ButtonGroup>` },
      { title: "Con texto, campo y separador", render: (
        <div className="flex flex-wrap gap-gap-lg">
          <ButtonGroup>
            <ButtonGroupText>https://</ButtonGroupText>
            <Input placeholder="miclinica.es" className="w-field-sm" />
          </ButtonGroup>
          <ButtonGroup>
            <Button>Guardar</Button>
            <ButtonGroupSeparator />
            <Button size="icon" aria-label="Más opciones"><ChevronRight /></Button>
          </ButtonGroup>
        </div>),
        code: `<ButtonGroup>\n  <ButtonGroupText>https://</ButtonGroupText>\n  <Input placeholder="miclinica.es" />\n</ButtonGroup>\n\n<ButtonGroup>\n  <Button>Guardar</Button>\n  <ButtonGroupSeparator />\n  <Button size="icon"><ChevronRight /></Button>\n</ButtonGroup>` },
    ],
  },
  kbd: {
    description: "Muestra una tecla o un atajo de teclado.",
    examples: [{ title: "Atajos", render: (
      <div className="flex flex-wrap items-center gap-gap-lg text-ui">
        <span className="flex items-center gap-gap-sm">Buscar <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup></span>
        <span className="flex items-center gap-gap-sm">Guardar <KbdGroup><Kbd>Ctrl</Kbd><span>+</span><Kbd>S</Kbd></KbdGroup></span>
        <span className="flex items-center gap-gap-sm">Cerrar <Kbd>Esc</Kbd></span>
      </div>),
      code: imp("Kbd, KbdGroup", "kbd") + `<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>\n<Kbd>Esc</Kbd>` }],
  },
  field: {
    description: "Monta formularios accesibles: etiqueta, campo, ayuda y error, ordenados y bien separados.",
    examples: [
      { title: "Formulario con grupos", render: (
        <FieldSet className="w-full max-w-popover">
          <FieldLegend>Datos del paciente</FieldLegend>
          <FieldDescription>Los usamos solo para gestionar tus citas.</FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fnombre">Nombre</FieldLabel>
              <Input id="fnombre" placeholder="Laura Pérez" />
            </Field>
            <Field data-invalid="true">
              <FieldLabel htmlFor="femail">Email</FieldLabel>
              <Input id="femail" aria-invalid="true" defaultValue="laura@" />
              <FieldError>Escribe un email completo, por ejemplo laura@correo.es.</FieldError>
            </Field>
            <FieldSeparator>o</FieldSeparator>
            <Field orientation="horizontal">
              <Checkbox id="favisos" defaultChecked />
              <FieldContent>
                <FieldLabel htmlFor="favisos">Recordatorios por SMS</FieldLabel>
                <FieldDescription>Un mensaje el día antes de cada cita.</FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>),
        code: imp("Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet", "field") +
          `<FieldSet>\n  <FieldLegend>Datos del paciente</FieldLegend>\n  <FieldGroup>\n    <Field>\n      <FieldLabel htmlFor="nombre">Nombre</FieldLabel>\n      <Input id="nombre" />\n    </Field>\n    <Field data-invalid="true">\n      <FieldLabel htmlFor="email">Email</FieldLabel>\n      <Input id="email" aria-invalid="true" />\n      <FieldError>Escribe un email completo.</FieldError>\n    </Field>\n    <Field orientation="horizontal">\n      <Checkbox id="avisos" />\n      <FieldContent>\n        <FieldLabel htmlFor="avisos">Recordatorios por SMS</FieldLabel>\n        <FieldDescription>Un mensaje el día antes.</FieldDescription>\n      </FieldContent>\n    </Field>\n  </FieldGroup>\n</FieldSet>` },
    ],
  },
  "input-group": {
    description: "Campo con iconos, textos o botones pegados dentro, como un buscador o un cuadro para escribir a la IA.",
    examples: [
      { title: "Buscador y campo con sufijo", render: (
        <div className="grid w-full max-w-popover gap-gap-lg">
          <InputGroup>
            <InputGroupInput placeholder="Buscar paciente…" />
            <InputGroupAddon><Search /></InputGroupAddon>
            <InputGroupAddon align="inline-end"><Kbd>⌘K</Kbd></InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="0,00" />
            <InputGroupAddon align="inline-end"><InputGroupText>EUR</InputGroupText></InputGroupAddon>
          </InputGroup>
        </div>),
        code: imp("InputGroup, InputGroupAddon, InputGroupInput, InputGroupText", "input-group") + `<InputGroup>\n  <InputGroupInput placeholder="Buscar paciente…" />\n  <InputGroupAddon><Search /></InputGroupAddon>\n</InputGroup>\n\n<InputGroup>\n  <InputGroupInput placeholder="0,00" />\n  <InputGroupAddon align="inline-end"><InputGroupText>EUR</InputGroupText></InputGroupAddon>\n</InputGroup>` },
      { title: "Cuadro para escribir (chat)", render: (
        <InputGroup className="max-w-dialog">
          <InputGroupTextarea placeholder="Pregunta lo que quieras…" />
          <InputGroupAddon align="block-end">
            <InputGroupButton size="icon-xs" variant="outline" aria-label="Adjuntar"><Paperclip /></InputGroupButton>
            <InputGroupText className="ml-auto">52 % usado</InputGroupText>
            <InputGroupButton size="icon-xs" variant="default" aria-label="Enviar"><ArrowUpIcon /></InputGroupButton>
          </InputGroupAddon>
        </InputGroup>),
        code: `<InputGroup>\n  <InputGroupTextarea placeholder="Pregunta lo que quieras…" />\n  <InputGroupAddon align="block-end">\n    <InputGroupButton size="icon-xs" variant="outline"><Paperclip /></InputGroupButton>\n    <InputGroupButton size="icon-xs" variant="default"><ArrowUpIcon /></InputGroupButton>\n  </InputGroupAddon>\n</InputGroup>` },
    ],
  },
  "native-select": {
    description: "El desplegable del navegador, con el estilo del sistema. Úsalo en móvil o cuando no necesitas buscar dentro.",
    examples: [{ title: "Normal y pequeño", render: (
      <div className="flex flex-wrap items-center gap-gap-md">
        <NativeSelect defaultValue="revision">
          <NativeSelectOption value="revision">Revisión</NativeSelectOption>
          <NativeSelectOption value="limpieza">Limpieza</NativeSelectOption>
          <NativeSelectOption value="urgencia">Urgencia</NativeSelectOption>
        </NativeSelect>
        <NativeSelect size="sm" defaultValue="es">
          <NativeSelectOption value="es">Español</NativeSelectOption>
          <NativeSelectOption value="ca">Català</NativeSelectOption>
        </NativeSelect>
        <NativeSelect disabled><NativeSelectOption>Deshabilitado</NativeSelectOption></NativeSelect>
      </div>),
      code: imp("NativeSelect, NativeSelectOption", "native-select") + `<NativeSelect defaultValue="revision">\n  <NativeSelectOption value="revision">Revisión</NativeSelectOption>\n  <NativeSelectOption value="limpieza">Limpieza</NativeSelectOption>\n</NativeSelect>` }],
  },
  item: {
    description: "Fila de una lista con icono o imagen, título, descripción y acciones.",
    examples: [{ title: "Lista de ajustes", render: (
      <ItemGroup className="w-full max-w-dialog rounded-card border-thin">
        <Item>
          <ItemMedia variant="icon"><BadgeCheck /></ItemMedia>
          <ItemContent><ItemTitle>Cuenta verificada</ItemTitle><ItemDescription>Tu identidad está confirmada.</ItemDescription></ItemContent>
          <ItemActions><Button size="sm" variant="outline">Ver</Button></ItemActions>
        </Item>
        <ItemSeparator />
        <Item>
          <ItemMedia><Avatar><AvatarFallback>LP</AvatarFallback></Avatar></ItemMedia>
          <ItemContent><ItemTitle>Laura Pérez</ItemTitle><ItemDescription>Próxima cita: viernes, 17:30</ItemDescription></ItemContent>
          <ItemActions><Button size="icon-sm" variant="ghost" aria-label="Abrir"><ChevronRight /></Button></ItemActions>
        </Item>
      </ItemGroup>),
      code: imp("Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle", "item") + `<ItemGroup>\n  <Item>\n    <ItemMedia variant="icon"><BadgeCheck /></ItemMedia>\n    <ItemContent>\n      <ItemTitle>Cuenta verificada</ItemTitle>\n      <ItemDescription>Tu identidad está confirmada.</ItemDescription>\n    </ItemContent>\n    <ItemActions><Button size="sm" variant="outline">Ver</Button></ItemActions>\n  </Item>\n</ItemGroup>` }],
  },
  empty: {
    description: "Lo que se ve cuando todavía no hay nada: explica por qué y qué hacer.",
    examples: [{ title: "Bandeja vacía", render: (
      <Empty className="border-thin">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
          <EmptyTitle>No tienes mensajes</EmptyTitle>
          <EmptyDescription>Cuando un paciente te escriba, lo verás aquí.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><Button>Escribir un mensaje</Button></EmptyContent>
      </Empty>),
      code: imp("Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle", "empty") + `<Empty>\n  <EmptyHeader>\n    <EmptyMedia variant="icon"><Inbox /></EmptyMedia>\n    <EmptyTitle>No tienes mensajes</EmptyTitle>\n    <EmptyDescription>Cuando un paciente te escriba, lo verás aquí.</EmptyDescription>\n  </EmptyHeader>\n  <EmptyContent><Button>Escribir un mensaje</Button></EmptyContent>\n</Empty>` }],
  },
  resizable: {
    description: "Paneles que se pueden ensanchar o estrechar arrastrando la línea que los separa.",
    examples: [{ title: "Arrastra la línea", render: (
      <div className="h-handle w-full max-w-dialog overflow-hidden rounded-card border-thin">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="40%"><div className="flex h-full items-center justify-center text-ui">Lista</div></ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="60%"><div className="flex h-full items-center justify-center text-ui">Detalle</div></ResizablePanel>
      </ResizablePanelGroup>
      </div>),
      code: imp("ResizableHandle, ResizablePanel, ResizablePanelGroup", "resizable") + `<ResizablePanelGroup orientation="horizontal">\n  <ResizablePanel defaultSize="40%">Lista</ResizablePanel>\n  <ResizableHandle withHandle />\n  <ResizablePanel defaultSize="60%">Detalle</ResizablePanel>\n</ResizablePanelGroup>` }],
  },
  spinner: {
    description: "Indica que algo se está cargando.",
    examples: [{ title: "Solo y en un botón", render: (
      <div className="flex flex-wrap items-center gap-gap-lg">
        <Spinner />
        <Spinner className="size-icon-lg text-primary" />
        <Button disabled><Spinner />Guardando…</Button>
      </div>),
      code: imp("Spinner", "spinner") + `<Spinner />\n<Button disabled><Spinner />Guardando…</Button>` }],
  },
  message: {
    description: "Un mensaje de una conversación: avatar, nombre, contenido y pie. Se alinea a la derecha si es tuyo.",
    examples: [{ title: "Conversación", render: (
      <MessageGroup className="w-full max-w-dialog gap-gap-lg">
        <Message>
          <MessageAvatar><Avatar><AvatarFallback><Sparkles className="size-icon-md" /></AvatarFallback></Avatar></MessageAvatar>
          <MessageContent>
            <MessageHeader>Asistente</MessageHeader>
            <Bubble variant="muted"><BubbleContent>¿Quieres que te recuerde la cita por SMS?</BubbleContent></Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageContent>
            <Bubble><BubbleContent>Sí, por favor.</BubbleContent></Bubble>
            <MessageFooter>Leído · 10:24</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>),
      code: imp("Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader", "message") + `<Message>\n  <MessageAvatar><Avatar>…</Avatar></MessageAvatar>\n  <MessageContent>\n    <MessageHeader>Asistente</MessageHeader>\n    <Bubble variant="muted"><BubbleContent>¿Te lo recuerdo por SMS?</BubbleContent></Bubble>\n  </MessageContent>\n</Message>\n<Message align="end">\n  <MessageContent>\n    <Bubble><BubbleContent>Sí, por favor.</BubbleContent></Bubble>\n    <MessageFooter>Leído · 10:24</MessageFooter>\n  </MessageContent>\n</Message>` }],
  },
  bubble: {
    description: "El bocadillo de un mensaje de chat. Tiene variantes de color y puede llevar reacciones.",
    examples: [{ title: "Variantes", render: (
      <div className="flex w-full max-w-dialog flex-col gap-gap-lg">
        <Bubble><BubbleContent>Principal: tus mensajes.</BubbleContent></Bubble>
        <Bubble variant="secondary"><BubbleContent>Secundaria.</BubbleContent></Bubble>
        <Bubble variant="muted"><BubbleContent>Apagada: los de la otra persona.</BubbleContent></Bubble>
        <Bubble variant="tinted"><BubbleContent>Teñida con el color de marca.</BubbleContent></Bubble>
        <Bubble variant="outline"><BubbleContent>Con borde.</BubbleContent></Bubble>
        <Bubble variant="destructive"><BubbleContent>No se ha podido enviar.</BubbleContent></Bubble>
        <Bubble variant="muted" className="mb-gap-md">
          <BubbleContent>¡Cita confirmada!</BubbleContent>
          <BubbleReactions>👍 2</BubbleReactions>
        </Bubble>
      </div>),
      code: imp("Bubble, BubbleContent, BubbleReactions", "bubble") + `<Bubble><BubbleContent>Tu mensaje</BubbleContent></Bubble>\n<Bubble variant="muted"><BubbleContent>Su mensaje</BubbleContent></Bubble>\n<Bubble variant="tinted"><BubbleContent>…</BubbleContent></Bubble>\n<Bubble variant="muted">\n  <BubbleContent>¡Cita confirmada!</BubbleContent>\n  <BubbleReactions>👍 2</BubbleReactions>\n</Bubble>` }],
  },
  attachment: {
    description: "Archivo adjunto en un chat o formulario, con su estado (subiendo, error, listo).",
    examples: [{ title: "Adjuntos", render: (
      <AttachmentGroup className="max-w-dialog">
        <Attachment>
          <AttachmentMedia><FileText /></AttachmentMedia>
          <AttachmentContent><AttachmentTitle>radiografia.pdf</AttachmentTitle><AttachmentDescription>1,2 MB</AttachmentDescription></AttachmentContent>
          <AttachmentActions><AttachmentAction aria-label="Quitar"><X /></AttachmentAction></AttachmentActions>
        </Attachment>
        <Attachment state="uploading">
          <AttachmentMedia><Spinner data-slot="spinner" /></AttachmentMedia>
          <AttachmentContent><AttachmentTitle>presupuesto.pdf</AttachmentTitle><AttachmentDescription>Subiendo… 60 %</AttachmentDescription></AttachmentContent>
        </Attachment>
        <Attachment state="error">
          <AttachmentMedia><FileText /></AttachmentMedia>
          <AttachmentContent><AttachmentTitle>foto.heic</AttachmentTitle><AttachmentDescription>Formato no admitido</AttachmentDescription></AttachmentContent>
        </Attachment>
      </AttachmentGroup>),
      code: imp("Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle", "attachment") + `<Attachment>\n  <AttachmentMedia><FileText /></AttachmentMedia>\n  <AttachmentContent>\n    <AttachmentTitle>radiografia.pdf</AttachmentTitle>\n    <AttachmentDescription>1,2 MB</AttachmentDescription>\n  </AttachmentContent>\n  <AttachmentActions><AttachmentAction><X /></AttachmentAction></AttachmentActions>\n</Attachment>\n<Attachment state="error">…</Attachment>` }],
  },
  marker: {
    description: "Una marca dentro de una conversación: la fecha, un aviso o un paso que ha hecho la IA.",
    examples: [{ title: "Marcas", render: (
      <div className="flex w-full max-w-dialog flex-col gap-gap-lg">
        <Marker variant="separator"><MarkerContent>Hoy</MarkerContent></Marker>
        <Marker><MarkerIcon><Search /></MarkerIcon><MarkerContent>Ha buscado huecos libres esta semana</MarkerContent></Marker>
        <Marker variant="border"><MarkerIcon><Copy /></MarkerIcon><MarkerContent>Conversación copiada</MarkerContent></Marker>
      </div>),
      code: imp("Marker, MarkerContent, MarkerIcon", "marker") + `<Marker variant="separator"><MarkerContent>Hoy</MarkerContent></Marker>\n<Marker>\n  <MarkerIcon><Search /></MarkerIcon>\n  <MarkerContent>Ha buscado huecos libres</MarkerContent>\n</Marker>` }],
  },
  "message-scroller": {
    description: "La zona con scroll de un chat: baja sola con cada mensaje nuevo y muestra un botón para volver al final.",
    examples: [{ title: "Sube un poco y aparece el botón", render: (
      <MessageScrollerProvider>
        <MessageScroller className="h-sheet max-w-dialog rounded-card border-thin">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-gap-lg p-inset-lg">
              {CHAT.map((m, i) => (
                <MessageScrollerItem key={i}>
                  <Message align={m.me ? "end" : "start"}>
                    <MessageContent><Bubble variant={m.me ? "default" : "muted"}><BubbleContent>{m.text}</BubbleContent></Bubble></MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>),
      code: imp("MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport", "message-scroller") + `<MessageScrollerProvider>\n  <MessageScroller>\n    <MessageScrollerViewport>\n      <MessageScrollerContent>\n        {mensajes.map((m) => (\n          <MessageScrollerItem key={m.id}>…</MessageScrollerItem>\n        ))}\n      </MessageScrollerContent>\n    </MessageScrollerViewport>\n    <MessageScrollerButton />\n  </MessageScroller>\n</MessageScrollerProvider>` }],
  },
}
