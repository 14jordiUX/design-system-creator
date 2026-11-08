"""Genera todas las salidas de un sistema de diseño a partir de sus tokens.

Uso:  python scripts/generate.py <carpeta-del-sistema>      (por ejemplo: systems/sereno o base)
      python scripts/generate.py --all                       (base + todas las carpetas de systems/)

Fuente de verdad (lo que se edita):   system.json + tokens/*.tokens.json
Salidas (se regeneran, no editar):    css/tokens.css, css/globals.css, figma/tokens-studio.json,
                                      preview.html, kit/  (kit de proyecto con SKILL.md)
"""
import json, os, re, shutil, sys
from preview_template import render as render_preview
import tailwind_theme

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UI_DIR = os.path.join(ROOT, "web", "src", "components", "ui")
UTILS = os.path.join(ROOT, "web", "src", "lib", "utils.ts")
DEPS = ["radix-ui", "class-variance-authority", "clsx", "tailwind-merge", "lucide-react", "sonner",
        # solo para algunos componentes: command/combobox, calendar/date-picker, carousel, chart, drawer, input-otp, form, resizable, message-scroller
        "cmdk", "react-day-picker", "embla-carousel-react", "recharts", "vaul", "input-otp",
        "react-hook-form", "@hookform/resolvers", "zod",
        # resizable y message-scroller
        "react-resizable-panels", "@shadcn/react"]


def custom_components(sysdir):
    """Componentes propios (no de shadcn) de un sistema: los de base/components (para todos) y los de <sistema>/components.
    Cada uno es una carpeta <slug>/ con <slug>.tsx (el componente) y demo.tsx (sus ejemplos para la web).
    Devuelve {slug: carpeta}; si un sistema tiene uno con el mismo nombre que base, manda el del sistema."""
    out = {}
    for d in [os.path.join(ROOT, "base", "components"), os.path.join(os.path.abspath(sysdir), "components")]:
        if not os.path.isdir(d): continue
        for slug in sorted(os.listdir(d)):
            if os.path.isfile(os.path.join(d, slug, slug + ".tsx")): out[slug] = os.path.join(d, slug)
    return out


def kit_imports(src, folder):
    """Rutas relativas para el kit (components/ui o components/custom), para que funcione sin configurar alias."""
    ui = '"./' if folder == "ui" else '"../ui/'
    custom = '"./' if folder == "custom" else '"../custom/'
    return (src.replace('"@/lib/utils"', '"../../lib/utils"').replace('"@/hooks/', '"../../hooks/')
               .replace('"@/components/ui/', ui).replace('"@/components/custom/', custom))


def sync_web_custom():
    """Copia los componentes propios a web/src/custom/<base|sistema>/<slug>/ para que la web los compile (no se guarda en git)."""
    dst = os.path.join(ROOT, "web", "src", "custom")
    if os.path.isdir(dst): shutil.rmtree(dst)
    sources = [("base", os.path.join(ROOT, "base", "components"))]
    sd = os.path.join(ROOT, "systems")
    sources += [(d, os.path.join(sd, d, "components")) for d in sorted(os.listdir(sd)) if os.path.isdir(os.path.join(sd, d, "components"))]
    for scope, d in sources:
        if os.path.isdir(d): shutil.copytree(d, os.path.join(dst, scope))
    os.makedirs(dst, exist_ok=True)


def load(path):
    with open(path, encoding="utf-8") as f: return json.load(f)

def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f: json.dump(obj, f, indent=2, ensure_ascii=False); f.write("\n")

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f: f.write(text)


# ---------- lectura de tokens ----------
def flatten(obj, prefix=(), inherited=None, out=None):
    out = {} if out is None else out
    typ = obj.get("$type", inherited)
    for k, v in obj.items():
        if k.startswith("$"): continue
        if isinstance(v, dict) and "$value" in v:
            out[".".join(prefix + (k,))] = (v["$value"], v.get("$type", typ), v.get("$description"))
        elif isinstance(v, dict):
            flatten(v, prefix + (k,), typ, out)
    return out

