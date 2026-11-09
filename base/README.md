# Sistema de diseño base

Plantilla genérica de tokens de la que parte cada sistema de diseño nuevo. Abre `preview.html` en el navegador para verlo todo (tiene botón de modo claro/oscuro).

## Qué hay en la carpeta

| Archivo | Para qué sirve |
|---|---|
| `tokens/primitives.tokens.json` | Valores en bruto: escalas de color (50–950), espaciado (base 4px), radios, tipografía, sombras, duraciones y curvas de animación. |
| `tokens/semantic.tokens.json` | Roles que no cambian con el modo: estilos tipográficos (display, h1–h4, body, label, caption, code), espaciados de uso, radios por tipo de elemento, elevación, movimiento y alturas de controles. |
| `tokens/color.light.tokens.json` | Colores semánticos en modo claro. |
| `tokens/color.dark.tokens.json` | Los mismos roles en modo oscuro. |
| `css/tokens.css` | Todo convertido a variables CSS, con alias para shadcn/ui (`--primary`, `--background`, etc.) y clases tipográficas (`.text-heading-h1`…). |
| `figma/tokens-studio.json` | Archivo único para importar en Figma con el plugin Tokens Studio, con los temas Light y Dark ya configurados. |
| `preview.html` | Vista previa visual del sistema. |

## Cómo está organizado

Dos capas, siguiendo el estándar W3C de design tokens (DTCG):

1. **Primitivos**: qué valor es (`color.brand.600`, `space.4`). Nunca se usan directamente en componentes.
2. **Semánticos**: para qué sirve (`color.bg.action.primary.default`, `color.text.muted`, `radius.card`). Apuntan a primitivos. Los componentes solo usan esta capa, así que el modo oscuro o una marca nueva se hacen cambiando a qué primitivo apunta cada rol.

Colores semánticos: `color . dónde . función . variante . estado`. «Dónde» es `bg` (fondo), `text` (texto e iconos) o `border` (borde), más `surface` (tarjetas, menús) y `chart` (gráficos). Funciones: `action` (primary, secondary, ghost, disabled) y `feedback` (success, warning, danger, info); `on-action` / `on-feedback` es el texto que va encima de su fondo. Ejemplos: `color.bg.action.primary.hover`, `color.text.on-action.primary`, `color.border.feedback.danger.subtle`.

Todos los pares texto/fondo cumplen contraste WCAG AA (4.5:1) en claro y oscuro.

## Para crear un sistema nuevo a partir de este

Normalmente basta con cambiar la escala `color.brand` y las familias tipográficas en `primitives.tokens.json`. Si hace falta, se ajustan radios y espaciado. Los archivos `css/`, `figma/`, `preview.html` y `kit/` se regeneran a partir de los tokens con `python scripts/generate.py base` (ver `FORMATO.md` en la carpeta principal).

## Importar en Figma

1. Instala el plugin gratuito **Tokens Studio for Figma**.
2. En el plugin: Settings → Token Storage → Local, y luego Tools → Load from file → `figma/tokens-studio.json`.
3. Styles & Variables → Export styles & variables, marcando los temas Light y Dark: crea las variables de Figma con los dos modos.

(Los nombres exactos de los menús pueden variar según la versión del plugin.)
