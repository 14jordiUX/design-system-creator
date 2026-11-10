// Plugin «Design System Creator» para Figma.
// - Dibujar: lee el .json que descarga la web (Prototipos → Compartir → Llevar a Figma) y crea, en este archivo:
//     · variables (Primitivos ocultos, Semánticos y Color con modos Claro / Oscuro) y estilos de sombra
//     · una página de componentes (con variantes) y otra con las pantallas del flujo, conectadas como prototipo
//   Todo color, espacio, radio y texto queda enlazado a su variable; cada componente lleva sus propiedades (textos, iconos,
//   partes opcionales), su descripción y su ficha; y el archivo se ordena: portada, fundamentos, componentes, catálogo y flujos.
//   Al terminar, una revisión dice lo que no cumple las reglas (README). Si las variables o los componentes ya existen
//   (por ejemplo, porque los has cambiado tú), se reutilizan: no se pisan tus cambios salvo que lo pidas.
// - Exportar cambios: guarda en un .json las variables, los componentes y las pantallas tal como están ahora,
//   para que Claude reconstruya el código igual que lo has dibujado.
// - Actualizar: lee un .json nuevo (con cambios hechos por Claude) y los aplica en este mismo archivo: pisa los valores
//   de las variables, rehace por dentro los componentes que ya existen (sin borrarlos, así todas sus instancias se
//   actualizan) y sustituye las pantallas del flujo en su sitio. Lo que no viene en el .json no se toca.

figma.showUI(__html__, { width: 420, height: 600, themeColors: true })

const log = (text, kind) => figma.ui.postMessage({ type: "log", text, kind: kind || "info" })

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "draw") {
      const d = msg.data
      if (d && d.format === "dsc-figma-bundle@1") {
        const opts = Object.assign({}, msg.options || {}, { done: {}, queue: [], sets: d.sets || {}, defs: d.definitions || {} })
        // Todo el sistema: cada flujo se dibuja (o actualiza) en su página, con los mismos tokens y componentes
        let last = null
        for (let i = 0; i < d.flows.length; i++) {
          const f = d.flows[i]
          last = await draw({ format: "dsc-figma@1", system: d.system, mode: d.mode, collections: d.collections, effects: d.effects, prototype: f.prototype, screens: f.screens, view: f.view || d.view }, opts)
        }
        await finishFile(d, last)
      } else await finishFile(d, await draw(d, Object.assign({}, msg.options || {}, { sets: (d && d.sets) || {}, defs: (d && d.definitions) || {} })))
    }
    if (msg.type === "export") await exportChanges()
  } catch (e) {
    log("Algo ha fallado: " + (e && e.message ? e.message : String(e)), "error")
    console.error(e)
  }
  figma.ui.postMessage({ type: "done" })
}

// ---------- utilidades ----------
function hexToRgba(hex) {
  let h = String(hex || "#000000").replace("#", "")
  if (h.length <= 4) h = h.split("").map((c) => c + c).join("")
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255
  return { r: n(0), g: n(2), b: n(4), a: h.length >= 8 ? n(6) : 1 }
}
function rgbaToHex(c, a) {
  const t = (v) => Math.round(v * 255).toString(16).padStart(2, "0")
  const alpha = a === undefined ? (c.a === undefined ? 1 : c.a) : a
  return "#" + t(c.r) + t(c.g) + t(c.b) + (alpha < 1 ? t(alpha) : "")
}
function solid(hex, variable) {
  const c = hexToRgba(hex)
  let paint = { type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }
  if (variable) paint = figma.variables.setBoundVariableForPaint(paint, "color", variable)
  return paint
}
const props = (o) => Object.keys(o).sort().map((k) => k + "=" + o[k]).join(", ")
function parseProps(name) {
  const o = {}
  // «default» (o «default=default», de antes) es la variante sin propiedades
  String(name || "").split(", ").forEach((kv) => { const i = kv.indexOf("="); if (i > 0 && kv !== "default=default") o[kv.slice(0, i)] = kv.slice(i + 1) })
  return o
}
// Las capas de un componente que son suyas (textos e iconos), sin entrar en los componentes que lleva dentro
function ownParts(n, out) {
  out = out || []
  for (const c of n.children || []) {
    if (c.type === "TEXT" || (c.type === "SVG" && c.icon)) out.push(c)
    else if (!c.component) ownParts(c, out)
  }
  return out
}
// Los componentes que lleva dentro (solo el primer nivel)
function nestedOf(n, out) {
  out = out || []
  for (const c of n.children || []) { if (c.component) out.push(c); else nestedOf(c, out) }
  return out
}
const rolesOfNode = (n) => ownParts(n).concat(nestedOf(n)).map((p) => p.role).filter(Boolean)
// Lo que se puede elegir como campo dentro de un Field («campo · cuál»)
const FIELD_CONTROLS = ["input", "textarea", "select-trigger", "native-select", "input-group", "password-input", "code-input", "checkbox", "switch", "slider", "radio-group-item"]
const isIconLayer = (x) => x.type === "INSTANCE" && (x.name.indexOf("icon/") === 0 || x.name.indexOf("icono") === 0)
// Instancias de primer nivel dentro de una capa (no los iconos ni lo que va dentro de otra instancia)
function firstInstances(node, out) {
  out = out || []
  for (const c of node.children || []) {
    if (c.type === "INSTANCE") { if (!isIconLayer(c)) out.push(c) }
    else if ("children" in c && c.type !== "TEXT" && c.type !== "SLOT") firstInstances(c, out)
  }
  return out
}

// ---------- variables ----------
// Nombres antiguos de colores (antes de que el nombre dijera dónde se aplican: bg / text / border).
// Al actualizar, la variable antigua se renombra a la nueva: así lo que ya la usaba sigue enlazado y no quedan duplicadas.
const FEEDBACK_RENAME = { solid: "bg/feedback/X/default", hover: "bg/feedback/X/hover", subtle: "bg/feedback/X/subtle", "on-solid": "text/on-feedback/X", text: "text/feedback/X", border: "border/feedback/X/subtle" }
function newColorName(name) {
  let m = name.match(/^color\/action\/([\w-]+)\/([\w-]+)$/)
  if (m) {
    if (m[2] === "on") return "color/text/on-action/" + m[1]
    if (m[1] === "disabled" && m[2] === "default") return "color/bg/action/disabled"
    return "color/bg/action/" + m[1] + "/" + m[2]
  }
  m = name.match(/^color\/feedback\/([\w-]+)\/([\w-]+)$/)
  if (m && FEEDBACK_RENAME[m[2]]) return "color/" + FEEDBACK_RENAME[m[2]].replace("X", m[1])
  return null
}

function renameOldColors(existingVars, wanted) {
  let n = 0
  for (const v of existingVars) {
    const to = newColorName(v.name)
    // Solo si el .json ya trae el nombre nuevo (y no el antiguo)
    if (!to || !wanted[to] || wanted[v.name]) continue
    if (existingVars.some((x) => x.variableCollectionId === v.variableCollectionId && x.name === to)) continue
    try { v.name = to; n++ } catch (e) { /* */ }
  }
  if (n) log(n + " variables de color con el nombre antiguo se han renombrado al nuevo (bg / text / border); lo que las usaba sigue enlazado.")
}

