"""Añade a los sistemas existentes los tokens nuevos de token_extras.py.

Uso: python scripts/migrate.py --all   (o una carpeta concreta)"""
import json, os, sys
from token_extras import extend

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def migrate(d):
    files = {n: os.path.join(d, "tokens", f"{n}.tokens.json") for n in ["primitives", "semantic", "color.light", "color.dark"]}
    data = {n: json.load(open(p, encoding="utf-8")) for n, p in files.items()}
    extend(data["primitives"], data["semantic"], data["color.light"], data["color.dark"])
    for n, p in files.items():
        with open(p, "w", encoding="utf-8") as f: json.dump(data[n], f, indent=2, ensure_ascii=False); f.write("\n")
    print("migrado:", d)

if __name__ == "__main__":
    targets = sys.argv[1:]
    if targets == ["--all"]:
        targets = [os.path.join(ROOT, "base")] + [os.path.join(ROOT, "systems", x) for x in sorted(os.listdir(os.path.join(ROOT, "systems")))]
    for t_ in targets: migrate(t_)
