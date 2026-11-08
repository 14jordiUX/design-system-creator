"""Trae un componente nuevo de shadcn/ui y lo adapta a los tokens del sistema.

Uso: python scripts/port_shadcn.py <carpeta-del-repo-shadcn> nombre [nombre…] [--dry-run]

1. Lee apps/v4/registry/bases/radix/ui/<nombre>.tsx (la versión Radix, la que usamos).
2. Sustituye las clases cn-* por las del estilo «Vega» (el clásico de shadcn, styles/style-vega.css).
3. Cambia los IconPlaceholder por iconos de lucide-react y arregla los imports.
4. Traduce las clases de Tailwind a clases de tokens (p-4 → p-inset-lg, text-sm → text-ui, rounded-md → rounded-control…).
5. Escribe web/src/components/ui/<nombre>.tsx y lista lo que no ha sabido traducir (hay que revisarlo a mano).
Después: generate.py --all, npm run build y check_tokens.py.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UI = os.path.join(ROOT, "web", "src", "components", "ui")

SP = {"0": "0", "px": "thin", "0.5": "3xs", "1": "2xs", "1.5": "xs", "2": "sm", "2.5": "sm", "3": "md", "3.5": "md",
      "4": "lg", "5": "lg", "6": "xl", "7": "xl", "8": "2xl", "10": "2xl", "12": "3xl", "16": "4xl"}
PAD = ["p", "px", "py", "pt", "pb", "pl", "pr", "ps", "pe"]
GAP = ["m", "mx", "my", "mt", "mb", "ml", "mr", "ms", "me", "gap", "gap-x", "gap-y", "space-x", "space-y"]
POS = ["top", "bottom", "left", "right", "inset", "inset-x", "inset-y", "start", "end", "translate-x", "translate-y"]
SIZE = {"3": "icon-sm", "3.5": "icon-sm", "4": "icon-md", "4.5": "icon-md", "5": "icon-lg", "6": "avatar-sm",
        "7": "control-sm", "8": "control-sm", "9": "control-md", "10": "control-md", "11": "control-lg", "12": "control-lg",
        "16": "avatar-2xl"}
DIM = ["w", "h", "size", "min-w", "min-h", "max-w", "max-h"]
TEXT = {"xs": "caption", "sm": "ui", "base": "body", "lg": "lead", "xl": "title", "2xl": "h3", "3xl": "h2", "4xl": "h1", "5xl": "display"}
FONT = {"normal": "normal", "medium": "emphasis", "semibold": "strong", "bold": "heavy", "mono": "code", "sans": "base"}
LEADING = {"none": "compact", "tight": "compact", "snug": "compact", "normal": "body", "relaxed": "prose", "loose": "prose"}
TRACKING = {"tight": "heading", "tighter": "heading", "normal": "body", "wide": "caps", "wider": "caps", "widest": "caps"}
ROUND = {"": "control", "xs": "fine", "sm": "inner", "md": "control", "lg": "card", "xl": "overlay", "2xl": "overlay",
         "3xl": "overlay", "4xl": "overlay", "full": "pill", "none": "square"}
SHADOW = {"": "flat", "xs": "flat", "sm": "flat", "md": "raised", "lg": "overlay", "xl": "modal", "2xl": "modal", "none": "none"}
DURATION = {"75": "micro", "100": "micro", "150": "micro", "200": "default", "300": "emphasis", "500": "emphasis", "700": "emphasis", "1000": "emphasis"}
Z = {"10": "raised", "20": "sticky", "30": "sticky", "40": "floating", "50": "overlay"}
ROT = {"45": "tilt", "90": "turn", "180": "flip"}
SUBTLE = {"muted": "subtle", "accent": "subtle", "primary": "primary-subtle", "destructive": "danger-subtle", "secondary": "subtle"}

unmapped = set()


def split_variant(tok):
    depth = 0
    for i in range(len(tok) - 1, -1, -1):
        c = tok[i]
        if c == "]": depth += 1
        elif c == "[": depth -= 1
        elif c == ":" and depth == 0: return tok[:i + 1], tok[i + 1:]
    return "", tok


def map_util(u):
    """Devuelve la clase traducida, "" para quitarla, o None si no es una clase de Tailwind conocida (se deja igual)."""
    neg = u.startswith("-")
    core = u[1:] if neg else u
    sign = "-" if neg else ""
    m = re.fullmatch(r"([a-z-]+?)-(\d+(?:\.\d+)?|px)", core)
    if m:
        pre, n = m.groups()
        if pre in PAD and n in SP: return f"{sign}{pre}-{'inset-' + SP[n] if SP[n] not in ('0', 'thin') else SP[n]}"
        if pre in GAP and n in SP: return f"{sign}{pre}-{'gap-' + SP[n] if SP[n] not in ('0', 'thin') else SP[n]}"
        if pre in POS and n in SP: return f"{sign}{pre}-{'inset-' + SP[n] if SP[n] not in ('0', 'thin') else SP[n]}"
        if pre in DIM and n in SIZE: return f"{pre}-{SIZE[n]}"
        if pre in DIM and n == "0": return core
        if pre == "duration" and n in DURATION: return f"duration-{DURATION[n]}"
        if pre == "z" and n in Z: return f"z-{Z[n]}"
        if pre == "rotate" and n in ROT: return f"{sign}rotate-{ROT[n]}"
        if pre == "opacity": return "opacity-disabled" if n not in ("0", "100") else core
        if pre in ("border", "border-t", "border-b", "border-l", "border-r", "border-x", "border-y", "border-s", "border-e"):
            return {"0": f"{pre}-0", "2": "border-thick"}.get(n, f"{pre}-thin")
        if pre in ("ring", "outline") and n != "0": return "focus-ring"
        if pre in ("delay", "line-clamp", "order", "grid-cols", "col-span", "row-span", "basis", "grow", "shrink", "scale"):
            return u
        unmapped.add(u); return u
    if core in ("border", "border-t", "border-b", "border-l", "border-r", "border-x", "border-y", "border-s", "border-e"):
        return f"{core}-thin"
    m = re.fullmatch(r"text-(xs|sm|base|lg|xl|[2-5]xl)", core)
    if m: return f"text-{TEXT[m.group(1)]}"
    m = re.fullmatch(r"font-(normal|medium|semibold|bold|mono|sans)", core)
    if m: return f"font-{FONT[m.group(1)]}"
    m = re.fullmatch(r"leading-(none|tight|snug|normal|relaxed|loose)", core)
    if m: return f"leading-{LEADING[m.group(1)]}"
    m = re.fullmatch(r"tracking-(tight|tighter|normal|wide|wider|widest)", core)
    if m: return f"tracking-{TRACKING[m.group(1)]}"
    m = re.fullmatch(r"rounded(-[trblse]{1,2})?(?:-(xs|sm|md|lg|xl|2xl|3xl|4xl|full|none))?", core)
    if m: return f"rounded{m.group(1) or ''}-{ROUND[m.group(2) or '']}"
    m = re.fullmatch(r"shadow(?:-(xs|sm|md|lg|xl|2xl|none))?", core)
    if m: return f"shadow-{SHADOW[m.group(1) or '']}"
    if re.fullmatch(r"(ring|outline)-(ring|offset-\d|offset-background|destructive)(/\d+)?", core) or core in ("ring-offset-background",):
        return ""
    if core in ("ring", "ring-[3px]", "outline-hidden") and core != "outline-hidden": return "focus-ring"
    if core == "outline-hidden": return "outline-none"
    m = re.fullmatch(r"(bg|text|border|fill|stroke)-([a-z-]+)/(\d+)", core)
    if m:
        kind, color, _ = m.groups()
        if kind == "bg": return f"bg-{SUBTLE.get(color, color)}"
        if kind == "text" and color == "destructive": return "text-danger-text"
        return f"{kind}-{color}"
    m = re.fullmatch(r"animate-accordion-(down|up)", core)
    if m: return f"animate-collapse-{m.group(1)}"
    if core in ("transition", "transition-all", "transition-colors", "transition-opacity", "transition-transform"): return u
    if core.startswith("ease-"): return "ease-default"
    if "[" in core and re.search(r"\d(px|rem|ms|s)\b|--spacing\(", core): unmapped.add(u)
    return None


def map_class(tok):
    if not tok or tok.startswith(("http", "data-slot")): return tok
    imp = tok.endswith("!")
    variant, util = split_variant(tok.rstrip("!"))
    # Un ring fuera de :focus es un borde fino decorativo, no un anillo de foco
    if "focus" not in variant and "aria-invalid" not in variant:
        m = re.fullmatch(r"ring(?:-(\d+|\[\d+px\]))?", util)
        if m: return variant + "border-thin"
        m = re.fullmatch(r"ring-([a-z-]+)(?:/\d+)?", util)
        if m and m.group(1) not in ("offset-background",): return variant + f"border-{m.group(1).replace('foreground', 'border')}"
    new = map_util(util)
    if new is None: return tok
    if new == "": return ""
    return variant + new + ("!" if imp else "")


def convert_classes(s):
    return " ".join(x for x in (map_class(t) for t in s.split()) if x)


def load_vega(repo):
    css = open(os.path.join(repo, "apps/v4/registry/styles/style-vega.css"), encoding="utf-8").read()
    return {k: v.strip() for k, v in re.findall(r"\.(cn-[\w-]+)\s*\{\s*@apply\s+([^;]+);\s*\}", css)}


def port(repo, name, dry=False):
    src = open(os.path.join(repo, "apps/v4/registry/bases/radix/ui", name + ".tsx"), encoding="utf-8").read()
    vega = load_vega(repo)
    icons = set()

    def icon(m):
        lucide = re.search(r'lucide="(\w+)"', m.group(0)).group(1)
        icons.add(lucide)
        rest = re.sub(r'\s(lucide|tabler|hugeicons|phosphor|remixicon)="[^"]*"', "", m.group(1))
        return f"<{lucide}{rest.rstrip()} />"
    src = re.sub(r"<IconPlaceholder((?:\s+[\w-]+=(?:\"[^\"]*\"|\{[^}]*\}))*)\s*/>", icon, src)
    src = re.sub(r'import \{ IconPlaceholder \} from "[^"]+"\n', "", src)
    src = src.replace('from "cn"', 'from "@/lib/utils"').replace("@/registry/bases/radix/ui/", "@/components/ui/")
    src = src.replace("@/registry/bases/radix/lib/", "@/lib/").replace("@/registry/bases/radix/hooks/", "@/hooks/")
    if icons:
        src = re.sub(r'(import \{ cn \} from "@/lib/utils"\n)', lambda m: m.group(1) + f'import {{ {", ".join(sorted(icons))} }} from "lucide-react"\n', src, count=1)

    def string(m):
        q, body = m.group(1), m.group(2)
        toks = body.split()
        if not toks or not any(re.match(r"^(cn-|[\w\[\]&*:@/.-]*-)", t) or ":" in t for t in toks): return m.group(0)
        if any(t.startswith("cn-") for t in toks):
            toks = [vega.get(t, "") if t.startswith("cn-") else t for t in toks]
        out = convert_classes(" ".join(toks))
        return q + out + q
    src = re.sub(r'(")([^"\n]*)"', string, src)
    out = os.path.join(UI, name + ".tsx")
    if not dry:
        with open(out, "w", encoding="utf-8", newline="\n") as f: f.write(src)
    return out


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    repo, names = args[0], args[1:]
    for n in names: print("→", port(repo, n, "--dry-run" in sys.argv))
    if unmapped: print("Sin traducir (revisar a mano):", " ".join(sorted(unmapped)))