def resolve(val, table, depth=0):
    if depth > 20: return val
    if isinstance(val, str):
        m = re.fullmatch(r"\{(.+)\}", val)
        if m and m.group(1) in table: return resolve(table[m.group(1)][0], table, depth + 1)
        return val
    if isinstance(val, dict): return {k: resolve(v, table, depth + 1) for k, v in val.items()}
    if isinstance(val, list): return [resolve(v, table, depth + 1) for v in val]
    return val

def css_name(path): return "--" + path.replace(".", "-")

def css_value(val, typ):
    if isinstance(val, str) and re.fullmatch(r"\{(.+)\}", val):
        return f"var({css_name(val[1:-1])})"
    if typ == "fontFamily" and isinstance(val, list):
        return ", ".join(f'"{f}"' if " " in f else f for f in val)
    if typ == "cubicBezier": return f"cubic-bezier({', '.join(map(str, val))})"
    if typ == "shadow":
        items = val if isinstance(val, list) else [val]
        return ", ".join(f"{s['offsetX']} {s['offsetY']} {s['blur']} {s['spread']} {s['color']}" for s in items)
    return str(val)

BASE_LAYER = """@layer base {
  * { border-color: var(--border); outline-color: var(--ring); }
  body { background-color: var(--background); color: var(--foreground); font-family: var(--font-family-sans);
         font-size: var(--font-size-md); line-height: var(--font-line-height-normal);
         -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
}"""

SHADCN = {
    "background": "color.bg.default", "foreground": "color.text.default",
    "card": "color.surface.card", "card-foreground": "color.text.default",
    "popover": "color.surface.popover", "popover-foreground": "color.text.default",
    "primary": "color.action.primary.default", "primary-foreground": "color.action.primary.on",
    "secondary": "color.action.secondary.default", "secondary-foreground": "color.action.secondary.on",
    "muted": "color.bg.muted", "muted-foreground": "color.text.muted",
    "accent": "color.action.ghost.hover", "accent-foreground": "color.action.ghost.on",
    "destructive": "color.feedback.danger.solid", "destructive-foreground": "color.feedback.danger.on-solid",
    "border": "color.border.default", "input": "color.border.input", "ring": "color.border.focus",
    "radius": "radius.control",
}


