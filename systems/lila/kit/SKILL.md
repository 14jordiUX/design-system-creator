---
name: lila-design-system
description: Usa el sistema de diseño «Lila» al crear o modificar interfaces de este proyecto (pantallas, componentes, estilos). Sistema muy informal y desenfadado: morado pastel, esquinas muy redondeadas y mucho aire.
---

# Sistema de diseño «Lila»

Sistema muy informal y desenfadado: morado pastel, esquinas muy redondeadas y mucho aire.

Tipo de producto: Producto digital informal (app o web de consumo).

## Principios

- **Desenfadado.** Botones en morado pastel con texto oscuro, esquinas casi redondas y una fuente redondeada. Nada rígido.
- **Suave.** Los pasteles dan el carácter; el morado intenso (tono 600) se guarda para enlaces y foco, donde hace falta que se lea.
- **Con aire.** Espaciado generoso y escala de texto amplia: mejor que respire a que se apriete.

## Notas de uso

- **General:** Creado en conversación con Claude a partir de «muy informal y morado pastel».
- **Color:** El botón principal usa el tono 300 (pastel) con texto en el 950. Enlaces y foco en el 600, que cumple contraste sobre blanco. Fondos suaves en el 50 y 100.
- **Tipografía:** Quicksand para todo: redondeada y amable. Para textos largos funciona mejor en tamaños de 16 px o más.
- **Componentes:** Radios grandes en todo. Evitar sombras duras: elevación suave.

## Reglas

1. **Usa siempre los componentes de `components/ui/`** (shadcn/ui ya tematizados). No crees botones, campos o tarjetas desde cero si existe el componente. Componentes disponibles: accordion, alert, alert-dialog, aspect-ratio, attachment, avatar, badge, breadcrumb, bubble, button, button-group, calendar, card, carousel, chart, checkbox, code-block, collapsible, command, context-menu, dialog, direction, drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, item, kbd, label, marker, menubar, message, message-scroller, native-select, navigation-menu, pagination, popover, progress, questionnaire, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip, trace. Además, componentes propios de este sistema en `components/custom/`: app-sidebar, back-button, brand, choice-card, code-input, fab, icon-badge, password-input, setting-row, stat-card, step-footer, steps, tab. Úsalos antes que montar algo parecido. Hay pantallas de ejemplo hechas solo con estos componentes en `patterns/` (panel-de-gestion): tómalas como modelo de estructura. Y flujos de varias pantallas que se pueden clicar en `prototypes/` (login, onboarding): cada uno recibe `screen` y `go(id)`; tómalos como modelo para montar flujos completos.
2. **Nunca escribas valores a mano**: nada de `#hex`, `px`, `rem`, `ms` ni clases con corchetes como `p-[13px]`. El tema de Tailwind de este kit solo contiene clases que apuntan a tokens; si una clase no existe (por ejemplo `h-9`, `bg-red-500` sin token o `text-white`), no genera CSS. Si necesitas un valor que no está, pide añadir un token.
3. **Solo tokens semánticos.** Los primitivos (`space.4`, `radius.md`, `font.size.sm`, `color.brand.600`…) son la capa de gestión: no se usan en el código y no tienen clase. Usa siempre el semántico (`space.inset.lg`, `radius.control`, `text.size.ui`, `color.bg.action.primary.default`…).
4. Vocabulario de clases (todas salen de tokens):
   - Color: `bg-`/`text-`/`border-` + `background`, `foreground`, `card`, `popover`, `primary`, `primary-hover`, `primary-subtle`, `secondary`, `secondary-hover`, `muted`, `muted-foreground`, `subtle`, `accent`, `destructive`, `destructive-hover`, `border`, `border-strong`, `input`, `ring`, `overlay`, `inverse`, `link`, `success`/`warning`/`danger`/`info` (+ `-foreground`, `-subtle`, `-border`, `-text`), `chart-1…5`, `sidebar-*`.
   - Relleno y distancias a bordes: `p-inset-*`, `px-inset-*`, `top-inset-*`… con la escala `3xs, 2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl`.
   - Separación: `gap-gap-*`, `space-y-gap-*`, `mt-gap-*`… (misma escala) y `section`. `0` significa «nada» y se escribe tal cual (`p-0`).
   - Tamaños: `control-sm|md|lg` (alturas), `icon-sm|md|lg`, `avatar-sm…2xl`, `indicator`, `line`, `field-xs|sm`, `area-min`, `menu-min`, `popover`, `tooltip`, `dialog`, `sheet`, `header`, `sidebar`, `prose`, `content`, `page`.
   - Tipografía: `text-caption|ui|body|lead|title|h3|h2|h1|display`, `font-normal|emphasis|strong|heavy`, `font-base|code`, `leading-compact|body|prose`, `tracking-heading|body|caps`, o el estilo completo `typo-heading-h1`, `typo-body-md`, `typo-label-md`…
   - Forma: `rounded-control|card|overlay|pill|inner|fine|square`, `border-thin`, `border-t-thin`…, `border-thick`.
   - Profundidad y foco: `shadow-flat|raised|overlay|modal`, `focus-visible:focus-ring`, `opacity-disabled`.
   - Movimiento: `transition-*` (ya usa la duración y curva del sistema), `duration-micro|default|emphasis`, `animate-enter|exit|fade-in|slide-in-right|collapse-down`…
   Usa `cn()` de `lib/utils.ts` para combinar clases: ya conoce estos nombres.
