"""Publica cada sistema como «registro» de shadcn/ui.

En un proyecto con shadcn, un componente ya con el estilo del sistema se instala así:
  npx shadcn@latest add https://<usuario>.github.io/<repo>/r/<sistema>/button.json
y el sistema entero (todos los componentes, tema, utilidades) así:
  npx shadcn@latest add https://<usuario>.github.io/<repo>/r/<sistema>/todo.json

Uso: python scripts/build_registry.py [carpeta_salida] [--url https://…]
     (por defecto web/public/r, que la web publica tal cual; la URL sale del remoto de git o de GITHUB_REPOSITORY)
Lo ejecuta GitHub al publicar (.github/workflows/web.yml). No se guarda en el repositorio.
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UI_DIR = os.path.join(ROOT, "web", "src", "components", "ui")
HOOKS_DIR = os.path.join(ROOT, "web", "src", "hooks")
UTILS = os.path.join(ROOT, "web", "src", "lib", "utils.ts")
ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json"


def site_url():
    repo = os.environ.get("GITHUB_REPOSITORY")
    if not repo:
        try:
            remote = subprocess.run(["git", "remote", "get-url", "origin"], cwd=ROOT, capture_output=True, text=True).stdout
            m = re.search(r"github\.com[/:]([^/]+/[^/.\s]+)", remote)
            repo = m.group(1) if m else None
        except Exception: repo = None
    if not repo: return "https://ejemplo.github.io/design-system-creator"
    owner, name = repo.split("/")
    return f"https://{owner.lower()}.github.io/{name}"


def read(p):
    with open(p, encoding="utf-8") as f: return f.read()


def npm_deps(src):
    out = set()
    for mod in re.findall(r'from\s+"([^"]+)"', src):
        if mod.startswith((".", "@/")) or mod in ("react", "react-dom"): continue
        parts = mod.split("/")
        out.add("/".join(parts[:2]) if mod.startswith("@") else parts[0])
    return sorted(out)


def systems():
    yield "base", os.path.join(ROOT, "base")
    sd = os.path.join(ROOT, "systems")
    for d in sorted(os.listdir(sd)) if os.path.isdir(sd) else []:
        if os.path.isfile(os.path.join(sd, d, "system.json")): yield d, os.path.join(sd, d)


def build(out_dir, base_url):
    comps = sorted(f[:-4] for f in os.listdir(UI_DIR) if f.endswith(".tsx"))
    hooks = sorted(f[:-3] for f in os.listdir(HOOKS_DIR) if f.endswith(".ts")) if os.path.isdir(HOOKS_DIR) else []
    index = []
    for sid, sdir in systems():
        meta = json.loads(read(os.path.join(sdir, "system.json")))
        url = lambda name: f"{base_url}/r/{sid}/{name}.json"
        d = os.path.join(out_dir, sid)
        os.makedirs(d, exist_ok=True)
        items = []

        def emit(item):
            items.append({k: v for k, v in item.items() if k != "files"} | {"files": [{k: v for k, v in f.items() if k != "content"} for f in item["files"]]})
            with open(os.path.join(d, item["name"] + ".json"), "w", encoding="utf-8", newline="\n") as f:
                json.dump({"$schema": ITEM_SCHEMA, **item}, f, ensure_ascii=False, indent=2)

        emit({
            "name": "theme", "type": "registry:file", "title": f"Tema de {meta['name']}",
            "description": "Variables y tema de Tailwind v4 del sistema. Importa src/design-system/globals.css una vez en la raíz de la app (en lugar de @import \"tailwindcss\").",
            "files": [
                {"path": "design-system/globals.css", "type": "registry:file", "target": "~/src/design-system/globals.css", "content": read(os.path.join(sdir, "css", "globals.css"))},
                {"path": "design-system/tokens.css", "type": "registry:file", "target": "~/src/design-system/tokens.css", "content": read(os.path.join(sdir, "css", "tokens.css"))},
            ],
        })
        utils_src = read(UTILS)
        emit({"name": "utils", "type": "registry:lib", "title": "Utilidades (cn y tokenPx)", "dependencies": npm_deps(utils_src),
              "files": [{"path": "lib/utils.ts", "type": "registry:lib", "content": utils_src}]})
        for h in hooks:
            src = read(os.path.join(HOOKS_DIR, h + ".ts"))
            emit({"name": h, "type": "registry:hook", "dependencies": npm_deps(src), "files": [{"path": f"hooks/{h}.ts", "type": "registry:hook", "content": src}]})
        for c in comps:
            src = read(os.path.join(UI_DIR, c + ".tsx"))
            deps = [url("theme"), url("utils")]
            deps += [url(x) for x in sorted(set(re.findall(r'"@/components/ui/([\w-]+)"', src))) if x != c]
            deps += [url(x) for x in sorted(set(re.findall(r'"@/hooks/([\w-]+)"', src)))]
            emit({"name": c, "type": "registry:ui", "title": c.replace("-", " ").title(),
                  "description": f"{c} de shadcn/ui con el estilo de {meta['name']} (todo sale de tokens).",
                  "dependencies": npm_deps(src), "registryDependencies": deps,
                  "files": [{"path": f"ui/{c}.tsx", "type": "registry:ui", "content": src}]})
        emit({"name": "todo", "type": "registry:item", "title": f"{meta['name']} completo",
              "description": f"Todos los componentes de {meta['name']}, con su tema y utilidades.",
              "registryDependencies": [url(c) for c in comps], "files": []})
        with open(os.path.join(d, "registry.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump({"$schema": "https://ui.shadcn.com/schema/registry.json", "name": sid, "homepage": f"{base_url}/#/s/{sid}", "items": items}, f, ensure_ascii=False, indent=2)
        index.append(sid)
    print(f"Registro de shadcn: {len(index)} sistemas × {len(comps)} componentes en {os.path.relpath(out_dir, ROOT)} ({base_url}/r/…)")


if __name__ == "__main__":
    args = sys.argv[1:]
    url = args[args.index("--url") + 1] if "--url" in args else site_url()
    pos = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] != "--url")]
    build(os.path.abspath(pos[0]) if pos else os.path.join(ROOT, "web", "public", "r"), url.rstrip("/"))
