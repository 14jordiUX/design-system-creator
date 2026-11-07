# Design System Creator

Herramienta para crear, ver y exportar sistemas de diseño.

## Cómo verla

- **Para ver:** doble clic en **`Abrir la web.html`**. Se abre en tu navegador, sin instalar nada.
- **Online:** https://14jordiux.github.io/design-system-creator/ . En el modo editor, **Guardar** sube los cambios a GitHub (la primera vez pide una llave de GitHub; la web explica cómo crearla). GitHub regenera todo y vuelve a publicar la web en 1 o 2 minutos. El cuestionario también crea sistemas desde ahí, y **Nuevo sistema → Desde una web** crea uno a partir de una dirección (GitHub abre la web, mide sus estilos y crea el sistema en 3–5 minutos).
- **Para editar y guardar en tu ordenador:** doble clic en **`Abrir el editor.bat`**. Se abre una ventana negra (déjala abierta) y la web en `http://localhost:5179`. En el modo editor, el botón **Guardar** escribe los cambios en la carpeta del sistema, regenera CSS, Figma y kit, y actualiza `Abrir la web.html`. Necesita Node.js y Python 3.

(Necesita internet solo para cargar las tipografías de Google Fonts.)

## Qué hay en la carpeta

| Carpeta / archivo | Qué es |
|---|---|
| `Abrir la web.html` | La web, lista para abrir (solo ver). |
| `Abrir el editor.bat` | Abre la web con guardado (arranca `servidor.mjs`). |
| `base/` | El sistema base: la plantilla de la que parten todos. |
| `systems/` | Una subcarpeta por cada sistema creado (ahora: `sereno`). |
| `FORMATO.md` | Cómo está organizada la carpeta de un sistema y qué campos tiene la ficha. |
| `scripts/` | `new_system.py` crea un sistema nuevo desde unas respuestas (lo usa Claude en conversación; da lo mismo que el cuestionario); `generate.py` genera todo lo demás (CSS, Figma, vista previa, kit) a partir de los tokens. |
| `peticiones/` | Peticiones «Desde una web» pendientes y sus resultados (las procesa GitHub). |
| `web/` | El código de la web. |

## Estado (versión 0.5)

Regla: todo (colores, medidas, bordes, tipografía, espaciado, sombras, movimiento) sale de tokens; `scripts/check_tokens.py` lo comprueba.

Funciona: biblioteca con búsqueda y orden, modo cliente (inicio con principios y notas de uso, fundamentos, los 47 componentes de la lista con su demo, descargas), modo editor con cambios en vivo, deshacer/rehacer y guardar en la carpeta, cuestionario de 8 pasos que crea un sistema nuevo en `systems/` (con «Abrir el editor.bat»): escala de color en OKLCH, grises fríos o cálidos, buscador de fuentes, y control de contraste con arreglo automático. Descargas: kit de proyecto (.zip), SKILL.md, archivo para Figma, CSS y tokens.

Todavía no (tiene la pantalla, pero avisa de que llegará más adelante): duplicar, renombrar y borrar sistemas, patrones y paquete Claude Design.
