"""Comprueba que el generador de Python (new_system.py) y el de la web (web/src/lib/generator.ts) dan los mismos tokens.

Uso: python scripts/check_generator.py      (necesita Node 22.6 o superior)
"""
import json, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import new_system as ns

CASES = [
    {"name": "A", "brand": "#e2662a", "sober": 90, "serious": 80, "dense": 20},
    {"name": "B", "brand": "#0f766e", "warmNeutral": True, "unit": "8", "density": 90, "scale": "amplia", "radius": 0},
    {"name": "C", "brand": "#7c3aed", "sober": 10, "serious": 10, "dense": 70, "border": 2, "shadow": 100, "speed": 0},
    {"name": "D", "brand": "#fde047", "scale": "compacta", "radius": 24, "density": 0},
]

with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f: json.dump(CASES, f)
here = os.path.dirname(os.path.abspath(__file__))
r = subprocess.run(  # noqa
    ["node", "--experimental-strip-types", "--no-warnings", os.path.join(here, "generator_parity.ts"), f.name], capture_output=True, text=True, encoding="utf-8")
os.unlink(f.name)
if r.returncode: sys.exit(r.stderr)
base, fails = ns.load_base(), 0
for case, js in zip(CASES, json.loads(r.stdout)):
    py = ns.build_tokens(base, ns.normalize(case))["primitives"]
    if py != js:
        fails += 1
        print(f"Distinto en el caso {case['name']}")
print("Generadores iguales" if not fails else f"{fails} casos distintos")
sys.exit(1 if fails else 0)
