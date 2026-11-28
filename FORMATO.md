# Formato de un sistema de diseño

Cada sistema es una carpeta. `base/` es la plantilla; los demás viven en `systems/<id>/`.

```
systems/sereno/
├── system.json            ← la ficha (la editas tú o Claude)
├── config.json            ← opcional: con qué se creó desde la base
├── tokens/                ← los tokens: la fuente de verdad
│   ├── primitives.tokens.json
│   ├── semantic.tokens.json
│   ├── color.light.tokens.json
│   └── color.dark.tokens.json
│
├── referencia.jpg         ← solo si se creó desde una web: captura de esa web
│
│   (todo lo de abajo se genera solo: no se edita a mano)
├── css/tokens.css         ← variables CSS, claro y oscuro
├── css/globals.css        ← tema para Tailwind CSS v4 + shadcn/ui
├── figma/tokens-studio.json
├── preview.html           ← vista previa rápida, sin la web
└── kit/                   ← kit de proyecto (componentes, estilos, SKILL.md)
```

## Componentes propios

Además de los de shadcn/ui, un sistema puede tener componentes propios:

```
base/components/<slug>/            ← los tienen todos los sistemas (por ejemplo stat-card)
systems/<id>/components/<slug>/    ← solo ese sistema (por ejemplo sereno/appointment-card)
├── <slug>.tsx                     ← el componente: solo clases de tokens semánticos y componentes de "@/components/ui/…"
└── demo.tsx                       ← export default { label, description, examples: [{ title, render, code }] }
```

`scripts/generate.py` los copia a la web (grupo «Propios»), al kit (`kit/components/custom/`) y al registro de shadcn
(`…/r/<id>/<slug>.json`). Si un sistema tiene uno con el mismo nombre que base, manda el del sistema.
El nombre (`slug`) no puede coincidir con uno de shadcn/ui.

## Patrones

Pantallas hechas solo juntando componentes (de shadcn/ui y propios) y tokens, sin piezas ni valores nuevos:

```
base/patterns/<slug>/<slug>.tsx            ← los tienen todos los sistemas (por ejemplo panel-de-gestion)
systems/<id>/patterns/<slug>/<slug>.tsx    ← solo ese sistema
```

Cada archivo exporta `meta = { label, description }` y por defecto la pantalla. Importa los componentes como en un
proyecto real (`@/components/ui/…`, `@/components/custom/…`). `scripts/generate.py` los copia a la web (Patrones, con
vista de escritorio y de móvil) y al kit (`kit/patterns/`).

## Prototipos

Flujos de varias pantallas que se pueden clicar (login, registro, compra…), con las mismas reglas que los patrones:

```
base/prototypes/<slug>/<slug>.tsx            ← los tienen todos los sistemas (por ejemplo login)
systems/<id>/prototypes/<slug>/<slug>.tsx    ← solo ese sistema
```

Cada archivo exporta `meta = { label, description, screens: [{ id, label }], hints? }` (la primera pantalla es la de
inicio) y por defecto el flujo, que recibe `screen` (la pantalla que toca) y `go(id)` para pasar a otra. La web se
ocupa del resto: probarlo (móvil o escritorio, con cualquier sistema), el mapa con todas las pantallas y su descarga en
PNG, y el enlace a pantalla completa `#/p/<sistema>/<slug>?pantalla=<id>&modo=oscuro` para test con usuarios o para
incrustar. `scripts/generate.py` los copia a la web y al kit (`kit/prototypes/`).

`meta.links` (opcional) dice a qué pantalla lleva cada botón (`{ from, text, to }`), para conectar las pantallas como
prototipo en Figma.

### Ida y vuelta con Figma

En Prototipos → Compartir → «Llevar a Figma» se descarga un `.json` (`dsc-figma@1`) con los tokens como variables y las
pantallas medidas tal como se ven, y el plugin de `figma-plugin/` lo dibuja en Figma con componentes, variantes y
variables enlazadas. El mismo plugin exporta los cambios (`dsc-figma-changes@1`) y `scripts/figma_changes.py` los
resume para pasarlos al código. Detalles en `figma-plugin/README.md`.

## Journeys (para el simulador de usuarios sintéticos)

Un journey es un recorrido de varias pantallas, con variantes (A = lo que hay hoy, B, C… = propuestas), que se
exporta a HTML para que el simulador de «Usuarios sintéticos» lo mida. El formato de salida es el contrato
`CONTRATO-DSC.md` de ese proyecto.

```
systems/<id>/journeys/<slug>/      ← la fuente (o base/journeys/<slug>/)
├── journey.json                   ← id, nombre, titulo, cliente, pantallas, variantes, objetivos
└── <slug>.tsx                     ← las pantallas: export default ({ pantalla, variante }) => …

journeys/<cliente>/<slug>/         ← lo exportado (se genera solo: no se edita a mano)
├── journey.json                   ← el del contrato: origen, sistemaDiseno, pantallas, variantes, objetivos
├── comun/estilo.css               ← solo las clases que se usan, con el tema del sistema
├── comun/fuentes/                 ← las tipografías copiadas dentro (funciona sin conexión)
├── A/index.html, A/…              ← una página por pantalla
└── B/…                            ← las mismas pantallas y los mismos nombres de archivo
```

