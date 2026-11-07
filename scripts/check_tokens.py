"""Comprueba que la web y los componentes no usan valores fijos: todo debe salir de tokens.

Uso:  python scripts/check_tokens.py            (después de `npm run build` en web/)

Revisa dos cosas:
1. CSS final: cualquier declaración de las clases (capa utilities) con un valor escrito a mano
   (px, rem, ms, colores #hex/rgb…) en vez de var(--token).
2. Código: clases usadas en los componentes que no generan CSS (por ejemplo `p-7` o `bg-red-500`,
   que no existen porque no hay token para ellas).
Termina con código 1 si encuentra algo."""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "web", "dist", "index.html")

# Valores permitidos aunque sean literales: no son decisiones de diseño
ALLOWED_PROPS = {"z-index", "flex", "flex-grow", "flex-shrink", "order", "grid-template-columns", "grid-template-rows",
                 "grid-column", "grid-row", "grid-column-start", "grid-column-end", "grid-row-start", "grid-row-end", "-webkit-line-clamp", "line-clamp", "content", "animation-iteration-count", "aspect-ratio"}
ALLOWED_VALUE = re.compile(r"^(0|0px|-?\d+(\.\d+)?%|100vh|100dvh|100svh|1|-1|180deg|-180deg|45deg|90deg|#0000)$")  # %, transparente y giros (45/90/180º): proporciones, no medidas
LITERAL = re.compile(r"(?<![\w-])(-?\d*\.?\d+)(px|rem|em|ms|s|deg|vh|vw|dvh|%)?(?![\w-])|#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|oklch|oklab)\(")
# Utilidades técnicas de accesibilidad / maquetación permitidas tal cual
ALLOWED_SELECTORS = re.compile(r"^\.(sr-only|not-sr-only|line-clamp-\d|checker)")


def strip_var_calls(v):
    # quita var(--x, fallback) y nombres de variables: lo que queda son literales
    prev = None
    while prev != v:
        prev = v
        v = re.sub(r"var\(--[\w-]+(,[^()]*)?\)", "VAR", v)
    return v


def css_rules(css):
    """Devuelve (selector, propiedad, valor) de la capa utilities, aplanando @media/@supports."""
    i = css.find("@layer utilities")
    if i < 0: return []
    depth, start, j = 0, css.index("{", i), css.index("{", i)
    while True:
        if css[j] == "{": depth += 1
        elif css[j] == "}":
            depth -= 1
            if depth == 0: break
        j += 1
    body = css[start + 1:j]
    out, stack, buf = [], [], ""
    for ch in body:
        if ch == "{":
            stack.append(buf.strip()); buf = ""
        elif ch == "}":
            decls = buf; buf = ""
            sel = next((s for s in reversed(stack) if not s.startswith("@")), "")
            for d in decls.split(";"):
                if ":" in d and not d.strip().startswith("@"):
                    p, v = d.split(":", 1)
                    out.append((sel, p.strip(), v.strip()))
            stack.pop()
        else:
            buf += ch
    return out


def check_css(css):
    problems = []
    for sel, prop, val in css_rules(css):
        if not prop or prop in ALLOWED_PROPS or ALLOWED_SELECTORS.match(sel): continue
        rest = strip_var_calls(val)
        if prop.startswith("--tw-") and rest in ("VAR", "", "initial"): continue
        for m in LITERAL.finditer(rest):
            lit = m.group(0)
            if ALLOWED_VALUE.match(lit) and "color-mix" not in val: continue
            if m.group(1) and not m.group(2) and prop in ("opacity",) and lit in ("0", "1"): continue
            # números sin unidad dentro de calc() que multiplican un token (p. ej. * -1) están permitidos
            if m.group(1) and not m.group(2) and re.search(r"\*\s*" + re.escape(lit), rest): continue
            if m.group(1) and not m.group(2) and prop.startswith("--tw-") : continue
            problems.append(f"{sel}  ->  {prop}: {val}")
            break
    return problems


