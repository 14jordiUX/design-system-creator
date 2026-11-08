---
name: sereno-design-system
description: Usa el sistema de diseño «Sereno» al crear o modificar interfaces de este proyecto (pantallas, componentes, estilos). Sistema para una clínica dental: tono cercano y limpio, verde azulado tranquilo, grises cálidos y esquinas suaves.
---

# Sistema de diseño «Sereno»

Sistema para una clínica dental: tono cercano y limpio, verde azulado tranquilo, grises cálidos y esquinas suaves.

Tipo de producto: Web y app de reservas para clínica dental.

## Principios

- **Tranquilo.** Un verde azulado que transmite salud y calma. Se usa con moderación, sobre todo en acciones.
- **Cercano.** Tipografía redondeada (Plus Jakarta Sans) y esquinas suaves para que nada parezca frío o clínico.
- **Claro.** Mucho aire, textos cortos y contraste alto para pacientes de todas las edades.

## Notas de uso

- **General:** Pensado para pacientes de cualquier edad: textos cortos, mucho aire y botones grandes y claros.
- **Color:** El verde azulado solo en acciones (pedir cita, confirmar) y enlaces. El rojo de error nunca para avisos informativos.
- **Tipografía:** Plus Jakarta Sans para todo. Evitar textos en mayúsculas; usar frases en tono cercano («Pide tu cita»).
- **Componentes:** Una sola acción principal por pantalla. Las tarjetas con esquinas suaves (radio card) para citas y tratamientos.

## Reglas

1. **Usa siempre los componentes de `components/ui/`** (shadcn/ui ya tematizados). No crees botones, campos o tarjetas desde cero si existe el componente. Componentes disponibles: accordion, alert, alert-dialog, aspect-ratio, attachment, avatar, badge, breadcrumb, bubble, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, item, kbd, label, marker, menubar, message, message-scroller, native-select, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip. Además, componentes propios de este sistema en `components/custom/`: appointment-card, fab, stat-card, tab. Úsalos antes que montar algo parecido.
2. **Nunca escribas valores a mano**: nada de `#hex`, `px`, `rem`, `ms` ni clases con corchetes como `p-[13px]`. El tema de Tailwind de este kit solo contiene clases que apuntan a tokens; si una clase no existe (por ejemplo `h-9`, `bg-red-500` sin token o `text-white`), no genera CSS. Si necesitas un valor que no está, pide añadir un token.
3. **Solo tokens semánticos.** Los primitivos (`space.4`, `radius.md`, `font.size.sm`, `color.brand.600`…) son la capa de gestión: no se usan en el código y no tienen clase. Usa siempre el semántico (`space.inset.lg`, `radius.control`, `text.size.ui`, `color.action.primary.default`…).
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
5. Carga las fuentes: Plus Jakarta Sans (texto) y JetBrains Mono (código), por ejemplo desde Google Fonts.
6. Para añadir más componentes de shadcn/ui: `npx shadcn@latest add <componente>` con el `components.json` del kit; heredan el tema solos.

## Tokens de color (claro / oscuro)

