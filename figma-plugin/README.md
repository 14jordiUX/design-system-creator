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
   los tokens, el catálogo entero de componentes —página «Catálogo», una mesa por componente con sus ejemplos— y todos los flujos;
   cada flujo en móvil y en escritorio, en páginas «<flujo> · <sistema> · Móvil» y «… · Escritorio»; el plugin dibuja o
   actualiza cada uno en su página). Es grande: en Figma tarda un poco. Si el archivo tenía la página antigua sin tamaño,
   al actualizar pasa a ser la de móvil.
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

## Reglas de auto layout (las aplica la exportación y el plugin, siempre)

Pedidas por Jordi al revisar el catálogo en Figma. Cualquier componente o pantalla nueva las cumple sin hacer nada:

1. **Nada en freeform.** Las rejillas (`grid`) se pasan a auto layouts anidados. El Alert, por ejemplo, queda así: fila [icono, columna [título, descripción]]. Una pila con huecos distintos se corta por el hueco mayor, y cada trozo va en su propio auto layout.
2. **Un marco en Hug nunca tiene hijos en Fill** en ese eje. Si los tiene, ese eje va fijo; si no, se encoge.
3. **Alineación.** Si el contenido está centrado en la caja (la marca de la casilla), el auto layout centra.
4. **Tamaño propio del componente maestro:**
   - Se adapta al contenido (Hug) si en la web también lo hacía. Por ejemplo, un botón crece con su texto.
   - Ancho fijo y alto Hug si dentro hay algo que rellena, como el texto del Alert: el texto se ajusta al ancho y la caja crece hacia abajo.
   - Los campos (input, textarea, select…) y las barras (progress, slider, separator) tienen ancho fijo.
   - Los que no escalan tienen tamaño fijo: casilla, interruptor, avatar, botón de icono… (lista `FIXED_SIZE` en `web/src/lib/figma-export.ts`).
5. **Listas con slot.** Tabs (`tabs-list`), Toggle Group (`toggle-group`) y Tab propio (`tab-list`) son componentes con un **slot** («opciones»). Dentro van las pestañas u opciones que pida cada pantalla, y el componente preferido del slot es el suyo: `tabs-trigger`, `toggle-group-item` o `tab-trigger`. Si Figma no admite slots, se dibujan como antes. La lista está en `SLOT_LISTS`, en `web/src/lib/figma-export.ts`.
6. **Cajas con slot.** Card, Dialog, Alert Dialog, Sheet, Drawer, Popover y Hover Card tienen un slot sin preferido, para meter dentro lo que haga falta. Lo que va suelto encima, como la X de cerrar, se queda fuera del slot. Los menús (Dropdown, Context, Menubar) tienen un slot con su opción como preferida.
7. **Estados.** En el catálogo, cada pieza interactiva sale también en sus estados, cada uno como variante (`estado=…`), en la sección «Estados» de su tarjeta. Se leen de sus clases:
   - `hover:` → hover
   - `active:` → pulsado
   - `focus-visible:` → foco, con el anillo por fuera
   - `disabled:` → deshabilitado
   - `aria-invalid:` → error
8. **Lo que se abre encima.** Diálogos, menús, paneles y tooltips se abren un momento al descargar, se miden y salen en la sección «Abierto» del catálogo como componentes.
9. **Piezas pegadas.** En un Button Group, un Toggle Group, las casillas del código o un campo con prefijo, cada pieza es su propia variante con la propiedad `posición`: `inicio` (sin esquinas a la derecha), `medio` (sin borde a la izquierda ni esquinas) o `fin` (sin borde a la izquierda). Las que van solas no llevan esa propiedad, que en el conjunto sale como `sola`. Así un Input dentro de un grupo no cambia el Input normal.
