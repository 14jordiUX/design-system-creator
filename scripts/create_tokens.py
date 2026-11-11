"""Crea los tokens (formato W3C DTCG) de un sistema nuevo a partir del sistema base.

Uso:  python scripts/create_tokens.py <carpeta-del-sistema> [config.json]

Solo escribe tokens/*.tokens.json. Después, `python scripts/generate.py <carpeta>`
genera todas las salidas (CSS, Figma, vista previa, kit) a partir de esos tokens."""
import json, os, re, sys

OUT = sys.argv[1]
# Optional 2nd argument: JSON config to customise the base (scales, fonts, radius).
# Example: {"scales": {"brand": [11 hex 50..950]}, "fonts": {"sans": ["Nunito", "sans-serif"]}, "radius": {"md": "10px"}}
CONFIG = json.load(open(sys.argv[2], encoding="utf-8")) if len(sys.argv) > 2 else {}

# ---------- PRIMITIVES ----------
SCALES = {
    # neutral (zinc-like)
    "neutral": ["#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b"],
    # brand (indigo-like) - the one to change per system
    "brand":   ["#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81", "#1e1b4b"],
    "green":   ["#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"],
    "amber":   ["#fffbeb", "#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f", "#451a03"],
    "red":     ["#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a"],
    "blue":    ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"],
}
SCALES.update(CONFIG.get("scales", {}))
STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]

def t(value, type_=None, desc=None):
    d = {"$value": value}
    if type_: d["$type"] = type_
    if desc: d["$description"] = desc
    return d

primitives = {
    "color": {"$type": "color",
              "white": t("#ffffff"), "black": t("#000000"),
              **{name: {s: t(v) for s, v in zip(STEPS, vals)} for name, vals in SCALES.items()}},
    "space": {"$type": "dimension", **{k: t(v) for k, v in {
        "0": "0px", "0-5": "2px", "1": "4px", "1-5": "6px", "2": "8px", "3": "12px", "4": "16px", "5": "20px",
        "6": "24px", "8": "32px", "10": "40px", "12": "48px", "16": "64px", "20": "80px", "24": "96px"}.items()}},
    "radius": {"$type": "dimension", **{k: t(v) for k, v in {
        "none": "0px", "xs": "2px", "sm": "4px", "md": "6px", "lg": "8px", "xl": "12px", "2xl": "16px", "full": "9999px"}.items()}},
    "border-width": {"$type": "dimension", "0": t("0px"), "1": t("1px"), "2": t("2px"), "4": t("4px")},
    "font": {
        "family": {"$type": "fontFamily",
                   "sans": t(["Inter", "ui-sans-serif", "system-ui", "sans-serif"]),
                   "serif": t(["Georgia", "ui-serif", "serif"]),
                   "mono": t(["JetBrains Mono", "ui-monospace", "monospace"])},
        "size": {"$type": "dimension", **{k: t(v) for k, v in {
            "xs": "12px", "sm": "14px", "md": "16px", "lg": "18px", "xl": "20px", "2xl": "24px",
            "3xl": "30px", "4xl": "36px", "5xl": "48px", "6xl": "60px"}.items()}},
        "weight": {"$type": "fontWeight", "regular": t(400), "medium": t(500), "semibold": t(600), "bold": t(700)},
        "line-height": {"$type": "number", "tight": t(1.15), "snug": t(1.3), "normal": t(1.5), "relaxed": t(1.7)},
        "letter-spacing": {"$type": "dimension", "tight": t("-0.02em"), "normal": t("0em"), "wide": t("0.04em")},
    },
    "shadow": {"$type": "shadow",
        "sm": t({"color": "#0000000f", "offsetX": "0px", "offsetY": "1px", "blur": "2px", "spread": "0px"}),
        "md": t({"color": "#0000001a", "offsetX": "0px", "offsetY": "4px", "blur": "8px", "spread": "-2px"}),
        "lg": t({"color": "#0000001f", "offsetX": "0px", "offsetY": "12px", "blur": "24px", "spread": "-4px"}),
        "xl": t({"color": "#00000029", "offsetX": "0px", "offsetY": "24px", "blur": "48px", "spread": "-8px"})},
    "duration": {"$type": "duration", "instant": t("0ms"), "fast": t("120ms"), "normal": t("200ms"), "slow": t("320ms")},
    "easing": {"$type": "cubicBezier",
        "standard": t([0.2, 0, 0, 1]), "enter": t([0, 0, 0.2, 1]), "exit": t([0.4, 0, 1, 1])},
    "opacity": {"$type": "number", "disabled": t(0.5), "overlay": t(0.6)},
}

for k, v in CONFIG.get("fonts", {}).items(): primitives["font"]["family"][k] = t(v)
for k, v in CONFIG.get("radius", {}).items(): primitives["radius"][k] = t(v)

# ---------- SEMANTIC COLOR (light / dark) ----------
def ref(p): return "{" + p + "}"
def c(scale, step): return ref(f"color.{scale}.{step}")

