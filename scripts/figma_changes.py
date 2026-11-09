"""Resume lo que Jordi ha cambiado en Figma, para pasarlo al código.

Uso:  python scripts/figma_changes.py <sistema> <cambios-figma.json> [figma-original.json]

- <sistema>: id del sistema (base, sereno, lila…), para comparar sus tokens con las variables de Figma.
- <cambios-figma.json>: lo que exporta el plugin con «Exportar cambios».
- [figma-original.json]: opcional, el archivo que se descargó de la web («Llevar a Figma»), para comparar textos y
  componentes pantalla a pantalla.

Escribe un informe en Markdown: tokens cambiados, nuevos o borrados; componentes y variantes nuevos; y, por pantalla,
textos cambiados, componentes usados y valores sueltos (sin variable), que hay que convertir en tokens antes de
pasarlos al código (regla: nada escrito a mano)."""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWN_SETS = {"button", "badge", "checkbox", "input", "input-group", "avatar", "alert", "input-otp-slot", "separator", "label", "switch", "kbd", "spinner"}


def flatten(obj, prefix=(), inherited=None, out=None):
    out = {} if out is None else out
    t = obj.get("$type", inherited) if isinstance(obj, dict) else inherited
    for k, v in (obj or {}).items():
        if k.startswith("$"): continue
        path = prefix + (k,)
        if isinstance(v, dict) and "$value" in v:
            out[".".join(path)] = {"value": v["$value"], "type": v.get("$type", t)}
        elif isinstance(v, dict):
            flatten(v, path, t, out)
    return out


def system_dir(sid):
    return os.path.join(ROOT, "base") if sid == "base" else os.path.join(ROOT, "systems", sid)


def load_tokens(sid):
    d = os.path.join(system_dir(sid), "tokens")
    rd = lambda f: json.load(open(os.path.join(d, f), encoding="utf-8"))
    return {"Primitivos": flatten(rd("primitives.tokens.json")), "Semánticos": flatten(rd("semantic.tokens.json")),
            "Claro": flatten(rd("color.light.tokens.json")), "Oscuro": flatten(rd("color.dark.tokens.json"))}


def norm(v):
    """Valor comparable: alias → {ruta}, color → #hex en minúsculas, medida → número."""
    if isinstance(v, dict) and "alias" in v: return "{" + str(v["alias"]).replace("/", ".") + "}"
    if isinstance(v, list): return str(v[0])
    if isinstance(v, str):
        if v.startswith("{"): return v
        if v.startswith("#"): return v.lower()[:7] if v.lower().endswith("ff") and len(v) == 9 else v.lower()
        m = re.match(r"^(-?\d*\.?\d+)px$", v)
        if m: return round(float(m.group(1)), 4)
        return v
    if isinstance(v, (int, float)): return round(float(v), 4)   # Figma guarda decimales con poca precisión (1.15 → 1.1499999)
    return v


def walk(n, out):
    out.append(n)
    for c in n.get("children", []) or []: walk(c, out)
    return out


def texts(n):
    out = []
    for x in walk(n, []):
        if x.get("text"): out.append(x["text"]["chars"])
        out += x.get("texts", []) or []
    return out


def flat_orig(n, path="", out=None):
    """Nodo del archivo original (web → Figma) en una lista comparable: ruta, tipo, tamaño, texto, color, tamaño de letra, borde."""
    out = [] if out is None else out
    if n.get("component") and path:
        out.append((path, "INST", n["component"]["set"])); return out
    t = n.get("text") or {}
    color = (t.get("color") or {}).get("token") or ((n.get("fill") or {}).get("token") if n["type"] != "SVG" else None)
    out.append((path, "ICON" if n["type"] == "SVG" else n["type"], n.get("w"), n.get("h"), t.get("chars"), color, t.get("size"), (n.get("stroke") or {}).get("token")))
    for i, c in enumerate(n.get("children") or []): flat_orig(c, f"{path}/{i}", out)
    return out