def generate(sysdir):
    sysdir = os.path.abspath(sysdir)
    meta = load(os.path.join(sysdir, "system.json"))
    tk = lambda n: load(os.path.join(sysdir, "tokens", f"{n}.tokens.json"))
    primitives, semantic, light, dark = tk("primitives"), tk("semantic"), tk("color.light"), tk("color.dark")
    prim, sem, lf, df = flatten(primitives), flatten(semantic), flatten(light), flatten(dark)
    table_light = {**prim, **sem, **lf}
    table_dark = {**prim, **sem, **df}

    # ---- css/tokens.css ----
    def block(flat):
        return "\n".join(f"  {css_name(p)}: {css_value(v, t)};" for p, (v, t, _) in flat.items() if t != "typography")
    typo_css = []
    props = {"fontFamily": "font-family", "fontSize": "font-size", "fontWeight": "font-weight",
             "lineHeight": "line-height", "letterSpacing": "letter-spacing"}
    for p, (v, t, _) in sem.items():
        if t != "typography": continue
        body = "".join(f"  {props[k]}: {css_value(r, None)};\n" for k, r in v.items())
        typo_css.append(f".text-{p.replace('typography.', '').replace('.', '-')} {{\n{body}}}")
    shadcn = "\n".join(f"  --{k}: var({css_name(v)});" for k, v in SHADCN.items())
    tokens_css = f"""/* {meta['name']}: generado desde tokens/*.tokens.json con scripts/generate.py. No editar a mano. */

:root {{
  /* Primitivos */
{block(prim)}

  /* Semánticos */
{block(sem)}

  /* Color: modo claro */
{block(lf)}

  /* Alias shadcn/ui */
{shadcn}
}}

.dark {{
{block(df)}
}}

/* Estilos tipográficos */
{chr(10).join(typo_css)}
"""
    write(os.path.join(sysdir, "css", "tokens.css"), tokens_css)

    # ---- css/globals.css (tema de Tailwind v4 + shadcn/ui, solo con tokens) ----
    globals_css = f"""/* {meta['name']}: tema para un proyecto con Tailwind CSS v4 + shadcn/ui.
   Generado con scripts/generate.py. Importa este archivo una vez en la raíz de la app.
   Solo existen clases que apuntan a tokens semánticos: p-3, h-9, bg-brand-600 o text-white no generan nada. */
@layer theme, base, components, utilities;
@import "tailwindcss/preflight" layer(base);
@import "tailwindcss/utilities" layer(utilities);
@import "./tokens.css";

@custom-variant dark (&:is(.dark *));

{tailwind_theme.build(primitives, semantic, light)}

{BASE_LAYER}
"""
    write(os.path.join(sysdir, "css", "globals.css"), globals_css)

    # ---- figma/tokens-studio.json ----
    dump(os.path.join(sysdir, "figma", "tokens-studio.json"), {
        "primitives": primitives, "semantic": semantic, "color/light": light, "color/dark": dark,
        "$themes": [
            {"id": "light", "name": "Light", "group": "Mode",
             "selectedTokenSets": {"primitives": "source", "semantic": "enabled", "color/light": "enabled"}},
            {"id": "dark", "name": "Dark", "group": "Mode",
             "selectedTokenSets": {"primitives": "source", "semantic": "enabled", "color/dark": "enabled"}}],
        "$metadata": {"tokenSetOrder": ["primitives", "semantic", "color/light", "color/dark"]}})

    # ---- preview.html ----
    scales = [k for k, v in primitives["color"].items() if not k.startswith("$") and "$value" not in v]
    data = {
        "scales": {s: [[st, primitives["color"][s][st]["$value"]] for st in primitives["color"][s] if not st.startswith("$")] for s in scales},
        "light": {p: resolve(v, table_light) for p, (v, _, _) in lf.items()},
        "dark": {p: resolve(v, table_dark) for p, (v, _, _) in df.items()},
        "lightRefs": {p: v for p, (v, _, _) in lf.items()},
        "darkRefs": {p: v for p, (v, _, _) in df.items()},
        "typography": [p for p, (_, t, _) in sem.items() if t == "typography"],
        "space": [[p, v] for p, (v, _, _) in prim.items() if p.startswith("space.")],
        "radius": [[p, resolve(v, table_light)] for p, (v, _, _) in sem.items() if p.startswith("radius.")],
        "elevation": [p for p in sem if p.startswith("elevation.")],
    }
    write(os.path.join(sysdir, "preview.html"), render_preview(data, tokens_css, meta["name"]))

    # ---- kit/ ----
    build_kit(sysdir, meta, primitives, sem, lf, df, table_light, table_dark, tokens_css, globals_css)
    print(f"ok  {meta['name']}  ->  css/, figma/, preview.html, kit/")