// Dónde se puede usar cada variable (así en Figma, al elegir un color de relleno, solo salen los de fondo, etc.)
function scopesFor(name, type) {
  const has = (p) => name.indexOf(p) === 0
  if (type === "COLOR") {
    if (has("color/bg/") || has("color/surface/")) return ["FRAME_FILL", "SHAPE_FILL"]
    if (has("color/text/")) return ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"]     // los iconos van del color del texto
    if (has("color/border/")) return ["STROKE_COLOR", "EFFECT_COLOR"]
    if (has("color/chart/")) return ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"]
    return ["ALL_FILLS", "STROKE_COLOR"]
  }
  if (type === "STRING") return has("text/family") ? ["FONT_FAMILY"] : []
  if (type !== "FLOAT") return []
  if (has("space/")) return ["GAP"]                                               // separación y márgenes de auto layout
  if (has("radius/")) return ["CORNER_RADIUS"]
  if (has("text/size")) return ["FONT_SIZE"]
  if (has("text/weight")) return ["FONT_WEIGHT"]
  if (has("text/leading")) return ["LINE_HEIGHT"]
  if (has("control/height") || has("size/") || has("layout/")) return has("size/line") ? ["WIDTH_HEIGHT", "STROKE_FLOAT"] : ["WIDTH_HEIGHT"]
  if (has("control/border") || has("control/focus")) return ["STROKE_FLOAT"]
  if (has("state/opacity") || /opacity|gradient/.test(name)) return ["OPACITY"]
  return []                                                                        // movimiento, capas…: no son de diseño
}
// Su nombre en el código (lo que ve un desarrollador en Dev Mode): la variable CSS de la web
const codeName = (name) => "var(--" + name.replace(/\//g, "-") + ")"

async function upsertVariables(collections, overwrite) {
  const existingCols = await figma.variables.getLocalVariableCollectionsAsync()
  const existingVars = await figma.variables.getLocalVariablesAsync()
  const wanted = {}
  for (const c of collections) for (const v of c.variables) wanted[v.name] = true
  renameOldColors(existingVars, wanted)
  const byName = {}             // nombre → variable (las de este archivo, de cualquier colección)
  const plan = []
  let created = 0, updated = 0

  // En el plan gratis cada colección solo puede tener un modo: el resto (p. ej. «Oscuro») va a una colección aparte,
  // «Color · Oscuro», con las mismas variables. Así no se pierde ningún valor y se exporta igual de vuelta.
  const queue = collections.map((c) => Object.assign({ register: true }, c))
  for (let qi = 0; qi < queue.length; qi++) {
    const col = queue[qi]
    let fc = existingCols.find((c) => c.name === col.name)
    if (!fc) fc = figma.variables.createVariableCollection(col.name)
    // Modos: el primero se renombra; los demás se añaden (los planes gratis solo permiten uno)
    if (fc.modes[0].name !== col.modes[0] && fc.modes.length === 1) fc.renameMode(fc.modes[0].modeId, col.modes[0])
    const modeIds = {}
    for (const m of col.modes) {
      let mode = fc.modes.find((x) => x.name === m)
      if (!mode) {
        try { const id = fc.addMode(m); mode = { modeId: id, name: m } }
        catch (e) {
          log("Tu plan de Figma no permite el modo «" + m + "» dentro de «" + col.name + "»: lo guardo en la colección «" + col.name + " · " + m + "».", "warn")
          queue.push({ name: col.name + " · " + m, modes: [m], hidden: col.hidden, register: false,
            variables: col.variables.map((v) => { const values = {}; values[m] = v.values[m]; return Object.assign({}, v, { values }) }) })
        }
      }
      if (mode) modeIds[m] = mode.modeId
    }
    if (col.hidden) { try { fc.hiddenFromPublishing = true } catch (e) { /* solo en archivos de equipo */ } }
    for (const v of col.variables) {
      let fv = existingVars.find((x) => x.variableCollectionId === fc.id && x.name === v.name)
      const isNew = !fv
      if (!fv) { fv = figma.variables.createVariable(v.name, fc, v.type); created++ }
      if (v.description && (isNew || overwrite)) fv.description = v.description
      // primitivos y copias de modo no salen en los selectores: se diseña con semánticos
      try { fv.scopes = col.hidden || !col.register ? [] : scopesFor(v.name, v.type) } catch (e) { /* */ }
      try { fv.setVariableCodeSyntax("WEB", codeName(v.name)) } catch (e) { /* */ }
      if (col.register) byName[v.name] = fv   // las de la colección aparte no se usan al dibujar
      plan.push({ fv, v, modeIds, write: isNew || overwrite })
    }
  }
  for (const v of existingVars) if (!byName[v.name]) byName[v.name] = v

  for (const p of plan) {
    if (!p.write) continue
    for (const m of Object.keys(p.v.values)) {
      const modeId = p.modeIds[m]
      if (!modeId) continue
      const val = p.v.values[m]
      let value = val
      if (val && typeof val === "object" && val.alias) {
        const target = byName[val.alias]
        if (!target) continue
        value = figma.variables.createVariableAlias(target)
      } else if (p.v.type === "COLOR") {
        value = hexToRgba(val)
      }
      try { p.fv.setValueForMode(modeId, value); updated++ } catch (e) { log("No se ha podido poner el valor de " + p.v.name + ": " + e.message, "warn") }
    }
  }
  log("Variables: " + created + " nuevas" + (overwrite ? ", valores actualizados" : ", las que ya existían se respetan") + ".")
  return byName
}

async function upsertEffects(effects, overwrite) {
  const existing = await figma.getLocalEffectStylesAsync()
  const byName = {}
  for (const e of effects) {
    let s = existing.find((x) => x.name === e.name)
    const isNew = !s
    if (!s) { s = figma.createEffectStyle(); s.name = e.name }
    if (isNew || overwrite) {
      if (e.description) s.description = e.description
      s.effects = e.shadows.map((sh) => {
        const c = hexToRgba(sh.color)
        return { type: "DROP_SHADOW", color: c, offset: { x: sh.x, y: sh.y }, radius: sh.blur, spread: sh.spread, visible: true, blendMode: "NORMAL", showShadowBehindNode: false }
      })
    }
    byName[e.name] = s
  }
  return byName
}

// ---------- fuentes ----------
const WEIGHT_NAMES = { 100: ["Thin"], 200: ["ExtraLight", "Extra Light"], 300: ["Light"], 400: ["Regular", "Book", "Normal"], 500: ["Medium"], 600: ["SemiBold", "Semi Bold", "Semibold"], 700: ["Bold"], 800: ["ExtraBold", "Extra Bold"], 900: ["Black", "Heavy"] }
let available = null
const fontCache = {}
async function fontFor(family, weight) {
  const key = family + "|" + weight
  if (fontCache[key]) return fontCache[key]
  if (!available) available = await figma.listAvailableFontsAsync()
  const w = Math.min(900, Math.max(100, Math.round(weight / 100) * 100))
  const pick = (fam) => {
    const styles = available.filter((f) => f.fontName.family === fam).map((f) => f.fontName.style)
    if (!styles.length) return null
    for (const d of [0, 100, -100, 200, -200, 300]) {
      const names = WEIGHT_NAMES[w + d] || []
      const s = styles.find((x) => names.indexOf(x) >= 0)
      if (s) return { family: fam, style: s }
    }
    return { family: fam, style: styles[0] }
  }
  let font = pick(family)
  if (!font) {
    if (!fontCache["missing|" + family]) log("No tienes instalada la fuente «" + family + "»: uso Inter. Instálala y vuelve a dibujar para verla bien.", "warn")
    fontCache["missing|" + family] = true
    font = pick("Inter") || { family: "Inter", style: "Regular" }
  }
  await figma.loadFontAsync(font)
  fontCache[key] = font
  return font
}

// ---------- dibujo ----------
function bindIf(node, field, vars, name) {
  if (!name) return
  const v = vars[name.replace(/\./g, "/")]
  if (!v) return
  try { node.setBoundVariable(field, v) } catch (e) { /* propiedad no enlazable en este nodo */ }
}
const tokenVar = (vars, token) => (token ? vars[token.replace(/\./g, "/")] : undefined)

// Tamaño propio de un componente (el maestro), según cómo se usaba en la web:
// - abraza su contenido (Hug) si en la web se adaptaba a él (un botón crece con su texto);
// - ancho fijo si dentro hay algo que rellena (un Alert: el texto se ajusta al ancho y la altura crece);
// - fijo si tenía un tamaño fijo (casilla, interruptor, avatar…).
const FIXED_WIDTH = { input: 1, textarea: 1, "select-trigger": 1, "native-select": 1, "input-group": 1, "password-input": 1, "code-input": 1, slider: 1, progress: 1, separator: 1, skeleton: 1 }
function selfSizing(frame, n) {
  if (!n.sizing || !("layoutMode" in frame) || frame.layoutMode === "NONE") return
  const fillsKid = (axis) => (n.children || []).some((k) => !k.absolute && k.sizing && k.sizing[axis] === "FILL")
  const flow = (n.children || []).filter((k) => !k.absolute)
  // Campos y barras: su ancho no depende del texto de dentro (un campo no encoge si el texto es corto)
  const wide = n.component && FIXED_WIDTH[n.component.set]
  const mode = (axis) => (!flow.length || n.sizing[axis] === "FIXED" || fillsKid(axis) || (axis === "h" && wide) ? "FIXED" : "AUTO")
  const hor = frame.layoutMode === "HORIZONTAL"
  try {
    frame.primaryAxisSizingMode = hor ? mode("h") : mode("v")
    frame.counterAxisSizingMode = hor ? mode("v") : mode("h")
  } catch (e) { /* */ }
}

function paintIcon(node, paint) {
  const all = "findAll" in node ? node.findAll(() => true) : []
  for (const n of [node].concat(all)) {
    if (n.type === "INSTANCE" || n.type === "FRAME" || n.type === "COMPONENT") continue
    if ("strokes" in n && n.strokes.length) n.strokes = [paint]
    if ("fills" in n && n.fills !== figma.mixed && n.fills.length) n.fills = [paint]
  }
}

class Drawer {
  constructor(vars, effects, componentsPage, update) {
    this.vars = vars; this.effects = effects; this.page = componentsPage
    this.update = !!update      // poner al día los componentes que ya existen
    this.done = {}              // componentes ya puestos al día (compartido entre los flujos de un mismo archivo)
    this.refreshed = 0
    this.slotted = []           // componentes lista con slot (al final se les pone el componente preferido)
    this.rebuilt = []           // componentes que han cambiado de estructura (se rehacen enteros)
    this.defining = {}          // componentes que se están creando ahora (un componente no puede llevarse dentro a sí mismo)
    this.components = {}        // set|props → ComponentNode
    this.icons = {}             // icon/<nombre> → ComponentNode
    this.links = []             // { node, to }
    this.toggled = []           // instancias con interruptores (icono izquierda/derecha, texto): se ajustan al final
    this.compX = 0; this.compY = 0
    this.styles = {}            // estilos de texto ya preparados en esta pasada
    this.defs = {}              // set|props → la pieza completa (la que tiene más partes): de ella sale el maestro
    this.sets = {}              // set → { description, optional: partes que no siempre van }
  }

  async text(n, parent) {
    const t = figma.createText()
    parent.appendChild(t)
    t.fontName = await fontFor(n.text.family, n.text.weight)
    t.characters = n.text.chars
    await this.textStyle(t, n)
    return t
  }

  // Estilo de un texto (todo menos lo que dice): se usa al crearlo y al poner al día un componente
  async textStyle(t, n) {
    const font = await fontFor(n.text.family, n.text.weight)
    if (t.fontName === figma.mixed || t.fontName.family !== font.family || t.fontName.style !== font.style) {
      const now = t.fontName === figma.mixed && t.characters.length ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName]
      for (const f of now) if (f !== figma.mixed) await figma.loadFontAsync(f)
      t.fontName = font
    }
    const style = await this.styleFor(n, font)
    if (style) {
      try { await t.setTextStyleIdAsync(style.id) } catch (e) { /* */ }
      // El interlineado puede variar de un texto a otro con el mismo estilo: se ajusta en el texto
      const lh = style.lineHeight
      if (n.text.lineHeight && (!lh || lh.unit !== "PIXELS" || Math.abs(lh.value - n.text.lineHeight) > 0.5)) t.lineHeight = { value: n.text.lineHeight, unit: "PIXELS" }
    }
    if (!style || t.textStyleId !== style.id) {
      t.fontSize = n.text.size
      if (n.text.lineHeight) t.lineHeight = { value: n.text.lineHeight, unit: "PIXELS" }
      if (n.text.letterSpacing) t.letterSpacing = { value: n.text.letterSpacing, unit: "PIXELS" }
      t.textCase = n.text.upper ? "UPPER" : "ORIGINAL"
      t.textDecoration = n.text.underline ? "UNDERLINE" : "NONE"
      const len = t.characters.length
      for (const field of ["fontSize", "fontWeight", "fontFamily"]) {
        const v = tokenVar(this.vars, n.text.bind[field])
        if (v && len) { try { t.setRangeBoundVariable(0, len, field, v) } catch (e) { /* si la fuente no lo permite */ } }
      }
    }
    t.textAlignHorizontal = n.text.align
    t.fills = [solid(n.text.color.color, tokenVar(this.vars, n.text.color.token))]
    if (n.text.single) t.textAutoResize = "WIDTH_AND_HEIGHT"
    else { t.textAutoResize = "HEIGHT"; t.resize(Math.max(1, n.w + 1), Math.max(1, n.h)) }
    t.name = n.role || n.name
  }

  // Estilo de texto (texto/<tamaño>/<peso>): uno por cada combinación que se usa, con sus variables enlazadas
  async styleFor(n, font) {
    const T = n.text, b = T.bind || {}
    const last = (tok, raw) => (tok ? tok.split(/[./]/).pop() : String(raw))
    const WEIGHTS = { 400: "normal", 500: "emphasis", 600: "strong", 700: "heavy" }
    let name = "texto/" + last(b.fontSize, T.size) + "/" + (b.fontWeight ? last(b.fontWeight) : WEIGHTS[T.weight] || String(T.weight))
    if (b.fontFamily && !/base$/.test(b.fontFamily)) name += "/" + last(b.fontFamily, "")
    if (T.upper) name += " · mayúsculas"
    if (T.underline) name += " · subrayado"
    if (this.styles[name]) return this.styles[name]
    if (!this.styleList) { try { this.styleList = await figma.getLocalTextStylesAsync() } catch (e) { this.styleList = [] } }
    let st = this.styleList.find((x) => x.name === name)
    const isNew = !st
    try {
      if (!st) { st = figma.createTextStyle(); st.name = name; if (this.styleList.indexOf(st) < 0) this.styleList.push(st) }
      if (isNew || this.update) {
        st.fontName = font
        st.fontSize = T.size
        st.lineHeight = T.lineHeight ? { value: T.lineHeight, unit: "PIXELS" } : { unit: "AUTO" }
        st.letterSpacing = { value: T.letterSpacing || 0, unit: "PIXELS" }
        st.textCase = T.upper ? "UPPER" : "ORIGINAL"
        st.textDecoration = T.underline ? "UNDERLINE" : "NONE"
        for (const field of ["fontSize", "fontWeight", "fontFamily"]) {
          const v = tokenVar(this.vars, b[field])
          if (v) { try { st.setBoundVariable(field, v) } catch (e) { /* */ } }
        }
      }
    } catch (e) { log("No he podido crear el estilo de texto «" + name + "»: " + e.message, "warn"); return null }
    this.styles[name] = st
    return st
  }

  async icon(n) {
    const inst = (await this.iconComp(n)).createInstance()
    inst.resize(n.w, n.h)
    paintIcon(inst, solid(n.fill.color, tokenVar(this.vars, n.fill.token)))
    return inst
  }

  // El componente del icono (icon/<nombre>): el que ya hay en el archivo o uno nuevo
  async iconComp(n) {
    if (!this.icons[n.name]) {
      // ¿Ya está en el archivo? Se reutiliza (así no se duplica al volver a dibujar)
      await figma.loadAllPagesAsync()
      const found = figma.root.findAllWithCriteria({ types: ["COMPONENT"] }).find((c) => c.name === n.name)
      if (found) this.icons[n.name] = found
    }
    if (!this.icons[n.name]) {
      const svg = figma.createNodeFromSvg(n.svg)
      const comp = figma.createComponentFromNode(svg)
      comp.name = n.name
      paintIcon(comp, solid("#000000"))
      this.place(comp)
      this.icons[n.name] = comp
    }
    return this.icons[n.name]
  }

  place(comp) {
    this.page.appendChild(comp)
    comp.x = this.compX; comp.y = this.compY
    this.compX += comp.width + 48
    if (this.compX > 1600) { this.compX = 0; this.compY += 160 }
  }

  async box(n, frame) {
    frame.name = n.name
    frame.fills = n.fill ? [solid(n.fill.color, tokenVar(this.vars, n.fill.token))] : []
    if (n.stroke) {
      frame.strokes = [solid(n.stroke.color, tokenVar(this.vars, n.stroke.token))]
      frame.strokeAlign = n.stroke.outside ? "OUTSIDE" : "INSIDE"   // fuera: el anillo de foco
      const [t, r, b, l] = n.stroke.weights
      frame.strokeTopWeight = t; frame.strokeRightWeight = r; frame.strokeBottomWeight = b; frame.strokeLeftWeight = l
      const sw = n.bind && n.bind.strokeWeight
      if (sw) [["strokeTopWeight", t], ["strokeRightWeight", r], ["strokeBottomWeight", b], ["strokeLeftWeight", l]].forEach(([f, w]) => { if (w > 0) bindIf(frame, f, this.vars, sw) })
    } else frame.strokes = []
    if (n.radius) {
      const [tl, tr, br, bl] = n.radius
      frame.topLeftRadius = tl; frame.topRightRadius = tr; frame.bottomRightRadius = br; frame.bottomLeftRadius = bl
      const rt = n.bind && n.bind.radius
      if (rt && tl === tr && tr === br && br === bl) ["topLeftRadius", "topRightRadius", "bottomRightRadius", "bottomLeftRadius"].forEach((f) => bindIf(frame, f, this.vars, rt))
    }
    if (n.effect && this.effects[n.effect]) await frame.setEffectStyleIdAsync(this.effects[n.effect].id)
    if (n.opacity !== undefined) frame.opacity = n.opacity
    frame.clipsContent = !!n.clip
    frame.resize(Math.max(1, n.w), Math.max(1, n.h))
    if (n.layout) {
      const L = n.layout
      frame.layoutMode = L.mode
      frame.strokesIncludedInLayout = true
      frame.itemSpacing = L.gap
      frame.paddingTop = L.pad[0]; frame.paddingRight = L.pad[1]; frame.paddingBottom = L.pad[2]; frame.paddingLeft = L.pad[3]
      frame.primaryAxisAlignItems = L.main
      frame.counterAxisAlignItems = L.cross === "STRETCH" ? "MIN" : L.cross === "BASELINE" && L.mode !== "HORIZONTAL" ? "MIN" : L.cross
      if (L.wrap && L.mode === "HORIZONTAL") frame.layoutWrap = "WRAP"
      frame.primaryAxisSizingMode = "FIXED"; frame.counterAxisSizingMode = "FIXED"
      for (const f of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"]) {
        // Sin token en la web (las secciones que añade el catálogo, p. ej.): la variable semántica que vale eso
        const tok = (n.bind && n.bind[f]) || (frame[f] > 0 ? this.spaceFor(f, frame[f]) : undefined)
        bindIf(frame, f, this.vars, tok)
      }
    }
  }

  // Dibuja un nodo dentro de `parent`. `asDefinition`: estamos creando el componente, no una instancia.
  async node(n, parent, parentNode, asDefinition) {
    let out
    if (n.type === "TEXT") out = await this.text(n, parent)
    else if (n.type === "SVG") { out = n.icon ? await this.icon(n) : figma.createNodeFromSvg(n.svg); parent.appendChild(out) }
    else if (n.component && !asDefinition && (out = await this.instance(n))) parent.appendChild(out)
    else {
      out = figma.createFrame()
      parent.appendChild(out)
      await this.box(n, out)
      for (const c of n.children || []) await this.node(c, out, n, false)
    }
    this.fit(out, n, parentNode)
    this.bindSize(out, n)
    this.mark(out, n)
    if (n.link) this.links.push({ node: out, to: n.link })
    return out
  }

  spaceFor(field, value) {
    if (!this.values) return undefined
    const pref = field === "itemSpacing" ? ["space/gap/", "space/inset/"] : ["space/inset/", "space/gap/"]
    for (const p of pref) { const n = this.values.names.find((x) => x.indexOf(p) === 0 && Number(this.values(x)) === value); if (n) return n }
    // A 1 px de una medida del sistema (un hueco de 3 que sale de medir textos): se queda con la más cercana
    let best, dist = 1.01
    for (const p of pref) for (const x of this.values.names) {
      if (x.indexOf(p) !== 0) continue
      const d = Math.abs(Number(this.values(x)) - value)
      if (d < dist || (d === dist && best && Number(this.values(x)) > Number(this.values(best)))) { best = x; dist = d }
    }
    return best
  }

  // Alto o ancho fijo que viene de un token (alto del botón, tamaño del avatar): enlazado a su variable, solo si es fijo
  bindSize(out, n) {
    if (!n.bind || !("layoutMode" in out) || out.type === "INSTANCE") return
    const fixed = (axis) => {
      if ("layoutSizingHorizontal" in out && out.parent && out.parent.layoutMode && out.parent.layoutMode !== "NONE") {
        const m = axis === "h" ? out.layoutSizingHorizontal : out.layoutSizingVertical
        if (m !== "FIXED") return false
      }
      if (out.layoutMode === "NONE") return true
      const hor = out.layoutMode === "HORIZONTAL"
      return (axis === "h") === hor ? out.primaryAxisSizingMode === "FIXED" : out.counterAxisSizingMode === "FIXED"
    }
    if (n.bind.height && fixed("v")) bindIf(out, "height", this.vars, n.bind.height)
    if (n.bind.width && fixed("h")) bindIf(out, "width", this.vars, n.bind.width)
  }

  // Cada texto e icono, con el nombre de lo que es (título, descripción, icono izquierda…): así sale en sus propiedades
  mark(out, n) {
    if (n.role) { out.name = n.role; try { out.setPluginData("role", n.role) } catch (e) { /* */ } }
    if (n.hidden !== undefined || n.role) out.visible = !n.hidden
  }

  // ¿Esta pieza se puede poner como instancia y ajustarla con sus propiedades (textos, iconos, partes opcionales)?
  viaProps(n) {
    if (hasSlot(n)) return false
    if (n.component.toggles) return true
    const master = this.defs[n.component.set + "|" + props(n.component.props)]
    if (!master) return false
    const have = rolesOfNode(master)
    if (!rolesOfNode(n).every((r) => have.indexOf(r) >= 0)) return false
    // Los de dentro sin nombre (sin propiedad que los cambie) tienen que ser los mismos
    const plain = (x) => nestedOf(x).filter((c) => !c.role).map((c) => c.component.set).join(",")
    const a = plain(n), b = plain(master)
    return a === b
  }

  fit(out, n, parentNode) {
    const inAuto = parentNode && parentNode.layout
    if (inAuto && n.absolute) { out.layoutPositioning = "ABSOLUTE" }
    if (!inAuto || n.absolute) { out.x = n.x; out.y = n.y }
    if (out.type !== "TEXT" && (out.type !== "INSTANCE" || !inAuto)) { try { out.resize(Math.max(1, n.w), Math.max(1, n.h)) } catch (e) { /* */ } }
    if (out.type === "INSTANCE" && inAuto) { try { out.resize(Math.max(1, n.w), Math.max(1, n.h)) } catch (e) { /* */ } }
    if (inAuto && n.sizing) {
      const canHug = out.type === "TEXT" || (("layoutMode" in out) && out.layoutMode !== "NONE")
      const set = (axis, mode) => {
        const m = mode === "HUG" && !canHug ? "FIXED" : mode
        try { out[axis] = m } catch (e) { /* */ }
      }
      set("layoutSizingHorizontal", n.sizing.h)
      set("layoutSizingVertical", n.sizing.v)
    }
  }

  async definition(n) {
    const key = n.component.set + "|" + props(n.component.props)
    if (this.defining[key]) return null   // dentro de sí mismo: se dibuja como capa normal
    if (this.components[key]) return this.components[key]
    this.defining[key] = true
    try { return await this.defineNew(this.defs[key] || n, key) } finally { delete this.defining[key] }
  }

  async defineNew(n, key) {
    // ¿Ya existe en el archivo (quizá cambiado por ti)? Entonces se reutiliza tal cual
    const existing = await findComponent(n.component.set, n.component.props)
    // Al actualizar, cada componente se pone al día una sola vez por archivo .json (aunque salga en varios flujos)
    if (existing && this.update && !this.done[key]) { this.done[key] = true; this.components[key] = existing; await this.refresh(existing, n); return existing }
    if (existing) { this.components[key] = existing; return existing }
    const holder = figma.createFrame()
    this.page.appendChild(holder)
    const frame = await this.node(Object.assign({}, n, { sizing: undefined, link: undefined }), holder, null, true)
    if (n.component.toggles) await this.ensureRoles(frame, n)
    const comp = figma.createComponentFromNode(frame)
    comp.name = props(n.component.props) || "default"
    this.page.appendChild(comp)
    holder.remove()
    comp.setPluginData("set", n.component.set)
    if (hasSlot(n)) this.makeSlot(comp, n)
    selfSizing(comp, n)
    this.bindSize(comp, n)
    this.slotFit(comp)
    this.components[key] = comp
    this.done[key] = true      // recién hecho: en los demás flujos de este archivo no se vuelve a rehacer
    return comp
  }

  // Rehace un componente que ya existe con lo que trae el .json, sin cambiar el componente en sí:
  // así no se rompen sus instancias (en otras pantallas o archivos) y todas reciben el cambio.
  // Si tiene las mismas capas, se cambian sus propiedades una a una: así las instancias de cualquier página
  // conservan sus textos e iconos. Si ha cambiado de estructura, se rehace entero.
  async refresh(comp, n) {
    const def = Object.assign({}, n, { sizing: undefined, link: undefined })
    const name = comp.name     // el nombre es la variante (variante=…, tamaño=…): no se toca
    if (this.sameShape(comp, def, true) && (!n.component.toggles || this.hasRoles(comp))) await this.patch(comp, def, true)
    else {
      for (const c of comp.children.slice()) c.remove()
      await this.box(def, comp)
      for (const c of n.children || []) await this.node(c, comp, n, false)
      if (n.component.toggles) await this.ensureRoles(comp, n)
      this.rebuilt.push(n.component.set)
    }
    comp.name = name
    try { comp.resize(Math.max(1, n.w), Math.max(1, n.h)) } catch (e) { /* */ }
    for (const f of ["width", "height"]) { try { comp.setBoundVariable(f, null) } catch (e) { /* */ } }
    selfSizing(comp, n)
    this.bindSize(comp, n)
    this.slotFit(comp)
    this.refreshed++
  }

  // Componente lista (pestañas, grupo de botones): lo de dentro va en un slot, para poner las que hagan falta
  makeSlot(comp, n) {
    if (typeof comp.createSlot !== "function") return
    try {
      // Lo que va suelto encima (la X de cerrar de un diálogo) se queda en el componente, fuera del slot
      const kids = comp.children.slice()
      const flow = (n.children || []).map((c) => !c.absolute)
      const slot = comp.createSlot()
      slot.name = "opciones"
      slot.fills = []
      slot.layoutMode = comp.layoutMode
      slot.itemSpacing = comp.itemSpacing
      slot.primaryAxisAlignItems = comp.primaryAxisAlignItems
      slot.counterAxisAlignItems = comp.counterAxisAlignItems
      bindIf(slot, "itemSpacing", this.vars, (n.bind && n.bind.itemSpacing) || (slot.itemSpacing > 0 ? this.spaceFor("itemSpacing", slot.itemSpacing) : undefined))
      for (let i = 0; i < kids.length; i++) { if (flow[i] === false) continue; slot.appendChild(kids[i]); if (n.children && n.children[i]) this.fit(kids[i], n.children[i], n) }
      // Lo que queda suelto, delante del slot
      for (let i = 0; i < kids.length; i++) if (flow[i] === false) comp.appendChild(kids[i])
      try { comp.setBoundVariable("itemSpacing", null) } catch (e) { /* */ }
      comp.itemSpacing = 0
      this.slotted.push({ comp: comp, slot: slot, prefer: n.component.slot })
    } catch (e) { log("No he podido crear el slot de «" + n.component.set + "»: " + e.message, "warn") }
  }

  slotOf(node) {
    return (node.children || []).find((x) => x.type === "SLOT") || null
  }

  // El slot ocupa el ancho del componente si este es fijo; si abraza, el slot también
  slotFit(comp) {
    const slot = this.slotOf(comp)
    if (!slot) return
    const hor = comp.layoutMode === "HORIZONTAL"
    const fixedW = (hor ? comp.primaryAxisSizingMode : comp.counterAxisSizingMode) === "FIXED"
    const fixedH = (hor ? comp.counterAxisSizingMode : comp.primaryAxisSizingMode) === "FIXED"
    try { slot.layoutSizingHorizontal = fixedW ? "FILL" : "HUG"; slot.layoutSizingVertical = fixedH ? "FILL" : "HUG" } catch (e) { /* */ }
  }

  // Lo que va en el slot de una instancia (o del componente al ponerlo al día): las opciones que trae el .json
  async fillSlot(slot, n) {
    for (const c of slot.children.slice()) c.remove()
    for (const c of n.children || []) if (!c.absolute) await this.node(c, slot, n, false)
  }

  kindOf(n, top) {
    if (n.type === "TEXT") return "TEXT"
    if (n.type === "SVG") return n.icon ? "INSTANCE" : "SVG"
    if (n.component && !top) return "INSTANCE"
    return "FRAME"
  }

  sameShape(node, n, top) {
    const k = this.kindOf(n, top)
    // Con slot: lo de dentro cambia en cada pantalla, cuenta solo que tenga su slot
    if (top && hasSlot(n) && this.slotOf(node)) return true
    if (k === "SVG") return true
    if (k === "TEXT") return node.type === k
    if (node.type === "INSTANCE") return k === "INSTANCE"
    if (k === "INSTANCE" && n.type === "SVG") return false
    // Una pieza que debía ser instancia pero se dibujó tal cual (otra forma) se compara capa a capa
    if (node.type !== "FRAME" && node.type !== "COMPONENT") return false
    const kids = n.children || []
    if (node.children.length !== kids.length) return false
    for (let i = 0; i < kids.length; i++) if (!this.sameShape(node.children[i], kids[i], false)) return false
    return true
  }

  async patch(node, n, top) {
    const k = this.kindOf(n, top)
    if (k === "SVG") return
    if (k === "TEXT") { await this.textStyle(node, n); this.mark(node, n); return }
    if (k === "INSTANCE" && node.type === "INSTANCE") {
      if (n.type === "SVG") {
        if (n.icon) { await this.iconComp(n); const cur = await node.getMainComponentAsync(); if (cur !== this.icons[n.name]) node.swapComponent(this.icons[n.name]) }
        try { node.resize(n.w, n.h) } catch (e) { /* */ }
        paintIcon(node, solid(n.fill.color, tokenVar(this.vars, n.fill.token)))
        this.mark(node, n)
        return
      }
      const comp = await this.definition(n)
      if (comp) {
        const cur = await node.getMainComponentAsync(); if (cur !== comp) node.swapComponent(comp)
        this.mark(node, n)
        if (this.viaProps(n)) this.toggled.push({ inst: node, n: n }); else await this.overrides(node, n)
      }
      return
    }
    await this.box(n, node)
    const slot = top && hasSlot(n) ? this.slotOf(node) : null
    if (slot) {
      try { node.setBoundVariable("itemSpacing", null) } catch (e) { /* */ }
      node.itemSpacing = 0
      slot.itemSpacing = n.layout ? n.layout.gap : 0
      if (n.bind) bindIf(slot, "itemSpacing", this.vars, n.bind.itemSpacing)
      await this.fillSlot(slot, n)
      return
    }
    const kids = n.children || []
    for (let i = 0; i < kids.length; i++) {
      await this.patch(node.children[i], kids[i], false)
      this.fit(node.children[i], kids[i], n)
    }
  }

  // Botón: [icono izquierda] texto [icono derecha]. Los iconos que no lleva se añaden ocultos, para encenderlos
  // con su interruptor (y cambiar el icono por otro). Así no hace falta una variante por cada combinación.
  hasRoles(comp) {
    return !!comp.children.find((x) => x.name === "icono izquierda") && !!comp.children.find((x) => x.name === "icono derecha")
  }

  async ensureRoles(frame, n) {
    const kids = n.children || [], layers = frame.children.slice()
    let L = null, T = null, R = null
    kids.forEach((k, i) => { const l = layers[i]; if (!l) return; if (k.role === "icono izquierda") L = l; else if (k.role === "icono derecha") R = l; else if (!T && (k.type === "TEXT" || (!k.component && collect(k, "TEXT").length))) T = l })
    if (T && T.type === "TEXT" && !T.name) T.name = "texto"
    const size = L || R ? (L || R).width : this.iconSizeFor(n)
    const make = async () => {
      const ic = await this.placeholderIcon()
      const inst = ic.createInstance()
      inst.resize(size, size)
      const tt = T && (T.type === "TEXT" ? T : ("findAll" in T ? T.findAll((x) => x.type === "TEXT")[0] : null))
      if (tt && tt.fills !== figma.mixed && tt.fills.length) paintIcon(inst, tt.fills[0])
      try { inst.layoutSizingHorizontal = "FIXED"; inst.layoutSizingVertical = "FIXED" } catch (e) { /* */ }
      return inst
    }
    if (!L) { L = await make(); frame.insertChild(T ? frame.children.indexOf(T) : 0, L) }
    if (!R) { R = await make(); frame.insertChild(T ? frame.children.indexOf(T) + 1 : frame.children.length, R) }
    L.name = "icono izquierda"; R.name = "icono derecha"
    try { L.setPluginData("role", "icono izquierda"); R.setPluginData("role", "icono derecha") } catch (e) { /* */ }
    L.visible = false; R.visible = false     // el maestro, sin iconos: cada botón enciende los suyos
  }

  // Tamaño del icono para un botón que no lleva: el de otra variante del mismo tamaño
  iconSizeFor(n) {
    for (const key of Object.keys(this.components)) {
      if (key.split("|")[0] !== n.component.set || key.indexOf("tamaño=" + n.component.props["tamaño"] + ",") < 0 && !key.endsWith("tamaño=" + n.component.props["tamaño"])) continue
      const c = this.components[key]
      const l = c && !c.removed && c.children.find((x) => x.name === "icono izquierda" || x.name === "icono derecha")
      if (l) return l.width
    }
    return 16
  }

  async placeholderIcon() {
    const names = Object.keys(this.icons)
    if (this.icons["icon/plus"]) return this.icons["icon/plus"]
    if (names.length) return this.icons[names[0]]
    await figma.loadAllPagesAsync()
    const found = figma.root.findAllWithCriteria({ types: ["COMPONENT"] }).find((c) => c.name.indexOf("icon/") === 0)
    if (found) { this.icons[found.name] = found; return found }
    const comp = figma.createComponent()
    comp.name = "icon/circle"; comp.resize(16, 16); comp.fills = []
    const e = figma.createEllipse(); e.resize(12, 12); e.x = 2; e.y = 2; e.fills = []; e.strokes = [solid("#000000")]; e.strokeWeight = 2
    comp.appendChild(e)
    this.place(comp)
    this.icons[comp.name] = comp
    return comp
  }

  // Al final (cuando el componente ya tiene sus propiedades): sus textos, qué iconos se ven, cuáles son y qué
  // partes opcionales lleva. Lo mismo, por dentro, en los componentes que lleva dentro (un botón dentro de una tarjeta).
  async setProps(inst, n, depth) {
    if (inst.removed) return
    let defs
    try { defs = inst.componentProperties } catch (e) { return }
    const byRole = {}
    for (const p of ownParts(n).concat(nestedOf(n))) if (p.role && !byRole[p.role]) byRole[p.role] = p
    const want = {}
    for (const k of Object.keys(defs)) {
      const name = k.split("#")[0], d = defs[k]
      if (d.type === "TEXT") { const p = byRole[name]; if (p && p.type === "TEXT" && d.value !== p.text.chars) want[k] = p.text.chars }
      else if (d.type === "BOOLEAN") {
        if (name.indexOf("con ") === 0) want[k] = !!byRole[name.slice(4)]
        else if (n.component.toggles && name in n.component.toggles) want[k] = !!n.component.toggles[name]
        else if (name.indexOf("icono") === 0) want[k] = !!byRole[name]
      } else if (d.type === "INSTANCE_SWAP") {
        const p = byRole[name.replace(/ · cuál$/, "")]
        // Solo si cambia: «cambiar» al mismo icono hace que Figma lo deje con el color del icono original
        if (p && p.icon) { await this.iconComp(p); const id = this.icons[p.name].id; if (d.value !== id) want[k] = id }
        // Una pieza de dentro que se elige (el tipo de campo de un Field): la variante que toca
        else if (p && p.component) { const comp = await this.definition(p); if (comp && d.value !== comp.id) want[k] = comp.id }
      }
    }
    if (Object.keys(want).length) { try { inst.setProperties(want) } catch (e) { log("No he podido ajustar los textos o iconos de un «" + n.component.set + "»: " + e.message, "warn") } }
    // Colores: los de esta pantalla (al cambiar el icono, Figma puede quedarse con el color del original)
    const mine = inst.findAll((x) => !!x.componentPropertyReferences && Object.keys(x.componentPropertyReferences).some((r) => defs[x.componentPropertyReferences[r]]))
    for (const l of mine) {
      const refs = l.componentPropertyReferences
      const key = refs.characters || refs.mainComponent || refs.visible
      const role = key.split("#")[0].replace(/ · cuál$/, "").replace(/^con /, "")
      const p = byRole[role]
      if (!p) continue
      if (p.type === "TEXT" && l.type === "TEXT") l.fills = [solid(p.text.color.color, tokenVar(this.vars, p.text.color.token))]
      else if (p.type === "SVG" && p.fill) paintIcon(l, solid(p.fill.color, tokenVar(this.vars, p.fill.token)))
    }
    if (!Object.keys(defs).some((k) => defs[k].type !== "VARIANT")) await this.overrides(inst, n, true)
    // Lo que lleva dentro: la variante que toca y sus textos
    if ((depth || 0) > 6) return
    const kidsN = nestedOf(n), kidsI = firstInstances(inst)
    // Las de dentro con nombre (etiqueta, campo) se buscan por su propiedad; las demás, en orden
    const pairs = [], used = []
    for (const kn of kidsN.filter((x) => x.role)) {
      const keys = Object.keys(defs).filter((k) => { const nm = k.split("#")[0]; return nm === kn.role + " · cuál" || nm === "con " + kn.role })
      const free = kidsI.filter((x) => used.indexOf(x) < 0)
      const ki = free.find((x) => { const r = x.componentPropertyReferences; return r && keys.some((k) => r.mainComponent === k || r.visible === k) }) || free.find((x) => x.name === kn.role)
      if (ki) { used.push(ki); pairs.push([kn, ki]) }
    }
    const restN = kidsN.filter((x) => !x.role), restI = kidsI.filter((x) => used.indexOf(x) < 0)
    if (restN.length === restI.length) restN.forEach((kn, i) => pairs.push([kn, restI[i]]))
    for (const pr of pairs) {
      const kn = pr[0], ki = pr[1]
      if (hasSlot(kn)) continue
      const comp = await this.definition(kn)
      if (comp) { const cur = await ki.getMainComponentAsync(); if (cur !== comp) { try { ki.swapComponent(comp) } catch (e) { continue } } }
      await this.setProps(ki, kn, (depth || 0) + 1)
    }
  }

  async instance(n) {
    const comp = await this.definition(n)
    if (!comp) return null
    // Misma variante pero otra forma (otro número de textos, iconos o capas): se dibuja tal cual, no como instancia
    const viaProps = this.viaProps(n)
    if (!viaProps && !this.sameShape(comp, Object.assign({}, n, { sizing: undefined }), true)) return null
    const inst = comp.createInstance()
    if (viaProps) this.toggled.push({ inst: inst, n: n })
    else await this.overrides(inst, n)
    inst.name = n.component.set
    return inst
  }

  async overrides(inst, n, own) {
    const slot = hasSlot(n) ? this.slotOf(inst) : null
    if (slot) { await this.fillSlot(slot, n); return }
    // Lo que cambia de una vez a otra: los textos y sus colores, y qué icono va
    const texts = own ? inst.findAll((x) => x.type === "TEXT" && !x.componentPropertyReferences) : inst.findAll((x) => x.type === "TEXT")
    const want = own ? [] : collect(n, "TEXT")
    for (let i = 0; i < Math.min(texts.length, want.length); i++) {
      const t = texts[i], w = want[i]
      if (t.characters !== w.text.chars) {
        await figma.loadFontAsync(t.fontName === figma.mixed ? await fontFor(w.text.family, w.text.weight) : t.fontName)
        t.characters = w.text.chars
      }
      t.fills = [solid(w.text.color.color, tokenVar(this.vars, w.text.color.token))]
    }
    const icons = own ? [] : inst.findAll(isIconLayer)
    const wantIcons = collect(n, "SVG").filter((x) => x.icon)
    for (let i = 0; i < Math.min(icons.length, wantIcons.length); i++) {
      const w = wantIcons[i]
      const cur = await icons[i].getMainComponentAsync()
      if (!cur || cur.name !== w.name) { await this.iconComp(w); icons[i].swapComponent(this.icons[w.name]) }
      paintIcon(icons[i], solid(w.fill.color, tokenVar(this.vars, w.fill.token)))
    }
  }
}

