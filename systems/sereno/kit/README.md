# Kit de proyecto: Sereno

Todo lo necesario para empezar un proyecto nuevo con el sistema «Sereno» ya aplicado.

## Cómo usarlo (sin tocar código)

1. Crea la carpeta del proyecto nuevo y pon dentro esta carpeta del kit.
2. Abre una conversación con Claude en ese proyecto y dile: **«Usa el sistema de diseño del kit»**.
3. Claude leerá `SKILL.md` y montará el proyecto con los componentes y el estilo del sistema.

Si quieres que Claude lo recuerde siempre, guarda `SKILL.md` como skill.

## Qué contiene

| Archivo / carpeta | Qué es |
|---|---|
| `SKILL.md` | Instrucciones para Claude: principios, reglas y todos los tokens. |
| `tokens/` | Los tokens en formato W3C (la fuente de verdad). |
| `styles/tokens.css` | Variables CSS, con modo claro y oscuro. |
| `styles/globals.css` | Tema listo para Tailwind CSS v4 y shadcn/ui. |
| `components/ui/` | 62 componentes de shadcn/ui que toman el estilo del sistema. |
| `components/custom/` | Componentes propios del sistema: app-sidebar, appointment-card, fab, stat-card, steps, tab. |
| `patterns/` | Pantallas de ejemplo hechas solo con los componentes: panel-de-gestion. |
| `prototypes/` | Flujos de varias pantallas que se pueden clicar: login, onboarding. |
| `lib/utils.ts` | Función auxiliar que usan los componentes. |
| `components.json` | Configuración para añadir más componentes con `npx shadcn add`. |

Generado con `scripts/generate.py`. No edites estos archivos a mano: cambia los tokens del sistema y vuelve a generar.
