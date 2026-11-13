// Laboratorio · Barra flotante en vertical, a la derecha (para usarla con el pulgar).
// Misma idea que la barra horizontal («Todo, sin hover»): fusión líquida entre niveles, fondo de pestaña con gota y empuje al pulsar.
//   · Inicio: las pestañas en una columna abajo a la derecha. Al bajar por la lista se encoge (sin textos, más estrecha).
//   · Detalle: volver, favorito y compartir en la columna de la derecha; el CTA «Añadir a la cesta» sigue flotando abajo en el centro.
//   · Ventana: la X abajo a la derecha.
//   · Lado: la columna puede ir a la derecha o a la izquierda. Se cambia arrastrando el menú principal (solo el de inicio)
//     hacia el lado contrario; una capa de tutorial lo explica la primera vez. El lado elegido se recuerda.
//   · Opción «mano» (params.hand): sin tutorial y con magia: si haces scroll con el dedo en la mitad derecha de la pantalla,
//     el menú se va a la derecha; si lo haces en la mitad izquierda, a la izquierda. Arrastrarlo sigue funcionando.
//   · Opción «arco» (params.arc): sin tutorial. Al hacer scroll con el pulgar, el dedo dibuja un arco y termina hacia el lado
//     de su mano. Bajando (el dedo sube): si acaba más a la izquierda de donde empezó, el menú va a la izquierda; más a la derecha, a la derecha.
//     Subiendo (el dedo baja) el arco va al revés, así que la regla se invierte.
// Las tres piezas de fondo (a, b, c) se juntan en una sola en inicio y en la ventana, y se separan como un líquido en el detalle.
// Todos los valores salen de tokens del sistema o de variables --lab-* de laboratorio.json.
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react"
import { ArrowLeft, Hand, Heart, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Option } from "./previews"
import { CONCENTRIC, DETAILS, KIDS, MORE_DETAILS, MORE_PRODUCTS, PRODUCTS, SIZES, TABS, ms, px } from "./floating-bar"

type Level = "home" | "detail" | "modal"
type Blob = "a" | "b" | "c"
type Rect = { x: number; y: number; w: number; h: number }
type Press = { blob: Blob; x: number; y: number } | null
const BLOBS: Blob[] = ["a", "b", "c"]
type Side = "right" | "left"
const SIDE_KEY = "dsc.lab.barra.lado", TUTORIAL_KEY = "dsc.lab.barra.tutorial"
const stored = (store: () => Storage, key: string) => { try { return store().getItem(key) } catch { return null } }
const store = (st: () => Storage, key: string, value: string) => { try { st().setItem(key, value) } catch { /* modo privado: no se recuerda */ } }