| Token | Variable CSS | Claro | Oscuro | Uso |
|---|---|---|---|---|
| `color.bg.default` | `--color-bg-default` | #ffffff | #0c0a09 | Fondo de la página |
| `color.bg.subtle` | `--color-bg-subtle` | #fafaf9 | #1c1917 |  |
| `color.bg.muted` | `--color-bg-muted` | #f5f5f4 | #292524 | Zonas secundarias, filas alternas |
| `color.bg.inverse` | `--color-bg-inverse` | #1c1917 | #fafaf9 |  |
| `color.surface.card` | `--color-surface-card` | #ffffff | #1c1917 | Tarjetas |
| `color.surface.popover` | `--color-surface-popover` | #ffffff | #1c1917 | Menús, popovers, tooltips |
| `color.surface.overlay` | `--color-surface-overlay` | #09090b99 | #09090b99 | Velo detrás de modales |
| `color.surface.sidebar` | `--color-surface-sidebar` | #fafaf9 | #1c1917 | Fondo de la barra lateral |
| `color.text.default` | `--color-text-default` | #0c0a09 | #fafaf9 | Texto principal |
| `color.text.muted` | `--color-text-muted` | #57534e | #a8a29e | Texto secundario |
| `color.text.subtle` | `--color-text-subtle` | #a8a29e | #78716c | Placeholders, deshabilitado |
| `color.text.inverse` | `--color-text-inverse` | #fafaf9 | #0c0a09 |  |
| `color.text.link` | `--color-text-link` | #0f766e | #2dd4bf |  |
| `color.border.default` | `--color-border-default` | #e7e5e4 | #292524 |  |
| `color.border.strong` | `--color-border-strong` | #d6d3d1 | #44403c |  |
| `color.border.input` | `--color-border-input` | #e7e5e4 | #292524 | Borde de campos de formulario |
| `color.border.focus` | `--color-border-focus` | #14b8a6 | #2dd4bf | Anillo de foco |
| `color.action.primary.default` | `--color-action-primary-default` | #0f766e | #0f766e |  |
| `color.action.primary.hover` | `--color-action-primary-hover` | #115e59 | #115e59 |  |
| `color.action.primary.active` | `--color-action-primary-active` | #134e4a | #134e4a |  |
| `color.action.primary.on` | `--color-action-primary-on` | #ffffff | #ffffff | Texto/icono sobre primary |
| `color.action.primary.subtle` | `--color-action-primary-subtle` | #f0fdfa | #021716 | Fondo suave (tags, selección) |
| `color.action.secondary.default` | `--color-action-secondary-default` | #f5f5f4 | #292524 |  |
| `color.action.secondary.hover` | `--color-action-secondary-hover` | #e7e5e4 | #44403c |  |
| `color.action.secondary.active` | `--color-action-secondary-active` | #d6d3d1 | #57534e |  |
| `color.action.secondary.on` | `--color-action-secondary-on` | #1c1917 | #fafaf9 |  |
| `color.action.ghost.hover` | `--color-action-ghost-hover` | #f5f5f4 | #292524 |  |
| `color.action.ghost.on` | `--color-action-ghost-on` | #1c1917 | #fafaf9 |  |
| `color.action.disabled.default` | `--color-action-disabled-default` | #f5f5f4 | #292524 |  |
| `color.action.disabled.on` | `--color-action-disabled-on` | #a8a29e | #57534e |  |
| `color.feedback.success.solid` | `--color-feedback-success-solid` | #15803d | #15803d | Fondo sólido (badges, botones) |
| `color.feedback.success.on-solid` | `--color-feedback-success-on-solid` | #ffffff | #ffffff | Texto sobre el fondo sólido |
| `color.feedback.success.subtle` | `--color-feedback-success-subtle` | #f0fdf4 | #052e16 | Fondo suave de alertas |
| `color.feedback.success.border` | `--color-feedback-success-border` | #bbf7d0 | #166534 |  |
| `color.feedback.success.text` | `--color-feedback-success-text` | #15803d | #86efac |  |
| `color.feedback.warning.solid` | `--color-feedback-warning-solid` | #f59e0b | #f59e0b | Fondo sólido (badges, botones) |
| `color.feedback.warning.on-solid` | `--color-feedback-warning-on-solid` | #0c0a09 | #0c0a09 | Texto sobre el fondo sólido |
| `color.feedback.warning.subtle` | `--color-feedback-warning-subtle` | #fffbeb | #451a03 | Fondo suave de alertas |
| `color.feedback.warning.border` | `--color-feedback-warning-border` | #fde68a | #92400e |  |
| `color.feedback.warning.text` | `--color-feedback-warning-text` | #b45309 | #fcd34d |  |
| `color.feedback.danger.solid` | `--color-feedback-danger-solid` | #dc2626 | #dc2626 | Fondo sólido (badges, botones) |
| `color.feedback.danger.on-solid` | `--color-feedback-danger-on-solid` | #ffffff | #ffffff | Texto sobre el fondo sólido |
| `color.feedback.danger.subtle` | `--color-feedback-danger-subtle` | #fef2f2 | #450a0a | Fondo suave de alertas |
| `color.feedback.danger.border` | `--color-feedback-danger-border` | #fecaca | #991b1b |  |
| `color.feedback.danger.text` | `--color-feedback-danger-text` | #b91c1c | #fca5a5 |  |
| `color.feedback.danger.hover` | `--color-feedback-danger-hover` | #b91c1c | #b91c1c | Fondo sólido de peligro al pasar el ratón |
| `color.feedback.info.solid` | `--color-feedback-info-solid` | #2563eb | #2563eb | Fondo sólido (badges, botones) |
| `color.feedback.info.on-solid` | `--color-feedback-info-on-solid` | #ffffff | #ffffff | Texto sobre el fondo sólido |
| `color.feedback.info.subtle` | `--color-feedback-info-subtle` | #eff6ff | #172554 | Fondo suave de alertas |
| `color.feedback.info.border` | `--color-feedback-info-border` | #bfdbfe | #1e40af |  |
| `color.feedback.info.text` | `--color-feedback-info-text` | #1d4ed8 | #93c5fd |  |
| `color.chart.1` | `--color-chart-1` | #0f766e | #2dd4bf |  |
| `color.chart.2` | `--color-chart-2` | #16a34a | #4ade80 |  |
| `color.chart.3` | `--color-chart-3` | #f59e0b | #fbbf24 |  |
| `color.chart.4` | `--color-chart-4` | #2563eb | #60a5fa |  |
| `color.chart.5` | `--color-chart-5` | #ef4444 | #f87171 |  |

