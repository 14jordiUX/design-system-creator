"""Actualiza la lista completa de Google Fonts que usa el editor (web/src/lib/google-fonts.json).

Sale del paquete npm `google-font-metadata` (datos públicos de Google Fonts, sin clave de API):
    npm pack google-font-metadata && tar xzf google-font-metadata-*.tgz
    python scripts/update_google_fonts.py package/data/google-fonts-v2.json
Formato: [[familia, categoría, "pesos separados por ;"], ...]  categoría: sans | serif | display | handwriting | mono"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = {"sans-serif": "sans", "serif": "serif", "display": "display", "handwriting": "handwriting", "monospace": "mono"}

src = json.load(open(sys.argv[1], encoding="utf-8"))
rows = sorted(([f["family"], CAT.get(f["category"], "sans"), ";".join(str(w) for w in sorted(f["weights"]))]
               for f in src.values() if "latin" in f.get("subsets", [])), key=lambda r: r[0].lower())
out = os.path.join(ROOT, "web", "src", "lib", "google-fonts.json")
with open(out, "w", encoding="utf-8") as f:
    f.write("[\n" + ",\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n]\n")
print(len(rows), "familias ->", out)