`journey.json` (fuente):

| Campo | Qué es |
|---|---|
| `id` | Nombre de la carpeta, en minúsculas y con guiones |
| `nombre`, `titulo` | Nombre del journey y título de las páginas (por ejemplo el nombre del cliente) |
| `cliente` | Id del cliente en el simulador (la carpeta de salida es `journeys/<cliente>/`) |
| `pantallas` | `{ id, nombre, archivo? }` en el orden del recorrido; la última es la de éxito. La primera es `index.html` |
| `variantes` | `{ id, nombre, cambios }`; la primera es la A. `cambios` dice qué cambia y qué había en A |
| `objetivos` | Opcional: `{ id, nombre, pantalla }`. Lo que cuenta como objetivo **al pulsarlo** en esa pantalla |

Las pantallas siguen las reglas de los prototipos (solo componentes del sistema y clases de tokens) y además:

- Se exportan a HTML **sin JavaScript**: para ir a otra pantalla, `<Ir a="tus-datos">` (enlace) o
  `<Formulario a="confirmacion">` (envío falso que solo pasa de pantalla), de `@/journey`. Nada de `onClick` para
  navegar. Lo que se abre y se cierra (menú móvil, preguntas frecuentes), con `<details>`. Los campos sin `name`.
- Las diferencias entre variantes se escriben en el mismo archivo: `variante === "B" ? … : …`.
- Anotaciones para el simulador: `data-sim-accion` (`principal`, `secundaria`, `salida`), `data-sim-responde="<duda>"`,
  `data-sim-compromiso` (`datos-personales`, `pago`) y `data-sim-objetivo="<id>"` en el enlace, botón o formulario
  que cumple un objetivo de `objetivos`. El mismo id en A y en B es el mismo elemento, aunque cambie de sitio o de
  texto; si una variante no lo tiene, en ella cuenta como que nadie lo pulsa (aviso), y si no lo tiene ninguna, es un error.
  En un bloque (`<div>`) cuenta cualquier enlace o botón de dentro (aviso).

```
node scripts/export_journey.mjs systems/<id>/journeys/<slug>   # exporta uno (necesita cd web && npm install una vez)
node scripts/export_journey.mjs --all                          # exporta todos (journeys y prototipos)
node scripts/export_journey.mjs --prototipos                   # solo los prototipos
```

El exportador comprueba lo básico del contrato (nada de internet, enlaces y formularios solo entre pantallas,
objetivos marcados en su pantalla). La revisión completa la hace el simulador:
`python -m simulador revisar-journey journeys/<cliente>/<slug>` desde la carpeta «Usuarios sintéticos».

### Los prototipos también van al simulador

Cada prototipo de cada sistema (los de `base/prototypes/` y los propios del sistema) se exporta solo, sin hacer nada
más, a `journeys/prototipos-<sistema>/<prototipo>/`: un journey con una sola variante (A) y `"tipo": "prototipo"`.
Los botones que dice `meta.links` pasan a ser enlaces entre pantallas (misma regla que la exportación a Figma: el
texto del botón es el de `text` o empieza por él); el botón principal del sistema cuenta como el paso siguiente
(`data-sim-accion="principal"`) y los demás como secundarios. En el simulador se elige un prototipo para cada variante del test
(por ejemplo, A = «Onboarding» y B = «Onboarding corto»). El simulador descarga estos archivos de GitHub, así que
basta con publicar. Si un prototipo no se puede exportar, se avisa en el registro de la publicación pero no la para.

## La ficha (`system.json`)

| Campo | Qué es | Ejemplo |
|---|---|---|
| `id` | Nombre de la carpeta, sin espacios | `sereno` |
| `name` | Nombre visible | `Sereno` |
| `description` | Una o dos frases: para qué es y qué tono tiene | |
| `productType` | Tipo de producto | `Web y app de reservas` |
| `origin` | Cómo se creó: `plantilla`, `cuestionario`, `conversacion`, `url`, `figma` | `conversacion` |
| `createdAt`, `updatedAt` | Fechas (AAAA-MM-DD) | `2026-11-05` |
| `principles` | Lista de principios: `{ "title", "text" }` | «Tranquilo», «Cercano»… |
| `notes` | Notas de uso por tema: `general`, `color`, `tipografía`, `componentes`… | |
| `sourceUrl` | Solo si se creó desde una web: su dirección | `https://ejemplo.com` |

Los principios y las notas aparecen en la web (Inicio) y se copian al `SKILL.md` del kit, para que Claude los respete.

## Los tokens

Formato estándar W3C (DTCG), en dos capas:

