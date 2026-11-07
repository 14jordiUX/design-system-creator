// Servidor local del Design System Creator (paso 1.4).
// Abre la web en http://localhost:5179 y permite GUARDAR en la carpeta lo que cambias en el modo editor.
// Arranque: doble clic en «Abrir el editor.bat» (o `node servidor.mjs`). Solo escucha en este ordenador.
//
// Al guardar un sistema:
//   1. escribe systems/<id>/tokens/*.tokens.json  (la fuente de verdad) y actualiza system.json
//   2. regenera sus salidas con Python: scripts/generate.py  (css, figma, preview, kit)
//   3. reconstruye la web (npm run build) y la copia a «Abrir la web.html»
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { spawn, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.DSC_PORT || 5179)
const HOST = "127.0.0.1"
const WEB_FILE = path.join(ROOT, "Abrir la web.html")
const FILES = { primitives: "primitives", semantic: "semantic", light: "color.light", dark: "color.dark" }
const isWin = process.platform === "win32"

// ---------- Python ----------
function findPython() {
  const cands = []
  if (process.env.PYTHON) cands.push([process.env.PYTHON])
  if (isWin) {
    const progs = path.join(process.env.LOCALAPPDATA || "", "Programs", "Python")
    if (fs.existsSync(progs)) {
      for (const d of fs.readdirSync(progs).filter((d) => /^Python3\d+$/.test(d)).sort().reverse())
        cands.push([path.join(progs, d, "python.exe")])
    }
    cands.push(["py", "-3"])
  }
  cands.push(["python3"], ["python"])
  for (const [cmd, ...args] of cands) {
    try {
      const r = spawnSync(cmd, [...args, "--version"], { encoding: "utf8", timeout: 10000 })
      if (r.status === 0 && /Python 3/.test(r.stdout + r.stderr)) return [cmd, ...args]
    } catch {}
  }
  return null
}
const PYTHON = findPython()

// ---------- tareas en segundo plano ----------
const job = { state: "idle", step: "", log: [], startedAt: 0, finishedAt: 0, system: "" }
const say = (t) => { job.log.push(t); console.log("  " + t) }

// Ejecuta un programa. En Windows va por la consola (npm es un .cmd), con todo ya entrecomillado.
function run(cmd, args, cwd, input) {
  return new Promise((resolve, reject) => {
    const line = [cmd, ...args].map(q).join(" ")
    const p = isWin ? spawn(line, { cwd, shell: true, env: process.env }) : spawn(cmd, args, { cwd, env: process.env })
    let out = ""
    p.stdout.on("data", (d) => (out += d))
    p.stderr.on("data", (d) => (out += d))
    p.on("error", reject)
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(out.trim().split("\n").slice(-15).join("\n") || `código ${code}`))))
    if (input !== undefined) p.stdin.end(input)
  })
}
const q = (s) => (/[\s"&()^|<>]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

async function rebuild(dir) {
  if (PYTHON) {
    job.step = "Generando CSS, Figma y kit"; say(job.step + "…")
    const [cmd, ...pre] = PYTHON
    await run(cmd, [...pre, path.join(ROOT, "scripts", "generate.py"), dir], ROOT)
  } else {
    say("Aviso: no encuentro Python. Guardo los tokens y la web, pero el CSS, Figma y el kit no se regeneran.")
  }
  job.step = "Actualizando la web"; say(job.step + " (tarda unos segundos)…")
  await run(isWin ? "npm.cmd" : "npm", ["run", "build"], path.join(ROOT, "web"))
  fs.copyFileSync(path.join(ROOT, "web", "dist", "index.html"), WEB_FILE)
}

function writeJson(file, obj) {
  const tmp = file + ".tmp"
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8")
  fs.renameSync(tmp, file)
}

function systemDir(id) {
  if (id === "base") return path.join(ROOT, "base")
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return null
  return path.join(ROOT, "systems", id)
}

async function writeTokens(dir, tokens, template) {
  if (PYTHON) {
    // Python respeta el orden de las claves del archivo (el navegador pone primero las que parecen números)
    const [cmd, ...pre] = PYTHON
    await run(cmd, [...pre, path.join(ROOT, "scripts", "save_tokens.py"), dir, ...(template ? [template] : [])], ROOT, JSON.stringify(tokens))
  } else {
    fs.mkdirSync(path.join(dir, "tokens"), { recursive: true })
    for (const [key, name] of Object.entries(FILES)) writeJson(path.join(dir, "tokens", `${name}.tokens.json`), tokens[key])
  }
}

const today = () => new Date().toISOString().slice(0, 10)
const startJob = (system, step) => Object.assign(job, { state: "working", step, log: [], startedAt: Date.now(), finishedAt: 0, system })
const endJob = (e) => {
  if (e) { job.state = "error"; job.step = "Error"; say(String(e.message || e)) }
  else { job.state = "done"; job.step = "Guardado"; say("Listo.") }
  job.finishedAt = Date.now()
}

// Guardar los cambios del modo editor
async function save(id, tokens) {
  const dir = systemDir(id)
  startJob(id, "Guardando tokens")
  try {
    say("Guardando tokens de «" + id + "»…")
    await writeTokens(dir, tokens)
    const metaFile = path.join(dir, "system.json")
    const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"))
    meta.updatedAt = today()
    writeJson(metaFile, meta)
    await rebuild(dir)
    endJob()
  } catch (e) { endJob(e) }
}

// Crear un sistema nuevo (cuestionario)
async function create(id, meta, tokens, answers) {
  const dir = path.join(ROOT, "systems", id)
  startJob(id, "Creando la carpeta")
  try {
    say("Creando «" + id + "»…")
    fs.mkdirSync(dir, { recursive: true })
    const { id: _, createdAt: __, updatedAt: ___, ...rest } = meta
    writeJson(path.join(dir, "system.json"), { id, ...rest, createdAt: today(), updatedAt: today() })
    if (answers) writeJson(path.join(dir, "config.json"), { cuestionario: answers })
    job.step = "Guardando tokens"; say(job.step + "…")
    await writeTokens(dir, tokens, path.join(ROOT, "base"))
    await rebuild(dir)
    endJob()
  } catch (e) {
    // Si falla, no dejamos un sistema a medias en la biblioteca
    try { if (!fs.existsSync(path.join(dir, "css"))) fs.rmSync(dir, { recursive: true, force: true }) } catch {}
    endJob(e)
  }
}

function freeId(wanted) {
  let base = String(wanted || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "sistema"
  if (base === "base") base = "base-2"
  let id = base, n = 2
  while (fs.existsSync(path.join(ROOT, "systems", id))) id = `${base}-${n++}`
  return id
}

const validTokens = (t) => t && Object.keys(FILES).every((k) => t[k] && typeof t[k] === "object" && !Array.isArray(t[k]))

// ---------- HTTP ----------
function send(res, code, body, type = "application/json; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" })
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body)
}