// Componente con slot: lista (con su preferido) o caja ("" = sin preferido)
function hasSlot(n) { return !!n.component && typeof n.component.slot === "string" }

function collect(n, type, out) {
  out = out || []
  if (n.type === type) out.push(n)
  for (const c of n.children || []) collect(c, type, out)
  return out
}

let componentIndex = null
async function findComponent(set, p) {
  if (!componentIndex) {
    componentIndex = {}
    await figma.loadAllPagesAsync()
    for (const s of figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] })) {
      for (const c of s.children) componentIndex[s.name + "|" + c.name] = c
    }
  }
  const exact = componentIndex[set + "|" + (props(p) || "default")] || (!Object.keys(p).length && componentIndex[set + "|default=default"])
  if (exact) return exact
  // La variante del archivo puede tener propiedades de más con su valor por defecto (posición=sola en un botón suelto)
  for (const key of Object.keys(componentIndex)) {
    if (key.split("|")[0] !== set) continue
    const cur = parseProps(key.slice(set.length + 1))
    if (Object.keys(p).some((k) => cur[k] !== p[k])) continue
    if (Object.keys(cur).every((k) => k in p || cur[k] === defaultOf(k))) return componentIndex[key]
  }
  return null
}
const defaultOf = (k) => (k === "estado" ? "normal" : k === "posición" ? "sola" : k === "seleccionado" ? "no" : k === "orientación" ? "vertical" : "default")

