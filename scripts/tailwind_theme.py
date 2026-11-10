"""Tema de Tailwind CSS v4 construido SOLO desde los tokens.

No se importa el tema por defecto de Tailwind: si una clase no apunta a un token
(por ejemplo `p-3`, `h-9`, `bg-red-500`, `text-white`) simplemente no existe.
Vocabulario de clases: ver la cabecera del CSS generado."""


def _cn(path):
    return "--" + path.replace(".", "-")


def _keys(group):
    return [k for k in group if not k.startswith("$")]


def _resolve(v, primitives):
    while isinstance(v, str) and v.startswith("{"):
        node = primitives
        for part in v[1:-1].split("."): node = node[part]
        v = node["$value"]
    return v


TEXT_TOKENS = {"primary": "--color-text-action-primary", "sidebar-primary": "--color-text-action-primary",
               "destructive": "--color-text-feedback-danger",
               **{f: f"--color-text-feedback-{f}" for f in ["success", "warning", "danger", "info"]}}
BORDER_TOKENS = {"primary": "--color-border-action-primary", "sidebar-primary": "--color-border-action-primary",
                 "destructive": "--color-border-feedback-danger-default",
                 **{f: f"--color-border-feedback-{f}-default" for f in ["success", "warning", "danger", "info"]}}
# espacio de nombres de Tailwind v4 -> utilidades que lo leen
PROP_NS = {"text-color": TEXT_TOKENS, "fill": TEXT_TOKENS, "stroke": TEXT_TOKENS, "text-decoration-color": TEXT_TOKENS,
           "border-color": BORDER_TOKENS, "ring-color": BORDER_TOKENS, "outline-color": BORDER_TOKENS}
NS_UTILS = {"text-color": ["text"], "fill": ["fill"], "stroke": ["stroke"], "text-decoration-color": ["decoration"],
            "border-color": ["border", "border-t", "border-b", "border-l", "border-r"], "ring-color": ["ring"], "outline-color": ["outline"]}


def per_property(colors):
    return {ns: {k: v for k, v in m.items() if k in colors} for ns, m in PROP_NS.items()}