def build_kit(sysdir, meta, primitives, sem, lf, df, table_light, table_dark, tokens_css, globals_css):
    kit = os.path.join(sysdir, "kit")
    if os.path.isdir(kit): shutil.rmtree(kit)
    shutil.copytree(os.path.join(sysdir, "tokens"), os.path.join(kit, "tokens"))
    write(os.path.join(kit, "styles", "tokens.css"), tokens_css)
    write(os.path.join(kit, "styles", "globals.css"), globals_css)
    comps = sorted(f[:-4] for f in os.listdir(UI_DIR) if f.endswith(".tsx"))
    os.makedirs(os.path.join(kit, "components", "ui"), exist_ok=True)
    for c in comps:
        # Rutas relativas, para que el kit funcione sin configurar alias en el proyecto
        src = open(os.path.join(UI_DIR, c + ".tsx"), encoding="utf-8").read()
        write(os.path.join(kit, "components", "ui", c + ".tsx"), kit_imports(src, "ui"))
    custom = custom_components(sysdir)
    for slug, d in custom.items():
        src = open(os.path.join(d, slug + ".tsx"), encoding="utf-8").read()
        write(os.path.join(kit, "components", "custom", slug + ".tsx"), kit_imports(src, "custom"))
    meta = {**meta, "_custom": sorted(custom)}
    os.makedirs(os.path.join(kit, "lib"), exist_ok=True)
    shutil.copy(UTILS, os.path.join(kit, "lib", "utils.ts"))
    shutil.copytree(os.path.join(os.path.dirname(UI_DIR), "..", "hooks"), os.path.join(kit, "hooks"))
    dump(os.path.join(kit, "components.json"), {
        "$schema": "https://ui.shadcn.com/schema.json", "style": "new-york", "rsc": False, "tsx": True,
        "tailwind": {"config": "", "css": "src/design-system/styles/globals.css", "baseColor": "neutral", "cssVariables": True},
        "aliases": {"components": "@/design-system/components", "ui": "@/design-system/components/ui",
                    "utils": "@/design-system/lib/utils", "lib": "@/design-system/lib", "hooks": "@/hooks"},
        "iconLibrary": "lucide"})
    write(os.path.join(kit, "SKILL.md"), skill_md(meta, primitives, sem, lf, df, table_light, table_dark, comps))
    write(os.path.join(kit, "README.md"), readme_md(meta, comps))


def skill_md(meta, primitives, sem, lf, df, tl, td, comps):
    slug = re.sub(r"[^a-z0-9-]", "-", meta["id"].lower())
    fam = primitives["font"]["family"]
    principles = "\n".join(f"- **{p['title']}.** {p['text']}" for p in meta.get("principles", [])) or "- (Sin principios escritos todavía.)"
    notes = meta.get("notes", {})
    notes_md = "\n".join(f"- **{k.capitalize()}:** {v}" for k, v in notes.items()) or "- (Sin notas todavía.)"
    color_rows = "\n".join(
        f"| `{p}` | `{css_name(p)}` | {resolve(v, tl)} | {resolve(df[p][0], td) if p in df else ''} | {d or ''} |"
        for p, (v, _, d) in lf.items())
    typo_rows = "\n".join(
        f"| `.text-{p.replace('typography.', '').replace('.', '-')}` | {resolve(v, tl)['fontSize']} / {resolve(v, tl)['fontWeight']} |"
        for p, (v, t, _) in sem.items() if t == "typography")
    other_rows = "\n".join(f"| `{css_name(p)}` | {css_value(resolve(v, tl), t)} | {d or ''} |"
                           for p, (v, t, d) in sem.items() if t != "typography")
    return f"""---
name: {slug}-design-system
description: Usa el sistema de diseño «{meta['name']}» al crear o modificar interfaces de este proyecto (pantallas, componentes, estilos). {meta['description'][:180]}
---

# Sistema de diseño «{meta['name']}»

{meta['description']}

Tipo de producto: {meta.get('productType', '—')}.

## Principios

{principles}

## Notas de uso

{notes_md}

## Reglas

1. **Usa siempre los componentes de `components/ui/`** (shadcn/ui ya tematizados). No crees botones, campos o tarjetas desde cero si existe el componente. Componentes disponibles: {", ".join(comps)}.{(" Además, componentes propios de este sistema en `components/custom/`: " + ", ".join(meta.get("_custom", [])) + ". Úsalos antes que montar algo parecido.") if meta.get("_custom") else ""}
2. **Nunca escribas valores a mano**: nada de `#hex`, `px`, `rem`, `ms` ni clases con corchetes como `p-[13px]`. El tema de Tailwind de este kit solo contiene clases que apuntan a tokens; si una clase no existe (por ejemplo `h-9`, `bg-red-500` sin token o `text-white`), no genera CSS. Si necesitas un valor que no está, pide añadir un token.
3. **Solo tokens semánticos.** Los primitivos (`space.4`, `radius.md`, `font.size.sm`, `color.brand.600`…) son la capa de gestión: no se usan en el código y no tienen clase. Usa siempre el semántico (`space.inset.lg`, `radius.control`, `text.size.ui`, `color.action.primary.default`…).
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
2. Instala dependencias: `npm install {' '.join(DEPS)}` (y `tailwindcss` + `@tailwindcss/vite` si el proyecto no tiene Tailwind).
3. Importa `src/design-system/styles/globals.css` una sola vez en la raíz de la app (por ejemplo en `main.tsx`).
4. Importa los componentes desde `src/design-system/components/ui/` (por ejemplo `import {{ Button }} from "./design-system/components/ui/button"`). Usan rutas relativas, no hace falta configurar alias.
5. Carga las fuentes: {fam['sans']['$value'][0]} (texto) y {fam['mono']['$value'][0]} (código), por ejemplo desde Google Fonts.
6. Para añadir más componentes de shadcn/ui: `npx shadcn@latest add <componente>` con el `components.json` del kit; heredan el tema solos.

## Tokens de color (claro / oscuro)

| Token | Variable CSS | Claro | Oscuro | Uso |
|---|---|---|---|---|
{color_rows}

## Tipografía

Familias: sans = {", ".join(fam['sans']['$value'])}; mono = {", ".join(fam['mono']['$value'])}.

| Clase | Tamaño / peso |
|---|---|
{typo_rows}

## Espaciado, radios, elevación y movimiento

| Variable | Valor | Uso |
|---|---|---|
{other_rows}

Archivos de referencia: `tokens/*.tokens.json` (fuente, formato W3C DTCG), `styles/tokens.css` (variables), `styles/globals.css` (tema de Tailwind).
"""