1. **Primitivos**: qué valor es (`color.brand.600`, `space.4`).
2. **Semánticos**: para qué sirve (`color.bg.action.primary.default`, `radius.card`). Apuntan a primitivos.
   Los colores siguen `color . dónde (bg / text / border) . función . variante . estado`: `color.bg.action.primary.hover`, `color.text.on-action.primary`, `color.border.feedback.danger.subtle`. Las clases `bg-primary`, `text-primary` y `border-primary` toman cada una el token de su sitio.

## Comandos (para Claude)

```
python scripts/new_system.py respuestas.json [--fix-contrast | --fix-roles]  # crea un sistema completo (igual que el cuestionario de la web)
#   --fix-contrast oscurece la marca; --fix-roles arregla cada par sin contraste cambiando solo su rol (como «Contraste» en el editor)
node scripts/from_url.mjs https://ejemplo.com [--name X] [--dry-run]  # crea un sistema a partir de una web (necesita Playwright e internet)
#   Si no hay acceso a la web desde aquí: crea peticiones/<id>.json = {"url": "…", "name": "…"} y súbelo a main;
#   GitHub lo procesa al publicar y deja el resultado en peticiones/resultados/<id>.json
python scripts/check_generator.py                            # comprueba que new_system.py y el cuestionario dan los mismos tokens
python scripts/create_tokens.py systems/<id> [config.json]   # (antiguo) crea los tokens desde una config de escalas
python scripts/generate.py systems/<id>                      # regenera todas las salidas de un sistema
python scripts/generate.py --all                             # regenera base y todos los sistemas
python scripts/migrate.py --all                              # añade a los sistemas existentes los tokens nuevos
cd web && npm run build && cp dist/index.html "../Abrir la web.html"   # actualiza la web
python scripts/build_registry.py [web/public/r]               # publica cada sistema como registro de shadcn (lo hace GitHub al publicar)
python scripts/check_tokens.py                               # comprueba que no hay ningún valor fijo (debe dar 0, 0 y 0)
node scripts/export_journey.mjs --all                        # exporta los journeys a journeys/<cliente>/<journey>/ (para el simulador)
```

## Regla: todo sale de tokens

Ningún componente ni pantalla puede llevar un color, medida, borde, tipografía, espaciado, sombra o duración escritos a mano.
El tema de Tailwind (`css/globals.css`, y `web/src/theme.css` para la web) se genera desde los tokens y **no incluye
los valores por defecto de Tailwind**: una clase que no apunta a un token (`h-9`, `text-white`, `p-[13px]`…) no existe.
`scripts/check_tokens.py` lo comprueba en el CSS final.

Cuando una librería pide un número en JavaScript (por ejemplo la separación `sideOffset` de menús y popovers),
se lee del token con `tokenPx("space-inset-2xs")` (en `lib/utils.ts`). El orden de capas también es token (`layer.*`:
`z-raised`, `z-sticky`, `z-floating`, `z-overlay`) y los giros también (`motion.rotate.*`: `rotate-tilt` 45º,
`rotate-turn` 90º, `rotate-flip` 180º). Solo se permiten sin token las proporciones (%, ½, 16:9) y 0/1.

Los semánticos tampoco llevan valores escritos a mano: siempre apuntan a un primitivo. Las medidas fijas que no
siguen la escala de espaciado (alturas de control, anchos de menús, diálogos, paneles y páginas) están en
`dimension.*` (por ejemplo `dimension.512`), el alto máximo del drawer en `viewport.80`, la escala de entrada en
`scale.95`, el velo de los modales en `color.scrim`, las capas en `z-index.*` y los giros en `angle.*`.

### Primitivos y semánticos

Los **primitivos** (`space.4`, `radius.md`, `font.size.sm`, `color.brand.600`…) son la capa de gestión: guardan la
escala y se editan en un solo sitio. **Nunca se usan en el código.** Los componentes y la web usan solo
**semánticos**, que apuntan a un primitivo y dicen para qué sirven:

| Para… | Semánticos |
|---|---|
| Relleno y distancias a bordes | `space.inset.3xs … 4xl` |
| Separación entre elementos | `space.gap.3xs … 4xl`, `space.section` |
| Tamaños | `size.*` (iconos, avatares, campos…), `control.height.*`, `layout.*` |
| Texto | `typography.<estilo>` (display, h1, h2, h3, title, lead, body, ui, caption: familia, tamaño, peso, interlineado y espaciado; los aplica la clase `text-<estilo>`) y `text.size/weight/family/leading/tracking.*`, a los que apuntan |
| Forma | `radius.control/card/overlay/pill/inner/fine/square`, `control.border-width` |
| Profundidad | `elevation.*` |
| Estados | `state.opacity.*` |
| Movimiento | `motion.*` |
| Color | `color.*` de `color.light` / `color.dark` |

El tema de Tailwind solo crea clases para los semánticos, y `check_tokens.py` avisa (punto 3) si aparece un primitivo en el código.