// Qué propiedades y valores tiene cada componente según el .json (set → propiedad → valores)
function schemaOf(defs) {
  const out = {}
  for (const key of Object.keys(defs || {})) {
    const i = key.indexOf("|"), set = key.slice(0, i), p = parseProps(key.slice(i + 1))
    const o = (out[set] = out[set] || {})
    for (const k of Object.keys(p)) (o[k] = o[k] || {})[p[k]] = true
  }
  return out
}

// Archivos de antes: las variantes se pasan al orden nuevo sin perder nada.
// - «marcado», «activo» → estado normal + seleccionado=sí (seleccionar no es un estado, es otra propiedad)
// - error, solo en lo que de verdad lo tiene (campos, casillas…); el resto pasa a normal
// - «contenido» (con icono, solo icono…) ya no es variante: ahora los iconos se encienden con su interruptor
// Las variantes que quedan repetidas se juntan en una (sus instancias pasan a la que se queda).
const LEGACY_DROPPED = { button: ["contenido"] }
const LEGACY_NO_STATE = { button: ["error"] }
async function migrateSchema(schema) {
  await figma.loadAllPagesAsync()
  let changed = 0
  for (const set of figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] })) {
    const sc = schema[set.name]
    if (!sc && !LEGACY_DROPPED[set.name]) continue
    const kids = set.children.filter((c) => c.type === "COMPONENT")
    const parsed = kids.map((c) => parseProps(c.name))
    const mapped = parsed.map((p) => {
      const cur = Object.assign({}, p)
      if (sc && sc.seleccionado && /^(marcado|activo|seleccionado|on)$/.test(cur.estado || "")) { cur.estado = "normal"; cur.seleccionado = "sí" }
      if (sc && sc.seleccionado && !cur.seleccionado) cur.seleccionado = "no"
      if (cur.estado === "error" && ((sc && !(sc.estado && sc.estado.error)) || (!sc && LEGACY_NO_STATE[set.name]))) cur.estado = "normal"
      return cur
    })
    const allDefault = {}
    mapped.forEach((p) => Object.keys(p).forEach((k) => { if (allDefault[k] === undefined) allDefault[k] = true; if (p[k] !== defaultOf(k)) allDefault[k] = false }))
    const plan = kids.map((c, i) => {
      const cur = mapped[i]
      for (const k of Object.keys(cur)) {
        if (k === "contenido" && (sc ? !sc.contenido : true)) delete cur[k]
        else if (sc && !sc[k] && (k === "variante" || k === "tamaño" || k === "estado") && allDefault[k]) delete cur[k]
      }
      const to = props(cur) || "default"
      return { c: c, from: c.name, to: to, score: to === c.name ? 0 : parsed[i].contenido === "texto" ? 1 : !parsed[i].estado || parsed[i].estado === "normal" ? 2 : 3 }
    })
    if (plan.every((x) => x.from === x.to)) continue
    plan.sort((a, b) => a.score - b.score)
    const kept = {}
    for (const x of plan) {
      if (kept[x.to]) {
        for (const inst of await x.c.getInstancesAsync()) { try { inst.swapComponent(kept[x.to]) } catch (e) { /* */ } }
        x.c.remove()
        changed++
      } else {
        kept[x.to] = x.c
        if (x.c.name !== x.to) { x.c.name = x.to; changed++ }
      }
    }
    log("«" + set.name + "»: variantes pasadas al orden nuevo (seleccionado aparte, sin estados que no tiene, iconos con interruptor).")
  }
  componentIndex = null
  return changed
}

