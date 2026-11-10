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

- Formato de entrada `dsc-figma@1` (un flujo) o `dsc-figma-bundle@1` (todo): lo genera `web/src/lib/figma-export.ts` midiendo las pantallas tal como se ven en la web. Lleva `sets` (descripción y partes opcionales de cada componente) y `definitions` (la pieza más completa de cada variante, de la que sale el maestro).
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
10. **Botón: variantes completas e iconos con interruptores.** El botón tiene todas las combinaciones de `variante` × `tamaño` × `estado` (normal, hover, foco, deshabilitado; sin «error»), aunque no salgan en los ejemplos. El icono no es una variante: cada botón tiene `icono izquierda` e `icono derecha` (sí/no), `… · cuál` para elegir el icono y `texto`. Los botones de solo icono son los tamaños `icon…`. Al actualizar un archivo antiguo, la variante `contenido` se quita sola y las repetidas se juntan.
11. **Ancho de lo que lleva texto: abrazar o rellenar, nunca fijo.** Un texto de una línea abraza su texto; uno de varias líneas rellena el ancho de su caja. Una pieza que mide justo lo que su contenido abraza (aunque ocupe todo el ancho de su padre); las piezas en columnas de una rejilla rellenan su columna. Solo llevan ancho fijo las piezas que no escalan (regla 4), los campos y barras, y lo que en la web tiene un ancho propio (`w-…`). En las secciones «Estados» y «Abierto» cada pieza va con su tamaño natural.

## Reglas de componentes, variables y páginas (estudio de mercado, 2026-11-09)

Salen del estudio de cómo trabajan las grandes empresas en Figma (`/mnt/project-files/estudios/figma-reglas-plugin.md`).

12. **Cada componente, solo sus propiedades reales.** `variante`, `tamaño`, `paso` y `posición` solo si la pieza los tiene en el código; `estado` solo si es interactiva (o tiene un estado que no es el normal). `error` solo en campos, casillas, interruptores, etiquetas, sliders y tarjetas de elección. Al actualizar un archivo antiguo, las propiedades que sobran se quitan y las variantes repetidas se juntan (sus instancias pasan a la que se queda).
13. **`seleccionado` aparte del estado.** Casilla, radio, interruptor, pestañas, toggle, opciones de menú, elementos de la barra lateral… llevan `seleccionado=sí/no`. Lo que antes era `estado=marcado` o `estado=activo` pasa a `estado=normal, seleccionado=sí`.
14. **El patrón del botón para todos.** Cada texto es una propiedad de texto con el nombre de su función (`texto`, `título`, `descripción`, `etiqueta`, `valor`, `placeholder`, `atajo`…). Lo que no siempre va es un interruptor (`con descripción`, `icono`). Cada icono se elige con `… · cuál`, con los iconos del sistema como preferidos. Las piezas con iconos a los lados (botón, insignia, opción de menú, pestaña, enlace…) tienen `icono izquierda` e `icono derecha`.
15. **El maestro es la pieza más completa.** De todas las veces que sale una variante, el componente se hace con la que tiene más partes; las demás son instancias con las partes que no llevan apagadas.
16. **Piezas dentro de piezas: instancias, y a la vista.** Lo que ya es componente va como instancia (el botón dentro de una tarjeta), con su variante y sus textos, y se muestra en las propiedades del componente de fuera.
17. **Capas con nombre.** Textos e iconos por su función; cajas por su `data-slot` o por lo que son (cabecera, pie, contenido, párrafo, lista…), o por lo que llevan (acciones, textos, iconos, contenido con icono). Nunca `div`, `grupo`, `columna` ni `fila`.
18. **Rejilla de variantes ordenada.** Una fila por variante, tamaño y seleccionado; una columna por estado (normal, hover, foco, pulsado, deshabilitado, error). La de por defecto, la primera.
19. **Descripción** en cada componente (la de la web) y una **ficha** a su lado en la página de componentes: qué es, cuántas variantes tiene y sus propiedades.
20. **Variables con su uso y su código.** Cada variable solo sale donde toca (scopes): `color/bg` y `surface` en rellenos, `color/text` en textos e iconos, `color/border` en bordes, `space` en separaciones y márgenes, `radius` en esquinas, `size`, `control/height` y `layout` en ancho y alto, la tipografía en sus campos. Los primitivos no salen. En Dev Mode, cada una enseña su variable CSS: `var(--color-bg-action-primary-default)`.
21. **Estilos de texto** `texto/<tamaño>/<peso>` (p. ej. `texto/body/normal`), uno por combinación usada, con tamaño, peso y familia enlazados a sus variables, y aplicados a cada texto.
22. **Medidas con token.** El alto (y el ancho, si es fijo) que en la web sale de un token (`h-control-md`, `size-…`) se enlaza a su variable. Los márgenes y separaciones sin clase en la web se enlazan a la variable semántica que vale eso.
23. **Páginas en orden:** Portada, Fundamentos (colores, textos, espacios, radios y sombras, enlazados a sus variables), `---`, Componentes, `---`, el catálogo por grupos, `---`, los flujos.
24. **Revisión al terminar.** El plugin repasa el archivo y lo dice en su ventana: colores, márgenes o separaciones sin variable, capas con nombre por defecto, cajas Hug con hijos Fill, cajas sin auto layout, componentes con más de 30 variantes (salvo el botón), componentes sin descripción, variables sin uso y botones de menos de 44 px en móvil.
25. **Nada se pisa.** Al terminar, las pantallas de cada página de flujo o catálogo se recolocan en orden y en filas (lo demás que haya en la página va detrás); en la página de componentes, iconos arriba, cada componente con su ficha y lo demás debajo. Las variantes se reordenan otra vez al final.
26. **Campo completo (Field).** El campo de formulario es un componente `field` con etiqueta, campo, descripción y mensaje de error como partes. Etiqueta, descripción y mensaje se encienden y apagan (`con etiqueta`, `con descripción`, `con mensaje`). El tipo de campo se elige con `campo · cuál` (Input, Textarea, Select, Native Select, Input Group, Password Input, Code Input, Checkbox, Switch, Slider, Radio), y sus propiedades salen dentro. Tiene `orientación` (vertical / horizontal) y `estado` (normal, error…). El maestro lleva siempre etiqueta y descripción; cada pantalla apaga lo que no usa.
27. **Texto de los campos centrado.** El texto de un campo de una línea va centrado en alto, con el margen que tiene en la web; en un área de texto, arriba con su margen.