def flat_figma(n, path="", out=None):
    """Lo mismo para un nodo exportado desde Figma."""
    out = [] if out is None else out
    if n["type"] == "INSTANCE" and path:
        nm = (n.get("component") or {}).get("set") or (n.get("component") or {}).get("name") or n["name"]
        out.append((path, "ICON", n.get("w"), n.get("h")) if nm.startswith("icon/") else (path, "INST", nm)); return out
    t = n.get("text") or {}
    f = (n.get("fills") or [None])[0] or {}
    out.append((path, n["type"].replace("COMPONENT", "FRAME"), n.get("w"), n.get("h"), t.get("chars"), f.get("token") if n["type"] != "VECTOR" else None, t.get("fontSize"), ((n.get("strokes") or [None])[0] or {}).get("token")))
    for i, c in enumerate(n.get("children") or []): flat_figma(c, f"{path}/{i}", out)
    return out


def component_changes(orig, comps):
    """Compara cada variante de Figma con su primera aparición en el flujo original: colores, bordes, textos y estructura.
    Las diferencias de tamaño de pocos píxeles (cómo mide el texto cada programa) no cuentan."""
    occ = {}
    for s in orig["screens"]:
        for n in walk(s["node"], []):
            if n.get("component"):
                p = n["component"]["props"]
                occ.setdefault(n["component"]["set"] + "|" + ", ".join(f"{k}={p[k]}" for k in sorted(p)), n)
    out = []
    for c in comps:
        if "set" not in c: continue
        for v in c["variants"]:
            key = c["set"] + "|" + v["name"]
            on = occ.get(key)
            if not on: continue
            a, b = flat_orig(on), flat_figma(v)
            if len(a) != len(b):
                out.append(f"- **{c['set']}** ({v['name']}): ha cambiado la estructura ({len(a)} → {len(b)} capas)"); continue
            for x, y in zip(a, b):
                if x[1] in ("INST", "ICON") or y[1] in ("INST", "ICON"):
                    if x[1] != y[1] or (x[1] == "INST" and x[2] != y[2]): out.append(f"- **{c['set']}** ({v['name']}) {x[0] or 'raíz'}: {x[2]} → {y[2]}")
                    continue
                d = []
                if x[4] != y[4]: d.append(f"texto «{x[4]}» → «{y[4]}»")
                if (x[5] or "").replace(".", "/") != (y[5] or ""): d.append(f"color `{x[5]}` → `{y[5]}`")
                if x[6] and y[6] and abs(x[6] - y[6]) > 0.5: d.append(f"tamaño de letra {x[6]} → {y[6]}")
                if (x[7] or "").replace(".", "/") != (y[7] or ""): d.append(f"borde `{x[7]}` → `{y[7]}`")
                if d: out.append(f"- **{c['set']}** ({v['name']}) capa {x[0] or 'raíz'}: " + "; ".join(d))
    return out


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    sid, path = sys.argv[1], sys.argv[2]
    ch = json.load(open(path, encoding="utf-8"))
    orig = json.load(open(sys.argv[3], encoding="utf-8")) if len(sys.argv) > 3 else None
    tok = load_tokens(sid)
    lines = [f"# Cambios de Figma → {sid}", "", f"Archivo «{ch.get('file')}», página «{ch.get('page')}», exportado {ch.get('exportedAt')}.", ""]

    # ---- Tokens
    lines += ["## Tokens", ""]
    changed, new, gone = [], [], []
    seen = {k: set() for k in tok}
    for col in ch.get("collections", []):
        for v in col["variables"]:
            p = v["name"].replace("/", ".")
            for mode, val in v["values"].items():
                src = "Claro" if mode == "Claro" else "Oscuro" if mode == "Oscuro" else col["name"]
                if src not in tok: continue
                seen[src].add(p)
                cur = tok[src].get(p)
                if cur is None: new.append(f"- **{p}** ({src}) = `{val}`")
                elif norm(cur["value"]) != norm(val): changed.append(f"- **{p}** ({src}): `{cur['value']}` → `{val}`")
    allt = {**tok["Primitivos"], **tok["Semánticos"], **tok["Claro"]}
    def resolved(v, depth=0):
        m = re.match(r"^\{([^}]+)\}$", v) if isinstance(v, str) else None
        return resolved(allt[m.group(1)]["value"], depth + 1) if m and m.group(1) in allt and depth < 20 else v
    def exportable(t):  # lo mismo que pasa la web a Figma: colores #hex, medidas en px, números y fuentes
        v = resolved(t["value"])
        return t["type"] == "fontFamily" or isinstance(v, (int, float)) or (isinstance(v, str) and (v.startswith("#") or re.match(r"^-?\d*\.?\d+(px)?$", v)))
    for src, table in tok.items():
        for p, t in table.items():
            if p not in seen[src] and t["type"] in ("color", "dimension", "number", "fontWeight", "fontFamily") and exportable(t):
                if any(seen.values()): gone.append(f"- {p} ({src})")
    lines += [f"Cambiados: {len(changed)} · nuevos: {len(new)} · ya no están en Figma: {len(gone)}", ""]
    lines += (["### Cambiados", ""] + changed + [""]) if changed else []
    lines += (["### Nuevos (añadir como tokens; si son colores, semánticos que apunten a un primitivo)", ""] + new + [""]) if new else []
    lines += (["### Ya no están en Figma (revisar con Jordi antes de borrar)", ""] + gone[:60] + ([f"- … y {len(gone) - 60} más"] if len(gone) > 60 else []) + [""]) if gone else []

    # ---- Componentes
    lines += ["## Componentes", ""]
    orig_variants = set()
    if orig:
        for s in orig["screens"]:
            for x in walk(s["node"], []):
                if x.get("component"):
                    pr = x["component"]["props"]
                    orig_variants.add(x["component"]["set"] + "|" + ", ".join(f"{k}={pr[k]}" for k in sorted(pr)))
    for c in ch.get("components", []):
        if c.get("icon"): continue
        if "set" in c:
            label = "nuevo" if c["set"] not in KNOWN_SETS else "existente"
            vs = [v["name"] for v in c["variants"]]
            extra = [v for v in vs if orig and f"{c['set']}|{v}" not in orig_variants]
            lines.append(f"- **{c['set']}** ({label}): {len(vs)} variantes" + (f"; nuevas: {', '.join(extra)}" if extra else ""))
        else:
            lines.append(f"- **{c['name']}** (componente suelto, nuevo)")
    if orig:
        cc = component_changes(orig, ch.get("components", []))
        lines += ["", "### Cambios dentro de los componentes", ""] + (cc or ["- Ninguno"])
    lines.append("")

    # ---- Pantallas
    lines += ["## Pantallas", ""]
    origs = {s["label"]: s for s in orig["screens"]} if orig else {}
    for s in ch.get("screens", []):
        nodes = walk(s, [])
        loose = []
        for x in nodes:
            for f in x.get("fills", []) or []:
                if f and f.get("color") and not f.get("token"): loose.append(f"relleno {f['color']} en «{x['name']}»")
            for f in x.get("strokes", []) or []:
                if f and f.get("color") and not f.get("token"): loose.append(f"borde {f['color']} en «{x['name']}»")
            lay = x.get("layout")
            b = x.get("bind", {}) or {}
            if lay:
                for i, side in enumerate(["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]):
                    if lay["pad"][i] and side not in b: loose.append(f"{side} {lay['pad'][i]} en «{x['name']}»")
                if lay["gap"] and "itemSpacing" not in b and lay.get("main") != "SPACE_BETWEEN": loose.append(f"gap {lay['gap']} en «{x['name']}»")
        comps = sorted({(x["component"].get("set") or x["component"].get("name")) + (" · " + x["component"]["variant"] if x["component"].get("variant") else "") for x in nodes if x.get("component")})
        lines.append(f"### {s['name']}")
        lines.append("")
        o = origs.get(s["name"])
        if o:
            before, after = texts(o["node"]), texts(s)
            added = [t for t in after if t not in before]
            removed = [t for t in before if t not in after]
            if added: lines.append("- Textos nuevos o cambiados: " + "; ".join(f"«{t}»" for t in added))
            if removed: lines.append("- Textos que ya no están: " + "; ".join(f"«{t}»" for t in removed))
            if not added and not removed: lines.append("- Textos: sin cambios")
        else:
            lines.append("- Pantalla nueva (no estaba en el flujo original)")
        links = [f"«{x['name']}» → {x['link']}" for x in nodes if x.get("link")]
        if links: lines.append("- Enlaces del prototipo: " + "; ".join(links))
        lines.append("- Componentes: " + (", ".join(comps) if comps else "ninguno"))
        if loose: lines.append(f"- **Valores sin variable ({len(loose)})**: " + "; ".join(loose[:12]) + (" …" if len(loose) > 12 else ""))
        lines.append("")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