## Tipografía

Familias: sans = Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif; mono = JetBrains Mono, ui-monospace, monospace.

| Clase | Tamaño / peso |
|---|---|
| `.text-display` | 48px / 700 |
| `.text-heading-h1` | 36px / 700 |
| `.text-heading-h2` | 30px / 600 |
| `.text-heading-h3` | 24px / 600 |
| `.text-heading-h4` | 20px / 600 |
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
| `--space-inset-2xl` | 32px |  |
| `--space-inset-3xl` | 48px |  |
| `--space-inset-4xl` | 64px |  |
| `--space-gap-3xs` | 2px |  |
| `--space-gap-2xs` | 4px |  |
| `--space-gap-xs` | 6px |  |
| `--space-gap-sm` | 8px |  |
| `--space-gap-md` | 12px |  |
| `--space-gap-lg` | 16px |  |
| `--space-gap-xl` | 24px |  |
| `--space-gap-2xl` | 32px |  |
| `--space-gap-3xl` | 48px |  |
| `--space-gap-4xl` | 64px |  |
| `--space-section` | 64px | Separación entre secciones de página |
| `--radius-control` | 10px | Botones, campos, selects |
| `--radius-card` | 14px | Tarjetas y paneles |
| `--radius-overlay` | 20px | Modales, popovers |
| `--radius-pill` | 9999px | Badges, avatares, toggles |
| `--radius-inner` | 4px | Elementos dentro de un control (opciones de menú, casillas) |
| `--radius-fine` | 2px | Detalles pequeños |
| `--radius-square` | 0px | Sin redondeo |
| `--elevation-flat` | 0px 1px 2px 0px #0000000f |  |
| `--elevation-raised` | 0px 4px 8px -2px #0000001a | Tarjetas elevadas, dropdowns |
| `--elevation-overlay` | 0px 12px 24px -4px #0000001f | Popovers, menús |
| `--elevation-modal` | 0px 24px 48px -8px #00000029 |  |
| `--motion-duration-micro` | 120ms | Hover, foco |
| `--motion-duration-default` | 200ms |  |
| `--motion-duration-emphasis` | 320ms | Modales, paneles |
| `--motion-duration-loop` | 1600ms |  |
| `--motion-easing-default` | cubic-bezier(0.2, 0, 0, 1) |  |
| `--motion-scale-enter` | 0.95 | Escala inicial al aparecer (menús, diálogos) |
| `--motion-distance-enter` | 8px | Desplazamiento al aparecer |
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
| `--size-avatar-md` | 32px |  |
| `--size-avatar-lg` | 40px |  |
| `--size-avatar-xl` | 48px |  |
| `--size-avatar-2xl` | 64px |  |
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
| `--size-handle` | 96px | Ancho del tirador de un drawer |
| `--size-line` | 2px | Grosor de líneas indicadoras (pestaña activa, guías) |
| `--size-field-xs` | 80px | Campos cortos (códigos, números) |
| `--size-field-sm` | 96px | Campos y etiquetas cortas |
| `--size-area-min` | 96px | Alto mínimo de zonas de demo, de soltar archivos o de clic |
| `--size-fab-md` | 56px | Botón flotante (fab) |
| `--size-fab-sm` | 40px | Botón flotante pequeño y acciones de su lista |
| `--layout-header` | 56px | Alto de la cabecera de una aplicación |
| `--layout-sidebar` | 256px | Ancho de la barra lateral |
| `--layout-prose` | 672px | Ancho máximo de un bloque de texto |
| `--layout-content` | 1024px | Ancho máximo del contenido |
| `--layout-page` | 1152px | Ancho máximo de una página |
| `--layout-sidebar-icon` | 48px | Ancho de la barra lateral plegada (solo iconos) |
| `--layout-sidebar-mobile` | 288px | Ancho de la barra lateral en móvil |
| `--layout-drawer-max` | 80vh | Alto máximo de un drawer |
| `--layout-drawer-gap` | 96px | Distancia de un drawer al borde opuesto de la pantalla |
| `--layout-compact` | 512px | Por debajo de este ancho, un componente usa su versión móvil (consulta de contenedor @max-compact) |
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
| `--text-weight-strong` | 600 | Títulos |
| `--text-weight-heavy` | 700 |  |
| `--text-family-base` | "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif |  |
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

Archivos de referencia: `tokens/*.tokens.json` (fuente, formato W3C DTCG), `styles/tokens.css` (variables), `styles/globals.css` (tema de Tailwind).
