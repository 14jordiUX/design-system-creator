// Plugin «Design System Creator» para Figma.
// - Dibujar: lee el .json que descarga la web (Prototipos → Compartir → Llevar a Figma) y crea, en este archivo:
//     · variables (Primitivos ocultos, Semánticos y Color con modos Claro / Oscuro) y estilos de sombra
//     · una página de componentes (con variantes) y otra con las pantallas del flujo, conectadas como prototipo
//   Todo color, espacio, radio y texto queda enlazado a su variable. Si las variables o los componentes ya existen
//   (por ejemplo, porque los has cambiado tú), se reutilizan: no se pisan tus cambios salvo que lo pidas.
// - Exportar cambios: guarda en un .json las variables, los componentes y las pantallas tal como están ahora,
//   para que Claude reconstruya el código igual que lo has dibujado.

figma.showUI(__html__, { width: 420, height: 600, themeColors: true })

const log = (text, kind) => figma.ui.postMessage({ type: "log", text, kind: kind || "info" })

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "draw") await draw(msg.data, msg.options || {})
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

// ---------- variables ----------
async function upsertVariables(collections, overwrite) {
  const existingCols = await figma.variables.getLocalVariableCollectionsAsync()
  const existingVars = await figma.variables.getLocalVariablesAsync()
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
      if (col.hidden || !col.register) fv.scopes = []   // primitivos y copias de modo no salen en los selectores: se diseña con semánticos de «Color»
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

function paintIcon(node, paint) {
  const all = "findAll" in node ? node.findAll(() => true) : []
  for (const n of [node].concat(all)) {
    if (n.type === "INSTANCE" || n.type === "FRAME" || n.type === "COMPONENT") continue
    if ("strokes" in n && n.strokes.length) n.strokes = [paint]
    if ("fills" in n && n.fills !== figma.mixed && n.fills.length) n.fills = [paint]
  }
}

class Drawer {
  constructor(vars, effects, componentsPage) {
    this.vars = vars; this.effects = effects; this.page = componentsPage
    this.components = {}        // set|props → ComponentNode
    this.icons = {}             // icon/<nombre> → ComponentNode
    this.links = []             // { node, to }
    this.compX = 0; this.compY = 0
  }

  async text(n, parent) {
    const t = figma.createText()
    parent.appendChild(t)
    t.fontName = await fontFor(n.text.family, n.text.weight)
    t.characters = n.text.chars
    t.fontSize = n.text.size
    if (n.text.lineHeight) t.lineHeight = { value: n.text.lineHeight, unit: "PIXELS" }
    if (n.text.letterSpacing) t.letterSpacing = { value: n.text.letterSpacing, unit: "PIXELS" }
    if (n.text.upper) t.textCase = "UPPER"
    t.textAlignHorizontal = n.text.align
    t.fills = [solid(n.text.color.color, tokenVar(this.vars, n.text.color.token))]
    const len = t.characters.length
    for (const field of ["fontSize", "fontWeight", "fontFamily"]) {
      const v = tokenVar(this.vars, n.text.bind[field])
      if (v && len) { try { t.setRangeBoundVariable(0, len, field, v) } catch (e) { /* si la fuente no lo permite */ } }
    }
    t.name = n.name
    if (n.text.single) t.textAutoResize = "WIDTH_AND_HEIGHT"
    else { t.textAutoResize = "HEIGHT"; t.resize(Math.max(1, n.w + 1), Math.max(1, n.h)) }
    return t
  }

  async icon(n) {
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
    const inst = this.icons[n.name].createInstance()
    inst.resize(n.w, n.h)
    paintIcon(inst, solid(n.fill.color, tokenVar(this.vars, n.fill.token)))
    return inst
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
      frame.strokeAlign = "INSIDE"
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
      if (n.bind) for (const f of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"]) bindIf(frame, f, this.vars, n.bind[f])
    }
  }

  // Dibuja un nodo dentro de `parent`. `asDefinition`: estamos creando el componente, no una instancia.
  async node(n, parent, parentNode, asDefinition) {
    let out
    if (n.type === "TEXT") out = await this.text(n, parent)
    else if (n.type === "SVG") { out = n.icon ? await this.icon(n) : figma.createNodeFromSvg(n.svg); parent.appendChild(out) }
    else if (n.component && !asDefinition) { out = await this.instance(n); parent.appendChild(out) }
    else {
      out = figma.createFrame()
      parent.appendChild(out)
      await this.box(n, out)
      for (const c of n.children || []) await this.node(c, out, n, false)
    }
    this.fit(out, n, parentNode)
    if (n.link) this.links.push({ node: out, to: n.link })
    return out
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
    if (this.components[key]) return this.components[key]
    // ¿Ya existe en el archivo (quizá cambiado por ti)? Entonces se reutiliza tal cual
    const existing = await findComponent(n.component.set, n.component.props)
    if (existing) { this.components[key] = existing; return existing }
    const holder = figma.createFrame()
    this.page.appendChild(holder)
    const frame = await this.node(Object.assign({}, n, { sizing: undefined, link: undefined }), holder, null, true)
    const comp = figma.createComponentFromNode(frame)
    comp.name = props(n.component.props) || "default"
    this.page.appendChild(comp)
    holder.remove()
    comp.setPluginData("set", n.component.set)
    this.components[key] = comp
    return comp
  }

  async instance(n) {
    const comp = await this.definition(n)
    const inst = comp.createInstance()
    // Lo que cambia de una vez a otra: los textos y sus colores, y qué icono va
    const texts = inst.findAll((x) => x.type === "TEXT")
    const want = collect(n, "TEXT")
    for (let i = 0; i < Math.min(texts.length, want.length); i++) {
      const t = texts[i], w = want[i]
      if (t.characters !== w.text.chars) {
        await figma.loadFontAsync(t.fontName === figma.mixed ? await fontFor(w.text.family, w.text.weight) : t.fontName)
        t.characters = w.text.chars
      }
      t.fills = [solid(w.text.color.color, tokenVar(this.vars, w.text.color.token))]
    }
    const icons = inst.findAll((x) => x.type === "INSTANCE" && x.name.indexOf("icon/") === 0)
    const wantIcons = collect(n, "SVG").filter((x) => x.icon)
    for (let i = 0; i < Math.min(icons.length, wantIcons.length); i++) {
      const w = wantIcons[i]
      if (icons[i].name !== w.name) { await this.icon(w); icons[i].swapComponent(this.icons[w.name]) }
      paintIcon(icons[i], solid(w.fill.color, tokenVar(this.vars, w.fill.token)))
    }
    inst.name = n.component.set
    return inst
  }
}

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
  return componentIndex[set + "|" + props(p)] || null
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
    for (const c of comps) c.name.split(", ").forEach((kv) => { names[kv.split("=")[0]] = true })
    for (const c of comps) {
      const cur = {}
      c.name.split(", ").forEach((kv) => { const [k, v] = kv.split("="); if (k) cur[k] = v })
      for (const k of Object.keys(names)) if (!cur[k]) cur[k] = k === "estado" ? "normal" : "default"
      c.name = props(cur)
    }
    const existingSet = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] }).find((s) => s.name === set)
    if (existingSet) { for (const c of comps) existingSet.appendChild(c); continue }
    const cs = figma.combineAsVariants(comps, drawer.page)
    cs.name = set
    cs.layoutMode = "HORIZONTAL"; cs.layoutWrap = "WRAP"; cs.itemSpacing = 24; cs.counterAxisSpacing = 24
    cs.paddingTop = cs.paddingRight = cs.paddingBottom = cs.paddingLeft = 24
    cs.primaryAxisSizingMode = "AUTO"; cs.counterAxisSizingMode = "AUTO"
    cs.x = 0; cs.y = y
    y += cs.height + 80
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
  log("Sistema " + data.system.name + " · " + data.prototype.label + " (" + data.mode + ")")
  const vars = await upsertVariables(data.collections, !!options.overwrite)
  const effects = await upsertEffects(data.effects || [], !!options.overwrite)

  const compPage = await pageNamed("Componentes · " + data.system.name, true)
  const flowPage = await pageNamed(data.prototype.label + " · " + data.system.name, false)
  const drawer = new Drawer(vars, effects, compPage)
  drawer.compY = compPage.children.reduce((m, n) => Math.max(m, n.y + n.height + 120), 0)

  await figma.setCurrentPageAsync(flowPage)
  const frames = {}
  let x = 0
  const gap = 160
  for (const s of data.screens) {
    log("Dibujando «" + s.label + "»…")
    const frame = await drawer.node(Object.assign({}, s.node, { sizing: undefined }), flowPage, null, true)
    frame.name = s.label
    frame.x = x; frame.y = 0
    frame.clipsContent = true
    x += frame.width + gap
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
  figma.viewport.scrollAndZoomIntoView(Object.keys(frames).map((k) => frames[k]))
  log("Listo: " + data.screens.length + " pantallas, " + Object.keys(drawer.components).length + " variantes de componentes y " + Object.keys(drawer.icons).length + " iconos. Pulsa ▶ (Presentar) para probar el flujo.", "ok")
  figma.notify("Flujo dibujado con " + data.system.name)
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
    o.icons = n.findAll((x) => x.type === "INSTANCE" && x.name.indexOf("icon/") === 0).map((x) => x.name)
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
