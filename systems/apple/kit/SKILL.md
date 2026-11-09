---
name: apple-design-system
description: Usa el sistema de diseño «Apple» al crear o modificar interfaces de este proyecto (pantallas, componentes, estilos). Discover the innovative world of Apple and shop everything iPhone, iPad, Apple Watch, Mac, and Apple TV, plus explore accessories, entertainment, and expert device support. Creado 
---

# Sistema de diseño «Apple»

Discover the innovative world of Apple and shop everything iPhone, iPad, Apple Watch, Mac, and Apple TV, plus explore accessories, entertainment, and expert device support. Creado a partir de apple.com.

Tipo de producto: Basado en la web apple.com.

## Principios

- **Equilibrado.** La marca aparece en acciones y detalles; fondos y textos en neutros.
- **Cercano.** Esquinas de 16 px en controles y grises fríos.
- **Cómodo.** Rejilla de 4 px y escala tipográfica amplia.

## Notas de uso

- **General:** Creado automáticamente desde https://www.apple.com/ el 2026-11-07. Es un punto de partida: revisa colores, fuente y radios en el modo editor. La captura de la web está en referencia.jpg.
- **Color:** Color de marca #0071e3, sacado de botones.
- **Tipografía:** La web usa «SF Pro Display», que no está en Google Fonts; se usa Inter en su lugar (cámbiala en Tipografía si tienes la fuente). Texto base de 21 px (escala amplia).
- **Forma:** Los botones de la web son de píldora (totalmente redondos); el radio de controles queda en 16 px. Radio de controles 16 px, borde de 1 px, botones de unos 36 px de alto.

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
5. Carga las fuentes: Inter (texto) y JetBrains Mono (código), por ejemplo desde Google Fonts.
6. Para añadir más componentes de shadcn/ui: `npx shadcn@latest add <componente>` con el `components.json` del kit; heredan el tema solos.

## Tokens de color (claro / oscuro)

