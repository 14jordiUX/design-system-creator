# Plugin de Figma «Design System Creator»

Lleva un flujo de la web a Figma y trae tus cambios de vuelta.

## Instalarlo (solo la primera vez)

1. En la web, abre un prototipo → pestaña **Compartir** → **Llevar a Figma** → «Descargar el plugin», y descomprímelo.
   (O usa esta carpeta tal cual.)
2. En **Figma de escritorio**, abre un archivo y ve a **Plugins → Desarrollo → Importar plugin desde manifiesto…**.
3. Elige el `manifest.json` de la carpeta. Ya aparece en **Plugins → Desarrollo → Design System Creator**.

## Dibujar un flujo

1. En la web: **Llevar a Figma → Descargar el flujo para Figma** (sale con el sistema, el modo y el tamaño que tengas elegidos).
   O todo el sistema de una vez: **Prototipos → Todo <sistema> para Figma → Descargar todo para Figma** (formato `dsc-figma-bundle@1`:
   los tokens una vez y todos los flujos; el plugin dibuja o actualiza cada flujo en su página).
2. En Figma: abre el plugin, suelta el archivo y pulsa **Dibujar en Figma**.

Crea:
- **Variables**: «Primitivos» (ocultas en los selectores: solo son la capa de gestión), «Semánticos» y «Color» con los modos Claro y Oscuro. También los estilos de sombra (`elevation/…`).
- Una página **Componentes · <sistema>** con los componentes (button, input-group, checkbox…) y sus variantes (`variante`, `tamaño`, `contenido`, `estado`), y los iconos como `icon/<nombre>`.
- Una página **<flujo> · <sistema>** con las pantallas hechas con instancias de esos componentes, en auto layout, y conectadas como prototipo (▶ Presentar).

Todo color, espacio, radio y tamaño de texto va enlazado a su variable. Si vuelves a dibujar, se **reutilizan** las variables y componentes que ya hay en el archivo (con tus cambios), salvo que marques «Actualizar los valores…».

Si no tienes instalada la fuente del sistema, usa Inter y te avisa.

**Plan gratis de Figma:** solo permite un modo por colección. El modo oscuro se guarda entonces en otra colección, «Color · Oscuro», con las mismas variables (las pantallas se ven en claro). Al exportar los cambios vuelve igual.

## Actualizar con cambios de Claude

Cuando Claude cambia algo (un color, un componente, un texto de pantalla…), descarga otra vez el .json en la web
(«Llevar a Figma»), suéltalo en el plugin y pulsa **Actualizar este archivo**. En el mismo archivo:
- pisa los valores de las variables y estilos con los nuevos (y añade los que falten);
- pone al día los componentes que ya existen, capa a capa y sin borrarlos: todas sus instancias reciben el cambio
  y conservan sus textos (si un componente ha cambiado de forma, se rehace entero y te avisa);
- sustituye las pantallas del flujo en el mismo sitio (y rehace los enlaces del prototipo). Si una pantalla falla
  a medias, se deja la anterior y te lo dice.

Lo que no viene en el .json (otras páginas, otros componentes) no se toca. Si has cambiado algo en Figma que Claude
aún no tiene, expórtalo antes, porque se sustituye.

## Exportar tus cambios

Ve a la página del flujo (o selecciona las pantallas) y pulsa **Exportar cambios (.json)**. Súbeselo a Claude en el chat.
Claude lo revisa con `python scripts/figma_changes.py <sistema> <cambios.json> [figma-original.json]`, que resume los
tokens cambiados o nuevos, los componentes y variantes nuevos y, por pantalla, los textos cambiados, los enlaces y los
valores sueltos (sin variable), y lo pasa al código siguiendo las reglas del sistema.

## Para Claude

- Formato de entrada `dsc-figma@1`: lo genera `web/src/lib/figma-export.ts` midiendo las pantallas tal como se ven en la web.
- Formato de salida `dsc-figma-changes@1`: lo genera `code.js` (`exportChanges`).
- Sin compilación: `code.js` es JavaScript tal cual (sin `?.` ni `??`, por compatibilidad con el entorno de plugins).
