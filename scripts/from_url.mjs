// Crea un sistema de diseño a partir de una web (paso 2.1).
// Abre la página con un navegador sin ventana, mira los estilos que usa de verdad (colores de botones,
// enlaces y fondos, fuente, tamaño de letra, radios, bordes, sombras y altura de los botones) y los
// convierte en las mismas respuestas que el cuestionario. Después llama a scripts/new_system.py.
//
// Uso:
//   node scripts/from_url.mjs https://ejemplo.com [--name "Nombre"] [--dry-run]   → una web
//   node scripts/from_url.mjs --requests                                          → procesa peticiones/*.json
//
// Las peticiones las crea la web online (botón «Desde una web») o Claude: peticiones/<id>.json = { url, name? }.
// GitHub las procesa al publicar (.github/workflows/web.yml) y deja el resultado en peticiones/resultados/<id>.json.
// Necesita Playwright (en GitHub se instala solo).

import { createRequire } from "node:module"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const require = createRequire(path.join(ROOT, "web", "package.json"))
const PY = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3")

// ---------- color ----------
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
function oklch([r, g, b]) {
  ;[r, g, b] = [r, g, b].map((v) => toLin(v / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { L, C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360, A, B }
}
function lum([r, g, b]) { return 0.2126 * toLin(r / 255) + 0.7152 * toLin(g / 255) + 0.0722 * toLin(b / 255) }
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const near = (a, b) => { const p = oklch(a), q = oklch(b); return Math.hypot(p.L - q.L, p.A - q.A, p.B - q.B) < 0.05 }

/** Agrupa colores parecidos sumando su peso. */
function cluster(items) {
  const groups = []
  for (const it of items) {
    const g = groups.find((g) => near(g.rgb, it.rgb))
    if (g) { g.w += it.w; if (it.w > g.top) { g.top = it.w; g.rgb = it.rgb } } else groups.push({ rgb: it.rgb, w: it.w, top: it.w })
  }
  return groups.sort((a, b) => b.w - a.w)
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null }
const GENERIC = /^(system-ui|-apple-system|blinkmacsystemfont|segoe ui|helvetica( neue)?|arial|sans-serif|serif|monospace|ui-sans-serif|ui-serif|ui-monospace|roboto flex|apple color emoji|segoe ui emoji|inherit|initial)$/i

// ---------- lo que se mide dentro de la página ----------
function measure() {
  const cv = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  const rgba = (c) => {
    if (!c || c === "transparent") return null
    cv.clearRect(0, 0, 1, 1); cv.fillStyle = "#000"; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1)
    const d = cv.getImageData(0, 0, 1, 1).data
    return d[3] < 200 ? null : [d[0], d[1], d[2]]
  }
  const vh = innerHeight, maxY = vh * 4
  const out = { bg: [], text: [], buttons: [], links: [], inputs: [], fonts: {}, heading: {}, sizes: [], shadows: 0, boxes: 0 }
  const visible = (el, r) => r.width > 0 && r.height > 0 && r.top < maxY && r.bottom > 0 && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).opacity !== "0"
  const all = [...document.querySelectorAll("body *")].slice(0, 6000)
  const btnSel = 'button, [role="button"], input[type="submit"], input[type="button"], a[class*="btn" i], a[class*="button" i], a[class*="cta" i]'
  for (const el of [document.documentElement, document.body, ...all]) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
    if (el !== document.documentElement && el !== document.body && !visible(el, r)) continue
    const area = Math.max(0, Math.min(r.bottom, maxY) - Math.max(r.top, 0)) * Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0))
    const bg = rgba(cs.backgroundColor)
    if (bg) out.bg.push({ rgb: bg, w: el === document.documentElement || el === document.body ? innerWidth * maxY : area })
    const ownText = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("")
    if (ownText.length) {
      const col = rgba(cs.color)
      if (col) out.text.push({ rgb: col, w: ownText.length })
      const fam = cs.fontFamily, w = ownText.length
      out.fonts[fam] = (out.fonts[fam] || 0) + w
      if (/^H[1-3]$/.test(el.tagName)) out.heading[fam] = (out.heading[fam] || 0) + w
      if (!/^H[1-6]$/.test(el.tagName) && w > 30) out.sizes.push({ size: parseFloat(cs.fontSize), w })
    }
    if (el.matches(btnSel) && r.width >= 50 && r.width <= 520 && r.height >= 24 && r.height <= 90) {
      const col = rgba(cs.color)
      out.buttons.push({ rgb: bg, text: col, w: r.width * r.height, h: r.height, radius: parseFloat(cs.borderTopLeftRadius) || 0, weight: cs.fontWeight })
    } else if (el.tagName === "A" && ownText.length) {
      const col = rgba(cs.color); if (col) out.links.push({ rgb: col, w: ownText.length })
    }
    if (el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select'))
      out.inputs.push({ radius: parseFloat(cs.borderTopLeftRadius) || 0, border: parseFloat(cs.borderTopWidth) || 0, h: r.height })
    if (r.width > 120 && r.height > 60 && r.width < innerWidth * 0.95) {
      out.boxes++
      if (cs.boxShadow && cs.boxShadow !== "none") out.shadows++
    }
  }
  const meta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.content || ""
  out.title = document.title
  out.siteName = meta("og:site_name") || meta("application-name")
  out.description = meta("description") || meta("og:description")
  out.themeColor = rgba(meta("theme-color"))
  return out
}

