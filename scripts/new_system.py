"""Crea un sistema de diseño nuevo en systems/<id>/ a partir de unas respuestas (las mismas del cuestionario de la web).

Uso:
  python scripts/new_system.py respuestas.json [--id mi-sistema] [--fix-contrast | --fix-roles] [--no-build] [--dry-run]

respuestas.json (todo opcional salvo name y brand; lo que falte toma el valor por defecto):
{
  "name": "Clínica Sol", "description": "...", "productType": "...",
  "sober": 40, "serious": 50, "dense": 50,          # 0..100: sobrio→expresivo, serio→cercano, denso→espacioso
  "brand": "#e2662a", "warmNeutral": false,          # color de marca = tono 600 (botones y enlaces)
  "font": "Inter", "scale": "normal",                # compacta | normal | amplia
  "radius": 6, "border": 1, "unit": "4", "density": 50, "shadow": 50, "speed": 50,
  "applyCharacter": true,                            # si true, sober/serious/dense fijan radius, warmNeutral, density, scale, shadow y speed
                                                     # (solo los que no vengan escritos en el archivo)
  "principles": [{"title": "...", "text": "..."}],   # opcional: si no, se generan
  "notes": {"general": "...", "color": "..."},       # opcional: si no, se generan
  "overrides": {"primitives": {"color.green.600": "#15803d"}, "light": {"color.text.link": "{color.brand.700}"}}
                                                     # opcional: cambios puntuales de tokens (archivo → ruta → valor)
}

Hace lo mismo que el botón «Crear sistema» de la web (web/src/lib/generator.ts; si cambias uno, cambia el otro):
tokens desde base/ → system.json + config.json + tokens/ → scripts/generate.py → reconstruye la web si hay Node.
"""
import argparse, copy, json, math, os, re, shutil, subprocess, sys, unicodedata
from datetime import date

try: sys.stdout.reconfigure(encoding="utf-8")  # acentos y flechas también en la consola de Windows
except Exception: pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from generate import flatten, resolve, generate  # noqa: E402

STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]
FILES = {"primitives": "primitives", "semantic": "semantic", "light": "color.light", "dark": "color.dark"}
DEFAULTS = {"name": "", "description": "", "productType": "", "sober": 40, "serious": 50, "dense": 50,
            "warmNeutral": False, "font": "Inter", "scale": "normal", "radius": 6, "border": 1, "unit": "4",
            "density": 50, "shadow": 50, "speed": 50}


def js_round(x):  # Math.round de JavaScript (redondea .5 hacia arriba), para dar los mismos valores que la web
    return math.floor(x + 0.5)


# ---------- carácter (igual que fromCharacter en la web) ----------
def from_character(key, v):
    if key == "serious": return {"radius": js_round(2 + v * 0.14), "warmNeutral": v >= 60}
    if key == "dense": return {"density": v, "scale": "compacta" if v < 34 else "amplia" if v > 66 else "normal"}
    return {"shadow": js_round(25 + v * 0.6), "speed": js_round(70 - v * 0.4)}


# ---------- color: OKLCH ----------
def _lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def _srgb(c): return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055

def hex_to_oklch(h):
    r, g, b = (_lin(int(h[i:i + 2], 16) / 255) for i in (1, 3, 5))
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
    A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    return L, math.hypot(A, B), (math.degrees(math.atan2(B, A)) + 360) % 360

def _oklch_to_rgb(L, C, H):
    a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
    return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)

def oklch_to_hex(L, C, H):
    c = C
    for _ in range(30):
        if all(-0.0005 <= v <= 1.0005 for v in _oklch_to_rgb(L, c, H)): break
        c *= 0.92
    clamp = lambda v: min(1, max(0, v))
    return "#" + "".join(f"{js_round(clamp(_srgb(clamp(v))) * 255):02x}" for v in _oklch_to_rgb(L, c, H))

L_TARGET = [0.975, 0.94, 0.885, 0.81, 0.72, 0.63, 0.54, 0.46, 0.39, 0.32, 0.24]
C_CURVE = [0.12, 0.25, 0.45, 0.7, 0.9, 1, 1, 0.92, 0.8, 0.66, 0.5]

def brand_scale(hx):
    L0, C0, H = hex_to_oklch(hx)
    out = []
    for i in range(11):
        if i == 6: out.append(hx.lower()); continue
        t = L_TARGET[i]
        L = (L0 + (t - L_TARGET[6]) * ((L_TARGET[0] - L0) / (L_TARGET[0] - L_TARGET[6])) if i < 6
             else L0 + (t - L_TARGET[6]) * ((L0 - 0.2) / (L_TARGET[6] - L_TARGET[10])))
        out.append(oklch_to_hex(min(0.985, max(0.16, L)), C0 * C_CURVE[i], H))
    return out

