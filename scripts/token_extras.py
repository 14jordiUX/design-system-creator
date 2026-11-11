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


DIMENSIONS = (32, 40, 48, 56, 128, 192, 256, 288, 300, 320, 384, 512, 672, 768, 1024, 1152)
SCALE = {"3xs": "0-5", "2xs": "1", "xs": "1-5", "sm": "2", "md": "3", "lg": "4", "xl": "6", "2xl": "8", "3xl": "12", "4xl": "16"}


def extend(primitives, semantic, light, dark):
    color_roles(light, dark)
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
        "easing": {"emphasized": t([0.32, 0.72, 0, 1], desc="Arranca rápido y frena muy suave (cambios de forma grandes)")},
        "breakpoint": {"$type": "dimension",
                       "sm": t("640px"), "md": t("768px"), "lg": t("1024px"), "xl": t("1280px")},
        # v0.6: medidas fijas que antes estaban escritas a mano en los semánticos (no cambian con la densidad)
        "dimension": {"$type": "dimension", "$description": "Medidas fijas (alturas de control, anchos de paneles y páginas)",
                      **{str(n): t(f"{n}px") for n in DIMENSIONS}},
        "viewport": {"$type": "dimension", "80": t("80vh")},
        "scale": {"$type": "number", "95": t(0.95)},
        "z-index": {"$type": "number", "$description": "Orden de apilado (qué queda encima)",
                    **{str(n): t(n) for n in (10, 20, 30, 40, 50)}},
        "opacity": {"10": t(0.1), "40": t(0.4), "80": t(0.8)},
        "angle": {"$type": "other", "45": t("45deg"), "90": t("90deg"), "180": t("180deg")},
        "color": {"scrim": t("#09090b99", "color", desc="Negro translúcido para velos")},
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
            "fab": {"md": t("{dimension.56}", desc="Botón flotante (fab)"), "sm": t("{space.10}", desc="Botón flotante pequeño y acciones de su lista")},
            "tab-bar": {"expanded": t("{space.16}", desc="Alto de la barra de pestañas flotante en grande (icono y texto)"),
                        "compact": t("{space.12}", desc="Alto de la barra de pestañas flotante en pequeño (solo icono)"),
                        "item": t("{space.12}", desc="Ancho de cada pestaña cuando la barra flotante está en pequeño")},
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
            "desktop": t("{dimension.768}", desc="Desde este ancho, la estructura de la app es la de escritorio (sidebar fijo); por debajo, la de móvil"),
            "compact": t("{dimension.512}", desc="Por debajo de este ancho, un componente usa su versión móvil (consulta de contenedor @max-compact)"),
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
            "leading": {"$type": "number", "compact": t("{font.line-height.tight}"), "title": t("{font.line-height.snug}", desc="Títulos pequeños"),
                        "body": t("{font.line-height.normal}"), "prose": t("{font.line-height.relaxed}")},
            "tracking": {"$type": "dimension", "heading": t("{font.letter-spacing.tight}"), "body": t("{font.letter-spacing.normal}"),
                         "caps": t("{font.letter-spacing.wide}", desc="Textos en mayúsculas")},
        },
        "radius": {"inner": t("{radius.sm}", desc="Elementos dentro de un control (opciones de menú, casillas)"),
                   "fine": t("{radius.xs}", desc="Detalles pequeños"), "square": t("{radius.none}", desc="Sin redondeo")},
        "state": {"opacity": {"$type": "number", "disabled": t("{opacity.disabled}", desc="Elementos desactivados"),
                              "overlay": t("{opacity.overlay}")}},
        "motion": {
            "duration": {"loop": t("{duration.loop}")},
            "easing": {"emphasis": t("{easing.emphasized}", desc="Cambios de forma grandes (la barra de pestañas flotante que se encoge)")},
            "scale": {"$type": "number", "enter": t(0.95, desc="Escala inicial al aparecer (menús, diálogos)")},
            "distance": {"$type": "dimension", "enter": t("{space.2}", desc="Desplazamiento al aparecer"),
                         "scroll": t("{space.6}", desc="Cuánto hay que bajar o subir para que algo reaccione al scroll (barra de pestañas flotante)")},
            "rotate": {"$type": "other", "tilt": t("{angle.45}", desc="Giro de un octavo (un + que se convierte en ×)"),
                       "turn": t("{angle.90}", desc="Giro de un cuarto (flechas de submenú, iconos que cambian)"),
                       "flip": t("{angle.180}", desc="Media vuelta (flecha de un acordeón o un select abiertos)")},
        },
        "chart": {"$type": "number", "$description": "Gráficos",
                  "area-opacity": t("{opacity.40}", desc="Relleno de las áreas"),
                  "gradient-start": t("{opacity.80}", desc="Opacidad arriba del degradado de un área"),
                  "gradient-end": t("{opacity.10}", desc="Opacidad abajo del degradado de un área")},
        "layer": {"$type": "number", "$description": "Qué queda encima de qué (z-index)",
                  "raised": t("{z-index.10}", desc="Un elemento por encima de sus vecinos (foco en grupos de botones, casilla activa)"),
                  "sticky": t("{z-index.20}", desc="Partes pegadas o superpuestas dentro de un componente"),
                  "floating": t("{z-index.40}", desc="Botones flotantes (fab)"),
                  "overlay": t("{z-index.50}", desc="Menús, popovers, diálogos y paneles")},
    })
    _to_primitives(primitives, semantic, light, dark)
    text_styles(semantic)
    for colors, dark_mode in ((light, False), (dark, True)):
        _merge(colors["color"], {
            "bg": {"feedback": {"danger": {"hover": t("{color.red.700}", desc="Fondo de peligro al pasar el ratón")}}},
            "surface": {"sidebar": t("{color.neutral.900}" if dark_mode else "{color.neutral.50}", desc="Fondo de la barra lateral")},
            "chart": {"$description": "Colores de series en gráficos",
                **{str(i + 1): t("{color.%s}" % c) for i, c in enumerate(
                    ["brand.400", "green.400", "amber.400", "blue.400", "red.400"] if dark_mode else
                    ["brand.600", "green.600", "amber.500", "blue.600", "red.500"])}},
        })