async function fontOnGoogle(family) {
  try {
    const r = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}`, { headers: { "User-Agent": "Mozilla/5.0" } })
    // Solo cuentan las fuentes públicas del catálogo (/s/); otras rutas (/l/) no se pueden usar libremente
    return r.ok && (await r.text()).includes("fonts.gstatic.com/s/")
  } catch { return false }
}

// Nombre en Google Fonts: «inter», «Inter Variable», «NotionInter» → Inter
const KNOWN = (() => {
  try { return [...fs.readFileSync(path.join(ROOT, "web", "src", "lib", "fonts.ts"), "utf8").matchAll(/family: "([^"]+)"/g)].map((x) => x[1]).sort((a, b) => b.length - a.length) }
  catch { return [] }
})()
async function googleName(name) {
  const clean = name.replace(/[-_\s]?(variable|var|vf|web|display|text)$/i, "").replace(/[-_]/g, " ").trim()
  const title = clean.replace(/\b\w/g, (c) => c.toUpperCase())
  const known = KNOWN.find((k) => clean.toLowerCase() === k.toLowerCase()) || KNOWN.find((k) => clean.toLowerCase().includes(k.toLowerCase()))
  for (const c of [...new Set([name, known, clean, title].filter(Boolean))]) if (await fontOnGoogle(c)) return c
  return null
}

const firstFamily = (stack) => stack.split(",").map((f) => f.trim().replace(/^["']|["']$/g, "")).find((f) => f && !GENERIC.test(f) && !/fallback|emoji|placeholder/i.test(f))
function topFont(weights) {
  const tally = {}
  for (const [stack, w] of Object.entries(weights)) { const f = firstFamily(stack); if (f) tally[f] = (tally[f] || 0) + w }
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || null
}

/** Convierte las medidas en las respuestas del cuestionario (más notas que explican de dónde sale cada cosa). */
async function toAnswers(m, url, name) {
  const host = new URL(url).hostname.replace(/^www\./, "")
  const notes = { color: [], type: [], shape: [] }

  // Color de marca: el fondo de los botones con color; si no hay, los enlaces, el color de tema o los fondos con color.
  const sat = (x) => x.rgb && oklch(x.rgb).C >= 0.06 && oklch(x.rgb).L > 0.25 && oklch(x.rgb).L < 0.92
  const cands = [
    ...m.buttons.filter(sat).map((b) => ({ rgb: b.rgb, w: b.w * 3, from: "botones" })),
    ...m.links.filter(sat).map((l) => ({ rgb: l.rgb, w: l.w * 40, from: "enlaces" })),
    ...m.bg.filter(sat).map((b) => ({ rgb: b.rgb, w: b.w * 0.05, from: "fondos" })),
    ...(m.themeColor && sat({ rgb: m.themeColor }) ? [{ rgb: m.themeColor, w: 2000, from: "color de tema" }] : []),
  ]
  const groups = cluster(cands)
  let brand, brandFrom
  if (groups.length) {
    brand = groups[0].rgb
    const src = cands.filter((c) => near(c.rgb, brand)).sort((a, b) => b.w - a.w)[0]
    brandFrom = src.from
  } else {
    const btn = cluster(m.buttons.filter((b) => b.rgb).map((b) => ({ rgb: b.rgb, w: b.w })))[0]
    brand = btn && oklch(btn.rgb).L < 0.9 ? btn.rgb : [37, 99, 235]
    brandFrom = btn ? "botones (la web no usa colores vivos)" : "ninguno: la web no tiene color de marca claro, se usa un azul"
  }
  notes.color.push(`Color de marca ${hex(brand)}, sacado de ${brandFrom}.`)

  // Botón principal: qué color de texto usa la web encima de la marca
  const mainBtn = m.buttons.filter((b) => b.rgb && near(b.rgb, brand) && b.text).sort((a, b) => b.w - a.w)[0]
  const overrides = {}
  if (mainBtn && oklch(mainBtn.text).L < 0.5 && contrast(brand, [255, 255, 255]) < 4.5) {
    for (const mode of ["light", "dark"]) overrides[mode] = { "color.action.primary.on": "{color.brand.950}" }
    notes.color.push("Los botones de la web llevan el texto oscuro encima del color de marca; se mantiene igual.")
  }

  // Grises: cálidos si los neutros de la web tiran a amarillo o rojo
  const greys = [...m.bg, ...m.text].filter((x) => { const c = oklch(x.rgb); return c.C > 0.004 && c.C < 0.05 })
  let wx = 0, wy = 0
  for (const g of greys) { const c = oklch(g.rgb); wx += Math.cos((c.H * Math.PI) / 180) * g.w; wy += Math.sin((c.H * Math.PI) / 180) * g.w }
  const hue = ((Math.atan2(wy, wx) * 180) / Math.PI + 360) % 360
  const warmNeutral = greys.length > 0 && hue > 20 && hue < 120

  const page = cluster(m.bg)[0]
  if (page && oklch(page.rgb).L < 0.35) notes.color.push("La web es de fondo oscuro; el sistema se crea con modo claro y oscuro (mira el modo oscuro).")

  // Tipografía
  const webFont = topFont(m.fonts)
  const heading = topFont(m.heading)
  const font = webFont ? await googleName(webFont) : null
  if (!webFont) notes.type.push("La web usa la fuente del sistema; se usa Inter.")
  else if (!font) notes.type.push(`La web usa «${webFont}», que no está en Google Fonts; se usa Inter en su lugar (cámbiala en Tipografía si tienes la fuente).`)
  else notes.type.push(font === webFont ? `Fuente ${font}, la del texto de la web.` : `La web usa «${webFont}», que es ${font} de Google Fonts.`)
  if (heading && heading !== webFont) notes.type.push(`Los titulares de la web usan «${heading}».`)
  // Tamaño del texto corrido: mediana ponderada por cantidad de texto, sin contar titulares grandes
  const sizes = m.sizes.filter((x) => x.size >= 11 && x.size <= 22).sort((a, b) => a.size - b.size)
  const total = sizes.reduce((t, x) => t + x.w, 0)
  let acc = 0, body = 16
  for (const x of sizes) { acc += x.w; if (acc >= total / 2) { body = x.size; break } }
  const scale = body < 15 ? "compacta" : body >= 17.5 ? "amplia" : "normal"

  // Forma
  const solid = m.buttons.filter((b) => b.rgb)
  const radii = solid.map((b) => (b.radius >= b.h / 2 - 1 ? 999 : b.radius))
  const r = median(radii)
  let radius = 6
  if (r === 999) { radius = 16; notes.shape.push("Los botones de la web son de píldora (totalmente redondos); el radio de controles queda en 16 px.") }
  else if (r != null) radius = Math.round(clamp(r, 0, 24))
  else if (m.inputs.length) radius = Math.round(clamp(median(m.inputs.map((i) => i.radius)), 0, 24))
  const border = m.inputs.length ? Math.round(clamp(median(m.inputs.map((i) => i.border)) || 1, 1, 3)) : 1

  // Densidad: altura de los botones
  const h = median([...solid.map((b) => b.h), ...m.inputs.map((i) => i.h)]) || 40
  const density = h <= 34 ? 25 : h <= 40 ? 45 : h <= 46 ? 60 : 80

  // Sombras y carácter
  const shadowShare = m.boxes ? m.shadows / m.boxes : 0
  const shadow = Math.round(clamp(20 + shadowShare * 250, 15, 85))
  const vivid = groups.filter((g) => g.w > (groups[0]?.w || 0) * 0.1).length
  const sober = Math.round(clamp(25 + (vivid - 1) * 15 + (oklch(brand).C > 0.17 ? 15 : 0), 10, 90))
  const serious = Math.round(clamp((radius - 2) / 0.14, 0, 100))

  const site = m.siteName || (m.title || host).split(/\s[|–—·-]\s|:\s/)[0].trim() || host
  return {
    name: name || site.slice(0, 40),
    description: (m.description ? m.description.slice(0, 180) + " " : "") + `Creado a partir de ${host}.`,
    productType: `Basado en la web ${host}`,
    origin: "url",
    sourceUrl: url,
    applyCharacter: false,
    sober, serious, dense: density, brand: hex(brand), warmNeutral, font: font || "Inter", scale, radius, border, unit: "4",
    density, shadow, speed: 50,
    ...(Object.keys(overrides).length ? { overrides } : {}),
    notes: {
      general: `Creado automáticamente desde ${url} el ${new Date().toISOString().slice(0, 10)}. Es un punto de partida: revisa colores, fuente y radios en el modo editor. La captura de la web está en referencia.jpg.`,
      color: notes.color.join(" "),
      "tipografía": notes.type.join(" ") + ` Texto base de ${Math.round(body)} px (escala ${scale}).`,
      forma: [...notes.shape, `Radio de controles ${radius} px, borde de ${border} px, botones de unos ${Math.round(h)} px de alto.`].join(" "),
    },
  }
}

async function analyse(url) {
  const { chromium } = require("playwright")
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "es-ES", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" })
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 })
    if (res && res.status() >= 400) throw new Error(`La web respondió ${res.status()}`)
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1500)
    // Cierra avisos de cookies habituales para que no tapen la página
    for (const t of ["Aceptar", "Aceptar todo", "Accept", "Accept all", "Allow all", "Agree", "OK"]) {
      const b = page.getByRole("button", { name: t, exact: true })
      if (await b.count().catch(() => 0)) { await b.first().click({ timeout: 2000 }).catch(() => {}); break }
    }
    const shot = await page.screenshot({ type: "jpeg", quality: 70 })
    return { m: await page.evaluate(measure), shot }
  } finally { await browser.close() }
}

/** Analiza una web y crea el sistema. Devuelve el id creado. */
async function create(url, { name, dryRun } = {}) {
  if (!/^https?:\/\//i.test(url)) url = "https://" + url
  console.log(`Analizando ${url}…`)
  const { m, shot } = await analyse(url)
  const answers = await toAnswers(m, url, name)
  console.log(JSON.stringify(answers, null, 1))
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "desde-web-"))
  const file = path.join(tmp, "respuestas.json")
  fs.writeFileSync(file, JSON.stringify(answers))
  const args = [path.join(ROOT, "scripts", "new_system.py"), file, "--fix-roles", "--no-build", ...(dryRun ? ["--dry-run"] : [])]
  const log = execFileSync(PY, args, { encoding: "utf8" })
  console.log(log)
  if (dryRun) return null
  const id = log.match(/Creado: systems\/(\S+)/)?.[1]
  if (!id) throw new Error("No se pudo crear el sistema")
  fs.writeFileSync(path.join(ROOT, "systems", id, "referencia.jpg"), shot)
  return id
}

async function processRequests() {
  const dir = path.join(ROOT, "peticiones")
  if (!fs.existsSync(dir)) return
  fs.mkdirSync(path.join(dir, "resultados"), { recursive: true })
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const reqId = f.replace(/\.json$/, "")
    const req = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
    let result
    try {
      const id = await create(req.url, { name: req.name })
      result = { ok: true, id, url: req.url }
    } catch (e) {
      console.error(e)
      const msg = String(e.message || e)
      const human = /ERR_NAME_NOT_RESOLVED/.test(msg) ? "No encuentro esa web: revisa la dirección."
        : /Timeout|ERR_TIMED_OUT/.test(msg) ? "La web ha tardado demasiado en cargar. Prueba otra vez o con otra página de la web."
        : /respondió 40[13]|ERR_CONNECTION_REFUSED|ERR_BLOCKED/.test(msg) ? "La web no deja entrar a un navegador automático. Pídemelo en el chat y lo intento de otra forma."
        : "No se ha podido analizar la web (" + msg.split("\n")[0].slice(0, 160) + ")."
      result = { ok: false, url: req.url, error: human }
    }
    fs.writeFileSync(path.join(dir, "resultados", f), JSON.stringify({ ...result, at: new Date().toISOString() }, null, 2) + "\n")
    fs.rmSync(path.join(dir, f))
  }
}

const argv = process.argv.slice(2)
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined }
if (argv.includes("--requests")) await processRequests()
else if (argv[0] && !argv[0].startsWith("--")) {
  const id = await create(argv[0], { name: opt("--name"), dryRun: argv.includes("--dry-run") })
  if (id) console.log(`Listo: systems/${id}. Reconstruye la web (o sube a GitHub) para verlo.`)
} else {
  console.log("Uso: node scripts/from_url.mjs https://ejemplo.com [--name Nombre] [--dry-run]  |  --requests")
  process.exit(1)
}