def build(primitives, semantic, light):
    L = []
    add = L.append

    # ---------- colores ----------
    colors = {
        "background": "--background", "foreground": "--foreground",
        "card": "--card", "card-foreground": "--card-foreground",
        "popover": "--popover", "popover-foreground": "--popover-foreground",
        "primary": "--primary", "primary-foreground": "--primary-foreground",
        "primary-hover": "--color-bg-action-primary-hover", "primary-active": "--color-bg-action-primary-active",
        "primary-subtle": "--color-bg-action-primary-subtle",
        "secondary": "--secondary", "secondary-foreground": "--secondary-foreground",
        "secondary-hover": "--color-bg-action-secondary-hover", "secondary-active": "--color-bg-action-secondary-active",
        "muted": "--muted", "muted-foreground": "--muted-foreground",
        "subtle": "--color-bg-subtle", "subtle-foreground": "--color-text-subtle",
        "accent": "--accent", "accent-foreground": "--accent-foreground",
        "destructive": "--destructive", "destructive-foreground": "--destructive-foreground",
        "destructive-hover": "--color-bg-feedback-danger-hover",
        "border": "--border", "border-strong": "--color-border-strong", "input": "--input", "ring": "--ring",
        "overlay": "--color-surface-overlay",
        "inverse": "--color-bg-inverse", "inverse-foreground": "--color-text-inverse",
        "link": "--color-text-link",
        "disabled": "--color-bg-action-disabled", "disabled-foreground": "--color-text-on-action-disabled",
    }
    colors.update({
        "sidebar": "--color-surface-sidebar", "sidebar-foreground": "--foreground",
        "sidebar-primary": "--primary", "sidebar-primary-foreground": "--primary-foreground",
        "sidebar-accent": "--accent", "sidebar-accent-foreground": "--accent-foreground",
        "sidebar-border": "--border", "sidebar-ring": "--ring",
    })
    for k in _keys(light["color"].get("chart", {})):
        colors[f"chart-{k}"] = f"--color-chart-{k}"
    for f in ["success", "warning", "danger", "info"]:
        colors[f] = f"--color-bg-feedback-{f}-default"
        colors[f"{f}-foreground"] = f"--color-text-on-feedback-{f}"
        colors[f"{f}-subtle"] = f"--color-bg-feedback-{f}-subtle"
        colors[f"{f}-border"] = f"--color-border-feedback-{f}-subtle"
        colors[f"{f}-text"] = f"--color-text-feedback-{f}"
    # El mismo nombre de clase toma el token de su sitio: bg-primary = fondo de la acción,
    # text-primary = texto en color principal, border-primary = borde en color principal.
    by_prop = per_property(colors)
    # (las escalas primitivas de color no se exponen como clases: solo los colores semánticos)

    # ---------- espaciado y tamaños ----------
    spacing = {"0": None}   # 0 = nada (no es una medida de diseño)
    sp = semantic["space"]
    for grp in ["inset", "gap"]:
        for k in _keys(sp[grp]):
            spacing[f"{grp}-{k}"] = f"--space-{grp}-{k}"
    spacing["section"] = "--space-section"
    for k in _keys(semantic["control"]["height"]):
        spacing[f"control-{k}"] = f"--control-height-{k}"
    spacing["thin"] = "--control-border-width"
    def walk(group, prefix, var_prefix):
        for k in _keys(group):
            v = group[k]
            if "$value" in v: spacing[f"{prefix}{k}"] = f"{var_prefix}{k}"
            else: walk(v, f"{prefix}{k}-", f"{var_prefix}{k}-")
    walk(semantic["size"], "", "--size-")
    walk(semantic["layout"], "", "--layout-")

    font = primitives["font"]
    add("@theme inline reference {")
    add("  /* Colores */")
    L += [f"  --color-{k}: var({v});" for k, v in colors.items()]
    add("\n  /* Colores según dónde se aplican (texto, borde, icono): ganan a --color-* */")
    L += [f"  --{ns}-{k}: var({v});" for ns, m in by_prop.items() for k, v in m.items()]
    add("\n  /* Espaciado y tamaños (p-, m-, gap-, w-, h-, size-, max-w-, top-…) */")
    L += [f"  --spacing-{k}: {'0px' if v is None else f'var({v})'};" for k, v in spacing.items()]
    L += [f"  --container-{k}: var({v});" for k, v in spacing.items() if v and k != "compact"]
    add("\n  /* Tipografía (solo semánticos: text.*) */")
    tx = semantic["text"]
    L += [f"  --font-{k}: var(--text-family-{k});" for k in _keys(tx["family"])]
    L += [f"  --text-{k}: var(--text-size-{k});" for k in _keys(tx["size"])]
    L += [f"  --font-weight-{k}: var(--text-weight-{k});" for k in _keys(tx["weight"])]
    L += [f"  --leading-{k}: var(--text-leading-{k});" for k in _keys(tx["leading"])]
    L += [f"  --tracking-{k}: var(--text-tracking-{k});" for k in _keys(tx["tracking"])]
    add("\n  /* Radios (semánticos) */")
    L += [f"  --radius-{k}: var(--radius-{k});" for k in _keys(semantic["radius"])]
    add("\n  /* Sombras (elevación semántica) */")
    L += [f"  --shadow-{k}: var(--elevation-{k});" for k in _keys(semantic["elevation"])]
    add("\n  /* Movimiento */")
    L += [f"  --ease-{k}: var(--motion-easing-{k});" for k in _keys(semantic["motion"]["easing"])]
    add("  --default-transition-duration: var(--motion-duration-micro);")
    add("  --default-transition-timing-function: var(--motion-easing-default);")
    add("  --default-font-family: var(--text-family-base);")
    add("  --default-mono-font-family: var(--text-family-code);")
    add("}")
    add("")
    add("/* Puntos de ruptura (las media queries no aceptan variables: se escribe el valor del token) */")
    add("@theme reference {")
    L += [f"  --breakpoint-{k}: {primitives['breakpoint'][k]['$value']};" for k in _keys(primitives["breakpoint"])]
    if "compact" in semantic["layout"]:   # consulta de contenedor @max-compact (componentes que se adaptan a su hueco)
        add(f"  --container-compact: {_resolve(semantic['layout']['compact']['$value'], primitives)};")
    add("}")
    add("")

    # ---------- utilidades propias ----------
    add("/* Bordes: border-thin y sus lados (grosor = control.border-width) */")
    add("@utility border-thin { border-style: solid; border-width: var(--control-border-width); }")
    for side, prop in [("t", "top"), ("b", "bottom"), ("l", "left"), ("r", "right"), ("x", "inline"), ("y", "block"), ("s", "inline-start"), ("e", "inline-end")]:
        add(f"@utility border-{side}-thin {{ border-{prop}-style: solid; border-{prop}-width: var(--control-border-width); }}")
    add("@utility border-thick { border-style: solid; border-width: var(--control-focus-ring-width); }")
    add("@utility border-s-thick { border-inline-start-style: solid; border-inline-start-width: var(--control-focus-ring-width); }")
    add("")
    add("/* Foco accesible: anillo con los tokens control.focus-ring-* y color.border.focus */")
    add("@utility focus-ring { outline: var(--control-focus-ring-width) solid var(--ring); outline-offset: var(--control-focus-ring-offset); }")
    add("@utility focus-ring-inset { outline: var(--control-focus-ring-width) solid var(--ring); outline-offset: calc(var(--control-focus-ring-width) * -1); }")
    add("")
    add("/* Opacidades con nombre */")
    L += [f"@utility opacity-{k} {{ opacity: var(--state-opacity-{k}); }}" for k in _keys(semantic["state"]["opacity"])]
    add("")
    add("/* Capas (z-index con nombre): z-raised, z-sticky, z-floating, z-overlay */")
    L += [f"@utility z-{k} {{ z-index: var(--layer-{k}); }}" for k in _keys(semantic["layer"])]
    add("")
    add("/* Giros con nombre: rotate-tilt (45º), rotate-turn (90º), rotate-flip (180º) */")
    L += [f"@utility rotate-{k} {{ rotate: var(--motion-rotate-{k}); }}" for k in _keys(semantic["motion"]["rotate"])]
    add("")
    add("/* Duraciones con nombre */")
    L += [f"@utility duration-{k} {{ --tw-duration: var(--motion-duration-{k}); transition-duration: var(--motion-duration-{k}); }}"
          for k in _keys(semantic["motion"]["duration"])]
    add("")
    add("/* Estilos tipográficos completos: typo-heading-h1, typo-body-md, typo-label-sm… */")
    for p, v in _typography(semantic):
        name = p.replace("typography.", "").replace(".", "-")
        props = "; ".join(f"{css}: var(--{ref})" for css, ref in [
            ("font-family", v["fontFamily"]), ("font-size", v["fontSize"]), ("font-weight", v["fontWeight"]),
            ("line-height", v["lineHeight"]), ("letter-spacing", v["letterSpacing"])])
        add(f"@utility typo-{name} {{ {props}; }}")
    add("")
    add(ANIMATIONS)
    return "\n".join(L)