5. Solo una acción principal (`<Button>` por defecto) por pantalla; el resto, `variant="secondary"`, `"outline"` o `"ghost"`.
6. El modo oscuro se activa con la clase `dark` en `<html>`. No hace falta nada más: los tokens cambian solos.
7. Todo par texto/fondo debe cumplir contraste WCAG AA (4,5:1). Los tokens semánticos ya lo cumplen; si combinas otros, compruébalo.
7. Si falta algo (un color, un componente), no lo inventes: dilo y propón añadirlo al sistema.

## Cómo instalarlo en un proyecto nuevo (React + Tailwind v4)

1. Copia el contenido de este kit a `src/design-system/` del proyecto.
2. Instala dependencias: `npm install radix-ui class-variance-authority clsx tailwind-merge lucide-react sonner cmdk react-day-picker embla-carousel-react recharts vaul input-otp react-hook-form @hookform/resolvers zod react-resizable-panels @shadcn/react` (y `tailwindcss` + `@tailwindcss/vite` si el proyecto no tiene Tailwind).
3. Importa `src/design-system/styles/globals.css` una sola vez en la raíz de la app (por ejemplo en `main.tsx`).
4. Importa los componentes desde `src/design-system/components/ui/` (por ejemplo `import { Button } from "./design-system/components/ui/button"`). Usan rutas relativas, no hace falta configurar alias.
5. Carga las fuentes: Quicksand (texto) y JetBrains Mono (código), por ejemplo desde Google Fonts.
6. Para añadir más componentes de shadcn/ui: `npx shadcn@latest add <componente>` con el `components.json` del kit; heredan el tema solos.

## Tokens de color (claro / oscuro)