def neutral_scale(warm, brand_hex, expressive):
    hue = hex_to_oklch(brand_hex)[2] if expressive > 60 else 60 if warm else 265
    chroma = (0.008 if warm else 0.006) + max(0, expressive - 60) / 40 * 0.01
    Ls = [0.985, 0.967, 0.92, 0.87, 0.71, 0.55, 0.44, 0.37, 0.27, 0.21, 0.145]
    return [oklch_to_hex(l, chroma * C_CURVE[min(i + 2, 10)] * 1.1, hue) for i, l in enumerate(Ls)]

def luminance(hx):
    if not re.fullmatch(r"#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?", str(hx)): return None
    r, g, b = (int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda s: s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    if la is None or lb is None: return None
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

def readable_on_white(hx):
    L, C, H = hex_to_oklch(hx)
    out = hx
    while (contrast("#ffffff", out) or 0) < 4.5 and L > 0.2:
        L -= 0.01; out = oklch_to_hex(L, C, H)
    return out


# ---------- tokens ----------
def _px(v): return float(str(v).replace("px", "").replace("ms", ""))
def _round_to(n, step): return max(step, js_round(n / step) * step)
def _num(x): return int(x) if float(x).is_integer() else x
def _items(group): return [(k, v) for k, v in group.items() if not k.startswith("$")]

def build_tokens(base, a):
    t = copy.deepcopy(base)
    p = t["primitives"]
    for i, c in enumerate(brand_scale(a["brand"])): p["color"]["brand"][STEPS[i]]["$value"] = c
    for i, c in enumerate(neutral_scale(a["warmNeutral"], a["brand"], a["sober"])): p["color"]["neutral"][STEPS[i]]["$value"] = c

    p["font"]["family"]["sans"]["$value"] = [a["font"], "ui-sans-serif", "system-ui", "sans-serif"]
    f = {"compacta": 0.92, "normal": 1, "amplia": 1.08}[a["scale"]]
    for k, tk in _items(base["primitives"]["font"]["size"]):
        v = _px(tk["$value"])
        p["font"]["size"][k]["$value"] = f"{_num(js_round(v * (0.95 if f < 1 else 1)) if v <= 16 else _round_to(v * f, 2))}px"
    if a["sober"] > 66: p["font"]["weight"]["semibold"]["$value"] = 700

    r = a["radius"]
    for k, v in {"xs": r / 3, "sm": r * 2 / 3, "md": r, "lg": r * 1.4, "xl": r * 2, "2xl": r * 2.6}.items():
        p["radius"][k]["$value"] = f"{js_round(v)}px"
    p["border-width"]["1"]["$value"] = f"{a['border']}px"
    p["border-width"]["2"]["$value"] = f"{a['border'] + 1}px"

    d = 0.85 + a["density"] / 100 * 0.35
    unit = int(a["unit"])
    for k, tk in _items(base["primitives"]["space"]):
        v = _px(tk["$value"])
        if v == 0: continue
        step = 2 if v < 8 else 4 if v < 16 else unit
        p["space"][k]["$value"] = f"{_num(_round_to(v * d, step))}px"

    s = 0.5 + a["shadow"] / 100 * 1.3
    for k, tk in _items(base["primitives"]["shadow"]):
        col = tk["$value"]["color"]
        alpha = min(255, js_round(int(col[7:9], 16) * s))
        p["shadow"][k]["$value"] = {**tk["$value"], "color": col[:7] + f"{alpha:02x}"}

    m = 0.7 + a["speed"] / 100 * 0.8
    for k, tk in _items(base["primitives"]["duration"]):
        if k in ("instant", "loop"): continue
        p["duration"][k]["$value"] = f"{js_round(_px(tk['$value']) * m / 10) * 10}ms"

    for file, changes in (a.get("overrides") or {}).items():
        for path, value in changes.items():
            node = t[file]
            for part in path.split("."): node = node[part]
            node["$value"] = value
    return t


PAIRS = [("Texto principal sobre fondo", "color.text.default", "color.bg.default"),
         ("Texto secundario sobre fondo", "color.text.muted", "color.bg.default"),
         ("Texto principal sobre tarjeta", "color.text.default", "color.surface.card"),
         ("Enlace sobre fondo", "color.text.link", "color.bg.default"),
         ("Botón principal", "color.action.primary.on", "color.action.primary.default"),
         ("Botón secundario", "color.action.secondary.on", "color.action.secondary.default"),
         ("Éxito", "color.feedback.success.on-solid", "color.feedback.success.solid"),
         ("Aviso", "color.feedback.warning.on-solid", "color.feedback.warning.solid"),
         ("Error", "color.feedback.danger.on-solid", "color.feedback.danger.solid"),
         ("Info", "color.feedback.info.on-solid", "color.feedback.info.solid")]


def _table(t, mode):
    table = {}
    for f in ("primitives", "semantic", mode): flatten(t[f], out=table)
    return table


def contrast_report(t):
    out = []
    for mode in ("light", "dark"):
        table = _table(t, mode)
        for label, fg, bg in PAIRS:
            r = contrast(resolve(table.get(fg, (None,))[0], table), resolve(table.get(bg, (None,))[0], table))
            out.append((label + (" (oscuro)" if mode == "dark" else ""), r))
    return out


def _node(tree, path):
    for k in path.split("."): tree = (tree or {}).get(k)
    return tree


def fix_roles(t):
    """Arregla los pares sin contraste cambiando solo el rol de ese caso (igual que «Contraste» en el editor de la web):
    el tono más cercano de la misma escala que llega a 4,5:1, mejor en un rol que no compartan otros pares.
    Devuelve la lista de cambios hechos."""
    prim = t["primitives"]["color"]
    steps = lambda sc: [k for k in prim.get(sc, {}) if not k.startswith("$")]
    done = []
    for mode in ("light", "dark"):
        for label, fg, bg in PAIRS:
            table = _table(t, mode)
            val = lambda p: resolve(table.get(p, (None,))[0], table)
            if (contrast(val(fg), val(bg)) or 0) >= 4.5: continue
            options = []
            for side, token, other in (("bg", bg, val(fg)), ("fg", fg, val(bg))):
                node = _node(t[mode], token)
                m = re.fullmatch(r"\{(color\.[^}]+)\}", str((node or {}).get("$value", "")))
                if not m: continue
                alias, scale = m.group(1), m.group(1).split(".")[1]
                cands = (["color.white"] + [f"color.neutral.{k}" for k in steps("neutral")] + ["color.black"]
                         if "$value" in prim.get(scale, {}) else [f"color.{scale}.{k}" for k in steps(scale)])
                if alias not in cands: continue
                shared = any(l != label and token in (f2, b2) for l, f2, b2 in PAIRS)
                for i, c in enumerate(cands):
                    hx = val(c); r = contrast(other, hx) or 0
                    if r >= 4.5: options.append((abs(i - cands.index(alias)) + (3 if shared else 0), -r, token, alias, c, node))
            if not options: continue
            _, _, token, alias, new, node = min(options, key=lambda o: o[:2])
            node["$value"] = "{" + new + "}"
            done.append(f"{label}{' (oscuro)' if mode == 'dark' else ''}: {token} {alias} → {new}")
            sc, st, nsc, nst = alias.split(".")[1], alias.split(".")[-1], new.split(".")[1], new.split(".")[-1]
            if re.search(r"\.(default|solid)$", token) and sc == nsc and sc in prim and "$value" not in prim[sc]:
                ss, parent = steps(sc), token.rsplit(".", 1)[0]
                for sib in ("hover", "active"):
                    n2 = _node(t[mode], f"{parent}.{sib}")
                    m2 = re.fullmatch(r"\{color\.([^.]+)\.([^}]+)\}", str((n2 or {}).get("$value", "")))
                    if not m2 or m2.group(1) != sc: continue
                    j = min(len(ss) - 1, max(0, ss.index(m2.group(2)) + ss.index(nst) - ss.index(st)))
                    n2["$value"] = f"{{color.{sc}.{ss[j]}}}"
    return done


def slugify(name):
    s = unicodedata.normalize("NFD", name)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn").lower()
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", s))[:40] or "sistema"

def free_id(wanted):
    base = wanted if wanted != "base" else "base-2"
    i, n = base, 2
    while os.path.exists(os.path.join(ROOT, "systems", i)): i, n = f"{base}-{n}", n + 1
    return i


def meta_from(a):
    tone = lambda v, lo, mid, hi: lo if v < 34 else hi if v > 66 else mid
    return {
        "name": a["name"].strip(),
        "description": a["description"].strip() or f"Sistema {tone(a['sober'], 'sobrio', 'equilibrado', 'expresivo')} y {tone(a['serious'], 'serio', 'neutro', 'cercano')}.",
        "productType": a["productType"].strip(),
        "origin": a.get("origin", "conversacion"),
        **({"sourceUrl": a["sourceUrl"]} if a.get("sourceUrl") else {}),
        "principles": a.get("principles") or [
            {"title": tone(a["sober"], "Sobrio", "Equilibrado", "Expresivo"), "text": tone(a["sober"],
                "El color de marca se reserva para acciones principales; el resto, en neutros.",
                "La marca aparece en acciones y detalles; fondos y textos en neutros.",
                "La marca tiñe también los neutros y los titulares ganan peso.")},
            {"title": tone(a["serious"], "Serio", "Neutro", "Cercano"), "text": f"Esquinas de {a['radius']} px en controles y grises {'cálidos' if a['warmNeutral'] else 'fríos'}."},
            {"title": tone(a["dense"], "Denso", "Cómodo", "Espacioso"), "text": f"Rejilla de {a['unit']} px y escala tipográfica {a['scale']}."},
        ],
        "notes": a.get("notes") or {
            "general": "Creado en una conversación con Claude. Ajusta lo que haga falta en el modo editor.",
            "color": f"Color de marca {a['brand']} (tono 600, el de los botones). La escala se genera en OKLCH.",
            "tipografía": f"{a['font']} para todo.",
        },
    }


def normalize(raw):
    a = {**DEFAULTS}
    if raw.get("applyCharacter", True):
        for key in ("sober", "serious", "dense"):
            if key in raw: a.update(from_character(key, raw[key]))
    a.update(raw)
    a["unit"] = str(a["unit"])
    if not a.get("name", "").strip(): sys.exit("Falta «name».")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", a.get("brand", "")): sys.exit("«brand» debe ser un color #rrggbb.")
    a["brand"] = a["brand"].lower()
    if a["scale"] not in ("compacta", "normal", "amplia"): sys.exit("«scale» debe ser compacta, normal o amplia.")
    if a["unit"] not in ("4", "8"): sys.exit("«unit» debe ser 4 u 8.")
    return a


def load_base():
    out = {}
    for key, name in FILES.items():
        with open(os.path.join(ROOT, "base", "tokens", f"{name}.tokens.json"), encoding="utf-8") as f: out[key] = json.load(f)
    return out

def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f: json.dump(obj, f, indent=2, ensure_ascii=False); f.write("\n")


def build_web():
    npm = shutil.which("npm.cmd") or shutil.which("npm")
    if not npm:
        print("Aviso: no encuentro Node/npm. La carpeta está creada; la web la mostrará cuando se reconstruya (Abrir el editor.bat → guardar, o npm run build).")
        return
    print("Actualizando la web…")
    subprocess.run([npm, "run", "build"], cwd=os.path.join(ROOT, "web"), check=True, capture_output=True)
    shutil.copyfile(os.path.join(ROOT, "web", "dist", "index.html"), os.path.join(ROOT, "Abrir la web.html"))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("answers"); ap.add_argument("--id")
    ap.add_argument("--fix-contrast", action="store_true", help="oscurece la marca si el texto blanco no se lee encima")
    ap.add_argument("--fix-roles", action="store_true", help="arregla los contrastes cambiando solo el rol de cada caso (no la marca)")
    ap.add_argument("--no-build", action="store_true"); ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    with open(args.answers, encoding="utf-8") as f: raw = json.load(f)
    a = normalize(raw)
    if args.fix_contrast and (contrast("#ffffff", a["brand"]) or 0) < 4.5:
        fixed = readable_on_white(a["brand"])
        print(f"Marca oscurecida para el contraste: {a['brand']} → {fixed}")
        a["brand"] = fixed

    tokens = build_tokens(load_base(), a)
    if args.fix_roles:
        for c in fix_roles(tokens): print("Contraste arreglado:", c)
    report = contrast_report(tokens)
    bad = [(l, r) for l, r in report if r is None or r < 4.5]
    print("Contraste:", "todo AA" if not bad else "; ".join(f"{l} {r:.2f}:1" if r else l for l, r in bad))
    if args.dry_run:
        print(json.dumps({"brand": brand_scale(a["brand"]), "neutral": neutral_scale(a["warmNeutral"], a["brand"], a["sober"])}, indent=1))
        return

    sid = free_id(args.id or slugify(a["name"]))
    d = os.path.join(ROOT, "systems", sid)
    today = date.today().isoformat()
    meta = meta_from(a)
    dump(os.path.join(d, "system.json"), {"id": sid, **meta, "createdAt": today, "updatedAt": today})
    dump(os.path.join(d, "config.json"), {"cuestionario": {k: v for k, v in a.items() if k not in ("principles", "notes")}})
    for key, name in FILES.items(): dump(os.path.join(d, "tokens", f"{name}.tokens.json"), tokens[key])
    generate(d)
    if not args.no_build: build_web()
    print(f"Creado: systems/{sid}")


if __name__ == "__main__":
    main()