def _typography(semantic):
    out = []
    def walk(o, prefix):
        for k, v in o.items():
            if k.startswith("$"): continue
            if isinstance(v, dict) and "$value" in v:
                if v.get("$type") == "typography" or isinstance(v["$value"], dict):
                    val = {kk: vv[1:-1].replace(".", "-") for kk, vv in v["$value"].items()}
                    out.append((prefix + k, val))
            elif isinstance(v, dict):
                walk(v, prefix + k + ".")
    walk(semantic["typography"], "typography.")
    return out


ANIMATIONS = """/* Animaciones: duración, curva, escala y distancia salen de los tokens motion.* */
@keyframes ds-enter { from { opacity: 0; transform: scale(var(--motion-scale-enter)); } }
@keyframes ds-exit { to { opacity: 0; transform: scale(var(--motion-scale-enter)); } }
@keyframes ds-fade-in { from { opacity: 0; } }
@keyframes ds-fade-out { to { opacity: 0; } }
@keyframes ds-slide-in-right { from { transform: translateX(100%); } }
@keyframes ds-slide-out-right { to { transform: translateX(100%); } }
@keyframes ds-slide-in-left { from { transform: translateX(-100%); } }
@keyframes ds-slide-out-left { to { transform: translateX(-100%); } }
@keyframes ds-slide-in-top { from { transform: translateY(-100%); } }
@keyframes ds-slide-out-top { to { transform: translateY(-100%); } }
@keyframes ds-slide-in-bottom { from { transform: translateY(100%); } }
@keyframes ds-slide-out-bottom { to { transform: translateY(100%); } }
@keyframes ds-collapse-down { from { height: 0; } to { height: var(--radix-accordion-content-height, var(--radix-collapsible-content-height)); } }
@keyframes ds-collapse-up { from { height: var(--radix-accordion-content-height, var(--radix-collapsible-content-height)); } to { height: 0; } }
@keyframes ds-caret-blink { 0%, 70%, 100% { opacity: 1; } 20%, 50% { opacity: 0; } }
@keyframes ds-pulse { 50% { opacity: var(--state-opacity-disabled); } }
@keyframes ds-spin { to { transform: rotate(360deg); } }
@utility animate-enter { animation: ds-enter var(--motion-duration-default) var(--motion-easing-default); }
@utility animate-exit { animation: ds-exit var(--motion-duration-micro) var(--motion-easing-default) forwards; }
@utility animate-fade-in { animation: ds-fade-in var(--motion-duration-default) var(--motion-easing-default); }
@utility animate-fade-out { animation: ds-fade-out var(--motion-duration-micro) var(--motion-easing-default) forwards; }
@utility animate-slide-in-right { animation: ds-slide-in-right var(--motion-duration-emphasis) var(--motion-easing-default); }
@utility animate-slide-out-right { animation: ds-slide-out-right var(--motion-duration-default) var(--motion-easing-default) forwards; }
@utility animate-slide-in-left { animation: ds-slide-in-left var(--motion-duration-emphasis) var(--motion-easing-default); }
@utility animate-slide-out-left { animation: ds-slide-out-left var(--motion-duration-default) var(--motion-easing-default) forwards; }
@utility animate-slide-in-top { animation: ds-slide-in-top var(--motion-duration-emphasis) var(--motion-easing-default); }
@utility animate-slide-out-top { animation: ds-slide-out-top var(--motion-duration-default) var(--motion-easing-default) forwards; }
@utility animate-slide-in-bottom { animation: ds-slide-in-bottom var(--motion-duration-emphasis) var(--motion-easing-default); }
@utility animate-slide-out-bottom { animation: ds-slide-out-bottom var(--motion-duration-default) var(--motion-easing-default) forwards; }
@utility animate-collapse-down { animation: ds-collapse-down var(--motion-duration-default) var(--motion-easing-default); }
@utility animate-collapse-up { animation: ds-collapse-up var(--motion-duration-default) var(--motion-easing-default); }
@utility animate-caret-blink { animation: ds-caret-blink var(--motion-duration-loop) var(--motion-easing-default) infinite; }
@utility aspect-video { aspect-ratio: 16 / 9; }
@utility animate-pulse { animation: ds-pulse var(--motion-duration-loop) var(--motion-easing-default) infinite; }
@keyframes ds-shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
@utility shimmer { background-image: linear-gradient(var(--motion-rotate-turn), currentColor 40%, var(--foreground) 50%, currentColor 60%); background-size: 300% 100%; background-clip: text; -webkit-background-clip: text; color: transparent; animation: ds-shimmer var(--motion-duration-loop) linear infinite; }
@utility shimmer-none { background-image: none; color: inherit; animation: none; }
@utility scroll-fade-x { mask-image: linear-gradient(var(--motion-rotate-turn), transparent, var(--foreground) var(--space-inset-lg), var(--foreground) calc(100% - var(--space-inset-lg)), transparent); }
@utility scroll-fade-y { mask-image: linear-gradient(transparent, var(--foreground) var(--space-inset-lg), var(--foreground) calc(100% - var(--space-inset-lg)), transparent); }
@utility animate-spin { animation: ds-spin var(--motion-duration-loop) linear infinite; }"""