def check_classes(css):
    sels = set(re.findall(r"\.((?:\\.|[\w-])+)", css))
    sels = {re.sub(r"\\(.)", r"\1", s) for s in sels}
    ignore = re.compile(r"^(group|peer|group/[\w-]+|peer/[\w-]+|@container/[\w-]+|dark|checker|outline|default|destructive|secondary|ghost|link|sm|lg|md|icon.*|horizontal|vertical|item-aligned|popper|center|start|end|top|right|bottom|left|line"
                        r"|[:,\-]|\w+:|/.*|.*/:.*|var\(.*|calc\(.*|.*\)|\d+:\d+|\[[\w-]+(=[\w-]+)?\],?|data-[a-z-]+|sans-serif|system-ui|ui-sans-serif|bottom-right|d-in|dropdown-menu|radio-group)$")
    bad = {}
    for f in glob.glob(os.path.join(ROOT, "web", "src", "**", "*.tsx"), recursive=True):
        src = open(f, encoding="utf-8").read()
        # fuera: imports, data-slot, rutas y textos que no son clases
        src = re.sub(r'(from|import)\s+"[^"]*"', "", src)
        src = re.sub(r'data-[\w-]+=\{?"[^"]*"', "", src)
        src = re.sub(r'"[^"\n]*"\s*:', "", src)              # claves de objetos ("alert-dialog": …)
        src = re.sub(r'imp\([^)]*\)', "", src)                 # nombres de archivo en los ejemplos de código
        src = re.sub(r"tokenPx\(\"[^\"]*\"\)", "", src)               # tokens leídos desde JS
        src = re.sub(r'"--[\w-]+"', "", src)                   # nombres de variables CSS en style={…}
        for lit in re.findall(r'"([^"\n]+)"', src):
            toks = lit.split()
            # solo cadenas que parecen listas de clases
            if not toks or not all(re.match(r"^[a-z0-9\[\]\-:/.*&@!>()=,'%_]+$", t) for t in toks): continue
            if not any("-" in t or ":" in t for t in toks): continue
            for tok in toks:
                if ignore.match(tok) or not re.match(r"^[\w\[\]\-:/.*&@!>()=,'%]+$", tok): continue
                if tok not in sels and not any(s.endswith(tok) or s == tok for s in sels):
                    bad.setdefault(os.path.relpath(f, ROOT), set()).add(tok)
    return bad


PRIMITIVE = re.compile(r"^(space\.\d|radius\.(none|xs|sm|md|lg|xl|2xl|full)$|font\.|color\.(white|black|neutral|brand|green|amber|red|blue)\b|shadow\.|opacity\.|duration\.|easing\.|border-width\.|breakpoint\.)")
PRIM_VAR = re.compile(r"var\(--(space-\d[\w-]*|radius-(none|xs|sm|md|lg|xl|2xl|full)\b|font-(size|weight|family|line-height|letter-spacing)-[\w-]+|shadow-\w+|opacity-\w+|duration-\w+|easing-\w+|border-width-\w+|color-(white|black|neutral|brand|green|amber|red|blue)\b[\w-]*)\)")


def check_primitives():
    """Los primitivos son solo la capa de gestión: el código usa siempre tokens semánticos."""
    import json
    cmap = json.load(open(os.path.join(ROOT, "web", "src", "class-tokens.json"), encoding="utf-8"))
    def core(t):
        d, idx = 0, -1
        for i, ch in enumerate(t):
            if ch in "[(": d += 1
            elif ch in "])": d -= 1
            elif ch == ":" and d == 0: idx = i
        return t[idx + 1:].strip("!").lstrip("-")
    bad = {}
    files = glob.glob(os.path.join(ROOT, "web", "src", "**", "*.tsx"), recursive=True) + \
        [f for f in glob.glob(os.path.join(ROOT, "web", "src", "**", "*.css"), recursive=True) if not f.endswith("theme.css")]
    for f in files:
        src = open(f, encoding="utf-8").read()
        found = set(m.group(0) for m in PRIM_VAR.finditer(src))
        found |= set(re.findall(r'tokenPx\("space-\d[^"]*"\)', src))
        for lit in re.findall(r'"([^"\n]+)"|`([^`]+)`', src):
            for tok in (lit[0] or lit[1]).split():
                for p in cmap.get(core(tok), []):
                    if PRIMITIVE.match(p): found.add(f"{tok} ({p})")
        if found: bad[os.path.relpath(f, ROOT)] = found
    return bad


if __name__ == "__main__":
    html = open(HTML, encoding="utf-8").read()
    css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S))
    p = check_css(css)
    b = check_classes(css)
    print(f"1) Valores fijos en el CSS de las clases: {len(p)}")
    for x in p: print("   ", x)
    n = sum(len(v) for v in b.values())
    print(f"2) Clases que no salen de ningún token (no generan CSS): {n}")
    for f, toks in sorted(b.items()): print("   ", f, ":", " ".join(sorted(toks)))
    pr = check_primitives()
    k = sum(len(v) for v in pr.values())
    print(f"3) Primitivos usados directamente en el código (deben ser semánticos): {k}")
    for f, toks in sorted(pr.items()): print("   ", f, ":", " ".join(sorted(toks)))
    sys.exit(1 if p or n or k else 0)