# ---------- v0.8: un estilo de texto por cada tamaño con nombre ----------
# Cada estilo (typography.h1, typography.body…) dice su familia, tamaño, peso, interlineado y espaciado.
# Apunta a los tokens semánticos text.* (el tamaño es text.size.<estilo>), así la clase text-h1 de los
# componentes y el estilo de texto texto/h1/… de Figma salen del mismo sitio.
TEXT_STYLES = [  # estilo, peso, interlineado, espaciado, descripción
    ("display", "heavy", "compact", "heading", "Cifras y titulares muy grandes"),
    ("h1", "heavy", "compact", "heading", "Título de página"),
    ("h2", "strong", "compact", "heading", "Título de sección"),
    ("h3", "strong", "title", "body", "Subtítulo"),
    ("title", "strong", "title", "body", "Títulos de tarjetas y bloques pequeños"),
    ("lead", "normal", "prose", "body", "Entradilla y texto destacado"),
    ("body", "normal", "body", "body", "Texto de lectura"),
    ("ui", "normal", "body", "body", "Botones, menús y formularios"),
    ("caption", "normal", "body", "body", "Notas, metadatos y ayudas"),
]


def text_styles(semantic):
    """Pasa typography.heading.h1, body.md, label.*… a un estilo por tamaño (una sola vez)."""
    typo = semantic.get("typography") or {}
    if typo and "heading" not in typo: return
    semantic["typography"] = {
        "$description": "Estilos de texto completos. Cada uno manda en su clase (text-h1, text-body…): los componentes solo añaden font-*, leading-* o tracking-* cuando necesitan otra cosa",
        **{role: {"$value": {"fontFamily": "{text.family.base}", "fontSize": "{text.size.%s}" % role,
                             "fontWeight": "{text.weight.%s}" % w, "lineHeight": "{text.leading.%s}" % lh,
                             "letterSpacing": "{text.tracking.%s}" % ls},
                  "$type": "typography", "$description": d}
           for role, w, lh, ls, d in TEXT_STYLES}}


def _to_primitives(primitives, semantic, light, dark):
    """v0.6: ningún semántico lleva un valor escrito a mano; todos apuntan a un primitivo."""
    import re
    def walk(node, fn):
        for k, v in list(node.items()):
            if k.startswith("$") or not isinstance(v, dict): continue
            if "$value" in v: fn(v)
            else: walk(v, fn)
    def dim(tok):
        val = tok["$value"]
        if not isinstance(val, str) or val.startswith("{"): return
        m = re.fullmatch(r"(\d+)px", val)
        if m:
            primitives["dimension"].setdefault(m.group(1), t(val))
            tok["$value"] = "{dimension.%s}" % m.group(1)
        elif val == "80vh": tok["$value"] = "{viewport.80}"
    for grp in ("size", "layout"): walk(semantic[grp], dim)
    walk(semantic["control"]["height"], dim)
    se = semantic["motion"]["scale"]["enter"]
    if se["$value"] == 0.95: se["$value"] = "{scale.95}"
    for colors in (light, dark):
        ov = colors["color"]["surface"]["overlay"]
        if ov["$value"] == "#09090b99": ov["$value"] = "{color.scrim}"
    # dimension en orden numérico
    d = primitives["dimension"]
    primitives["dimension"] = {**{k: v for k, v in d.items() if k.startswith("$")},
                               **dict(sorted(((k, v) for k, v in d.items() if not k.startswith("$")), key=lambda kv: int(kv[0])))}