# ---------- qué token usa cada clase (para la lista "Tokens que usa" de la web) ----------
SHADCN_PATHS = {
    "--background": "color.bg.default", "--foreground": "color.text.default",
    "--card": "color.surface.card", "--card-foreground": "color.text.default",
    "--popover": "color.surface.popover", "--popover-foreground": "color.text.default",
    "--primary": "color.bg.action.primary.default", "--primary-foreground": "color.text.on-action.primary",
    "--secondary": "color.bg.action.secondary.default", "--secondary-foreground": "color.text.on-action.secondary",
    "--muted": "color.bg.muted", "--muted-foreground": "color.text.muted",
    "--accent": "color.bg.action.ghost.hover", "--accent-foreground": "color.text.on-action.ghost",
    "--destructive": "color.bg.feedback.danger.default", "--destructive-foreground": "color.text.on-feedback.danger",
    "--border": "color.border.default", "--input": "color.border.input", "--ring": "color.border.focus",
}

SPACING_UTILS = ["p", "px", "py", "pt", "pr", "pb", "pl", "ps", "pe", "m", "mx", "my", "mt", "mr", "mb", "ml", "-mx", "-my", "-mt", "-ml",
                 "gap", "gap-x", "gap-y", "space-x", "space-y", "-space-x", "-space-y", "size", "w", "h", "min-w", "min-h", "max-w", "max-h",
                 "top", "left", "right", "bottom", "inset", "inset-x", "inset-y", "-top", "-left", "-right", "-bottom",
                 "translate-x", "translate-y", "-translate-x", "-translate-y", "scroll-my"]