// Partes de un componente con nombre de función (las marca el plugin; las de antes, por su nombre)
const LEGACY_ROLES = { texto: 1, "icono izquierda": 1, "icono derecha": 1 }
function roleLayers(comp) {
  const out = []
  const walk = (x) => {
    for (const k of x.children || []) {
      let role = ""
      try { role = k.getPluginData("role") } catch (e) { /* */ }
      if (!role && LEGACY_ROLES[k.name]) role = k.name
      if (role && (k.type === "TEXT" || k.type === "INSTANCE")) out.push({ role: role, layer: k, nested: k.type === "INSTANCE" && role.indexOf("icono") !== 0 })
      else if (k.type !== "INSTANCE" && k.type !== "TEXT" && k.type !== "SLOT" && "children" in k) walk(k)
    }
  }
  walk(comp)
  return out
}

// Propiedades de cada componente, en el conjunto (no en cada variante) y enlazadas con las capas de todas sus variantes:
// - cada texto: una propiedad de texto con su nombre (título, descripción, texto…)
// - lo que no siempre va (una descripción, un icono): un interruptor «con descripción», «icono»…
// - los iconos del botón: «icono izquierda» / «icono derecha» (sí/no) y cuál va en cada lado («… · cuál»)
// - los componentes que lleva dentro se muestran en sus propiedades (para cambiarlos sin entrar)
// - la descripción del componente (la de la web)
async function bindProperties(drawer) {
  await figma.loadAllPagesAsync()
  const iconComps = figma.root.findAllWithCriteria({ types: ["COMPONENT"] }).filter((c) => c.name.indexOf("icon/") === 0)
  for (const set of figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] })) {
    const info = drawer.sets[set.name] || {}
    if (info.description) { try { set.description = info.description } catch (e) { /* */ } }
    const variants = set.children.filter((c) => c.type === "COMPONENT")
    const layers = variants.map((c) => ({ c: c, parts: roleLayers(c) }))
    const roles = []
    layers.forEach((v) => v.parts.forEach((p) => { if (!roles.some((r) => r.role === p.role)) roles.push({ role: p.role, type: p.layer.type, sample: p.layer, nested: p.nested }) }))
    for (const v of variants) for (const x of firstInstances(v)) { try { x.isExposedInstance = true } catch (e) { /* */ } }
    if (!roles.length) continue
    const failed = []
    try {
      const keyOf = (name, type) => Object.keys(set.componentPropertyDefinitions).find((k) => k.split("#")[0] === name && set.componentPropertyDefinitions[k].type === type)
      const ensure = (name, type, def) => keyOf(name, type) || set.addComponentProperty(name, type, def)
      const optional = info.optional || []
      const keys = {}
      for (const r of roles) {
        const k = (keys[r.role] = {})
        if (r.type === "TEXT") {
          k.text = ensure(r.role, "TEXT", r.sample.characters)
          if (optional.indexOf(r.role) >= 0) k.show = ensure("con " + r.role, "BOOLEAN", true)
        } else if (r.nested) {
          // Pieza de dentro (la etiqueta o el campo de un Field): se enciende y apaga; el campo, además, se elige
          if (optional.indexOf(r.role) >= 0) k.show = ensure("con " + r.role, "BOOLEAN", true)
          const main = await r.sample.getMainComponentAsync()
          if (main && r.role === "campo") {
            k.swap = ensure("campo · cuál", "INSTANCE_SWAP", main.id)
            const kinds = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] }).filter((x) => FIELD_CONTROLS.indexOf(x.name) >= 0)
            if (kinds.length) { try { set.editComponentProperty(k.swap, { preferredValues: kinds.map((c) => ({ type: "COMPONENT_SET", key: c.key })) }) } catch (e) { /* */ } }
          }
        } else {
          const toggle = r.role === "icono izquierda" || r.role === "icono derecha"
          if (toggle || optional.indexOf(r.role) >= 0) k.show = ensure(r.role, "BOOLEAN", !toggle)
          const main = await r.sample.getMainComponentAsync()
          if (main) {
            k.swap = ensure(r.role + " · cuál", "INSTANCE_SWAP", main.id)
            if (iconComps.length) { try { set.editComponentProperty(k.swap, { preferredValues: iconComps.slice(0, 60).map((c) => ({ type: "COMPONENT", key: c.key })) }) } catch (e) { /* sin clave (archivo sin publicar) */ } }
          }
        }
      }
      for (const v of layers) {
        const firstText = v.parts.map((p) => p.layer).find((l) => l.type === "TEXT")
        for (const p of v.parts) {
          const k = keys[p.role], refs = {}
          if (p.layer.type === "TEXT") {
            await figma.loadFontAsync(p.layer.fontName === figma.mixed ? { family: "Inter", style: "Regular" } : p.layer.fontName)
            refs.characters = k.text
            if (k.show) refs.visible = k.show
          } else if (p.nested) {
            if (k.show) refs.visible = k.show
            if (k.swap) refs.mainComponent = k.swap
          } else {
            if (k.show) refs.visible = k.show
            if (k.swap) refs.mainComponent = k.swap
            // El icono del botón va del color del texto (en la web es currentColor): al cambiar el icono, Figma puede perderlo
            if ((p.role === "icono izquierda" || p.role === "icono derecha") && firstText && firstText.fills !== figma.mixed && firstText.fills.length) paintIcon(p.layer, firstText.fills[0])
          }
          // Capa a capa: si Figma no deja enlazar una, las demás sí se enlazan (y se intenta propiedad a propiedad)
          try { p.layer.componentPropertyReferences = refs }
          catch (e) {
            const ok = {}
            for (const r of Object.keys(refs)) {
              try { const one = Object.assign({}, ok); one[r] = refs[r]; p.layer.componentPropertyReferences = one; ok[r] = refs[r] }
              catch (e2) { failed.push("«" + v.c.name + "» › " + p.role + " (" + r + "): " + e2.message) }
            }
          }
        }
      }
    } catch (e) { log("No he podido crear las propiedades de «" + set.name + "»: " + e.message, "warn") }
    if (failed.length && drawer.final) log("«" + set.name + "»: " + failed.length + " capas sin enlazar a su propiedad. Ej.: " + failed.slice(0, 3).join(" | "), "warn")
  }
}

// Orden de las variantes en su conjunto, como una tabla: una fila por variante y tamaño, una columna por estado
const ESTADOS = ["normal", "hover", "foco", "pulsado", "deshabilitado", "error", "visible"]
function arrangeSets() {
  for (const set of figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] })) {
    const kids = set.children.filter((c) => c.type === "COMPONENT")
    if (kids.length < 2) continue
    const all = kids.map((c) => ({ c: c, p: parseProps(c.name) }))
    const keys = {}
    all.forEach((x) => Object.keys(x.p).forEach((k) => { (keys[k] = keys[k] || {})[x.p[k]] = true }))
    const order = (k, v) => {
      if (k === "estado") { const i = ESTADOS.indexOf(v); return i < 0 ? 99 : i }
      const vals = Object.keys(keys[k] || {}).sort((a, b) => (a === defaultOf(k) ? -1 : b === defaultOf(k) ? 1 : a < b ? -1 : 1))
      return vals.indexOf(v)
    }
    const MAIN = ["variante", "tamaño", "seleccionado", "posición"]
    const rowKeys = MAIN.concat(Object.keys(keys).filter((k) => MAIN.indexOf(k) < 0 && k !== "estado").sort())
    const rowOf = (p) => rowKeys.filter((k) => k in p).map((k) => String(order(k, p[k])).padStart(3, "0")).join(".")
    const rows = {}
    all.forEach((x) => { const r = rowOf(x.p); (rows[r] = rows[r] || []).push(x) })
    const rowIds = Object.keys(rows).sort()
    const cols = keys.estado ? Object.keys(keys.estado).sort((a, b) => order("estado", a) - order("estado", b)) : null
    const pad = 24, gap = 24
    const colW = {}
    all.forEach((x) => { const c = cols ? x.p.estado : "_"; colW[c] = Math.max(colW[c] || 0, x.c.width) })
    const colX = {}
    let cx = pad
    for (const c of cols || ["_"]) { colX[c] = cx; cx += (colW[c] || 0) + gap }
    try { set.layoutMode = "NONE" } catch (e) { /* */ }
    let y = pad, maxX = cx
    for (const r of rowIds) {
      const list = rows[r]
      let h = 0, x = pad
      list.sort((a, b) => order("estado", a.p.estado) - order("estado", b.p.estado))
      for (const it of list) {
        if (cols) it.c.x = colX[it.p.estado]
        else { it.c.x = x; x += it.c.width + gap; maxX = Math.max(maxX, x) }
        it.c.y = y
        h = Math.max(h, it.c.height)
      }
      y += h + gap
    }
    // El orden de las capas también (en el panel de capas y al elegir variante)
    let i = 0
    for (const r of rowIds) for (const it of rows[r]) { try { set.insertChild(i++, it.c) } catch (e) { /* */ } }
    try { set.resize(Math.max(1, maxX - gap + pad), Math.max(1, y - gap + pad)) } catch (e) { /* */ }
  }
}

// Junta los componentes sueltos de cada tipo en un conjunto con variantes (button → variante, tamaño, contenido…)
function combineSets(drawer) {
  const groups = {}
  for (const key of Object.keys(drawer.components)) {
    const comp = drawer.components[key]
    if (comp.parent && comp.parent.type === "COMPONENT_SET") continue
    const set = key.split("|")[0]
    ;(groups[set] = groups[set] || []).push(comp)
  }
  let y = drawer.compY + 240
  for (const set of Object.keys(groups)) {
    const comps = groups[set]
    // Todas las variantes con las mismas propiedades (las que falten, «no» / «default»)
    const names = {}
    for (const c of comps) Object.keys(parseProps(c.name)).forEach((k) => { names[k] = true })
    const existing0 = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] }).find((s) => s.name === set)
    if (existing0) existing0.children.forEach((c) => Object.keys(parseProps(c.name)).forEach((k) => { names[k] = true }))
    for (const c of comps) {
      const cur = parseProps(c.name)
      for (const k of Object.keys(names)) if (!cur[k]) cur[k] = defaultOf(k)
      c.name = props(cur) || "default"
    }
    const existingSet = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] }).find((s) => s.name === set)
    if (existingSet) {
      for (const c of comps) existingSet.appendChild(c)
      continue
    }
    const cs = figma.combineAsVariants(comps, drawer.page)
    cs.name = set
    cs.layoutMode = "HORIZONTAL"; cs.layoutWrap = "WRAP"; cs.itemSpacing = 24; cs.counterAxisSpacing = 24
    cs.paddingTop = cs.paddingRight = cs.paddingBottom = cs.paddingLeft = 24
    for (const f of ["itemSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) bindIf(cs, f, drawer.vars, drawer.spaceFor(f, 24))
    cs.primaryAxisSizingMode = "AUTO"; cs.counterAxisSizingMode = "AUTO"
    cs.x = 0; cs.y = y
    y += cs.height + 80
  }
  // Las variantes que ya había en el archivo también reciben las propiedades nuevas (p. ej. posición=sola),
  // si no Figma avisa de «This variant is missing one or more properties». Se repasan todos los componentes,
  // también los que ya estaban completos en el archivo y solo se han puesto al día.
  for (const set of figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] })) {
    const all = {}
    set.children.forEach((c) => Object.keys(parseProps(c.name)).forEach((k) => { all[k] = true }))
    set.children.forEach((c) => {
      const cur = parseProps(c.name)
      for (const k of Object.keys(all)) if (!cur[k]) cur[k] = defaultOf(k)
      const name = props(cur) || "default"
      if (c.name !== name) c.name = name
    })
  }
}