| Token | Variable CSS | Claro | Oscuro | Uso |
|---|---|---|---|---|
| `color.bg.default` | `--color-bg-default` | #ffffff | #090a0c | Fondo de la página |
| `color.bg.subtle` | `--color-bg-subtle` | #f9fafc | #17181a |  |
| `color.bg.muted` | `--color-bg-muted` | #f2f4f7 | #262628 | Zonas secundarias, filas alternas |
| `color.bg.inverse` | `--color-bg-inverse` | #17181a | #f9fafc |  |
| `color.bg.action.primary.default` | `--color-bg-action-primary-default` | #0071e3 | #0071e3 | Fondo de la acción principal |
| `color.bg.action.primary.hover` | `--color-bg-action-primary-hover` | #0e57ab | #0e57ab | Al pasar el ratón |
| `color.bg.action.primary.active` | `--color-bg-action-primary-active` | #004086 | #004086 | Al pulsar |
| `color.bg.action.primary.subtle` | `--color-bg-action-primary-subtle` | #f2f7ff | #001534 | Fondo suave (tags, selección) |
| `color.bg.action.secondary.default` | `--color-bg-action-secondary-default` | #f2f4f7 | #262628 | Fondo de la acción secundaria |
| `color.bg.action.secondary.hover` | `--color-bg-action-secondary-hover` | #e2e4e9 | #3f4042 | Al pasar el ratón |
| `color.bg.action.secondary.active` | `--color-bg-action-secondary-active` | #d2d4d9 | #515255 | Al pulsar |
| `color.bg.action.ghost.hover` | `--color-bg-action-ghost-hover` | #f2f4f7 | #262628 | Al pasar el ratón |
| `color.bg.action.disabled` | `--color-bg-action-disabled` | #f2f4f7 | #262628 | Fondo de una acción desactivada |
| `color.bg.feedback.success.default` | `--color-bg-feedback-success-default` | #15803d | #15803d | Fondo lleno (badges, botones) |
| `color.bg.feedback.success.subtle` | `--color-bg-feedback-success-subtle` | #f0fdf4 | #052e16 | Fondo suave de alertas |
| `color.bg.feedback.warning.default` | `--color-bg-feedback-warning-default` | #f59e0b | #f59e0b | Fondo lleno (badges, botones) |
| `color.bg.feedback.warning.subtle` | `--color-bg-feedback-warning-subtle` | #fffbeb | #451a03 | Fondo suave de alertas |
| `color.bg.feedback.danger.default` | `--color-bg-feedback-danger-default` | #dc2626 | #dc2626 | Fondo lleno (badges, botones) |
| `color.bg.feedback.danger.hover` | `--color-bg-feedback-danger-hover` | #b91c1c | #b91c1c | Fondo lleno al pasar el ratón |
| `color.bg.feedback.danger.subtle` | `--color-bg-feedback-danger-subtle` | #fef2f2 | #450a0a | Fondo suave de alertas |
| `color.bg.feedback.info.default` | `--color-bg-feedback-info-default` | #2563eb | #2563eb | Fondo lleno (badges, botones) |
| `color.bg.feedback.info.subtle` | `--color-bg-feedback-info-subtle` | #eff6ff | #172554 | Fondo suave de alertas |
| `color.surface.card` | `--color-surface-card` | #ffffff | #17181a | Tarjetas |
| `color.surface.popover` | `--color-surface-popover` | #ffffff | #17181a | Menús, popovers, tooltips |
| `color.surface.overlay` | `--color-surface-overlay` | #09090b99 | #09090b99 | Velo detrás de modales |
| `color.surface.sidebar` | `--color-surface-sidebar` | #f9fafc | #17181a | Fondo de la barra lateral |
| `color.text.default` | `--color-text-default` | #090a0c | #f9fafc | Texto principal |
| `color.text.muted` | `--color-text-muted` | #515255 | #9fa1a6 | Texto secundario |
| `color.text.subtle` | `--color-text-subtle` | #9fa1a6 | #707175 | Placeholders, deshabilitado |
| `color.text.inverse` | `--color-text-inverse` | #f9fafc | #090a0c |  |
| `color.text.link` | `--color-text-link` | #0071e3 | #6eabfd |  |
| `color.text.action.primary` | `--color-text-action-primary` | #0071e3 | #6eabfd | Texto o icono en el color principal (legible sobre el fondo) |
| `color.text.on-action.primary` | `--color-text-on-action-primary` | #ffffff | #ffffff | Texto/icono encima de la acción principal |
| `color.text.on-action.secondary` | `--color-text-on-action-secondary` | #17181a | #f9fafc | Texto/icono encima de la acción secundaria |
| `color.text.on-action.ghost` | `--color-text-on-action-ghost` | #17181a | #f9fafc | Texto/icono encima de la acción sin fondo |
| `color.text.on-action.disabled` | `--color-text-on-action-disabled` | #9fa1a6 | #515255 | Texto/icono encima de la acción desactivada |
| `color.text.feedback.success` | `--color-text-feedback-success` | #15803d | #86efac | Texto de un aviso sobre fondo normal o suave |
| `color.text.feedback.warning` | `--color-text-feedback-warning` | #b45309 | #fcd34d | Texto de un aviso sobre fondo normal o suave |
| `color.text.feedback.danger` | `--color-text-feedback-danger` | #b91c1c | #fca5a5 | Texto de un aviso sobre fondo normal o suave |
| `color.text.feedback.info` | `--color-text-feedback-info` | #1d4ed8 | #93c5fd | Texto de un aviso sobre fondo normal o suave |
| `color.text.on-feedback.success` | `--color-text-on-feedback-success` | #ffffff | #ffffff | Texto/icono encima del fondo lleno |
| `color.text.on-feedback.warning` | `--color-text-on-feedback-warning` | #090a0c | #090a0c | Texto/icono encima del fondo lleno |
| `color.text.on-feedback.danger` | `--color-text-on-feedback-danger` | #ffffff | #ffffff | Texto/icono encima del fondo lleno |
| `color.text.on-feedback.info` | `--color-text-on-feedback-info` | #ffffff | #ffffff | Texto/icono encima del fondo lleno |
| `color.border.default` | `--color-border-default` | #e2e4e9 | #262628 |  |
| `color.border.strong` | `--color-border-strong` | #d2d4d9 | #3f4042 |  |
| `color.border.input` | `--color-border-input` | #e2e4e9 | #262628 | Borde de campos de formulario |
| `color.border.focus` | `--color-border-focus` | #3a8df8 | #6eabfd | Anillo de foco |
| `color.border.action.primary` | `--color-border-action-primary` | #0071e3 | #0071e3 | Borde en el color principal (casillas, selección) |
| `color.border.feedback.success.default` | `--color-border-feedback-success-default` | #15803d | #15803d | Borde fuerte (campo con error, selección) |
| `color.border.feedback.success.subtle` | `--color-border-feedback-success-subtle` | #bbf7d0 | #166534 | Borde suave de un aviso |
| `color.border.feedback.warning.default` | `--color-border-feedback-warning-default` | #f59e0b | #f59e0b | Borde fuerte (campo con error, selección) |
| `color.border.feedback.warning.subtle` | `--color-border-feedback-warning-subtle` | #fde68a | #92400e | Borde suave de un aviso |
| `color.border.feedback.danger.default` | `--color-border-feedback-danger-default` | #dc2626 | #dc2626 | Borde fuerte (campo con error, selección) |
| `color.border.feedback.danger.subtle` | `--color-border-feedback-danger-subtle` | #fecaca | #991b1b | Borde suave de un aviso |
| `color.border.feedback.info.default` | `--color-border-feedback-info-default` | #2563eb | #2563eb | Borde fuerte (campo con error, selección) |
| `color.border.feedback.info.subtle` | `--color-border-feedback-info-subtle` | #bfdbfe | #1e40af | Borde suave de un aviso |
| `color.chart.1` | `--color-chart-1` | #0071e3 | #6eabfd |  |
| `color.chart.2` | `--color-chart-2` | #16a34a | #4ade80 |  |
| `color.chart.3` | `--color-chart-3` | #f59e0b | #fbbf24 |  |
| `color.chart.4` | `--color-chart-4` | #2563eb | #60a5fa |  |
| `color.chart.5` | `--color-chart-5` | #ef4444 | #f87171 |  |