COLOR_UTILS = ["bg", "text", "border", "border-t", "border-b", "border-l", "border-r", "fill", "stroke", "outline", "ring", "decoration"]


def class_map(primitives, semantic, light):
    import re as _re
    # nombre de variable CSS -> ruta del token
    paths = {}
    def walk(o, prefix):
        for k, v in o.items():
            if k.startswith("$"): continue
            if isinstance(v, dict) and "$value" in v: paths["--" + (prefix + k).replace(".", "-")] = prefix + k
            elif isinstance(v, dict): walk(v, prefix + k + ".")
    for o in (primitives, semantic, light): walk(o, "")
    paths.update(SHADCN_PATHS)
    css = build(primitives, semantic, light)
    out = {}
    def put(cls, *ps):
        out[cls] = [p for p in ps if p]
    for name, var in _re.findall(r"--color-([\w-]+): var\((--[\w-]+)\);", css):
        for u in COLOR_UTILS: put(f"{u}-{name}", paths.get(var))
    for ns, m in PROP_NS.items():   # text-primary, border-destructive… leen el token de su sitio
        for name, var in m.items():
            if f"--color-{name}:" in css:
                for u in NS_UTILS[ns]: put(f"{u}-{name}", paths.get(var))
    for name, var in _re.findall(r"--spacing-([\w\\.-]+): var\((--[\w-]+)\);", css):
        name = name.replace("\\", "")
        for u in SPACING_UTILS: put(f"{u}-{name}", paths.get(var))
    for ns, util in [("text", "text"), ("font-weight", "font"), ("leading", "leading"), ("tracking", "tracking"), ("shadow", "shadow")]:
        for name, var in _re.findall(rf"--{ns}-([\w-]+): var\((--[\w-]+)\);", css):
            if ns == "text" and (name.startswith("color-") or name.startswith("decoration-")): continue
            put(f"{util}-{name}", paths.get(var))
    for name, var in _re.findall(r"--ease-([\w-]+): var\((--[\w-]+)\);", css):
        put(f"ease-{name}", paths.get(var))
    for name, var in _re.findall(r"--font-(base|code): var\((--[\w-]+)\);", css):
        put(f"font-{name}", paths.get(var))
    for name, var in _re.findall(r"--radius-([\w-]+): var\((--[\w-]+)\);", css):
        for side in ["", "-t", "-b", "-l", "-r", "-tl", "-tr", "-bl", "-br"]:
            put(f"rounded{side}-{name}", paths.get(var))
    for cls, body in _re.findall(r"@utility ([\w-]+) \{([^}]*)\}", css):
        if cls.startswith("typo-"):   # estilo tipográfico completo = un token semántico typography.*
            put(cls, "typography." + cls[5:].replace("-", ".")); continue
        put(cls, *[paths.get(v) for v in _re.findall(r"var\((--[\w-]+)\)", body)])
    for cls in ["animate-enter", "animate-exit"]:
        out[cls] = out.get(cls, []) + ["motion.scale.enter"]
    for t in ["transition", "transition-colors", "transition-all", "transition-opacity", "transition-transform", "transition-shadow"]:
        put(t, "motion.duration.micro", "motion.easing.default")
    return {k: sorted(set(v)) for k, v in out.items() if v}
