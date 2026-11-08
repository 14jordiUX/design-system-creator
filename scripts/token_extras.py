"""Tokens añadidos en la versión 0.3 para que los componentes no necesiten ningún valor fijo.

`extend(...)` añade los que falten (no toca los que ya existen). Lo usan create_tokens.py
(sistemas nuevos) y migrate.py (sistemas que ya existían)."""


def t(value, type_=None, desc=None):
    d = {"$value": value}
    if type_: d["$type"] = type_
    if desc: d["$description"] = desc
    return d


def _merge(target, extra):
    for k, v in extra.items():
        if k not in target:
            target[k] = v
        elif isinstance(v, dict) and "$value" not in v and isinstance(target[k], dict):
            _merge(target[k], v)


SCALE = {"3xs": "0-5", "2xs": "1", "xs": "1-5", "sm": "2", "md": "3", "lg": "4", "xl": "6", "2xl": "8", "3xl": "12", "4xl": "16"}


def extend(primitives, semantic, light, dark):
    # v0.5: escala semántica completa de espaciado (los componentes ya no usan space.N directamente).
    # Se reescribe una sola vez: si ya tiene "3xs", no se toca (así se respetan los cambios del editor).
    for grp, desc in (("inset", "Relleno interior (padding) y distancias a los bordes"),
                      ("gap", "Separación entre elementos (gap, márgenes)")):
        cur = semantic["space"].get(grp, {})
        if "3xs" not in cur:
            semantic["space"][grp] = {"$description": desc,
                                      **{k: t("{space.%s}" % v) for k, v in SCALE.items()}}
    _merge(primitives, {
        "duration": {"loop": t("1600ms", desc="Animaciones que se repiten (carga)")},
        "breakpoint": {"$type": "dimension",
                       "sm": t("640px"), "md": t("768px"), "lg": t("1024px"), "xl": t("1280px")},
    })
    _merge(semantic, {
        "control": {
            "focus-ring-offset": t("{border-width.2}", desc="Separación entre el control y su anillo de foco"),
        },
        "size": {"$type": "dimension",
            "icon": {"sm": t("{space.3}", desc="Iconos pequeños (dentro de badges, checks)"),
                     "md": t("{space.4}", desc="Iconos por defecto"),
                     "lg": t("{space.5}", desc="Iconos destacados")},
            "avatar": {"sm": t("{space.6}"), "md": t("{space.8}"), "lg": t("{space.10}"),
                       "xl": t("{space.12}"), "2xl": t("{space.16}")},
            "indicator": t("{space.2}", desc="Puntos de radio, viñetas"),
            "track": t("{space.1-5}", desc="Grosor de barras de slider"),
            "progress": t("{space.2}", desc="Alto de la barra de progreso"),
            "menu-min": t("128px", desc="Ancho mínimo de menús desplegables"),
            "popover": t("288px", desc="Ancho de popovers"),
            "tooltip": t("320px", desc="Ancho máximo de tooltips"),
            "dialog": t("512px", desc="Ancho máximo de diálogos"),
            "sheet": t("384px", desc="Ancho de paneles laterales"),
            "menu-wide": t("192px", desc="Ancho mínimo de menús de barra (menubar, menús contextuales)"),
            "list-max": t("300px", desc="Alto máximo de listas con búsqueda (command, combobox)"),
            "handle": t("{space.24}", desc="Ancho del tirador de un drawer"),
            "line": t("{border-width.2}", desc="Grosor de líneas indicadoras (pestaña activa, guías)"),
            "field": {"xs": t("{space.20}", desc="Campos cortos (códigos, números)"), "sm": t("{space.24}", desc="Campos y etiquetas cortas")},
            "area-min": t("{space.24}", desc="Alto mínimo de zonas de demo, de soltar archivos o de clic"),
            "fab": {"md": t("56px", desc="Botón flotante (fab)"), "sm": t("{space.10}", desc="Botón flotante pequeño y acciones de su lista")},
        },
        "layout": {"$type": "dimension",
            "header": t("56px", desc="Alto de la cabecera de una aplicación"),
            "sidebar": t("256px", desc="Ancho de la barra lateral"),
            "prose": t("672px", desc="Ancho máximo de un bloque de texto"),
            "content": t("1024px", desc="Ancho máximo del contenido"),
            "page": t("1152px", desc="Ancho máximo de una página"),
            "sidebar-icon": t("{space.12}", desc="Ancho de la barra lateral plegada (solo iconos)"),
            "sidebar-mobile": t("288px", desc="Ancho de la barra lateral en móvil"),
            "drawer-max": t("80vh", desc="Alto máximo de un drawer"),
            "drawer-gap": t("{space.24}", desc="Distancia de un drawer al borde opuesto de la pantalla"),
        },
        "text": {"$description": "Tipografía por propiedades sueltas (para combinar). Para estilos completos usa typography.*",
            "size": {"$type": "dimension",
                     "caption": t("{font.size.xs}", desc="Notas, metadatos"), "ui": t("{font.size.sm}", desc="Texto de controles y menús"),
                     "body": t("{font.size.md}", desc="Texto de lectura"), "lead": t("{font.size.lg}", desc="Entradilla"),
                     "title": t("{font.size.xl}", desc="Títulos de tarjeta o sección pequeña"), "h3": t("{font.size.2xl}"),
                     "h2": t("{font.size.3xl}"), "h1": t("{font.size.4xl}"), "display": t("{font.size.5xl}")},
            "weight": {"$type": "fontWeight",
                       "normal": t("{font.weight.regular}"), "emphasis": t("{font.weight.medium}", desc="Etiquetas, botones"),
                       "strong": t("{font.weight.semibold}", desc="Títulos"), "heavy": t("{font.weight.bold}")},
            "family": {"$type": "fontFamily", "base": t("{font.family.sans}"), "code": t("{font.family.mono}")},
            "leading": {"$type": "number", "compact": t("{font.line-height.tight}"), "body": t("{font.line-height.normal}"),
                        "prose": t("{font.line-height.relaxed}")},
            "tracking": {"$type": "dimension", "heading": t("{font.letter-spacing.tight}"), "body": t("{font.letter-spacing.normal}"),
                         "caps": t("{font.letter-spacing.wide}", desc="Textos en mayúsculas")},
        },
        "radius": {"inner": t("{radius.sm}", desc="Elementos dentro de un control (opciones de menú, casillas)"),
                   "fine": t("{radius.xs}", desc="Detalles pequeños"), "square": t("{radius.none}", desc="Sin redondeo")},
        "state": {"opacity": {"$type": "number", "disabled": t("{opacity.disabled}", desc="Elementos desactivados"),
                              "overlay": t("{opacity.overlay}")}},
        "motion": {
            "duration": {"loop": t("{duration.loop}")},
            "scale": {"$type": "number", "enter": t(0.95, desc="Escala inicial al aparecer (menús, diálogos)")},
            "distance": {"$type": "dimension", "enter": t("{space.2}", desc="Desplazamiento al aparecer")},
        },
    })
    for colors, dark_mode in ((light, False), (dark, True)):
        _merge(colors["color"], {
            "feedback": {"danger": {"hover": t("{color.red.700}", desc="Fondo sólido de peligro al pasar el ratón")}},
            "surface": {"sidebar": t("{color.neutral.900}" if dark_mode else "{color.neutral.50}", desc="Fondo de la barra lateral")},
            "chart": {"$description": "Colores de series en gráficos",
                **{str(i + 1): t("{color.%s}" % c) for i, c in enumerate(
                    ["brand.400", "green.400", "amber.400", "blue.400", "red.400"] if dark_mode else
                    ["brand.600", "green.600", "amber.500", "blue.600", "red.500"])}},
        })