# ---------- v0.7: los colores dicen dónde se aplican ----------
# color . dónde (bg / text / border) . función (action / feedback) . variante . estado
# Antes: color.action.primary.default / .on, color.feedback.danger.solid / .on-solid / .text / .border
FEEDBACK = ("success", "warning", "danger", "info")


def color_roles(light, dark):
    """Pasa action.* y feedback.* a bg.* / text.* / border.* (una sola vez; si ya está hecho, no toca nada)."""
    for colors in (light, dark):
        c = colors["color"]
        if "action" not in c and "feedback" not in c: continue
        act, fb = c.pop("action", {}), c.pop("feedback", {})
        bg, text, border = c.setdefault("bg", {}), c.setdefault("text", {}), c.setdefault("border", {})
        def take(node, key, desc=None):
            tok = node.get(key)
            if tok is None: return None
            tok = dict(tok)
            if desc: tok["$description"] = desc
            return tok
        b_act, t_on, b_fb, t_onfb, t_fb, br_fb = {}, {}, {}, {}, {}, {}
        LABEL = {"primary": "principal", "secondary": "secundaria", "ghost": "sin fondo", "disabled": "desactivada"}
        for v in ("primary", "secondary", "ghost", "disabled"):
            node = act.get(v)
            if not node: continue
            if v == "disabled":
                if "default" in node: b_act["disabled"] = take(node, "default", "Fondo de una acción desactivada")
            else:
                grp = {}
                for st, d in (("default", "Fondo de la acción %s" % LABEL[v]), ("hover", "Al pasar el ratón"),
                              ("active", "Al pulsar"), ("subtle", "Fondo suave (tags, selección)")):
                    if st in node: grp[st] = take(node, st, d)
                if grp: b_act[v] = grp
            if "on" in node: t_on[v] = take(node, "on", "Texto/icono encima de la acción %s" % LABEL[v])
        for f in FEEDBACK:
            node = fb.get(f)
            if not node: continue
            grp = {}
            if "solid" in node: grp["default"] = take(node, "solid", "Fondo lleno (badges, botones)")
            if "hover" in node: grp["hover"] = take(node, "hover", "Fondo lleno al pasar el ratón")
            if "subtle" in node: grp["subtle"] = take(node, "subtle", "Fondo suave de alertas")
            b_fb[f] = grp
            if "on-solid" in node: t_onfb[f] = take(node, "on-solid", "Texto/icono encima del fondo lleno")
            if "text" in node: t_fb[f] = take(node, "text", "Texto de un aviso sobre fondo normal o suave")
            br = {}
            if "solid" in node: br["default"] = take(node, "solid", "Borde fuerte (campo con error, selección)")
            if "border" in node: br["subtle"] = take(node, "border", "Borde suave de un aviso")
            if br: br_fb[f] = br
        # nuevos: texto y borde en color de la acción principal
        prim = b_act.get("primary", {})
        if "link" in text and prim:
            t_act = {"primary": {"$value": text["link"]["$value"], "$description": "Texto o icono en el color principal (legible sobre el fondo)"}}
        else:
            t_act = {}
        br_act = {"primary": {"$value": prim["default"]["$value"], "$description": "Borde en el color principal (casillas, selección)"}} if "default" in prim else {}
        bg.update({"action": b_act, "feedback": b_fb})
        text.update({k: v for k, v in (("action", t_act), ("on-action", t_on), ("feedback", t_fb), ("on-feedback", t_onfb)) if v})
        border.update({k: v for k, v in (("action", br_act), ("feedback", br_fb)) if v})
        # orden: bg, surface, text, border, chart…
        order = ["bg", "surface", "text", "border"]
        rest = {k: v for k, v in c.items() if k not in order}
        colors["color"] = {**{k: v for k, v in rest.items() if k.startswith("$")}, **{k: c[k] for k in order if k in c},
                           **{k: v for k, v in rest.items() if not k.startswith("$")}}