// Al ajustar las instancias pueden hacer falta variantes nuevas (un campo de contraseña dentro de un Field): se meten
// en su conjunto con sus propiedades y se vuelven a ajustar las instancias (hasta que no falte ninguna)
async function settle(drawer, list) {
  const loose = () => Object.keys(drawer.components).some((k) => { const c = drawer.components[k]; return c && !c.removed && c.parent && c.parent.type !== "COMPONENT_SET" })
  for (let i = 0; i < 3 && loose(); i++) {
    combineSets(drawer)
    await bindProperties(drawer)
    arrangeSets()
    for (const t of list) await drawer.setProps(t.inst, t.n)
  }
}

// En cada slot, el componente que se suele meter (pestaña, opción…) sale el primero al elegir qué poner
function preferInSlots(drawer) {
  const sets = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] })
  for (const s of drawer.slotted) {
    if (!s.prefer) continue      // caja sin preferido (Card, Dialog…): se llena con lo que quieras
    const want = sets.find((x) => x.name === s.prefer)
    const ref = s.slot.componentPropertyReferences && s.slot.componentPropertyReferences.slotContentId
    if (!want || !ref) continue
    const owners = [s.comp.parent && s.comp.parent.type === "COMPONENT_SET" ? s.comp.parent : null, s.comp].filter(Boolean)
    for (const o of owners) {
      try {
        if (o.componentPropertyDefinitions && o.componentPropertyDefinitions[ref]) {
          o.editComponentProperty(ref, { preferredValues: [{ type: "COMPONENT_SET", key: want.key }] })
          break
        }
      } catch (e) { log("No he podido poner «" + s.prefer + "» como preferido en el slot: " + e.message, "warn"); break }
    }
  }
}

async function pageNamed(name, reuse) {
  await figma.loadAllPagesAsync()
  let p = figma.root.children.find((x) => x.name === name)
  if (p && reuse) return p
  if (p) { let i = 2; while (figma.root.children.find((x) => x.name === name + " (" + i + ")")) i++; name = name + " (" + i + ")" }
  p = figma.createPage(); p.name = name
  return p
}

async function draw(data, options) {
  if (!data || data.format !== "dsc-figma@1") throw new Error("Este archivo no es de la web Design System Creator (Llevar a Figma).")
  componentIndex = null
  await migrateSchema(schemaOf(options.defs))
  const update = !!options.update
  log((update ? "Actualizando con " : "Sistema ") + data.system.name + " · " + data.prototype.label + " (" + data.mode + ")")
  const vars = await upsertVariables(data.collections, update || !!options.overwrite)
  const effects = await upsertEffects(data.effects || [], update || !!options.overwrite)

  const compPage = await pageNamed("Componentes · " + data.system.name, true)
  // Al actualizar se usa la página del flujo que ya existe; al dibujar, una nueva
  // Cada tamaño en su página: «Iniciar sesión · Base · Móvil» y «… · Escritorio» (el catálogo, sin tamaño)
  const base = data.prototype.label + " · " + data.system.name
  const pageName = data.prototype.slug.indexOf("catalogo") === 0 || !data.view ? base : base + " · " + (data.view === "mobile" ? "Móvil" : "Escritorio")
  if (update && data.prototype.slug.indexOf("catalogo-") === 0) {
    // Antes el catálogo iba entero en una página; ahora va una por grupo. La antigua no se borra (por si la has tocado): se marca
    await figma.loadAllPagesAsync()
    const old = figma.root.children.find((x) => x.name === "Catálogo · " + data.system.name)
    if (old) { old.name = "Catálogo (antiguo) · " + data.system.name; log("El catálogo ahora va en una página por grupo. La página antigua se llama «" + old.name + "»: bórrala cuando quieras.", "warn") }
  }
  if (update && pageName !== base && data.view === "mobile") {
    // Archivos de antes (se dibujaban en móvil, en una página sin tamaño): esa página pasa a ser la de móvil
    await figma.loadAllPagesAsync()
    const old = figma.root.children.find((x) => x.name === base)
    if (old && !figma.root.children.find((x) => x.name === pageName)) { old.name = pageName; log("La página «" + base + "» pasa a llamarse «" + pageName + "».") }
  }
  const flowPage = await pageNamed(pageName, update)
  const drawer = new Drawer(vars, effects, compPage, update)
  if (options.done) drawer.done = options.done
  if (options.queue) drawer.toggled = options.queue    // todas las instancias del archivo: al final se repasan otra vez
  const queueStart = drawer.toggled.length
  drawer.defs = options.defs || {}
  drawer.values = valueTable(data.collections)
  drawer.sets = options.sets || {}
  drawer.compY = compPage.children.reduce((m, n) => Math.max(m, n.y + n.height + 120), 0)

  await figma.setCurrentPageAsync(flowPage)
  const frames = {}
  let x = flowPage.children.reduce((m, n) => Math.max(m, n.x + n.width + 160), 0)
  const gap = 160
  let replaced = 0
  let rowY = 0, rowH = 0
  for (const s of data.screens) {
    log((update ? "Actualizando «" : "Dibujando «") + s.label + "»…")
    // Al actualizar, la pantalla que ya existe se sustituye en el mismo sitio (los enlaces se rehacen después)
    const old = update ? flowPage.children.find((c) => c.type === "FRAME" && c.name === s.label) : null
    // Se dibuja en un marco aparte; si algo falla a medias, se quita y la pantalla anterior se queda como estaba
    const holder = figma.createFrame()
    flowPage.appendChild(holder)
    holder.name = "(dibujando " + s.label + ")"; holder.fills = []; holder.x = x; holder.y = -100000
    let frame
    try {
      frame = await drawer.node(Object.assign({}, s.node, { sizing: undefined }), holder, null, true)
    } catch (e) {
      holder.remove()
      log("No he podido dibujar «" + s.label + "»: " + (e && e.message ? e.message : e) + ". La dejo como estaba.", "error")
      if (old) frames[s.id] = old
      continue
    }
    flowPage.appendChild(frame)
    holder.remove()
    frame.name = s.label
    frame.clipsContent = true
    if (old) { frame.x = old.x; frame.y = old.y; old.remove(); replaced++ }
    else {
      // Muchas pantallas (el catálogo): en filas, para que no quede una tira infinita
      if (x > 0 && x + frame.width > 9000) { x = 0; rowY += rowH + gap; rowH = 0 }
      frame.x = x; frame.y = rowY; x += frame.width + gap; rowH = Math.max(rowH, frame.height)
    }
    frames[s.id] = frame
    // El modo (claro u oscuro) de la pantalla
    const colorCol = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === "Color")
    if (colorCol) {
      const m = colorCol.modes.find((mm) => mm.name === data.mode)
      if (m) frame.setExplicitVariableModeForCollection(colorCol, m.modeId)
      else if (s === data.screens[0]) log("Las pantallas se ven en claro: tu plan no permite el modo «" + data.mode + "» en la misma colección.", "warn")
    }
  }
  combineSets(drawer)
  preferInSlots(drawer)
  await bindProperties(drawer)
  arrangeSets()
  for (const t of drawer.toggled.slice(queueStart)) await drawer.setProps(t.inst, t.n)
  await settle(drawer, drawer.toggled.slice(queueStart))

  // Prototipo: cada botón lleva a su pantalla
  for (const l of drawer.links) {
    const dest = frames[l.to]
    if (!dest) continue
    try {
      await l.node.setReactionsAsync([{ trigger: { type: "ON_CLICK" }, actions: [{ type: "NODE", destinationId: dest.id, navigation: "NAVIGATE", transition: { type: "SMART_ANIMATE", easing: { type: "EASE_OUT" }, duration: 0.25 }, preserveScrollPosition: false, resetVideoPosition: false }] }])
    } catch (e) { log("No se ha podido conectar un botón con «" + l.to + "»: " + e.message, "warn") }
  }
  const first = frames[data.screens[0].id]
  if (first) flowPage.flowStartingPoints = [{ nodeId: first.id, name: data.prototype.label }]
  // Todo en su sitio, sin pisarse: las pantallas del flujo en orden (en filas si son muchas) y lo demás detrás
  layoutPage(flowPage, data.screens.map((s) => frames[s.id]).filter((f, i, a) => f && !f.removed && a.indexOf(f) === i), 9000)
  figma.viewport.scrollAndZoomIntoView(Object.keys(frames).map((k) => frames[k]))
  if (drawer.rebuilt.length) log("Han cambiado de forma y se han rehecho enteros: " + drawer.rebuilt.filter((x, i, a) => a.indexOf(x) === i).join(", ") + ". Si otros flujos de este archivo los usan, actualízalos también con su .json para que no pierdan sus textos.", "warn")
  if (update) log("Actualizado: " + drawer.refreshed + " variantes de componentes puestas al día, " + replaced + " pantallas sustituidas y " + (data.screens.length - replaced) + " nuevas. Lo que no venía en el archivo sigue igual.", "ok")
  else log("Listo: " + data.screens.length + " pantallas, " + Object.keys(drawer.components).length + " variantes de componentes y " + Object.keys(drawer.icons).length + " iconos. Pulsa ▶ (Presentar) para probar el flujo.", "ok")
  figma.notify(update ? "Archivo actualizado con " + data.system.name : "Flujo dibujado con " + data.system.name)
  return drawer
}

// ---------- portada, fundamentos, documentación de componentes, orden de páginas y revisión ----------
// Valor (ya resuelto, sin alias) de cada variable del .json, en el primer modo
function valueTable(collections) {
  const raw = {}
  for (const c of collections || []) if (c.name.indexOf(" · ") < 0) for (const v of c.variables) raw[v.name] = v.values[c.modes[0]]
  const res = (name, depth) => {
    const v = raw[name]
    if (v && typeof v === "object" && v.alias) return (depth || 0) > 8 ? undefined : res(v.alias, (depth || 0) + 1)
    return v
  }
  res.names = Object.keys(raw)
  return res
}

class Sheet {
  constructor(drawer, values) {
    this.vars = drawer.vars; this.styles = drawer.styleList || []; this.effects = drawer.effects; this.values = values
  }
  style(names) { for (const n of names) { const s = this.styles.find((x) => x.name === n); if (s) return s } return null }
  async text(chars, styleNames, colorVar, size) {
    const t = figma.createText()
    const st = this.style(styleNames)
    const font = st ? st.fontName : await fontFor("Inter", 400)
    await figma.loadFontAsync(font)
    t.fontName = font
    t.characters = chars
    if (st) { try { await t.setTextStyleIdAsync(st.id) } catch (e) { t.fontSize = size || 14 } } else t.fontSize = size || 14
    t.fills = [solid("#000000", this.vars[colorVar] || this.vars["color/text/default"])]
    t.name = chars.length > 30 ? "texto" : chars
    return t
  }
  // Separación enlazada a la variable semántica que vale eso (así nada queda con un número suelto)
  space(node, field, value) {
    node[field] = value
    const name = this.values.names.find((n) => (n.indexOf("space/gap/") === 0 || n.indexOf("space/inset/") === 0) && Number(this.values(n)) === value)
    if (name) bindIf(node, field, this.vars, name)
  }
  frame(name, dir, gap, pad, fill) {
    const f = figma.createFrame()
    f.name = name
    f.layoutMode = dir
    f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO"
    this.space(f, "itemSpacing", gap)
    for (const side of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) this.space(f, side, pad)
    f.fills = fill && this.vars[fill] ? [solid("#ffffff", this.vars[fill])] : []
    return f
  }
  radius(node, name) {
    const v = Number(this.values(name))
    if (!(v >= 0)) return
    for (const f of ["topLeftRadius", "topRightRadius", "bottomRightRadius", "bottomLeftRadius"]) { node[f] = Math.min(v, 999); bindIf(node, f, this.vars, name) }
  }
  card(name, width) {
    const f = this.frame(name, "VERTICAL", 12, 24, "color/surface/card")
    f.strokes = this.vars["color/border/default"] ? [solid("#e5e5e5", this.vars["color/border/default"])] : []
    f.strokeWeight = 1
    this.radius(f, "radius/card")
    if (width) { f.counterAxisSizingMode = "FIXED"; f.resize(width, 100); f.primaryAxisSizingMode = "AUTO" }
    return f
  }
  add(parent, child, fill) {
    parent.appendChild(child)
    if (fill) { try { child.layoutSizingHorizontal = "FILL" } catch (e) { /* */ } if (child.type === "TEXT") child.textAutoResize = "HEIGHT" }
    return child
  }
}

async function clearPage(name) {
  const page = await pageNamed(name, true)
  for (const c of page.children.slice()) c.remove()
  return page
}