function readBody(req, limit = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = []
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(new Error("demasiado grande")); req.destroy() } else chunks.push(c) })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

const server = http.createServer(async (req, res) => {
  // Solo peticiones de esta misma web (evita que otra página escriba en tu carpeta)
  const origin = req.headers.origin
  if (origin && origin !== `http://localhost:${PORT}` && origin !== `http://${HOST}:${PORT}`) return send(res, 403, { error: "origen no permitido" })
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    if (!fs.existsSync(WEB_FILE)) return send(res, 404, "Falta «Abrir la web.html».", "text/plain; charset=utf-8")
    return send(res, 200, fs.readFileSync(WEB_FILE), "text/html; charset=utf-8")
  }
  if (req.method === "GET" && url.pathname === "/api/ping") return send(res, 200, { ok: true, python: !!PYTHON })
  if (req.method === "GET" && url.pathname === "/api/status") return send(res, 200, job)

  if (req.method === "POST" && url.pathname === "/api/systems/new") {
    if (req.headers["content-type"]?.split(";")[0] !== "application/json") return send(res, 415, { error: "se espera JSON" })
    if (job.state === "working") return send(res, 409, { error: "Ya estoy guardando, espera un momento." })
    let body
    try { body = JSON.parse(await readBody(req)) } catch { return send(res, 400, { error: "JSON no válido" }) }
    const meta = body?.meta
    if (!meta || typeof meta.name !== "string" || !meta.name.trim()) return send(res, 400, { error: "Falta el nombre del sistema." })
    if (!validTokens(body.tokens)) return send(res, 400, { error: "Faltan archivos de tokens (primitives, semantic, light, dark)." })
    const id = freeId(meta.id || meta.name)
    create(id, meta, body.tokens, body.answers)
    return send(res, 202, { ok: true, id })
  }

  const m = url.pathname.match(/^\/api\/systems\/([^/]+)\/save$/)
  if (req.method === "POST" && m) {
    if (req.headers["content-type"]?.split(";")[0] !== "application/json") return send(res, 415, { error: "se espera JSON" })
    if (job.state === "working") return send(res, 409, { error: "Ya estoy guardando, espera un momento." })
    const id = decodeURIComponent(m[1]); const dir = systemDir(id)
    if (!dir || !fs.existsSync(path.join(dir, "system.json"))) return send(res, 404, { error: `No existe el sistema «${id}».` })
    let body
    try { body = JSON.parse(await readBody(req)) } catch { return send(res, 400, { error: "JSON no válido" }) }
    const t = body?.tokens
    if (!validTokens(t))
      return send(res, 400, { error: "Faltan archivos de tokens (primitives, semantic, light, dark)." })
    save(id, t)
    return send(res, 202, { ok: true })
  }
  send(res, 404, { error: "no encontrado" })
})

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") console.log(`\nYa hay un editor abierto en http://localhost:${PORT} (puedes cerrar esta ventana).\n`)
  else console.error(e)
  process.exit(1)
})

server.listen(PORT, HOST, () => {
  console.log(`\n  Design System Creator: http://localhost:${PORT}`)
  console.log(`  Python: ${PYTHON ? PYTHON.join(" ") : "no encontrado (no se regenerará el kit)"}`)
  console.log("  Deja esta ventana abierta mientras editas. Ciérrala para apagar el editor.\n")
  if (process.argv.includes("--abrir")) {
    const u = `http://localhost:${PORT}`
    if (isWin) spawn("cmd", ["/c", "start", "", u], { detached: true, stdio: "ignore" })
    else if (process.platform === "darwin") spawn("open", [u], { detached: true, stdio: "ignore" })
  }
})