def readme_md(meta, comps):
    return f"""# Kit de proyecto: {meta['name']}

Todo lo necesario para empezar un proyecto nuevo con el sistema «{meta['name']}» ya aplicado.

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
| `components/ui/` | {len(comps)} componentes de shadcn/ui que toman el estilo del sistema. |{chr(10) + "| `components/custom/` | Componentes propios del sistema: " + ", ".join(meta.get("_custom", [])) + ". |" if meta.get("_custom") else ""}
| `lib/utils.ts` | Función auxiliar que usan los componentes. |
| `components.json` | Configuración para añadir más componentes con `npx shadcn add`. |

Generado con `scripts/generate.py`. No edites estos archivos a mano: cambia los tokens del sistema y vuelve a generar.
"""


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    if sys.argv[1] == "--all":
        targets = [os.path.join(ROOT, "base")] + sorted(
            os.path.join(ROOT, "systems", d) for d in os.listdir(os.path.join(ROOT, "systems"))
            if os.path.isfile(os.path.join(ROOT, "systems", d, "system.json")))
    else:
        targets = sys.argv[1:]
    for t in targets: generate(t)
    sync_web_custom()
    # La web usa el mismo tema (las clases son iguales para todos los sistemas; los valores cambian en vivo)
    base = os.path.join(ROOT, "base", "tokens")
    L = lambda n: load(os.path.join(base, f"{n}.tokens.json"))
    write(os.path.join(ROOT, "web", "src", "theme.css"),
          "/* Generado con scripts/generate.py desde base/tokens. No editar a mano. */\n"
          + tailwind_theme.build(L("primitives"), L("semantic"), L("color.light")) + "\n\n" + BASE_LAYER + "\n")
    dump(os.path.join(ROOT, "web", "src", "class-tokens.json"),
         tailwind_theme.class_map(L("primitives"), L("semantic"), L("color.light")))