async function makeCover(sys, sheet) {
  const page = await clearPage("Portada · " + sys)
  const f = sheet.frame("Portada", "VERTICAL", 16, 96, "color/bg/action/primary/default")
  page.appendChild(f)
  f.primaryAxisSizingMode = "FIXED"; f.counterAxisSizingMode = "FIXED"; f.resize(1600, 960)
  f.primaryAxisAlignItems = "MAX"
  const on = "color/text/on-action/primary"
  sheet.add(f, await sheet.text("Sistema de diseño", ["texto/lead/normal", "texto/body/normal"], on, 20))
  sheet.add(f, await sheet.text(sys, ["texto/display/heavy", "texto/h1/heavy", "texto/h1/strong"], on, 64))
  const d = new Date()
  sheet.add(f, await sheet.text("Actualizado el " + d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear() + " · hecho con Design System Creator", ["texto/ui/normal", "texto/body/normal"], on, 14))
  try { await figma.setFileThumbnailNodeAsync(f) } catch (e) { /* solo si el archivo lo permite */ }
}

// Muestras de todo lo que se usa: colores, textos, espacios, radios y sombras (enlazados a sus variables)
async function makeFoundations(sys, data, sheet) {
  const page = await clearPage("Fundamentos · " + sys)
  const root = sheet.frame("Fundamentos", "VERTICAL", 48, 64, "color/bg/default")
  page.appendChild(root)
  root.counterAxisSizingMode = "FIXED"; root.resize(1600, 100); root.primaryAxisSizingMode = "AUTO"
  const section = async (title, hint) => {
    const s = sheet.add(root, sheet.frame(title, "VERTICAL", 16, 0), true)
    sheet.add(s, await sheet.text(title, ["texto/h2/strong", "texto/h2/heavy", "texto/title/strong"], "color/text/default", 30))
    if (hint) sheet.add(s, await sheet.text(hint, ["texto/body/normal", "texto/ui/normal"], "color/text/muted", 14), true)
    return s
  }
  const wrapRow = (s, name) => { const r = sheet.add(s, sheet.frame(name, "HORIZONTAL", 16, 0), true); r.layoutWrap = "WRAP"; r.counterAxisSpacing = 16; return r }
  const colorVars = (data.collections.find((c) => c.name === "Color") || { variables: [] }).variables
  const groups = [["bg", "Fondos"], ["surface", "Superficies"], ["text", "Textos e iconos"], ["border", "Bordes"], ["chart", "Gráficos"]]
  const sc = await section("Colores", "Cada color dice dónde se usa: fondo (bg), texto, borde… En Figma solo salen donde tocan.")
  for (const [g, label] of groups) {
    const list = colorVars.filter((v) => v.name.indexOf("color/" + g + "/") === 0)
    if (!list.length) continue
    sheet.add(sc, await sheet.text(label, ["texto/ui/emphasis", "texto/body/emphasis"], "color/text/default", 14))
    const row = wrapRow(sc, label)
    for (const v of list) {
      const sw = sheet.frame(v.name, "VERTICAL", 8, 0)
      row.appendChild(sw)
      sw.counterAxisSizingMode = "FIXED"; sw.resize(176, 100); sw.primaryAxisSizingMode = "AUTO"
      const chip = sheet.add(sw, figma.createFrame(), true)
      chip.name = "muestra"; chip.resize(176, 64)
      try { chip.layoutSizingVertical = "FIXED" } catch (e) { /* */ }
      chip.fills = [solid(String(sheet.values(v.name) || "#cccccc"), sheet.vars[v.name])]
      chip.strokes = sheet.vars["color/border/default"] ? [solid("#e5e5e5", sheet.vars["color/border/default"])] : []
      chip.strokeWeight = 1
      sheet.radius(chip, "radius/control")
      sheet.add(sw, await sheet.text(v.name.replace(/^color\//, ""), ["texto/caption/emphasis", "texto/caption/normal"], "color/text/default", 12), true)
      sheet.add(sw, await sheet.text(codeName(v.name), ["texto/caption/normal/code", "texto/caption/normal"], "color/text/muted", 11), true)
    }
  }
  const st = await section("Textos", "Estilos de texto: tamaño y peso enlazados a sus variables.")
  const styles = (sheet.styles || []).slice().sort((a, b) => b.fontSize - a.fontSize)
  for (const s of styles) {
    const t = await sheet.text(s.name.replace(/^texto\//, "") + " · " + Math.round(s.fontSize) + " px — El rápido zorro marrón", [s.name], "color/text/default", s.fontSize)
    sheet.add(st, t, true)
  }
  const nums = (prefix) => sheet.values.names.filter((n) => n.indexOf(prefix) === 0 && typeof sheet.values(n) === "number")
  const ss = await section("Espacios", "Márgenes (inset), separaciones (gap) y secciones.")
  for (const n of nums("space/")) {
    const r = sheet.add(ss, sheet.frame(n, "HORIZONTAL", 16, 0), true)
    r.counterAxisAlignItems = "CENTER"
    const label = sheet.add(r, await sheet.text(n.replace(/^space\//, "") + " · " + sheet.values(n) + " px", ["texto/ui/normal", "texto/body/normal"], "color/text/default", 14))
    label.textAutoResize = "HEIGHT"; label.resize(220, label.height)
    const bar = sheet.add(r, figma.createFrame())
    bar.name = "medida"; bar.resize(Math.max(1, Number(sheet.values(n))), 16)
    bar.fills = [solid("#3b82f6", sheet.vars["color/bg/action/primary/default"])]
    bindIf(bar, "width", sheet.vars, n)
  }
  const rs = await section("Radios", "Esquinas: controles, tarjetas, ventanas, píldoras…")
  const rrow = wrapRow(rs, "radios")
  for (const n of nums("radius/")) {
    const b = sheet.frame(n, "VERTICAL", 8, 16, "color/bg/muted")
    rrow.appendChild(b)
    b.primaryAxisSizingMode = "FIXED"; b.counterAxisSizingMode = "FIXED"; b.resize(140, 140)
    b.strokes = sheet.vars["color/border/strong"] ? [solid("#cccccc", sheet.vars["color/border/strong"])] : []
    b.strokeWeight = 1
    sheet.radius(b, n)
    sheet.add(b, await sheet.text(n.replace(/^radius\//, "") + " · " + sheet.values(n), ["texto/caption/normal", "texto/ui/normal"], "color/text/default", 12))
  }
  const effects = Object.keys(sheet.effects || {})
  if (effects.length) {
    const es = await section("Sombras", "Estilos de sombra (elevación).")
    const erow = wrapRow(es, "sombras")
    for (const name of effects) {
      const b = sheet.frame(name, "VERTICAL", 8, 16, "color/surface/card")
      erow.appendChild(b)
      b.primaryAxisSizingMode = "FIXED"; b.counterAxisSizingMode = "FIXED"; b.resize(180, 120)
      sheet.radius(b, "radius/card")
      try { await b.setEffectStyleIdAsync(sheet.effects[name].id) } catch (e) { /* */ }
      sheet.add(b, await sheet.text(name, ["texto/caption/normal", "texto/ui/normal"], "color/text/default", 12))
    }
  }
}

const PROP_TYPES = { VARIANT: "variante", TEXT: "texto", BOOLEAN: "sí / no", INSTANCE_SWAP: "icono a elegir", SLOT: "hueco para piezas" }
// En la página de componentes: los iconos arriba y cada componente con su ficha al lado (qué es y sus propiedades)
async function documentComponents(page, drawer, sheet) {
  for (const n of page.children.slice()) { let d = ""; try { d = n.getPluginData("doc") } catch (e) { /* */ } if (d === "1") n.remove() }
  const icons = page.children.filter((c) => c.type === "COMPONENT" && c.name.indexOf("icon/") === 0).sort((a, b) => (a.name < b.name ? -1 : 1))
  let x = 0, y = 0, rowH = 0
  for (const c of icons) {
    if (x > 1600) { x = 0; y += rowH + 32; rowH = 0 }
    c.x = x; c.y = y; x += c.width + 32; rowH = Math.max(rowH, c.height)
  }
  y += rowH + 160
  const list = page.children.filter((c) => c.type === "COMPONENT_SET" || (c.type === "COMPONENT" && c.name.indexOf("icon/") !== 0)).sort((a, b) => (a.name < b.name ? -1 : 1))
  for (const s of list) {
    const doc = sheet.card("Ficha · " + s.name, 400)
    page.appendChild(doc)
    try { doc.setPluginData("doc", "1") } catch (e) { /* */ }
    sheet.add(doc, await sheet.text(s.name, ["texto/h3/strong", "texto/title/strong", "texto/h2/strong"], "color/text/default", 22), true)
    const info = drawer.sets[s.name] || {}
    const desc = s.description || info.description
    if (desc) sheet.add(doc, await sheet.text(desc, ["texto/body/normal", "texto/ui/normal"], "color/text/muted", 14), true)
    const defs = s.type === "COMPONENT_SET" ? s.componentPropertyDefinitions : {}
    const keys = Object.keys(defs || {})
    if (s.type === "COMPONENT_SET") sheet.add(doc, await sheet.text(s.children.length + " variantes", ["texto/caption/normal", "texto/ui/normal"], "color/text/subtle", 12), true)
    if (keys.length) {
      sheet.add(doc, await sheet.text("Propiedades", ["texto/ui/strong", "texto/ui/emphasis"], "color/text/default", 14), true)
      for (const k of keys) {
        const d = defs[k]
        const values = d.type === "VARIANT" ? (d.variantOptions || []).join(", ") : d.type === "TEXT" ? "«" + String(d.defaultValue || "").slice(0, 40) + "»" : ""
        sheet.add(doc, await sheet.text(k.split("#")[0] + " — " + (PROP_TYPES[d.type] || d.type) + (values ? ": " + values : ""), ["texto/ui/normal", "texto/body/normal"], "color/text/default", 13), true)
      }
    }
    doc.x = 0; doc.y = y
    s.x = 480; s.y = y
    y += Math.max(doc.height, s.height) + 160
  }
  // Lo demás que haya en la página (de versiones anteriores o tuyo), debajo, sin pisar nada
  const placed = icons.concat(list)
  let rx = 0, rowH2 = 0
  for (const n of page.children.slice()) {
    let d = ""; try { d = n.getPluginData("doc") } catch (e) { /* */ }
    if (placed.indexOf(n) >= 0 || d === "1") continue
    if (rx > 0 && rx + n.width > 4000) { rx = 0; y += rowH2 + 160; rowH2 = 0 }
    n.x = rx; n.y = y; rx += n.width + 160; rowH2 = Math.max(rowH2, n.height)
  }
}

// Coloca las capas de primer nivel de una página en filas, sin que se pisen: primero `first` (en su orden), luego el resto
function layoutPage(page, first, maxW) {
  const rest = page.children.filter((n) => first.indexOf(n) < 0).sort((a, b) => (a.y - b.y) || (a.x - b.x))
  let x = 0, y = 0, rowH = 0
  for (const n of first.concat(rest)) {
    if (x > 0 && x + n.width > maxW) { x = 0; y += rowH + 160; rowH = 0 }
    n.x = x; n.y = y
    x += n.width + 160; rowH = Math.max(rowH, n.height)
  }
}

// Orden de las páginas: portada y fundamentos, componentes, catálogo y, al final, los flujos (con separadores)
async function orderPages(sys) {
  await figma.loadAllPagesAsync()
  const pages = () => figma.root.children.slice()
  const find = (name) => pages().find((p) => p.name === name)
  // La página vacía que trae todo archivo nuevo sobra
  for (const p of pages()) if ((p.name === "Page 1" || p.name === "Página 1") && !p.children.length && figma.root.children.length > 1) { try { if (figma.currentPage === p) await figma.setCurrentPageAsync(figma.root.children.find((x) => x !== p)); p.remove() } catch (e) { /* */ } }
  const seps = pages().filter((p) => /^-{3,}$/.test(p.name))
  while (seps.length < 3) { const p = figma.createPage(); p.name = "---"; seps.push(p) }
  const head = [find("Portada · " + sys), find("Fundamentos · " + sys), seps[0], find("Componentes · " + sys), seps[1]].filter(Boolean)
  const catalog = pages().filter((p) => p.name.indexOf("Catálogo · ") === 0 && p.name.slice(-(" · " + sys).length) === " · " + sys)
  const flows = pages().filter((p) => head.indexOf(p) < 0 && catalog.indexOf(p) < 0 && seps.indexOf(p) < 0 && p.name.indexOf(" · " + sys) > 0 && p.name.indexOf("Catálogo") !== 0)
  const order = head.concat(catalog, [seps[2]], flows)
  for (let i = 0; i < order.length; i++) { try { figma.root.insertChild(i, order[i]) } catch (e) { /* */ } }
}

// Revisión automática al terminar: lo que no cumple las reglas, para arreglarlo (o avisar a Claude)
async function auditFile(sys) {
  await figma.loadAllPagesAsync()
  const pages = figma.root.children.filter((p) => p.name.indexOf(" · " + sys) > 0 && p.name.indexOf("Portada") !== 0 && p.name.indexOf("Fundamentos") !== 0 && p.name.indexOf("(antiguo)") < 0)
  const c = { color: 0, space: 0, names: 0, hugFill: 0, free: 0, small: 0 }
  const ex = { color: [], space: [], names: [], hugFill: [], free: [], small: [] }
  const where = (n) => { const out = []; for (let x = n; x && x.type !== "PAGE"; x = x.parent) out.unshift(x.name); return out.slice(-3).join(" › ") }
  const hit = (k, n) => { c[k]++; if (ex[k].length < 3 && ex[k].indexOf(where(n)) < 0) ex[k].push(where(n)) }
  const DEFAULT = /^(Frame|Group|Rectangle|Ellipse|FRAME|GROUP|div|span|grupo|columna|fila)( \d+)?$/
  const TOUCH = { button: 1, "icon-button": 1, "fab-button": 1, "back-button": 1, "app-tab-bar-item": 1, "toggle-group-item": 1, toggle: 1, "tab-trigger": 1, "tabs-trigger": 1, "pagination-link": 1 }
  const walk = (n, mobile, inIcon) => {
    const icon = inIcon || (n.type === "COMPONENT" && n.name.indexOf("icon/") === 0)
    if (!icon && n.type !== "INSTANCE" && n.type !== "VECTOR") {
      for (const k of ["fills", "strokes"]) {
        const ps = n[k]
        if (Array.isArray(ps)) for (const p of ps) if (p.type === "SOLID" && p.visible !== false && !(p.boundVariables && p.boundVariables.color)) hit("color", n)
      }
      if ("layoutMode" in n && n.layoutMode !== "NONE") {
        const bv = n.boundVariables || {}
        for (const f of ["itemSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) if (n[f] > 0 && !bv[f]) { hit("space", n); break }
        for (const k of n.children || []) {
          const hor = n.layoutMode === "HORIZONTAL"
          if ((n.primaryAxisSizingMode === "AUTO" && (hor ? k.layoutSizingHorizontal : k.layoutSizingVertical) === "FILL") ||
              (n.counterAxisSizingMode === "AUTO" && (hor ? k.layoutSizingVertical : k.layoutSizingHorizontal) === "FILL")) hit("hugFill", k)
        }
      }
      if (n.type === "FRAME" && n.parent && n.parent.type !== "PAGE" && n.layoutMode === "NONE" && (n.children || []).filter((k) => k.type !== "VECTOR").length > 1) hit("free", n)
      if ((n.type === "FRAME" || n.type === "TEXT") && DEFAULT.test(n.name)) hit("names", n)
    }
    if (n.type === "INSTANCE") {
      if (mobile && TOUCH[n.name] && (n.width < 44 || n.height < 44)) hit("small", n)
      return
    }
    for (const k of n.children || []) walk(k, mobile, icon)
  }
  for (const p of pages) for (const k of p.children) walk(k, p.name.indexOf("Móvil") > 0, false)
  const sets = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] })
  const big = sets.filter((s) => s.children.length > 30 && s.name !== "button").map((s) => s.name + " (" + s.children.length + ")")
  const noDesc = sets.filter((s) => !s.description).map((s) => s.name)
  const vars = await figma.variables.getLocalVariablesAsync()
  const noScope = vars.filter((v) => v.scopes && v.scopes.length === 1 && v.scopes[0] === "ALL_SCOPES").length
  const lines = []
  const say = (ok, good, bad, k) => lines.push(ok ? "✓ " + good : "⚠ " + bad + (k && ex[k].length ? " (p. ej. " + ex[k].join("; ") + ")" : ""))
  say(!c.color, "todos los colores enlazados a variables", c.color + " colores sin variable", "color")
  say(!c.space, "todos los márgenes y separaciones enlazados", c.space + " cajas con márgenes o separaciones sin variable", "space")
  say(!c.names, "ninguna capa con nombre por defecto", c.names + " capas con nombre por defecto (Frame, div…)", "names")
  say(!c.hugFill, "ninguna caja Hug con un hijo Fill", c.hugFill + " cajas que abrazan con un hijo que rellena", "hugFill")
  say(!c.free, "nada en posición libre (todo auto layout)", c.free + " cajas sin auto layout con varias capas", "free")
  say(!big.length, "ningún componente con más de 30 variantes (salvo el botón)", "componentes con muchas variantes: " + big.slice(0, 6).join(", "))
  say(!noDesc.length, "todos los componentes con descripción", noDesc.length + " componentes sin descripción: " + noDesc.slice(0, 6).join(", "))
  say(!noScope, "todas las variables con su uso (scope) y su nombre de código", noScope + " variables sin uso definido")
  say(!c.small, "zonas táctiles de 44 px o más en móvil", c.small + " botones o pestañas de menos de 44 px en móvil (en la web el área táctil puede ser mayor)", "small")
  log("Revisión del archivo:\n" + lines.join("\n"), lines.some((l) => l[0] === "⚠") ? "warn" : "ok")
}

async function finishFile(data, drawer) {
  if (!drawer) return
  const sys = data.system.name
  // Al final, con todos los componentes ya hechos: propiedades otra vez (por si alguna no se pudo en un flujo) y
  // los textos e iconos de todas las instancias, también las de los primeros flujos
  drawer.final = true
  try {
    await bindProperties(drawer)
    for (const t of drawer.toggled) await drawer.setProps(t.inst, t.n)
    await settle(drawer, drawer.toggled)
  } catch (e) { log("No he podido repasar las propiedades: " + e.message, "warn") }
  const sheet = new Sheet(drawer, valueTable(data.collections))
  const steps = [["orden de variantes", async () => arrangeSets()], ["portada", () => makeCover(sys, sheet)], ["fundamentos", () => makeFoundations(sys, data, sheet)], ["fichas de componentes", () => documentComponents(drawer.page, drawer, sheet)], ["orden de páginas", () => orderPages(sys)], ["revisión", () => auditFile(sys)]]
  for (const [label, fn] of steps) {
    try { await fn() } catch (e) { log("No he podido hacer " + label + ": " + (e && e.message ? e.message : e), "warn"); console.error(e) }
  }
}

// ---------- exportar cambios (vuelta) ----------
async function varName(id) {
  if (!id) return undefined
  const v = await figma.variables.getVariableByIdAsync(id)
  return v ? v.name : undefined
}

async function paintOut(p) {
  if (!p || p.type !== "SOLID") return p ? { type: p.type } : undefined
  const id = p.boundVariables && p.boundVariables.color ? p.boundVariables.color.id : undefined
  const out = { color: rgbaToHex(p.color, p.opacity), token: await varName(id) }
  if (id) {
    // ¿Es la copia de «Oscuro» (plan gratis)? Tiene el mismo nombre que la buena, pero en claro se vería otro color.
    const v = await figma.variables.getVariableByIdAsync(id)
    const c = v ? await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId) : null
    if (c && c.name.indexOf(" · ") > 0) out.collection = c.name
  }
  return out
}

async function nodeOut(n) {
  const o = { type: n.type, name: n.name, w: Math.round(n.width), h: Math.round(n.height), x: Math.round(n.x), y: Math.round(n.y) }
  if (n.visible === false) o.hidden = true
  const bv = n.boundVariables || {}
  const bind = {}
  for (const k of Object.keys(bv)) {
    if (k === "fills" || k === "strokes" || k === "componentProperties") continue
    const ref = Array.isArray(bv[k]) ? bv[k][0] : bv[k]
    if (ref && ref.id) bind[k] = await varName(ref.id)
  }
  if (Object.keys(bind).length) o.bind = bind
  if ("fills" in n && Array.isArray(n.fills) && n.fills.length) o.fills = await Promise.all(n.fills.filter((p) => p.visible !== false).map(paintOut))
  if ("strokes" in n && n.strokes.length) { o.strokes = await Promise.all(n.strokes.map(paintOut)); o.strokeWeight = n.strokeWeight === figma.mixed ? [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight] : n.strokeWeight }
  if ("cornerRadius" in n) o.radius = n.cornerRadius === figma.mixed ? [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius] : n.cornerRadius
  if ("effectStyleId" in n && n.effectStyleId) { const s = await figma.getStyleByIdAsync(n.effectStyleId); if (s) o.effect = s.name }
  if ("opacity" in n && n.opacity < 1) o.opacity = n.opacity
  if ("layoutMode" in n && n.layoutMode !== "NONE") {
    o.layout = { mode: n.layoutMode, gap: n.itemSpacing, pad: [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft], main: n.primaryAxisAlignItems, cross: n.counterAxisAlignItems, wrap: n.layoutWrap === "WRAP" }
  }
  if ("layoutSizingHorizontal" in n) o.sizing = { h: n.layoutSizingHorizontal, v: n.layoutSizingVertical }
  if (n.type === "TEXT") {
    o.text = { chars: n.characters, fontSize: n.fontSize, fontName: n.fontName, align: n.textAlignHorizontal }
    if (typeof n.textStyleId === "string" && n.textStyleId) { const st = await figma.getStyleByIdAsync(n.textStyleId); if (st) o.text.style = st.name }
  }
  if (n.reactions && n.reactions.length) {
    const r = n.reactions[0]
    const a = r.actions && r.actions[0]
    if (a && a.destinationId) { const d = await figma.getNodeByIdAsync(a.destinationId); if (d) o.link = d.name }
  }
  if (n.type === "INSTANCE") {
    const main = await n.getMainComponentAsync()
    if (main) {
      o.component = main.parent && main.parent.type === "COMPONENT_SET" ? { set: main.parent.name, variant: main.name } : { name: main.name }
    }
    // Dentro de una instancia solo importan los textos e iconos que cambian
    o.texts = n.findAll((x) => x.type === "TEXT").map((t) => t.characters)
    o.icons = []
    for (const x of n.findAll((y) => isIconLayer(y) && y.visible !== false)) { const m = await x.getMainComponentAsync(); o.icons.push(m ? m.name : x.name) }
    // Sus propiedades (textos, iconos encendidos, partes opcionales) tal como están en esta pantalla
    try {
      const cp = n.componentProperties, pr = {}
      for (const k of Object.keys(cp)) {
        if (cp[k].type === "VARIANT" || cp[k].type === "SLOT" || cp[k].value === undefined) continue
        let v = cp[k].value
        if (cp[k].type === "INSTANCE_SWAP") { const c = await figma.getNodeByIdAsync(String(v)); v = c ? c.name : v }
        pr[k.split("#")[0]] = v
      }
      if (Object.keys(pr).length) o.props = pr
    } catch (e) { /* */ }
    return o
  }
  if ("children" in n) o.children = await Promise.all(n.children.map(nodeOut))
  return o
}

async function exportChanges() {
  await figma.loadAllPagesAsync()
  log("Leyendo variables, componentes y pantallas…")
  const cols = await figma.variables.getLocalVariableCollectionsAsync()
  const collections = []
  for (const c of cols) {
    const vars = []
    for (const id of c.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id)
      if (!v) continue
      const values = {}
      for (const m of c.modes) {
        const val = v.valuesByMode[m.modeId]
        if (val && typeof val === "object" && val.type === "VARIABLE_ALIAS") values[m.name] = { alias: await varName(val.id) }
        else if (v.resolvedType === "COLOR" && val) values[m.name] = rgbaToHex(val)
        else values[m.name] = val
      }
      vars.push({ name: v.name, type: v.resolvedType, values, description: v.description || undefined })
    }
    collections.push({ name: c.name, modes: c.modes.map((m) => m.name), variables: vars })
  }
  const effects = (await figma.getLocalEffectStylesAsync()).map((s) => ({ name: s.name, effects: s.effects }))
  const components = []
  for (const s of figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] })) {
    components.push({ set: s.name, page: s.parent && s.parent.type === "PAGE" ? s.parent.name : undefined, variants: await Promise.all(s.children.map(nodeOut)) })
  }
  for (const c of figma.root.findAllWithCriteria({ types: ["COMPONENT"] })) {
    if (c.parent && c.parent.type === "COMPONENT_SET") continue
    if (c.name.indexOf("icon/") === 0) { components.push({ icon: c.name }); continue }
    components.push({ name: c.name, node: await nodeOut(c) })
  }
  // Pantallas: lo seleccionado o, si no hay nada, los marcos de la página actual
  const page = figma.currentPage
  const sel = page.selection.filter((n) => n.type === "FRAME" || n.type === "SECTION")
  const top = sel.length ? sel : page.children.filter((n) => n.type === "FRAME")
  const screens = []
  for (const f of top) screens.push(await nodeOut(f))
  const out = { format: "dsc-figma-changes@1", file: figma.root.name, page: page.name, exportedAt: new Date().toISOString(), collections, effects, components, screens }
  figma.ui.postMessage({ type: "download", name: "cambios-figma-" + page.name.replace(/[^\w-]+/g, "-").toLowerCase() + ".json", content: JSON.stringify(out, null, 2) })
  log("Exportado: " + collections.reduce((s, c) => s + c.variables.length, 0) + " variables, " + components.length + " componentes y " + screens.length + " pantallas de «" + page.name + "». Súbeme el archivo al chat.", "ok")
}