| Token | Variable CSS | Claro | Oscuro | Uso |
|---|---|---|---|---|
| `color.bg.default` | `--color-bg-default` | #ffffff | #0a0a0d | Fondo de la página |
| `color.bg.subtle` | `--color-bg-subtle` | #faf9fe | #18181b |  |
| `color.bg.muted` | `--color-bg-muted` | #f4f3fa | #272629 | Zonas secundarias, filas alternas |
| `color.bg.inverse` | `--color-bg-inverse` | #18181b | #faf9fe |  |
| `color.bg.action.primary.default` | `--color-bg-action-primary-default` | #dcd2fd | #dcd2fd | Fondo de la acción principal |
| `color.bg.action.primary.hover` | `--color-bg-action-primary-hover` | #cebefe | #cebefe | Al pasar el ratón |
| `color.bg.action.primary.active` | `--color-bg-action-primary-active` | #c1aafe | #c1aafe | Al pulsar |
| `color.bg.action.primary.subtle` | `--color-bg-action-primary-subtle` | #f7f5ff | #1a0b34 | Fondo suave (tags, selección) |
| `color.bg.action.secondary.default` | `--color-bg-action-secondary-default` | #f4f3fa | #272629 | Fondo de la acción secundaria |
| `color.bg.action.secondary.hover` | `--color-bg-action-secondary-hover` | #e5e3ec | #403f44 | Al pasar el ratón |
| `color.bg.action.secondary.active` | `--color-bg-action-secondary-active` | #d4d3dc | #535158 | Al pulsar |
| `color.bg.action.ghost.hover` | `--color-bg-action-ghost-hover` | #f4f3fa | #272629 | Al pasar el ratón |
| `color.bg.action.disabled` | `--color-bg-action-disabled` | #f4f3fa | #272629 | Fondo de una acción desactivada |
| `color.bg.feedback.success.default` | `--color-bg-feedback-success-default` | #15803d | #15803d | Fondo lleno (badges, botones) |
| `color.bg.feedback.success.subtle` | `--color-bg-feedback-success-subtle` | #f0fdf4 | #052e16 | Fondo suave de alertas |
| `color.bg.feedback.warning.default` | `--color-bg-feedback-warning-default` | #f59e0b | #f59e0b | Fondo lleno (badges, botones) |
| `color.bg.feedback.warning.subtle` | `--color-bg-feedback-warning-subtle` | #fffbeb | #451a03 | Fondo suave de alertas |
| `color.bg.feedback.danger.default` | `--color-bg-feedback-danger-default` | #dc2626 | #dc2626 | Fondo lleno (badges, botones) |
| `color.bg.feedback.danger.hover` | `--color-bg-feedback-danger-hover` | #b91c1c | #b91c1c | Fondo lleno al pasar el ratón |
| `color.bg.feedback.danger.subtle` | `--color-bg-feedback-danger-subtle` | #fef2f2 | #450a0a | Fondo suave de alertas |
| `color.bg.feedback.info.default` | `--color-bg-feedback-info-default` | #2563eb | #2563eb | Fondo lleno (badges, botones) |
| `color.bg.feedback.info.subtle` | `--color-bg-feedback-info-subtle` | #eff6ff | #172554 | Fondo suave de alertas |
| `color.surface.card` | `--color-surface-card` | #ffffff | #18181b | Tarjetas |
| `color.surface.popover` | `--color-surface-popover` | #ffffff | #18181b | Menús, popovers, tooltips |
| `color.surface.overlay` | `--color-surface-overlay` | #09090b99 | #09090b99 | Velo detrás de modales |
| `color.surface.sidebar` | `--color-surface-sidebar` | #faf9fe | #18181b | Fondo de la barra lateral |
| `color.text.default` | `--color-text-default` | #0a0a0d | #faf9fe | Texto principal |
| `color.text.muted` | `--color-text-muted` | #535158 | #a2a0a9 | Texto secundario |
| `color.text.subtle` | `--color-text-subtle` | #a2a0a9 | #797584 | Placeholders, deshabilitado |
| `color.text.inverse` | `--color-text-inverse` | #faf9fe | #0a0a0d |  |
| `color.text.link` | `--color-text-link` | #624996 | #cebefe |  |
| `color.text.action.primary` | `--color-text-action-primary` | #624996 | #cebefe | Texto o icono en el color principal (legible sobre el fondo) |
| `color.text.on-action.primary` | `--color-text-on-action-primary` | #1a0b34 | #1a0b34 | Texto/icono encima de la acción principal |
| `color.text.on-action.secondary` | `--color-text-on-action-secondary` | #18181b | #faf9fe | Texto/icono encima de la acción secundaria |
| `color.text.on-action.ghost` | `--color-text-on-action-ghost` | #18181b | #faf9fe | Texto/icono encima de la acción sin fondo |
| `color.text.on-action.disabled` | `--color-text-on-action-disabled` | #a2a0a9 | #535158 | Texto/icono encima de la acción desactivada |
| `color.text.feedback.success` | `--color-text-feedback-success` | #15803d | #86efac | Texto de un aviso sobre fondo normal o suave |
| `color.text.feedback.warning` | `--color-text-feedback-warning` | #b45309 | #fcd34d | Texto de un aviso sobre fondo normal o suave |
| `color.text.feedback.danger` | `--color-text-feedback-danger` | #b91c1c | #fca5a5 | Texto de un aviso sobre fondo normal o suave |
| `color.text.feedback.info` | `--color-text-feedback-info` | #1d4ed8 | #93c5fd | Texto de un aviso sobre fondo normal o suave |
| `color.text.on-feedback.success` | `--color-text-on-feedback-success` | #ffffff | #ffffff | Texto/icono encima del fondo lleno |
| `color.text.on-feedback.warning` | `--color-text-on-feedback-warning` | #0a0a0d | #0a0a0d | Texto/icono encima del fondo lleno |
| `color.text.on-feedback.danger` | `--color-text-on-feedback-danger` | #ffffff | #ffffff | Texto/icono encima del fondo lleno |
| `color.text.on-feedback.info` | `--color-text-on-feedback-info` | #ffffff | #ffffff | Texto/icono encima del fondo lleno |
| `color.border.default` | `--color-border-default` | #e5e3ec | #272629 |  |
| `color.border.strong` | `--color-border-strong` | #d4d3dc | #403f44 |  |
| `color.border.input` | `--color-border-input` | #e5e3ec | #272629 | Borde de campos de formulario |
| `color.border.focus` | `--color-border-focus` | #c1aafe | #cebefe | Anillo de foco |
| `color.border.action.primary` | `--color-border-action-primary` | #dcd2fd | #dcd2fd | Borde en el color principal (casillas, selección) |
| `color.border.feedback.success.default` | `--color-border-feedback-success-default` | #15803d | #15803d | Borde fuerte (campo con error, selección) |
| `color.border.feedback.success.subtle` | `--color-border-feedback-success-subtle` | #bbf7d0 | #166534 | Borde suave de un aviso |
| `color.border.feedback.warning.default` | `--color-border-feedback-warning-default` | #f59e0b | #f59e0b | Borde fuerte (campo con error, selección) |
| `color.border.feedback.warning.subtle` | `--color-border-feedback-warning-subtle` | #fde68a | #92400e | Borde suave de un aviso |
| `color.border.feedback.danger.default` | `--color-border-feedback-danger-default` | #dc2626 | #dc2626 | Borde fuerte (campo con error, selección) |
| `color.border.feedback.danger.subtle` | `--color-border-feedback-danger-subtle` | #fecaca | #991b1b | Borde suave de un aviso |
| `color.border.feedback.info.default` | `--color-border-feedback-info-default` | #2563eb | #2563eb | Borde fuerte (campo con error, selección) |
| `color.border.feedback.info.subtle` | `--color-border-feedback-info-subtle` | #bfdbfe | #1e40af | Borde suave de un aviso |
| `color.chart.1` | `--color-chart-1` | #b494ff | #cebefe |  |
| `color.chart.2` | `--color-chart-2` | #16a34a | #4ade80 |  |
| `color.chart.3` | `--color-chart-3` | #f59e0b | #fbbf24 |  |
| `color.chart.4` | `--color-chart-4` | #2563eb | #60a5fa |  |
| `color.chart.5` | `--color-chart-5` | #ef4444 | #f87171 |  |

