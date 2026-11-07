"""Guarda los tokens que llegan del editor de la web sin desordenar los archivos.

Uso (lo llama servidor.mjs):  python scripts/save_tokens.py <carpeta-del-sistema> [carpeta-plantilla]  < {"primitives":…,"semantic":…,"light":…,"dark":…}
Si el sistema es nuevo (aún no tiene tokens), el orden se toma de la plantilla (normalmente base/).

El navegador desordena las claves que parecen números (0, 1, 2… van antes que $type y 0-5),
así que se respeta el orden del archivo que ya existe y las claves nuevas van al final.
"""
import json, os, sys

FILES = {"primitives": "primitives", "semantic": "semantic", "light": "color.light", "dark": "color.dark"}


def merge(old, new):
    if not isinstance(old, dict) or not isinstance(new, dict):
        return new
    out = {k: merge(old[k], new[k]) for k in old if k in new}
    out.update({k: v for k, v in new.items() if k not in old})
    return out


def main(folder, template=None):
    data = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    for key, name in FILES.items():
        path = os.path.join(folder, "tokens", f"{name}.tokens.json")
        old = {}
        src = path if os.path.exists(path) else os.path.join(template, "tokens", f"{name}.tokens.json") if template else None
        if src and os.path.exists(src):
            with open(src, encoding="utf-8") as f: old = json.load(f)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8", newline="\n") as f:
            json.dump(merge(old, data[key]), f, indent=2, ensure_ascii=False); f.write("\n")
        os.replace(tmp, path)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