def semantic_colors(dark):
    n = lambda l, d: c("neutral", d if dark else l)
    b = lambda l, d: c("brand", d if dark else l)
    W, B = ref("color.white"), ref("color.black")
    SOLID = {"green": "700", "amber": "500", "red": "600", "blue": "600"}
    def feedback(scale):
        on = c("neutral", "950") if scale == "amber" else W
        return {
            "solid": t(c(scale, SOLID[scale]), desc="Fondo sólido (badges, botones)"),
            "on-solid": t(on, desc="Texto sobre el fondo sólido"),
            "subtle": t(c(scale, "950" if dark else "50"), desc="Fondo suave de alertas"),
            "border": t(c(scale, "800" if dark else "200")),
            "text": t(c(scale, "300" if dark else "700")),
        }
    return {"color": {"$type": "color",
        "bg": {
            "default": t(c("neutral", "950") if dark else W, desc="Fondo de la página"),
            "subtle": t(n("50", "900")),
            "muted": t(n("100", "800"), desc="Zonas secundarias, filas alternas"),
            "inverse": t(n("900", "50")),
        },
        "surface": {
            "card": t(c("neutral", "900") if dark else W, desc="Tarjetas"),
            "popover": t(c("neutral", "900") if dark else W, desc="Menús, popovers, tooltips"),
            "overlay": t("#09090b99", desc="Velo detrás de modales"),
        },
        "text": {
            "default": t(n("950", "50"), desc="Texto principal"),
            "muted": t(n("600", "400"), desc="Texto secundario"),
            "subtle": t(n("400", "500"), desc="Placeholders, deshabilitado"),
            "inverse": t(n("50", "950")),
            "link": t(b("600", "400")),
        },
        "border": {
            "default": t(n("200", "800")),
            "strong": t(n("300", "700")),
            "input": t(n("200", "800"), desc="Borde de campos de formulario"),
            "focus": t(b("500", "400"), desc="Anillo de foco"),
        },
        "action": {
            "primary": {
                "default": t(b("600", "600")), "hover": t(b("700", "700")), "active": t(b("800", "800")),
                "on": t(W, desc="Texto/icono sobre primary"),
                "subtle": t(b("50", "950"), desc="Fondo suave (tags, selección)"),
            },
            "secondary": {
                "default": t(n("100", "800")), "hover": t(n("200", "700")), "active": t(n("300", "600")),
                "on": t(n("900", "50")),
            },
            "ghost": {"hover": t(n("100", "800")), "on": t(n("900", "50"))},
            "disabled": {"default": t(n("100", "800")), "on": t(n("400", "600"))},
        },
        "feedback": {"success": feedback("green"), "warning": feedback("amber"),
                     "danger": feedback("red"), "info": feedback("blue")},
    }}

# ---------- SEMANTIC (mode-independent) ----------
semantic_base = {
    "typography": {},   # los estilos de texto los pone token_extras.text_styles (apuntan a text.*)
    "space": {"$type": "dimension",
        "inset": {k: t(ref(f"space.{v}"), desc=d) for k, v, d in [
            ("xs", "1", "Padding interno mínimo"), ("sm", "2", "Badges, chips"), ("md", "4", "Botones, campos"),
            ("lg", "6", "Tarjetas"), ("xl", "8", "Secciones, modales")]},
        "gap": {k: t(ref(f"space.{v}")) for k, v in [("xs", "1"), ("sm", "2"), ("md", "4"), ("lg", "6"), ("xl", "8")]},
        "section": t(ref("space.16"), desc="Separación entre secciones de página"),
    },
    "radius": {"$type": "dimension",
        "control": t(ref("radius.md"), desc="Botones, campos, selects"),
        "card": t(ref("radius.lg"), desc="Tarjetas y paneles"),
        "overlay": t(ref("radius.xl"), desc="Modales, popovers"),
        "pill": t(ref("radius.full"), desc="Badges, avatares, toggles"),
    },
    "elevation": {"$type": "shadow",
        "flat": t(ref("shadow.sm")), "raised": t(ref("shadow.md"), desc="Tarjetas elevadas, dropdowns"),
        "overlay": t(ref("shadow.lg"), desc="Popovers, menús"), "modal": t(ref("shadow.xl"))},
    "motion": {
        "duration": {"$type": "duration", "micro": t(ref("duration.fast"), desc="Hover, foco"),
                     "default": t(ref("duration.normal")), "emphasis": t(ref("duration.slow"), desc="Modales, paneles")},
        "easing": {"$type": "cubicBezier", "default": t(ref("easing.standard"))},
    },
    "control": {"$type": "dimension",
        "height": {"sm": t("32px"), "md": t("40px"), "lg": t("48px")},
        "border-width": t(ref("border-width.1")),
        "focus-ring-width": t(ref("border-width.2")),
    },
}

light, dark = semantic_colors(False), semantic_colors(True)
from token_extras import extend
extend(primitives, semantic_base, light, dark)

# ---------- write DTCG files ----------
os.makedirs(f"{OUT}/tokens", exist_ok=True)
def dump(path, obj):
    with open(path, "w", encoding="utf-8") as f: json.dump(obj, f, indent=2, ensure_ascii=False); f.write("\n")
dump(f"{OUT}/tokens/primitives.tokens.json", primitives)
dump(f"{OUT}/tokens/semantic.tokens.json", semantic_base)
dump(f"{OUT}/tokens/color.light.tokens.json", light)
dump(f"{OUT}/tokens/color.dark.tokens.json", dark)

print("tokens ok:", OUT)