export function FloatingBarVertical({ option, fullscreen = false }: { option: Option; fullscreen?: boolean }) {
  const p = option.params ?? {}
  const goo = !!p.goo, push = !!p.push
  const gooId = useId().replace(/:/g, "")
  const frame = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const dock = useRef<HTMLDivElement>(null)
  const probeMd = useRef<HTMLSpanElement>(null), probeSm = useRef<HTMLSpanElement>(null)
  const levelRef = useRef<Level>("home")
  const products = fullscreen ? [...PRODUCTS, ...MORE_PRODUCTS] : PRODUCTS
  const details = fullscreen ? [...DETAILS, ...MORE_DETAILS] : DETAILS

  const [level, setLevel] = useState<Level>("home")
  const [shown, setShown] = useState<Level>("home")
  const [visible, setVisible] = useState(true)
  const [compact, setCompact] = useState(false)
  const [tab, setTab] = useState(0)
  const [dir, setDir] = useState(1)
  const [product, setProduct] = useState(PRODUCTS[0])
  const [press, setPress] = useState<Press>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [cta, setCta] = useState({ md: 0, sm: 0 })   // ancho del CTA en tamaño normal y pequeño, medido de copias invisibles
  const [merging, setMerging] = useState(false)
  const [side, setSide] = useState<Side>(() => (stored(() => localStorage, SIDE_KEY) === "left" ? "left" : "right"))
  const [drag, setDrag] = useState<number | null>(null)   // px que llevas arrastrado el menú (null: no se está arrastrando)
  const hand = !!p.hand, arc = !!p.arc
  const [tutorial, setTutorial] = useState(() => !hand && !arc && stored(() => sessionStorage, TUTORIAL_KEY) !== "visto")
  // Mano: dónde empezó el último gesto (dedo o rueda del ratón). Se decide una vez por gesto, cuando de verdad hay scroll.
  const gestureX = useRef<number | null>(null)
  const sideRef = useRef<Side>("right")
  const dragNow = useRef<number | null>(null)   // el mismo valor que drag, al momento (soltar puede llegar antes de que se repinte)
  const dragged = useRef(false)   // para que soltar después de arrastrar no cuente como un toque en una pestaña
  const ghost = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = dock.current
    if (!el) return
    const measure = () => {
      setBox({ w: el.clientWidth, h: el.clientHeight })
      setCta({ md: probeMd.current?.offsetWidth ?? 0, sm: probeSm.current?.offsetWidth ?? 0 })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (probeMd.current) ro.observe(probeMd.current)
    if (probeSm.current) ro.observe(probeSm.current)
    measure()
    return () => ro.disconnect()
  }, [])

  // Al cambiar de nivel: se van iconos y botones, se mueve el fondo y aparecen los del nuevo nivel
  useEffect(() => {
    if (level === shown) return
    setVisible(false)
    const t = window.setTimeout(() => { setShown(level); setVisible(true) }, ms(frame.current, "--lab-shape-time") * 0.6)
    return () => window.clearTimeout(t)
  }, [level, shown])
  // Mientras la columna se encoge o crece, el fondo de la pestaña se mueve con ella (los dos bordes a la vez)
  const [resizing, setResizing] = useState(false)
  const [sizedAs, setSizedAs] = useState(compact)
  if (sizedAs !== compact) { setSizedAs(compact); setResizing(true) }
  useEffect(() => {
    if (!resizing) return
    const r = window.setTimeout(() => setResizing(false), ms(frame.current, "--lab-shape-time"))
    return () => window.clearTimeout(r)
  }, [resizing, compact])
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setMerging(true)
    const u = window.setTimeout(() => setMerging(false), ms(frame.current, "--lab-shape-time"))
    return () => window.clearTimeout(u)
  }, [level])

  // Al bajar se encoge, al subir (o arriba del todo) vuelve a ser grande
  useEffect(() => {
    const els = [scroller.current, sheet.current].filter((e): e is HTMLDivElement => !!e)
    const offs = els.map((el) => {
      const own = el === sheet.current
      const step = px(el, "--motion-distance-scroll")
      let last = el.scrollTop, run = 0
      const onScroll = () => {
        const y = Math.max(0, el.scrollTop), d = y - last
        last = y
        if (own !== (levelRef.current === "modal")) return
        const gx = gestureX.current, box = frame.current?.getBoundingClientRect()
        if (hand && gx !== null && box && Math.abs(d) > 0) {
          gestureX.current = null
          const next: Side = gx - box.left > box.width / 2 ? "right" : "left"
          if (next !== sideRef.current) { setSide(next); store(() => localStorage, SIDE_KEY, next) }
        }
        if (y <= step) { run = 0; setCompact(false); return }
        run = Math.sign(d) === Math.sign(run) ? run + d : d
        if (run > step) setCompact(true)
        else if (run < -step) setCompact(false)
      }
      // Al tocar se apunta dónde está el dedo; con la rueda del ratón, dónde está el puntero
      const onStart = (e: PointerEvent | WheelEvent) => { gestureX.current = e.clientX }
      // Arco: dónde empieza y dónde acaba el dedo (eventos de toque, que siguen llegando mientras la página se desliza)
      let arcStart: { x: number; top: number } | null = null
      const onTouchStart = (e: TouchEvent) => { arcStart = e.touches.length === 1 ? { x: e.touches[0].clientX, top: el.scrollTop } : null }
      const onTouchEnd = (e: TouchEvent) => {
        const st = arcStart, t = e.changedTouches[0]
        arcStart = null
        if (!st || !t || el.scrollTop === st.top) return   // solo cuenta si de verdad hubo scroll (un toque no mueve el menú)
        const dx = t.clientX - st.x
        if (Math.abs(dx) < px(el, "--space-gap-sm")) return   // casi recto: no se sabe la mano, se queda donde está
        const down = el.scrollTop > st.top   // bajando por la página: el dedo sube y el arco se curva hacia el lado de la mano
        const next: Side = (dx < 0) === down ? "left" : "right"
        if (next !== sideRef.current) { setSide(next); store(() => localStorage, SIDE_KEY, next) }
      }
      el.addEventListener("scroll", onScroll, { passive: true })
      el.addEventListener("pointerdown", onStart, { passive: true })
      el.addEventListener("wheel", onStart, { passive: true })
      if (arc) {
        el.addEventListener("touchstart", onTouchStart, { passive: true })
        el.addEventListener("touchend", onTouchEnd, { passive: true })
        el.addEventListener("touchcancel", onTouchEnd, { passive: true })
      }
      return () => {
        el.removeEventListener("scroll", onScroll); el.removeEventListener("pointerdown", onStart); el.removeEventListener("wheel", onStart)
        el.removeEventListener("touchstart", onTouchStart); el.removeEventListener("touchend", onTouchEnd); el.removeEventListener("touchcancel", onTouchEnd)
      }
    })
    return () => offs.forEach((off) => off())
  }, [hand, arc])

  const go = (l: Level) => {
    if (l !== "modal" && scroller.current) scroller.current.scrollTop = 0
    if (l === "modal" && sheet.current) sheet.current.scrollTop = 0
    levelRef.current = l
    setCompact(false); setLevel(l)
  }

  // ---------- geometría (todo sale de tokens del sistema) ----------
  const root = frame.current
  const H = px(root, "--size-tab-bar-expanded"), Hc = px(root, "--size-tab-bar-compact")
  const pad = px(root, "--space-inset-2xs"), gap = px(root, "--space-gap-sm")
  const { w: W, h: D } = box
  const n = TABS.length
  const small = compact
  const col = small ? Hc : H            // ancho de la columna (y diámetro de los círculos)
  const cell = col - pad * 2            // cada pestaña o acción es un cuadrado dentro de la columna
  sideRef.current = side
  const travel = Math.max(0, W - col)   // lo que recorre la columna de un lado al otro
  const sign = side === "right" ? -1 : 1
  const colX = (side === "right" ? travel : 0) + (drag ?? 0)
  let a: Rect, b: Rect, c: Rect
  if (level === "home") {
    const h = n * cell + pad * 2
    a = b = c = { x: colX, y: D - h, w: col, h }
  } else if (level === "detail") {
    const bh = cell * 2 + pad * 2
    b = { x: colX, y: D - bh, w: col, h: bh }
    a = { x: colX, y: b.y - gap - col, w: col, h: col }
    const ch = small ? Hc : H, cw = (small ? cta.sm : cta.md) + pad * 2
    // En el centro de la pantalla; si en un teléfono estrecho tocara la columna, se aparta hacia el otro lado
    const mid = (W - cw) / 2
    c = { x: side === "right" ? Math.min(mid, colX - gap - cw) : Math.max(mid, colX + col + gap), y: D - ch, w: cw, h: ch }
  } else {
    a = b = c = { x: colX, y: D - col, w: col, h: col }
  }
  const rects: Record<Blob, Rect> = { a, b, c }

  // Empuje: se hunde la parte que tocas. En las piezas altas se inclina arriba/abajo; en las anchas, a los lados.
  const merged = level !== "detail"
  const hit = (blob: Blob) => !!press && (press.blob === blob || merged)
  const depth = px(root, "--lab-depth"), sink = px(root, "--lab-press"), maxTilt = px(root, "--lab-max-tilt")
  const pressStyle = (r: Rect, blob: Blob): CSSProperties => {
    if (!push || !press || !hit(blob) || !r.w || !r.h) return { transform: "none", transformOrigin: "50% 50%" }
    const tall = r.h > r.w
    const k = ((tall ? press.y : press.x) - 0.5) * 2
    const tilt = Math.min(maxTilt, (Math.asin(Math.min(1, depth / (tall ? r.h : r.w))) * 180) / Math.PI) * k
    const scale = 1 - (sink * 2) / Math.max(r.w, r.h)
    return tall
      ? { transform: `perspective(var(--lab-persp)) rotateX(${(-tilt).toFixed(2)}deg) scale(${scale.toFixed(4)})`, transformOrigin: `50% ${((1 - press.y) * 100).toFixed(1)}%` }
      : { transform: `perspective(var(--lab-persp)) rotateY(${tilt.toFixed(2)}deg) scale(${scale.toFixed(4)})`, transformOrigin: `${((1 - press.x) * 100).toFixed(1)}% 50%` }
  }
  const timing = (pressed: boolean): CSSProperties => ({
    transitionProperty: "left, top, width, height, transform",
    transitionDuration: `${drag === null ? "var(--lab-shape-time)" : "0s"}, var(--lab-shape-time), var(--lab-shape-time), var(--lab-shape-time), ${pressed ? "var(--lab-press-time)" : "var(--lab-release-time)"}`,
    transitionTimingFunction: `var(--lab-shape-ease), var(--lab-shape-ease), var(--lab-shape-ease), var(--lab-shape-ease), ${pressed ? "var(--lab-press-ease)" : "var(--lab-release-ease)"}`,
  })
  const place = (blob: Blob): CSSProperties => {
    const r = rects[blob]
    return { ...timing(hit(blob)), ...pressStyle(r, blob), left: r.x, top: r.y, width: r.w, height: r.h }
  }
  const onDown = (blob: Blob) => (e: RPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPress({ blob, x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) })
  }
  const release = () => setPress(null)

  // ---------- cambiar de lado: arrastrar el menú principal hacia el lado contrario ----------
  // Empieza a contar cuando el dedo se mueve más a los lados que arriba/abajo. Al soltar, si ha pasado de la mitad
  // del camino se queda en el otro lado; si no, vuelve al suyo (con el mismo muelle que el resto de la barra).
  // Se escucha en toda la ventana: un dedo rápido sale del menú antes de que el menú se haya movido.
  const geo = useRef({ side, travel, gap })
  geo.current = { side, travel, gap }
  const dragDown = (e: RPointerEvent<HTMLElement>) => {
    const st = { x: e.clientX, y: e.clientY, id: e.pointerId }
    dragged.current = false
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== st.id) return
      const { side, travel, gap } = geo.current
      const dx = ev.clientX - st.x, dy = ev.clientY - st.y
      if (dragNow.current === null) {
        if (Math.abs(dx) < gap || Math.abs(dx) < Math.abs(dy)) return
        dragged.current = true
        setPress(null)
      }
      dragNow.current = side === "right" ? Math.min(0, Math.max(-travel, dx)) : Math.max(0, Math.min(travel, dx))
      setDrag(dragNow.current)
    }
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== st.id) return
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
      const moved = dragNow.current
      dragNow.current = null
      if (moved === null) return
      const { side, travel } = geo.current
      if (Math.abs(moved) > travel / 2) {
        const next: Side = side === "right" ? "left" : "right"
        setSide(next); store(() => localStorage, SIDE_KEY, next)
        closeTutorial()
      }
      setDrag(null)
      setPress(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)
  }
  const closeTutorial = () => { setTutorial(false); store(() => sessionStorage, TUTORIAL_KEY, "visto") }
  const showTutorial = tutorial && level === "home" && shown === "home" && W > 0
  // Tutorial: una copia del menú va y vuelve hacia el otro lado, para enseñar el gesto
  useEffect(() => {
    const el = ghost.current
    if (!showTutorial || !el || !travel) return
    const time = ms(frame.current, "--lab-shape-time") * 3
    const anim = el.animate(
      [{ transform: "translateX(0)", offset: 0 }, { transform: "translateX(0)", offset: 0.2 },
        { transform: `translateX(${sign * travel}px)`, offset: 0.7 }, { transform: `translateX(${sign * travel}px)`, offset: 1 }],
      { duration: time, iterations: Infinity, direction: "alternate", easing: getComputedStyle(el).getPropertyValue("--motion-easing-default").trim() || "ease" })
    return () => anim.cancel()
  }, [showTutorial, travel, sign])

  // ---------- pestaña activa: el fondo va de una a otra como una gota (borde de delante primero) ----------
  const indTop = pad + tab * cell, indBottom = a.h - indTop - cell
  const lead = "var(--lab-lead) var(--lab-ease)", trail = "var(--lab-trail) var(--lab-ease)", shape = "var(--lab-shape-time) var(--lab-shape-ease)"
  const pick = (i: number) => { if (i !== tab) setDir(i > tab ? 1 : -1); setTab(i) }

  const content: CSSProperties = {
    transitionProperty: "opacity", transitionDuration: "var(--motion-duration-default)", transitionTimingFunction: "var(--motion-easing-default)",
  }
  const on = (l: Level) => shown === l && visible
  const layer = (l: Level) => cn("pointer-events-none absolute inset-0", on(l) ? "opacity-100" : "opacity-0")
  const live = (l: Level) => (on(l) ? "pointer-events-auto" : "pointer-events-none")
  const tip = cn("absolute flex items-center justify-center rounded-pill motion-reduce:transition-none [&_svg]:size-icon-lg")

  return (
    <div ref={frame} className={cn("bg-background", fullscreen
      ? "fixed inset-x-0 top-0 h-dvh touch-manipulation select-none"
      : "relative mx-auto h-dialog w-full max-w-sheet overflow-hidden rounded-overlay border-thin")}
      style={fullscreen ? { WebkitTapHighlightColor: "transparent" } : undefined}>
      <span aria-hidden className="pointer-events-none invisible absolute flex gap-gap-xs">
        <span ref={probeMd}><Button tabIndex={-1} className="rounded-pill">Añadir a la cesta</Button></span>
        <span ref={probeSm}><Button size="sm" tabIndex={-1} className="rounded-pill">Añadir a la cesta</Button></span>
      </span>

      {/* Páginas */}
      <div ref={scroller} className="absolute inset-0 overflow-y-auto overscroll-contain">
        <header className="sticky top-0 z-raised flex h-header items-center gap-gap-sm border-b-thin bg-background px-inset-lg"
          style={fullscreen ? { height: "calc(var(--layout-header) + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)" } : undefined}>
          <span className="font-strong">{level === "home" ? TABS[tab].label === "Inicio" ? "Tienda" : TABS[tab].label : product}</span>
        </header>
        {level === "home" ? (
          <div className="grid grid-cols-2 gap-gap-lg p-inset-lg pb-section">
            {products.map((t) => (
              <button key={t} type="button" onClick={() => { setProduct(t); go("detail") }} className="grid gap-gap-sm text-start">
                <span className="block h-field-sm rounded-card bg-primary-subtle" />
                <span>{t}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid gap-gap-md p-inset-lg pb-section">
            <span className="block aspect-square rounded-card bg-primary-subtle" />
            <p className="text-title font-strong">{product}</p>
            <p className="text-ui text-muted-foreground">Ligeras, transpirables y con suela de goma reciclada. Pulsa «Ver tallas» para abrir la ventana del tercer nivel.</p>
            <div><Button variant="outline" onClick={() => go("modal")}>Ver tallas</Button></div>
            {details.map((t) => <p key={t} className="border-b-thin pb-inset-sm text-ui">{t}</p>)}
          </div>
        )}
      </div>

      {/* Tercer nivel: ventana que sube desde abajo */}
      <div ref={sheet} aria-hidden={level !== "modal"}
        className={cn("absolute inset-0 z-raised flex flex-col gap-gap-md overflow-y-auto bg-background p-inset-lg pb-section duration-emphasis ease-emphasis",
          level === "modal" ? "visible translate-y-0" : "pointer-events-none invisible translate-y-full")}
        style={{ transitionProperty: "translate, transform, visibility", ...(fullscreen ? { paddingTop: "calc(var(--space-inset-lg) + env(safe-area-inset-top))" } : {}) }}>
        <p className="text-title font-strong">Guía de tallas</p>
        {SIZES.map((t) => <p key={t} className="border-b-thin pb-inset-sm text-ui">{t}</p>)}
        {fullscreen && <>
          <p className="pt-inset-md text-title font-strong">Tallas de niño</p>
          {KIDS.map((t) => <p key={t} className="border-b-thin pb-inset-sm text-ui">{t}</p>)}
          <p className="pt-inset-md text-title font-strong">Cómo medir el pie</p>
          <p className="text-ui text-muted-foreground">Ponte de pie sobre un papel, marca el talón y la punta del dedo más largo y mide la distancia en centímetros. Si estás entre dos tallas, elige la mayor.</p>
        </>}
      </div>

      {/* Fondo oscurecido del tutorial: va por debajo de la barra, así el menú queda destacado y se puede arrastrar */}
      {showTutorial && <div aria-hidden className="absolute inset-0 z-overlay animate-enter bg-overlay" />}

      {/* Barra: capa de sombras + capa de fondo (con fusión líquida) + capa de iconos y botones */}
      <div ref={dock} className="pointer-events-none absolute inset-inset-md z-overlay"
        style={fullscreen ? { left: CONCENTRIC, right: CONCENTRIC, bottom: CONCENTRIC, top: CONCENTRIC } : undefined}
        onPointerUp={release} onPointerLeave={release} onPointerCancel={release}>
        {goo && (
          <svg aria-hidden className="absolute size-0">
            <filter id={gooId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation={p.blur} result="blur" />
              <feColorMatrix in="blur" mode="matrix" values={p.matrix} />
            </filter>
          </svg>
        )}
        <div aria-hidden className="absolute inset-0">
          {BLOBS.map((k) => (
            <span key={k} className="absolute rounded-pill motion-reduce:transition-none"
              style={{ ...place(k), boxShadow: k !== "a" && merged ? "none" : "var(--lab-bar-box-shadow)" }} />
          ))}
        </div>
        <div aria-hidden className="absolute inset-0" style={{ filter: goo && merging ? `url(#${gooId})` : "none" }}>
          {BLOBS.map((k) => <span key={k} className="absolute rounded-pill bg-popover motion-reduce:transition-none" style={place(k)} />)}
        </div>

        {/* Inicio: pestañas en columna */}
        <div className={layer("home")} style={content}>
          <nav aria-label="Navegación de prueba" className={cn("absolute flex flex-col p-inset-2xs motion-reduce:transition-none", live("home"))}
            style={{ ...place("a"), touchAction: "none" }} onPointerDown={(e) => { onDown("a")(e); dragDown(e) }}
            onClickCapture={(e) => { if (dragged.current) { e.stopPropagation(); e.preventDefault(); dragged.current = false } }}>
            <span aria-hidden className="absolute inset-x-inset-2xs rounded-pill bg-primary-subtle motion-reduce:transition-none"
              style={{ top: indTop, bottom: indBottom, transition: resizing ? `top ${shape}, bottom ${shape}` : dir > 0 ? `bottom ${lead}, top ${trail}` : `top ${lead}, bottom ${trail}` }} />
            {TABS.map(({ icon: Icon, label }, i) => (
              <button key={label} type="button" onClick={() => pick(i)} aria-current={tab === i ? "page" : undefined} aria-label={small ? label : undefined}
                className={cn("relative flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-pill text-caption transition-colors",
                  tab === i ? "font-emphasis text-link" : "text-muted-foreground")}>
                <Icon className="size-icon-md shrink-0" />
                <span className={cn("grid w-full grid-cols-[minmax(0,1fr)] text-center transition-[grid-template-rows,opacity] duration-emphasis ease-emphasis",
                  small ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")}>
                  <span className="min-h-0 overflow-hidden"><span className="block truncate px-inset-3xs pt-inset-3xs">{label}</span></span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Detalle: volver, favorito y compartir en la columna (en el lado elegido); el CTA flota en el centro */}
        <div className={layer("detail")} style={content}>
          <button type="button" aria-label="Volver" onClick={() => go("home")} onPointerDown={onDown("a")} className={cn(tip, live("detail"))} style={place("a")}>
            <ArrowLeft />
          </button>
          <div className={cn("absolute flex flex-col p-inset-2xs motion-reduce:transition-none", live("detail"))} style={place("b")} onPointerDown={onDown("b")}>
            {/* Cada acción ocupa la mitad exacta de la columna (sin proporciones automáticas, que Safari calcula distinto) */}
            <Button variant="ghost" size="icon" className="h-auto min-h-0 w-full flex-1 basis-0 rounded-pill hover:bg-transparent" aria-label="Favorito"><Heart /></Button>
            <Button variant="ghost" size="icon" className="h-auto min-h-0 w-full flex-1 basis-0 rounded-pill hover:bg-transparent" aria-label="Compartir"><Share2 /></Button>
          </div>
          <div className={cn("absolute flex p-inset-2xs motion-reduce:transition-none", live("detail"))} style={place("c")} onPointerDown={onDown("c")}>
            <Button size={small ? "sm" : "default"} className="h-full min-w-max flex-1 rounded-pill">Añadir a la cesta</Button>
          </div>
        </div>

        {/* Ventana: una sola X, abajo, en el lado elegido */}
        <div className={layer("modal")} style={content}>
          <button type="button" aria-label="Cerrar" onClick={() => go("detail")} onPointerDown={onDown("a")} className={cn(tip, live("modal"))} style={place("a")}>
            <X />
          </button>
        </div>
      </div>

      {/* Tutorial, encima de todo menos del menú: una mano enseña el gesto y una tarjeta lo explica. No recibe toques
          (salvo la tarjeta), así el menú de verdad se puede arrastrar ya */}
      {showTutorial && (
        <div className={cn("pointer-events-none absolute inset-0 z-overlay animate-enter transition-opacity duration-default ease-default", drag !== null && "opacity-0")}>
          <div className="absolute inset-inset-md" style={fullscreen ? { left: CONCENTRIC, right: CONCENTRIC, bottom: CONCENTRIC, top: CONCENTRIC } : undefined}>
            <span ref={ghost} aria-hidden className="absolute flex items-center justify-center rounded-pill bg-primary text-primary-foreground shadow-overlay"
              style={{ left: a.x, top: a.y + (a.h - col) / 2, width: col, height: col }}>
              <Hand className="size-icon-lg" />
            </span>
            <div role="dialog" aria-labelledby={`${gooId}-tutorial`}
              className={cn(drag === null && "pointer-events-auto", "absolute inset-x-0 grid gap-gap-md rounded-card bg-popover p-inset-lg shadow-modal")}
              style={{ bottom: a.h + gap * 2 }}>
              <p id={`${gooId}-tutorial`} className="text-body font-strong">Pon el menú en el lado que prefieras</p>
              <p className="text-ui text-muted-foreground">
                Arrastra el menú hacia el lado contrario de la pantalla y suéltalo. Se queda ahí, a mano de tu pulgar, hasta que lo vuelvas a mover.
              </p>
              <div><Button size="sm" onClick={closeTutorial}>Entendido</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