## Tipografía

Familias: sans = Inter, ui-sans-serif, system-ui, sans-serif; mono = JetBrains Mono, ui-monospace, monospace.

| Clase | Tamaño / peso |
|---|---|
| `.text-display` | 52px / 700 |
| `.text-heading-h1` | 38px / 700 |
| `.text-heading-h2` | 32px / 600 |
| `.text-heading-h3` | 26px / 600 |
| `.text-heading-h4` | 22px / 600 |
| `.text-body-lg` | 20px / 400 |
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
| `--radius-control` | 16px | Botones, campos, selects |
| `--radius-card` | 22px | Tarjetas y paneles |
| `--radius-overlay` | 32px | Modales, popovers |
| `--radius-pill` | 9999px | Badges, avatares, toggles |
| `--radius-inner` | 11px | Elementos dentro de un control (opciones de menú, casillas) |
| `--radius-fine` | 5px | Detalles pequeños |
| `--radius-square` | 0px | Sin redondeo |
| `--elevation-flat` | 0px 1px 2px 0px #0000000b |  |
| `--elevation-raised` | 0px 4px 8px -2px #00000014 | Tarjetas elevadas, dropdowns |
| `--elevation-overlay` | 0px 12px 24px -4px #00000018 | Popovers, menús |
| `--elevation-modal` | 0px 24px 48px -8px #0000001f |  |
| `--motion-duration-micro` | 130ms | Hover, foco |
| `--motion-duration-default` | 220ms |  |
| `--motion-duration-emphasis` | 350ms | Modales, paneles |
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
| `--layout-desktop` | 768px | Desde este ancho, la estructura de la app es la de escritorio (sidebar fijo); por debajo, la de móvil |
| `--text-size-caption` | 12px | Notas, metadatos |
| `--text-size-ui` | 14px | Texto de controles y menús |
| `--text-size-body` | 16px | Texto de lectura |
| `--text-size-lead` | 20px | Entradilla |
| `--text-size-title` | 22px | Títulos de tarjeta o sección pequeña |
| `--text-size-h3` | 26px |  |
| `--text-size-h2` | 32px |  |
| `--text-size-h1` | 38px |  |
| `--text-size-display` | 52px |  |
| `--text-weight-normal` | 400 |  |
| `--text-weight-emphasis` | 500 | Etiquetas, botones |
| `--text-weight-strong` | 600 | Títulos |
| `--text-weight-heavy` | 700 |  |
| `--text-family-base` | Inter, ui-sans-serif, system-ui, sans-serif |  |
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