## Tipografía

Familias: sans = Quicksand, ui-sans-serif, system-ui, sans-serif; mono = JetBrains Mono, ui-monospace, monospace.

| Clase | Tamaño / peso |
|---|---|
| `.text-display` | 48px / 700 |
| `.text-heading-h1` | 36px / 700 |
| `.text-heading-h2` | 30px / 700 |
| `.text-heading-h3` | 24px / 700 |
| `.text-heading-h4` | 20px / 700 |
| `.text-body-lg` | 18px / 400 |
| `.text-body-md` | 16px / 400 |
| `.text-body-sm` | 14px / 400 |
| `.text-label-md` | 14px / 500 |
| `.text-label-sm` | 12px / 500 |
| `.text-caption` | 12px / 400 |
| `.text-code` | 14px / 400 |

## Espaciado, radios, elevación y movimiento

| Variable | Valor | Uso |
|---|---|---|
| `--space-inset-3xs` | 2px |  |
| `--space-inset-2xs` | 4px |  |
| `--space-inset-xs` | 6px |  |
| `--space-inset-sm` | 8px |  |
| `--space-inset-md` | 12px |  |
| `--space-inset-lg` | 16px |  |
| `--space-inset-xl` | 24px |  |
| `--space-inset-2xl` | 36px |  |
| `--space-inset-3xl` | 52px |  |
| `--space-inset-4xl` | 68px |  |
| `--space-gap-3xs` | 2px |  |
| `--space-gap-2xs` | 4px |  |
| `--space-gap-xs` | 6px |  |
| `--space-gap-sm` | 8px |  |
| `--space-gap-md` | 12px |  |
| `--space-gap-lg` | 16px |  |
| `--space-gap-xl` | 24px |  |
| `--space-gap-2xl` | 36px |  |
| `--space-gap-3xl` | 52px |  |
| `--space-gap-4xl` | 68px |  |
| `--space-section` | 68px | Separación entre secciones de página |
| `--radius-control` | 15px | Botones, campos, selects |
| `--radius-card` | 21px | Tarjetas y paneles |
| `--radius-overlay` | 30px | Modales, popovers |
| `--radius-pill` | 9999px | Badges, avatares, toggles |
| `--radius-inner` | 10px | Elementos dentro de un control (opciones de menú, casillas) |
| `--radius-fine` | 5px | Detalles pequeños |
| `--radius-square` | 0px | Sin redondeo |
| `--elevation-flat` | 0px 1px 2px 0px #00000015 |  |
| `--elevation-raised` | 0px 4px 8px -2px #00000025 | Tarjetas elevadas, dropdowns |
| `--elevation-overlay` | 0px 12px 24px -4px #0000002c | Popovers, menús |
| `--elevation-modal` | 0px 24px 48px -8px #0000003a |  |
| `--motion-duration-micro` | 120ms | Hover, foco |
| `--motion-duration-default` | 200ms |  |
| `--motion-duration-emphasis` | 330ms | Modales, paneles |
| `--motion-duration-loop` | 1600ms |  |
| `--motion-easing-default` | cubic-bezier(0.2, 0, 0, 1) |  |
| `--motion-easing-emphasis` | cubic-bezier(0.32, 0.72, 0, 1) | Cambios de forma grandes (la barra de pestañas flotante que se encoge) |
| `--motion-scale-enter` | 0.95 | Escala inicial al aparecer (menús, diálogos) |
| `--motion-distance-enter` | 8px | Desplazamiento al aparecer |
| `--motion-distance-scroll` | 24px | Cuánto hay que bajar o subir para que algo reaccione al scroll (barra de pestañas flotante) |
| `--motion-rotate-tilt` | 45deg | Giro de un octavo (un + que se convierte en ×) |
| `--motion-rotate-turn` | 90deg | Giro de un cuarto (flechas de submenú, iconos que cambian) |
| `--motion-rotate-flip` | 180deg | Media vuelta (flecha de un acordeón o un select abiertos) |
| `--control-height-sm` | 32px |  |
| `--control-height-md` | 40px |  |
| `--control-height-lg` | 48px |  |
| `--control-border-width` | 1px |  |
| `--control-focus-ring-width` | 2px |  |
| `--control-focus-ring-offset` | 2px | Separación entre el control y su anillo de foco |
| `--size-icon-sm` | 12px | Iconos pequeños (dentro de badges, checks) |
| `--size-icon-md` | 16px | Iconos por defecto |
| `--size-icon-lg` | 20px | Iconos destacados |
| `--size-avatar-sm` | 24px |  |
| `--size-avatar-md` | 36px |  |
| `--size-avatar-lg` | 44px |  |
| `--size-avatar-xl` | 52px |  |
| `--size-avatar-2xl` | 68px |  |
| `--size-indicator` | 8px | Puntos de radio, viñetas |
| `--size-track` | 6px | Grosor de barras de slider |
| `--size-progress` | 8px | Alto de la barra de progreso |
| `--size-menu-min` | 128px | Ancho mínimo de menús desplegables |
| `--size-popover` | 288px | Ancho de popovers |
| `--size-tooltip` | 320px | Ancho máximo de tooltips |
| `--size-dialog` | 512px | Ancho máximo de diálogos |
| `--size-sheet` | 384px | Ancho de paneles laterales |
| `--size-menu-wide` | 192px | Ancho mínimo de menús de barra (menubar, menús contextuales) |
| `--size-list-max` | 300px | Alto máximo de listas con búsqueda (command, combobox) |
| `--size-handle` | 104px | Ancho del tirador de un drawer |
| `--size-line` | 2px | Grosor de líneas indicadoras (pestaña activa, guías) |
| `--size-field-xs` | 88px | Campos cortos (códigos, números) |
| `--size-field-sm` | 104px | Campos y etiquetas cortas |
| `--size-area-min` | 104px | Alto mínimo de zonas de demo, de soltar archivos o de clic |
| `--size-fab-md` | 56px | Botón flotante (fab) |
| `--size-fab-sm` | 44px | Botón flotante pequeño y acciones de su lista |
| `--size-tab-bar-expanded` | 68px | Alto de la barra de pestañas flotante en grande (icono y texto) |
| `--size-tab-bar-compact` | 52px | Alto de la barra de pestañas flotante en pequeño (solo icono) |
| `--size-tab-bar-item` | 52px | Ancho de cada pestaña cuando la barra flotante está en pequeño |
| `--layout-header` | 56px | Alto de la cabecera de una aplicación |
| `--layout-sidebar` | 256px | Ancho de la barra lateral |
| `--layout-prose` | 672px | Ancho máximo de un bloque de texto |
| `--layout-content` | 1024px | Ancho máximo del contenido |
| `--layout-page` | 1152px | Ancho máximo de una página |
| `--layout-sidebar-icon` | 52px | Ancho de la barra lateral plegada (solo iconos) |
| `--layout-sidebar-mobile` | 288px | Ancho de la barra lateral en móvil |
| `--layout-drawer-max` | 80vh | Alto máximo de un drawer |
| `--layout-drawer-gap` | 104px | Distancia de un drawer al borde opuesto de la pantalla |
| `--layout-compact` | 512px | Por debajo de este ancho, un componente usa su versión móvil (consulta de contenedor @max-compact) |
| `--layout-desktop` | 768px | Desde este ancho, la estructura de la app es la de escritorio (sidebar fijo); por debajo, la de móvil |
| `--text-size-caption` | 12px | Notas, metadatos |
| `--text-size-ui` | 14px | Texto de controles y menús |
| `--text-size-body` | 16px | Texto de lectura |
| `--text-size-lead` | 18px | Entradilla |
| `--text-size-title` | 20px | Títulos de tarjeta o sección pequeña |
| `--text-size-h3` | 24px |  |
| `--text-size-h2` | 30px |  |
| `--text-size-h1` | 36px |  |
| `--text-size-display` | 48px |  |
| `--text-weight-normal` | 400 |  |
| `--text-weight-emphasis` | 500 | Etiquetas, botones |
| `--text-weight-strong` | 700 | Títulos |
| `--text-weight-heavy` | 700 |  |
| `--text-family-base` | Quicksand, ui-sans-serif, system-ui, sans-serif |  |
| `--text-family-code` | "JetBrains Mono", ui-monospace, monospace |  |
| `--text-leading-compact` | 1.15 |  |
| `--text-leading-body` | 1.5 |  |
| `--text-leading-prose` | 1.7 |  |
| `--text-tracking-heading` | -0.02em |  |
| `--text-tracking-body` | 0em |  |
| `--text-tracking-caps` | 0.04em | Textos en mayúsculas |
| `--state-opacity-disabled` | 0.5 | Elementos desactivados |
| `--state-opacity-overlay` | 0.6 |  |
| `--layer-raised` | 10 | Un elemento por encima de sus vecinos (foco en grupos de botones, casilla activa) |
| `--layer-sticky` | 20 | Partes pegadas o superpuestas dentro de un componente |
| `--layer-floating` | 40 | Botones flotantes (fab) |
| `--layer-overlay` | 50 | Menús, popovers, diálogos y paneles |
| `--chart-area-opacity` | 0.4 | Relleno de las áreas |
| `--chart-gradient-start` | 0.8 | Opacidad arriba del degradado de un área |
| `--chart-gradient-end` | 0.1 | Opacidad abajo del degradado de un área |

Archivos de referencia: `tokens/*.tokens.json` (fuente, formato W3C DTCG), `styles/tokens.css` (variables), `styles/globals.css` (tema de Tailwind).
