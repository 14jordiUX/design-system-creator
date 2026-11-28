// Exporta un journey navegable (con sus variantes A, B…) hecho con el kit de un sistema de diseño.
//
//   node scripts/export_journey.mjs systems/sereno/journeys/pedir-cita    ← uno
//   node scripts/export_journey.mjs --all                                 ← todos los de base/ y systems/, y los prototipos
//   node scripts/export_journey.mjs --prototipos                          ← solo los prototipos (journeys/prototipos-<sistema>/)
//
// Lee la fuente (systems/<sistema>/journeys/<journey>/journey.json + <journey>.tsx) y escribe el resultado en
// journeys/<cliente>/<journey>/, como pide el contrato con el simulador de usuarios sintéticos:
//   journey.json, comun/estilo.css (+ comun/fuentes/), y una carpeta por variante con un HTML por pantalla.
// Las páginas son HTML ya renderizado con el CSS de los tokens: se abren con doble clic, sin servidor, sin conexión
// y sin JavaScript. Ese resultado no se edita a mano: se cambia la fuente y se vuelve a exportar.
//
// Necesita las dependencias de la web (cd web && npm install) y, la primera vez, internet para copiar las fuentes
// de Google Fonts dentro del journey (si no hay, avisa y usa las fuentes de sistema).
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { createRequire } from "node:module"
import { pathToFileURL, fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const WEB = path.join(ROOT, "web")
const TMP = path.join(WEB, "node_modules", ".dsc-journeys")   // dentro de web/node_modules: así encuentra React, Radix…
const CACHE_FUENTES = path.join(TMP, "_fuentes")
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SALIDA = "journeys"

const webRequire = createRequire(path.join(WEB, "package.json"))
const importar = async (mod) => import(pathToFileURL(webRequire.resolve(mod)).href)

class ErrorJourney extends Error {}

// ------------------------------------------------------------------ fuente

function leerFuente(dir) {
  const fuente = path.resolve(dir)
  const archivoJson = path.join(fuente, "journey.json")
  if (!fs.existsSync(archivoJson)) throw new ErrorJourney(`no encuentro ${path.relative(ROOT, archivoJson)}`)
  const j = JSON.parse(fs.readFileSync(archivoJson, "utf8"))
  const donde = path.relative(ROOT, archivoJson)
  const errores = []
  if (!ID.test(j.id || "")) errores.push("id: en minúsculas y con guiones (es el nombre de la carpeta)")
  if (j.id && j.id !== path.basename(fuente)) errores.push(`id: es «${j.id}» pero la carpeta se llama «${path.basename(fuente)}»`)
  if (!j.nombre) errores.push("nombre: falta")
  if (!ID.test(j.cliente || "")) errores.push("cliente: falta o no es un id válido (el mismo que en el simulador)")
  if (!Array.isArray(j.pantallas) || !j.pantallas.length) errores.push("pantallas: hace falta al menos una")
  if (!Array.isArray(j.variantes) || !j.variantes.length) errores.push("variantes: hace falta al menos la A")
  const ids = new Set()
  for (const p of j.pantallas || []) {
    if (!ID.test(p.id || "")) errores.push(`pantallas: «${p.id}» no es un id válido`)
    if (ids.has(p.id)) errores.push(`pantallas: «${p.id}» está repetida`)
    ids.add(p.id)
    if (!p.nombre) errores.push(`pantallas › ${p.id}: falta el nombre`)
  }
  const vids = new Set()
  for (const v of j.variantes || []) {
    if (!/^[A-Z][A-Za-z0-9-]*$/.test(v.id || "")) errores.push(`variantes: «${v.id}» no vale (usa A, B, C…)`)
    if (vids.has(v.id)) errores.push(`variantes: «${v.id}» está repetida`)
    vids.add(v.id)
    if (!v.nombre) errores.push(`variantes › ${v.id}: falta el nombre`)
    if (v.cambios !== undefined && !Array.isArray(v.cambios)) errores.push(`variantes › ${v.id}: «cambios» es una lista de frases`)
  }
  if ((j.variantes || []).length > 1 && (j.variantes || []).slice(1).some((v) => !(v.cambios || []).length))
    errores.push("variantes: cada variante que no es la A tiene que decir sus «cambios» (qué había en A)")
  if (j.objetivos !== undefined && !Array.isArray(j.objetivos)) errores.push("objetivos: tiene que ser una lista")
  const oids = new Set()
  for (const o of j.objetivos || []) {
    if (!ID.test(o.id || "")) errores.push(`objetivos: «${o.id}» no es un id válido`)
    if (oids.has(o.id)) errores.push(`objetivos: «${o.id}» está repetido`)
    oids.add(o.id)
    if (!o.nombre) errores.push(`objetivos › ${o.id}: falta el nombre (es lo que se ve en el dashboard)`)
    if (!ids.has(o.pantalla)) errores.push(`objetivos › ${o.id}: la pantalla «${o.pantalla}» no está en «pantallas»`)
  }
  const tsx = path.join(fuente, `${j.id}.tsx`)
  if (!fs.existsSync(tsx)) errores.push(`falta ${j.id}.tsx (las pantallas)`)
  if (errores.length) throw new ErrorJourney(`${donde}:\n  ✗ ` + errores.join("\n  ✗ "))

  // ¿De qué sistema es? systems/<id>/journeys/<j> o base/journeys/<j>
  const padre = path.basename(path.dirname(path.dirname(fuente)))
  const abuelo = path.basename(path.dirname(path.dirname(path.dirname(fuente))))
  const sistemaDir = path.dirname(path.dirname(fuente))
  const sistema = abuelo === "systems" ? padre : padre === "base" ? "base" : null
  if (!sistema) throw new ErrorJourney(`${donde}: la fuente tiene que estar en systems/<sistema>/journeys/ o en base/journeys/`)
  const kit = path.join(sistemaDir, "kit")
  if (!fs.existsSync(path.join(kit, "styles", "globals.css")))
    throw new ErrorJourney(`no encuentro el kit de «${sistema}» (${path.relative(ROOT, kit)}). Genera antes: python scripts/generate.py ${path.relative(ROOT, sistemaDir)}`)
  return { j, fuente, tsx, sistema, kit }
}

function todasLasFuentes() {
  const out = []
  const mirar = (d) => fs.existsSync(d) && fs.readdirSync(d).sort().forEach((n) => {
    if (fs.existsSync(path.join(d, n, "journey.json"))) out.push(path.join(d, n))
  })
  mirar(path.join(ROOT, "base", "journeys"))
  if (fs.existsSync(path.join(ROOT, "systems")))
    for (const s of fs.readdirSync(path.join(ROOT, "systems")).sort()) mirar(path.join(ROOT, "systems", s, "journeys"))
  return out
}

// ------------------------------------------------------------------ fuentes tipográficas (dentro del journey)

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
const GENERICAS = new Set(["ui-sans-serif", "ui-serif", "ui-monospace", "system-ui", "sans-serif", "serif", "monospace",
  "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "helvetica", "helvetica neue", "arial", "georgia",
  "times", "times new roman", "courier", "courier new", "menlo", "consolas", "inherit"])

// Las familias que usan los textos del journey: la base y la de cada estilo de texto (y la de código si se usa).
function familiasDelSistema(tokensCss, usaCodigo) {
  const vars = {}
  for (const m of tokensCss.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim()
  const resolver = (v, n = 0) => {
    const m = v && v.match(/^var\((--[a-z0-9-]+)\)$/)
    return m && n < 10 ? resolver(vars[m[1]], n + 1) : v
  }
  const usadas = Object.keys(vars).filter((k) => k === "--text-family-base" || /^--typography-[a-z0-9-]+-font-family$/.test(k)
    || (usaCodigo && k === "--text-family-code"))
  const fams = new Set()
  for (const k of usadas) {
    const primera = (resolver(vars[k]) || "").split(",")[0].trim().replace(/^["']|["']$/g, "")
    if (primera && !GENERICAS.has(primera.toLowerCase()) && !primera.startsWith("var(")) fams.add(primera)
  }
  return [...fams].sort()
}

async function descargar(url, como = "text") {
  const r = await fetch(url, { headers: { "User-Agent": UA } })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return como === "text" ? r.text() : Buffer.from(await r.arrayBuffer())
}

// Copia las fuentes de Google Fonts a comun/fuentes/ y devuelve los @font-face con rutas locales.
async function fuentesLocales(familias, destino, avisos) {
  const caras = new Map()
  fs.mkdirSync(CACHE_FUENTES, { recursive: true })
  for (const fam of familias) {
    const slug = fam.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const cacheCss = path.join(CACHE_FUENTES, `${slug}.css`)
    let css
    try {
      css = fs.existsSync(cacheCss) ? fs.readFileSync(cacheCss, "utf8")
        : await descargar(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, "+")}:wght@400;500;600;700;800&display=swap`)
      fs.writeFileSync(cacheCss, css)
    } catch (e) {
      avisos.push(`no he podido copiar la fuente «${fam}» (${e.message}); el journey usará la fuente de sistema`)
      continue
    }
    // Solo los alfabetos latinos (español, catalán…): el resto no hace falta.
    for (const [, sub, bloque] of css.matchAll(/\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
      if (sub !== "latin" && sub !== "latin-ext") continue
      const url = (bloque.match(/url\(([^)]+)\)/) || [])[1]
      if (!url) continue
      const peso = (bloque.match(/font-weight:\s*([^;]+);/) || [])[1]?.trim() || "400"
      const estilo = (bloque.match(/font-style:\s*([^;]+);/) || [])[1]?.trim() || "normal"
      const rango = (bloque.match(/unicode-range:\s*([^;]+);/) || [])[1]?.trim()
      const nombre = `${slug}-${sub}-${crypto.createHash("sha1").update(url).digest("hex").slice(0, 8)}.woff2`
      const cache = path.join(CACHE_FUENTES, nombre)
      try {
        if (!fs.existsSync(cache)) fs.writeFileSync(cache, await descargar(url, "bin"))
      } catch (e) {
        avisos.push(`no he podido copiar «${fam}» (${e.message}); el journey usará la fuente de sistema`)
        continue
      }
      fs.mkdirSync(path.join(destino, "fuentes"), { recursive: true })
      fs.copyFileSync(cache, path.join(destino, "fuentes", nombre))
      // Las fuentes variables traen el mismo archivo para todos los pesos: una sola regla con el rango de pesos.
      const clave = `${fam}|${estilo}|${nombre}`
      const cara = caras.get(clave) || { fam, estilo, nombre, rango, pesos: [] }
      cara.pesos.push(...peso.split(/\s+/).map(Number))
      caras.set(clave, cara)
    }
  }
  return [...caras.values()].map(({ fam, estilo, nombre, rango, pesos }) => {
    const min = Math.min(...pesos), max = Math.max(...pesos)
    return `@font-face { font-family: "${fam}"; font-style: ${estilo}; font-weight: ${min === max ? min : `${min} ${max}`}; ` +
      `font-display: swap; src: url("fuentes/${nombre}") format("woff2");${rango ? ` unicode-range: ${rango};` : ""} }`
  }).join("\n")
}

// ------------------------------------------------------------------ exportar

function vaciar(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

function copiarCarpeta(de, a) {
  fs.cpSync(de, a, { recursive: true })
}

const escapar = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function pagina({ titulo, pantalla, cuerpo, lang = "es" }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)}</title>
<link rel="stylesheet" href="../comun/estilo.css">
</head>
<body data-sim-pantalla="${escapar(pantalla)}">
${cuerpo}
</body>
</html>
`
}

// Lo mínimo del contrato, para avisar antes de pasarlo al simulador (que lo revisa entero con «revisar-journey»).
function revisarHtml(html, donde, archivos, errores) {
  for (const m of html.matchAll(/<(?:link|script|img|source|iframe|video|audio|embed)\b[^>]*?\s(?:href|src)="([^"]+)"/g))
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(m[1])) errores.push(`${donde}: carga «${m[1]}» de internet`)
  for (const m of html.matchAll(/<form\b[^>]*?\saction="([^"]*)"/g))
    if (!archivos.has(m[1])) errores.push(`${donde}: un formulario envía a «${m[1]}», que no es ninguna pantalla`)
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"#?]+)[^"]*"/g))
    if (!/^[a-z]+:/i.test(m[1]) && !archivos.has(m[1])) errores.push(`${donde}: enlaza a «${m[1]}», que no es ninguna pantalla`)
  if (/type="module"/.test(html)) errores.push(`${donde}: lleva un script de tipo «module»`)
  for (const m of html.matchAll(/data-sim-accion="([^"]*)"/g))
    if (!["principal", "secundaria", "salida"].includes(m[1])) errores.push(`${donde}: data-sim-accion="${m[1]}" no vale`)
  for (const m of html.matchAll(/data-sim-compromiso="([^"]*)"/g))
    if (!["datos-personales", "pago"].includes(m[1])) errores.push(`${donde}: data-sim-compromiso="${m[1]}" no vale`)
}

// El CSS de un journey o prototipo exportado: solo las clases que usan sus pantallas, con el tema del sistema,
// y las fuentes copiadas dentro (comun/estilo.css + comun/fuentes/).
async function escribirEstilo({ trabajo, pantallasHtml, comun, avisos, compile, Scanner, nombre, sistema }) {
  const tokensCss = fs.readFileSync(path.join(trabajo, "styles", "tokens.css"), "utf8")
  const usaCodigo = Object.values(pantallasHtml).some((h) => /font-code|<code|<pre|<kbd/.test(h))
  const caras = await fuentesLocales(familiasDelSistema(tokensCss, usaCodigo), comun, avisos)
  const compilador = await compile(`@import "./styles/globals.css";\n`, { base: trabajo, onDependency: () => {} })
  const scanner = new Scanner({})
  const candidatos = scanner.scanFiles(Object.values(pantallasHtml).map((content) => ({ content, extension: "html" })))
  const css = compilador.build(candidatos)
  fs.writeFileSync(path.join(comun, "estilo.css"),
    `/* ${nombre}: estilos del sistema «${sistema}». Generado con scripts/export_journey.mjs. No editar a mano. */\n` +
    (caras ? caras + "\n" : "") + css)
}

async function exportar(dir, herramientas) {
  const { j, tsx, sistema, kit, fuente } = leerFuente(dir)
  const { createServer, react, renderToStaticMarkup, createElement, compile, Scanner } = herramientas
  const avisos = []

  // 1. Copia de trabajo: el kit del sistema + la navegación + las pantallas, dentro de web/node_modules.
  const trabajo = path.join(TMP, `${sistema}--${j.id}`)
  vaciar(trabajo)
  copiarCarpeta(kit, trabajo)
  fs.copyFileSync(path.join(ROOT, "scripts", "journey", "navegacion.tsx"), path.join(trabajo, "journey.tsx"))
  fs.mkdirSync(path.join(trabajo, "_journey"), { recursive: true })
  for (const n of fs.readdirSync(fuente)) {
    if (n.endsWith(".tsx") || n.endsWith(".ts")) fs.copyFileSync(path.join(fuente, n), path.join(trabajo, "_journey", n))
  }

  // 2. Renderizar cada pantalla de cada variante a HTML (con Vite, como la web; React en el servidor).
  const server = await createServer({
    root: trabajo, configFile: false, logLevel: "error", appType: "custom",
    plugins: [react()],
    resolve: { alias: [{ find: /^@\//, replacement: trabajo.replace(/\\/g, "/") + "/" }] },
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  const pantallasHtml = {}
  try {
    const nav = await server.ssrLoadModule(path.join(trabajo, "journey.tsx"))
    const mod = await server.ssrLoadModule(path.join(trabajo, "_journey", `${j.id}.tsx`))
    const Journey = mod.default
    if (typeof Journey !== "function") throw new ErrorJourney(`${j.id}.tsx: tiene que exportar por defecto el journey ({ pantalla, variante })`)
    const archivo = (id) => {
      const p = j.pantallas.find((x) => x.id === id)
      if (!p) throw new ErrorJourney(`${j.id}.tsx: hay un enlace a la pantalla «${id}», que no está en journey.json`)
      return p.archivo || (p === j.pantallas[0] ? "index.html" : `${p.id}.html`)
    }
    for (const v of j.variantes) {
      for (const p of j.pantallas) {
        let cuerpo
        try {
          cuerpo = renderToStaticMarkup(createElement(nav.JourneyContexto.Provider, { value: { archivo } },
            createElement(Journey, { pantalla: p.id, variante: v.id })))
        } catch (e) {
          if (e instanceof ErrorJourney) throw e
          throw new ErrorJourney(`${j.id}.tsx, variante ${v.id}, pantalla «${p.id}»: ${e.message}`)
        }
        if (!cuerpo.trim()) throw new ErrorJourney(`${j.id}.tsx: la pantalla «${p.id}» de la variante ${v.id} sale vacía`)
        pantallasHtml[`${v.id}/${archivo(p.id)}`] = pagina({ titulo: `${p.nombre} · ${j.titulo || j.nombre}`, pantalla: p.id, cuerpo, lang: j.idioma || "es" })
      }
    }
    j._archivo = archivo
  } finally {
    await server.close()
  }

  // 3. Comprobar lo básico del contrato antes de escribir nada.
  const archivos = new Set(j.pantallas.map((p) => j._archivo(p.id)))
  const errores = []
  for (const [donde, html] of Object.entries(pantallasHtml)) revisarHtml(html, donde, archivos, errores)
  // Objetivos «al pulsar»: cada data-sim-objetivo está declarado, en su pantalla, en un enlace, botón o formulario.
  const objetivos = new Map((j.objetivos || []).map((o) => [o.id, o]))
  for (const v of j.variantes) {
    for (const p of j.pantallas) {
      const donde = `${v.id}/${j._archivo(p.id)}`
      const html = pantallasHtml[donde]
      for (const m of html.matchAll(/<([a-z]+)\b[^>]*?\sdata-sim-objetivo="([^"]*)"/g)) {
        const o = objetivos.get(m[2])
        if (!o) errores.push(`${donde}: data-sim-objetivo="${m[2]}" no está en journey.json › objetivos`)
        else if (o.pantalla !== p.id) errores.push(`${donde}: el objetivo «${m[2]}» es de la pantalla «${o.pantalla}», no de «${p.id}»`)
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m[2]))
          errores.push(`${donde}: data-sim-objetivo="${m[2]}" tiene que ir en minúsculas, números y guiones`)
        else if (!["a", "button", "form", "input", "summary"].includes(m[1]))
          avisos.push(`${donde}: data-sim-objetivo="${m[2]}" está en un <${m[1]}>: contará si se pulsa cualquier enlace o botón de dentro`)
      }
    }
  }
  // El mismo id en A y en B es el mismo elemento. Si una variante no lo tiene, en ella nadie lo pulsa (aviso);
  // si no lo tiene ninguna, el objetivo no se puede medir (error).
  for (const o of objetivos.values()) {
    const sin = j.variantes.filter((v) => !pantallasHtml[`${v.id}/${j._archivo(o.pantalla)}`].includes(`data-sim-objetivo="${o.id}"`))
    if (sin.length === j.variantes.length)
      errores.push(`objetivo «${o.id}»: ninguna variante tiene data-sim-objetivo="${o.id}" en la pantalla «${o.pantalla}»`)
    else for (const v of sin)
      avisos.push(`variante ${v.id}: el objetivo «${o.id}» no tiene ningún elemento en «${o.pantalla}» (en ella contará como que nadie lo pulsa)`)
  }
  if (errores.length) throw new ErrorJourney(`${j.id}: no cumple el contrato:\n  ✗ ` + errores.join("\n  ✗ "))

  // 4. Escribir journeys/<cliente>/<journey>/
  const destino = path.join(ROOT, SALIDA, j.cliente, j.id)
  vaciar(destino)
  const comun = path.join(destino, "comun")
  fs.mkdirSync(comun, { recursive: true })
  for (const [rel, html] of Object.entries(pantallasHtml)) {
    fs.mkdirSync(path.dirname(path.join(destino, rel)), { recursive: true })
    fs.writeFileSync(path.join(destino, rel), html)
  }

  // 5. CSS: solo las clases que usan las pantallas, con el tema del sistema, y las fuentes copiadas dentro.
  await escribirEstilo({ trabajo, pantallasHtml, comun, avisos, compile, Scanner, nombre: j.nombre, sistema })

  // 6. journey.json del contrato (lo que lee el simulador)
  const salida = {
    id: j.id,
    nombre: j.nombre,
    origen: "design-system-creator",
    sistemaDiseno: sistema,
    fuente: path.relative(ROOT, fuente).split(path.sep).join("/"),
    nota: "Generado con scripts/export_journey.mjs. No editar a mano: se cambia la fuente y se vuelve a exportar.",
    pantallas: j.pantallas.map((p) => ({ id: p.id, nombre: p.nombre, archivo: j._archivo(p.id) })),
    variantes: j.variantes.map((v) => ({ id: v.id, nombre: v.nombre, carpeta: v.id, cambios: v.cambios || [] })),
  }
  if ((j.objetivos || []).length)
    salida.objetivos = j.objetivos.map((o) => ({ id: o.id, nombre: o.nombre, condicion: "pulsa", pantalla: o.pantalla }))
  fs.writeFileSync(path.join(destino, "journey.json"), JSON.stringify(salida, null, 2) + "\n")
  fs.rmSync(trabajo, { recursive: true, force: true })

  const rel = path.relative(ROOT, destino).split(path.sep).join("/")
  console.log(`✓ ${rel}: ${j.pantallas.length} pantallas × ${j.variantes.length} variantes (${j.variantes.map((v) => v.id).join(", ")}), sistema «${sistema}»`)
  for (const a of avisos) console.log(`  ⚠ ${a}`)
  return rel
}

// ------------------------------------------------------------------ prototipos
//
// Cada prototipo del kit de cada sistema (systems/<sistema>/kit/prototypes/<prototipo>.tsx: los de base/prototypes/
// y los propios del sistema) se exporta también, para que el simulador lo pueda usar como variante de un test:
//   journeys/prototipos-<sistema>/<prototipo>/  (journey.json con «tipo: prototipo», una sola variante A)
// Un prototipo navega con go(id) en JavaScript; aquí se pinta cada pantalla y los botones que dice `meta.links`
// ({ from, text, to }) pasan a ser enlaces normales a la otra pantalla. No hace falta tocar nada del prototipo.

const PREFIJO_PROTOTIPOS = "prototipos-"

function todosLosPrototipos() {
  const out = []
  const systems = path.join(ROOT, "systems")
  if (!fs.existsSync(systems)) return out
  for (const sistema of fs.readdirSync(systems).sort()) {
    const dir = path.join(systems, sistema, "kit", "prototypes")
    if (!fs.existsSync(path.join(systems, sistema, "kit", "styles", "globals.css")) || !fs.existsSync(dir)) continue
    for (const n of fs.readdirSync(dir).sort()) {
      const slug = n.replace(/\.tsx$/, "")
      if (n.endsWith(".tsx") && ID.test(slug)) out.push({ sistema, slug })
    }
  }
  return out
}

const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", "#x27": "'" }
const textoDe = (html) => html.replace(/<[^>]*>/g, " ")
  .replace(/&(#?[a-z0-9]+);/gi, (m, e) => ENTIDADES[e.toLowerCase()] ?? (e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : m))
  .replace(/\s+/g, " ").trim()
const normal = (t) => t.toLocaleLowerCase("es").replace(/\s+/g, " ").trim()

// Convierte en <a href> los botones de `links` (los de esta pantalla), con la misma regla que la exportación a Figma:
// el texto del botón es el de `text` o empieza por él. Devuelve el HTML y los textos que no encontró.
function enlazar(html, links, archivo) {
  const usados = new Set()
  const salida = html.replace(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g, (todo, etiqueta, attrs, dentro) => {
    const txt = normal(textoDe(dentro))
    const l = links.find((x) => txt === normal(x.text)) ?? links.find((x) => txt.startsWith(normal(x.text)))
    if (!l) return todo
    usados.add(normal(l.text))
    const limpios = attrs.replace(/\s(?:type|href|disabled|form|formaction)(?:="[^"]*")?(?=\s|$)/g, "")
    // El botón principal del sistema (variante «default») es el paso siguiente; los demás, secundarios
    const accion = /data-sim-accion=/.test(limpios) ? "" : ` data-sim-accion="${/data-variant="default"/.test(limpios) ? "principal" : "secundaria"}"`
    return `<a href="${archivo(l.to)}"${accion}${limpios}>${dentro}</a>`
  })
  return { html: salida, faltan: links.filter((l) => !usados.has(normal(l.text))).map((l) => l.text) }
}

function paginaPrototipo({ titulo, pantalla, cuerpo }) {
  // height:100% para que el «min-h-full» de los prototipos ocupe toda la ventana, como en la web
  return pagina({ titulo, pantalla, cuerpo }).replace("<html lang=\"es\">", "<html lang=\"es\" style=\"height:100%\">")
    .replace(`<body data-sim-pantalla=`, `<body style="height:100%" data-sim-pantalla=`)
}

async function exportarPrototipo({ sistema, slug }, herramientas) {
  const { createServer, react, renderToStaticMarkup, createElement, compile, Scanner } = herramientas
  const kit = path.join(ROOT, "systems", sistema, "kit")
  const avisos = []
  const trabajo = path.join(TMP, `prototipo--${sistema}--${slug}`)
  vaciar(trabajo)
  copiarCarpeta(kit, trabajo)

  const server = await createServer({
    root: trabajo, configFile: false, logLevel: "error", appType: "custom",
    plugins: [react()],
    resolve: { alias: [{ find: /^@\//, replacement: trabajo.replace(/\\/g, "/") + "/" }] },
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  const donde = `systems/${sistema}/kit/prototypes/${slug}.tsx`
  const pantallasHtml = {}
  let meta
  try {
    const mod = await server.ssrLoadModule(path.join(trabajo, "prototypes", `${slug}.tsx`))
    meta = mod.meta
    const Prototipo = mod.default
    if (typeof Prototipo !== "function") throw new ErrorJourney(`${donde}: tiene que exportar por defecto el prototipo ({ screen, go })`)
    const screens = (meta && Array.isArray(meta.screens) ? meta.screens : []).filter((x) => x && ID.test(x.id || ""))
    if (!screens.length) throw new ErrorJourney(`${donde}: le falta «meta.screens» (la lista de pantallas)`)
    meta.screens = screens
    const archivo = (id) => (id === screens[0].id ? "index.html" : `${id}.html`)
    const links = (Array.isArray(meta.links) ? meta.links : []).filter((l) => l && l.text && screens.some((x) => x.id === l.to))
    for (const p of screens) {
      let cuerpo
      try {
        cuerpo = renderToStaticMarkup(createElement(Prototipo, { screen: p.id, go: () => {} }))
      } catch (e) {
        throw new ErrorJourney(`${donde}, pantalla «${p.id}»: ${e.message}`)
      }
      if (!cuerpo.trim()) throw new ErrorJourney(`${donde}: la pantalla «${p.id}» sale vacía`)
      const { html, faltan } = enlazar(cuerpo, links.filter((l) => l.from === p.id), archivo)
      for (const t of faltan) avisos.push(`pantalla «${p.id}»: no encuentro el botón «${t}» (meta.links); en el simulador no llevará a ningún sitio`)
      pantallasHtml[`A/${archivo(p.id)}`] = paginaPrototipo({ titulo: `${p.label || p.id} · ${meta.label || slug}`, pantalla: p.id, cuerpo: html })
    }
    meta._archivo = archivo
  } finally {
    await server.close()
  }

  const archivos = new Set(meta.screens.map((p) => meta._archivo(p.id)))
  const errores = []
  for (const [d, html] of Object.entries(pantallasHtml)) revisarHtml(html, d, archivos, errores)
  if (errores.length) throw new ErrorJourney(`${donde}: no cumple el contrato:\n  ✗ ` + errores.join("\n  ✗ "))

  const destino = path.join(ROOT, SALIDA, PREFIJO_PROTOTIPOS + sistema, slug)
  vaciar(destino)
  const comun = path.join(destino, "comun")
  fs.mkdirSync(comun, { recursive: true })
  for (const [rel, html] of Object.entries(pantallasHtml)) {
    fs.mkdirSync(path.dirname(path.join(destino, rel)), { recursive: true })
    fs.writeFileSync(path.join(destino, rel), html)
  }
  const nombre = meta.label || slug
  await escribirEstilo({ trabajo, pantallasHtml, comun, avisos, compile, Scanner, nombre, sistema })
  const propio = path.join("systems", sistema, "prototypes", slug, `${slug}.tsx`)
  const fuente = fs.existsSync(path.join(ROOT, propio)) ? propio : path.join("base", "prototypes", slug, `${slug}.tsx`)
  const salida = {
    id: slug,
    nombre,
    tipo: "prototipo",
    origen: "design-system-creator",
    sistemaDiseno: sistema,
    fuente: fuente.split(path.sep).join("/"),
    descripcion: meta.description || "",
    nota: "Generado con scripts/export_journey.mjs desde el prototipo. No editar a mano: se cambia el prototipo y se vuelve a exportar.",
    pantallas: meta.screens.map((p) => ({ id: p.id, nombre: p.label || p.id, archivo: meta._archivo(p.id) })),
    variantes: [{ id: "A", nombre, carpeta: "A", cambios: [] }],
  }
  fs.writeFileSync(path.join(destino, "journey.json"), JSON.stringify(salida, null, 2) + "\n")
  fs.rmSync(trabajo, { recursive: true, force: true })
  const rel = path.relative(ROOT, destino).split(path.sep).join("/")
  console.log(`✓ ${rel}: prototipo «${nombre}», ${meta.screens.length} pantallas`)
  for (const a of avisos) console.log(`  ⚠ ${a}`)
  return rel
}

// Quita los prototipos exportados que ya no existen (solo dentro de journeys/prototipos-*/).
function limpiarPrototipos(exportados) {
  const base = path.join(ROOT, SALIDA)
  if (!fs.existsSync(base)) return
  for (const carpeta of fs.readdirSync(base)) {
    if (!carpeta.startsWith(PREFIJO_PROTOTIPOS)) continue
    const dir = path.join(base, carpeta)
    for (const slug of fs.readdirSync(dir)) {
      const rel = `${SALIDA}/${carpeta}/${slug}`
      if (!exportados.has(rel)) { fs.rmSync(path.join(dir, slug), { recursive: true, force: true }); console.log(`− ${rel}: ya no existe el prototipo`) }
    }
    if (!fs.readdirSync(dir).length) fs.rmdirSync(dir)
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (!args.length || args.includes("-h") || args.includes("--help")) {
    console.log("Uso: node scripts/export_journey.mjs systems/<sistema>/journeys/<journey> [...]  |  --all")
    return 0
  }
  if (!fs.existsSync(path.join(WEB, "node_modules", "vite"))) {
    console.error("✗ Faltan las dependencias de la web. Instálalas una vez con: cd web && npm install")
    return 1
  }
  const todos = args.includes("--all")
  const conPrototipos = todos || args.includes("--prototipos")
  const dirs = todos ? todasLasFuentes() : args.filter((a) => !a.startsWith("--"))
  if (!dirs.length && !conPrototipos) { console.log("No hay journeys que exportar (systems/<sistema>/journeys/<journey>/journey.json)."); return 0 }

  const [{ createServer }, reactPlugin, server, React, tw, oxide] = await Promise.all([
    importar("vite"), importar("@vitejs/plugin-react"), importar("react-dom/server"), importar("react"),
    importar("@tailwindcss/node"), importar("@tailwindcss/oxide"),
  ])
  const herramientas = {
    createServer, react: reactPlugin.default, renderToStaticMarkup: server.renderToStaticMarkup || server.default.renderToStaticMarkup,
    createElement: React.createElement || React.default.createElement, compile: tw.compile, Scanner: oxide.Scanner,
  }
  let fallos = 0
  for (const d of dirs) {
    try {
      await exportar(d, herramientas)
    } catch (e) {
      fallos++
      console.error(e instanceof ErrorJourney ? `✗ ${e.message}` : e)
    }
  }
  if (conPrototipos) {
    // Un prototipo que no se puede exportar se avisa, pero no para la publicación de la web.
    const exportados = new Set()
    for (const p of todosLosPrototipos()) {
      try {
        exportados.add(await exportarPrototipo(p, herramientas))
      } catch (e) {
        exportados.add(`${SALIDA}/${PREFIJO_PROTOTIPOS}${p.sistema}/${p.slug}`)  // se deja el de la vez anterior
        console.error(`⚠ prototipo «${p.slug}» (${p.sistema}) sin exportar: ${e instanceof ErrorJourney ? e.message : e}`)
      }
    }
    limpiarPrototipos(exportados)
  }
  if (!fallos) console.log("\nPara comprobarlo, desde «Usuarios sintéticos»: python -m simulador revisar-journey journeys/<cliente>/<journey>")
  return fallos ? 1 : 0
}

process.exitCode = await main()
