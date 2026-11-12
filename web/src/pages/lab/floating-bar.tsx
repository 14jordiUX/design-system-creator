// Laboratorio · Barra flotante (la de ayer: AppTabBar floating + AppDetailBar + AppModal) en un móvil de prueba.
// Se puede hacer scroll (la barra se encoge), cambiar de pestaña y navegar: página → detalle → ventana y vuelta.
// Novedades que se prueban (cada opción de laboratorio.json activa unas u otras):
//   · gota: el fondo de la pestaña sigue al dedo o al ratón y se estira como una gota (borde de delante y de detrás a distinto ritmo)
//   · fusión: al pasar de nivel, el fondo de la barra se separa o se junta como un líquido; después aparecen iconos y botones
//   · empuje: al pulsar, la barra se hunde desde el punto que tocas, como si empujaras una pieza sólida
// Todos los valores (tiempos, curvas, ángulos) llegan como variables --lab-* desde laboratorio.json.
import { useEffect, useId, useMemo, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactElement } from "react"
import { ArrowLeft, Calendar, Heart, Home, Inbox, MessageSquare, MoreHorizontal, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { LiquidGlass } from "./liquid-glass"
import type { Option } from "./previews"

type Level = "home" | "detail" | "modal"
type Rect = { x: number; w: number; h: number }
type Press = { blob: "a" | "b"; x: number } | null

const TABS = [
  { icon: Home, label: "Inicio" }, { icon: Inbox, label: "Bandeja" }, { icon: Calendar, label: "Agenda" },
  { icon: MessageSquare, label: "Chat" }, { icon: MoreHorizontal, label: "Más" },
]
const SIZES = ["35 · 22,5 cm", "36 · 23 cm", "37 · 23,5 cm", "38 · 24,5 cm", "39 · 25 cm", "40 · 25,5 cm", "41 · 26,5 cm", "42 · 27 cm", "43 · 27,5 cm", "44 · 28 cm", "45 · 29 cm", "46 · 29,5 cm"]
const PRODUCTS = ["Zapatillas", "Mochilas", "Gorras", "Botellas", "Chaquetas", "Calcetines", "Camisetas", "Gafas", "Relojes", "Bolsas"]

const px = (el: Element | null, name: string) => (el ? parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0 : 0)
const ms = (el: Element | null, name: string) => {
  const v = el ? getComputedStyle(el).getPropertyValue(name).trim() : ""
  return v.endsWith("ms") ? parseFloat(v) : v.endsWith("s") ? parseFloat(v) * 1000 : 0
}

// Opción «tooltip»: los botones que solo enseñan icono (pestañas en pequeño, volver, favorito, compartir, cerrar)
// muestran su nombre al pasar el ratón o al enfocarlos con el teclado
function Tip({ show, label, children }: { show: boolean; label: string; children: ReactElement }) {
  if (!show) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

// fullscreen: la misma barra a pantalla completa, sin el marco del móvil de prueba, para abrirla en el teléfono
// (#/laboratorio/barra-flotante/<opción>). Respeta la zona segura de abajo (la rayita de inicio del iPhone).
export function FloatingBarPreview({ option, fullscreen = false }: { option: Option; fullscreen?: boolean }) {
  const p = option.params ?? {}
  const glass = !!p.glass   // cristal: fondo translúcido que desenfoca y dobla lo que hay detrás (refracción)
  const goo = !!p.goo && !glass, drop = !!p.drop, push = !!p.push, tips = !!p.tooltip, noHover = !!p.noHover
  const gooId = useId().replace(/:/g, "")
  // Con cristal, las dos piezas de fondo son invisibles y solo marcan dónde está el cristal (que es una sola pieza)
  const trackA = useRef<HTMLSpanElement>(null), trackB = useRef<HTMLSpanElement>(null)
  const trackers = useMemo(() => [trackA, trackB], [])
  const [opacity, setOpacity] = useState(Number(p.opacity ?? 45))
  const [blur, setBlur] = useState(Number(p.glassBlur ?? 3))
  const [thickness, setThickness] = useState(Number(p.depth ?? 60))            // grosor del cristal: cuánto dobla el canto y lo ancho que es
  const [diffraction, setDiffraction] = useState(Number(p.diffraction ?? 30))   // separación de colores en el canto
  const frame = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const levelRef = useRef<Level>("home")
  const dock = useRef<HTMLDivElement>(null)

  const [level, setLevel] = useState<Level>("home")
  const [shown, setShown] = useState<Level>("home")      // nivel cuyos iconos y botones se ven
  const [visible, setVisible] = useState(true)
  const [compact, setCompact] = useState(false)
  const [tab, setTab] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const [dir, setDir] = useState(1)
  const [product, setProduct] = useState(PRODUCTS[0])
  const [press, setPress] = useState<Press>(null)
  const [width, setWidth] = useState(0)
  const [ctaW, setCtaW] = useState(0)   // ancho del CTA en tamaño pequeño (sm del botón), medido de una copia invisible
  const ctaProbe = useRef<HTMLSpanElement>(null)
  const [merging, setMerging] = useState(false)   // la fusión líquida solo actúa mientras la barra cambia de forma

  useLayoutEffect(() => {
    const el = dock.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    const probe = ctaProbe.current
    if (probe) setCtaW(probe.offsetWidth)
    const ro2 = new ResizeObserver(() => probe && setCtaW(probe.offsetWidth))
    if (probe) ro2.observe(probe)
    return () => { ro.disconnect(); ro2.disconnect() }
  }, [])

  // Al cambiar de nivel: primero se van iconos y botones, luego se mueve el fondo y al final aparecen los del nuevo nivel
  useEffect(() => {
    if (level === shown) return
    setVisible(false)
    const t = window.setTimeout(() => { setShown(level); setVisible(true) }, ms(frame.current, "--lab-shape-time") * 0.6)
    return () => window.clearTimeout(t)
  }, [level, shown])
  // Mientras la barra se encoge o crece, el fondo activo se mueve con ella: los dos bordes a la vez y con el mismo
  // muelle que la barra (si no, un borde va antes que el otro y el fondo se aplasta por un lado un instante)
  const [resizing, setResizing] = useState(false)
  const [sizedAs, setSizedAs] = useState(compact)
  if (sizedAs !== compact) { setSizedAs(compact); setResizing(true) }   // en el mismo render del cambio, antes de pintar
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

  // Al bajar se encoge, al subir (o arriba del todo) vuelve a ser grande (igual que AppTabBar floating).
  // Vale para las tres pantallas: la página (inicio y detalle) y la ventana, que tiene su propio scroll.
  useEffect(() => {
    const els = [scroller.current, sheet.current].filter((e): e is HTMLDivElement => !!e)
    const offs = els.map((el) => {
      const own = el === sheet.current   // la ventana solo manda cuando está abierta, y la página solo cuando no
      const step = px(el, "--motion-distance-scroll")
      let last = el.scrollTop, run = 0
      const onScroll = () => {
        const y = Math.max(0, el.scrollTop), d = y - last
        last = y
        if (own !== (levelRef.current === "modal")) return
        if (y <= step) { run = 0; setCompact(false); return }
        run = Math.sign(d) === Math.sign(run) ? run + d : d
        if (run > step) setCompact(true)
        else if (run < -step) setCompact(false)
      }
      el.addEventListener("scroll", onScroll, { passive: true })
      return () => el.removeEventListener("scroll", onScroll)
    })
    return () => offs.forEach((off) => off())
  }, [])

  const go = (l: Level) => {
    if (l !== "modal" && scroller.current) scroller.current.scrollTop = 0
    if (l === "modal" && sheet.current) sheet.current.scrollTop = 0
    levelRef.current = l
    setCompact(false); setHover(null); setLevel(l)
  }

  // ---------- geometría (todo sale de tokens del sistema) ----------
  const root = frame.current
  const H = px(root, "--size-tab-bar-expanded"), Hc = px(root, "--size-tab-bar-compact")
  const item = px(root, "--size-tab-bar-item"), pad = px(root, "--space-inset-2xs"), gap = px(root, "--space-gap-sm")
  const W = width
  const n = TABS.length
  const small = compact
  const g2 = px(root, "--space-gap-2xs"), dot = Hc - pad * 2   // en pequeño, cada acción del detalle es un círculo
  let a: Rect, b: Rect
  if (level === "home") {
    const w = small ? n * item + pad * 2 : W
    a = b = { x: (W - w) / 2, w, h: small ? Hc : H }
  } else if (level === "detail") {
    if (small) {   // volver + favorito y compartir en círculo + el CTA con texto en tamaño pequeño, centrados
      const bw = dot * 2 + ctaW + g2 * 2 + pad * 2, x0 = (W - Hc - gap - bw) / 2
      a = { x: x0, w: Hc, h: Hc }
      b = { x: x0 + Hc + gap, w: bw, h: Hc }
    } else {
      a = { x: 0, w: H, h: H }
      b = { x: H + gap, w: Math.max(H, W - H - gap), h: H }
    }
  } else {
    const d = small ? Hc : H
    a = b = { x: (W - d) / 2, w: d, h: d }
  }

  const shapeMove: CSSProperties = {
    transitionProperty: "left, width, height, top, transform",
    transitionDuration: "var(--lab-shape-time)", transitionTimingFunction: "var(--lab-shape-ease)",
  }
  // Empuje: se hunde la parte que tocas y el otro extremo queda quieto. La inclinación y el hundimiento se miden en px
  // (--lab-depth, --lab-press), así una pieza ancha se inclina poco y un círculo pequeño se nota igual.
  // Si las dos piezas están juntas (inicio y ventana), se empujan las dos a la vez.
  const merged = level !== "detail"
  const hit = (blob: "a" | "b") => !!press && (press.blob === blob || merged)
  const depth = px(root, "--lab-depth"), sink = px(root, "--lab-press"), maxTilt = px(root, "--lab-max-tilt")
  const pressStyle = (r: Rect, blob: "a" | "b"): CSSProperties => {
    if (!push || !press || !hit(blob) || !r.w) return { transform: "none", transformOrigin: "50% 50%" }
    const k = (press.x - 0.5) * 2
    const angle = Math.min(maxTilt, (Math.asin(Math.min(1, depth / r.w)) * 180) / Math.PI) * k
    const scale = 1 - (sink * 2) / Math.max(r.w, r.h)
    return {
      transform: `perspective(var(--lab-persp)) rotateY(${angle.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
      transformOrigin: `${((1 - press.x) * 100).toFixed(1)}% 50%`,
    }
  }
  const pressTiming = (pressed: boolean): CSSProperties => pressed
    ? { transitionDuration: "var(--lab-shape-time), var(--lab-shape-time), var(--lab-shape-time), var(--lab-shape-time), var(--lab-press-time)",
        transitionTimingFunction: "var(--lab-shape-ease), var(--lab-shape-ease), var(--lab-shape-ease), var(--lab-shape-ease), var(--lab-press-ease)" }
    : { transitionDuration: "var(--lab-shape-time), var(--lab-shape-time), var(--lab-shape-time), var(--lab-shape-time), var(--lab-release-time)",
        transitionTimingFunction: "var(--lab-shape-ease), var(--lab-shape-ease), var(--lab-shape-ease), var(--lab-shape-ease), var(--lab-release-ease)" }
  const place = (r: Rect, blob: "a" | "b"): CSSProperties => ({
    ...shapeMove, ...pressTiming(hit(blob)), ...pressStyle(r, blob),
    left: r.x, width: r.w, height: r.h, top: H - r.h,
  })
  const onDown = (blob: "a" | "b") => (e: RPointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    setPress({ blob, x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)) })
  }
  const release = () => setPress(null)

  // ---------- pestaña activa: fondo que sigue (y gota) ----------
  const target = hover ?? tab
  const itemW = (a.w - pad * 2) / n
  const indLeft = pad + target * itemW, indRight = a.w - indLeft - itemW
  const lead = "var(--lab-lead) var(--lab-ease)", trail = "var(--lab-trail) var(--lab-ease)"
  const shape = "var(--lab-shape-time) var(--lab-shape-ease)"
  // La dirección siempre se calcula desde donde está el fondo ahora mismo, también al salir (vuelve a la pestaña activa):
  // así el borde de delante es siempre el que va primero y el fondo nunca se queda sin ancho ni desaparece.
  const follow = (i: number | null) => {
    if (noHover) return
    const from = hover ?? tab, to = i ?? tab
    if (to !== from) setDir(to > from ? 1 : -1)
    setHover(i === null || !drop || noHover ? null : i)   // sin hover: la pastilla solo se mueve al hacer clic
  }
  const pick = (i: number) => { const from = hover ?? tab; if (i !== from) setDir(i > from ? 1 : -1); setTab(i) }
  const itemAt = (e: RPointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - box.left - pad) / (box.width - pad * 2)) * n)))
  }

  // Con cristal, las fotos de producto son degradados de color para que se vea cómo se doblan detrás de la barra
  const art = (t: string): CSSProperties => {
    const i = PRODUCTS.indexOf(t) % 5
    return { backgroundImage: `linear-gradient(135deg, var(--color-chart-${i + 1}), var(--color-chart-${((i + 2) % 5) + 1}))` }
  }
  const content: CSSProperties = {
    transitionProperty: "opacity", transitionDuration: "var(--motion-duration-default)", transitionTimingFunction: "var(--motion-easing-default)",
  }
  const fade = (l: Level) => cn("absolute inset-0 flex", shown === l && visible ? "opacity-100" : "pointer-events-none opacity-0")

  return (
    <div className={cn("grid gap-gap-lg", fullscreen && "h-dvh")}>
    <div ref={frame} className={cn("relative mx-auto w-full max-w-sheet overflow-hidden bg-background",
      fullscreen ? "h-dvh overscroll-none" : "h-dialog rounded-overlay border-thin")}>
      {/* Páginas */}
      <span ref={ctaProbe} aria-hidden className="pointer-events-none invisible absolute">
        <Button size="sm" tabIndex={-1} className="rounded-pill">Añadir a la cesta</Button>
      </span>
      <div ref={scroller} className="absolute inset-0 overflow-y-auto overscroll-contain">
        <header className="sticky top-0 z-raised flex h-header items-center gap-gap-sm border-b-thin bg-background px-inset-lg">
          <span className="font-strong">{level === "home" ? TABS[tab].label === "Inicio" ? "Tienda" : TABS[tab].label : product}</span>
        </header>
        {level === "home" ? (
          <div className="grid grid-cols-2 gap-gap-lg p-inset-lg pb-section">
            {PRODUCTS.map((t) => (
              <button key={t} type="button" onClick={() => { setProduct(t); go("detail") }} className="grid gap-gap-sm text-start">
                <span className="block h-field-sm rounded-card bg-primary-subtle" style={glass ? art(t) : undefined} />
                <span>{t}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid gap-gap-md p-inset-lg pb-section">
            <span className="block aspect-square rounded-card bg-primary-subtle" style={glass ? art(product) : undefined} />
            <p className="text-title font-strong">{product}</p>
            <p className="text-ui text-muted-foreground">Ligeras, transpirables y con suela de goma reciclada. Pulsa «Ver tallas» para abrir la ventana del tercer nivel.</p>
            <div><Button variant="outline" onClick={() => go("modal")}>Ver tallas</Button></div>
            {["Envío gratis", "Devolución en 30 días", "Garantía de 2 años"].map((t) => <p key={t} className="border-b-thin pb-inset-sm text-ui">{t}</p>)}
          </div>
        )}
      </div>

      {/* Tercer nivel: ventana que sube desde abajo */}
      <div ref={sheet} aria-hidden={level !== "modal"}
        className={cn("absolute inset-0 z-raised flex flex-col gap-gap-md overflow-y-auto bg-background p-inset-lg pb-section transition-transform duration-emphasis ease-emphasis motion-reduce:transition-none",
          level === "modal" ? "translate-y-0" : "pointer-events-none translate-y-full")}>
        <p className="text-title font-strong">Guía de tallas</p>
        {SIZES.map((t) => <p key={t} className="border-b-thin pb-inset-sm text-ui">{t}</p>)}
      </div>

      {/* Barra: capa de fondo (con fusión líquida) + capa de iconos y botones */}
      <div ref={dock} className="absolute inset-x-inset-md bottom-inset-md z-overlay h-tab-bar-expanded"
        style={fullscreen ? { bottom: "calc(var(--space-inset-md) + env(safe-area-inset-bottom))" } : undefined} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}>
        {goo && (
          <svg aria-hidden className="absolute size-0">
            <filter id={gooId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation={p.blur} result="blur" />
              <feColorMatrix in="blur" mode="matrix" values={p.matrix} />
            </filter>
          </svg>
        )}
        {glass && <LiquidGlass trackers={trackers} id={`${gooId}-glass`} opacity={opacity} blur={blur}
          refraction={thickness * 1.2} edge={6 + thickness * 0.2} dispersion={(diffraction / 100) * 0.3} merge={Number(p.merge ?? 10)} />}
        <div aria-hidden className="absolute inset-0" style={{ filter: glass ? "none" : goo && merging ? `url(#${gooId}) var(--lab-bar-shadow)` : "var(--lab-bar-shadow)" }}>
          {(["a", "b"] as const).map((k) => (
            <span key={k} ref={k === "a" ? trackA : trackB} className={cn("absolute rounded-pill motion-reduce:transition-none", !glass && "bg-popover")}
              style={place(k === "a" ? a : b, k)} />
          ))}
        </div>

        {/* Inicio: pestañas */}
        <div className={fade("home")} style={content}>
          <nav aria-label="Navegación de prueba" className="absolute flex p-inset-2xs motion-reduce:transition-none" style={place(a, "a")}
            onPointerDown={onDown("a")} onPointerMove={(e) => (e.buttons || e.pointerType === "mouse") && follow(itemAt(e))} onPointerLeave={() => follow(null)}>
            <span aria-hidden className="absolute inset-y-inset-2xs rounded-pill bg-primary-subtle motion-reduce:transition-none"
              style={{ left: indLeft, right: indRight, transition: resizing ? `left ${shape}, right ${shape}` : dir > 0 ? `right ${lead}, left ${trail}` : `left ${lead}, right ${trail}` }} />
            {TABS.map(({ icon: Icon, label }, i) => (
              <Tip key={label} show={tips && small} label={label}>
              <button type="button" onClick={() => pick(i)} aria-current={tab === i ? "page" : undefined} aria-label={small ? label : undefined}
                className={cn("relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-pill text-caption transition-colors",
                  tab === i ? "font-emphasis text-link" : "text-muted-foreground")}>
                <Icon className="size-icon-md" />
                <span className={cn("grid w-full grid-cols-[minmax(0,1fr)] text-center transition-[grid-template-rows,opacity] duration-emphasis ease-emphasis",
                  small ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")}>
                  <span className="min-h-0 overflow-hidden"><span className="block truncate pt-inset-3xs">{label}</span></span>
                </span>
              </button>
              </Tip>
            ))}
          </nav>
        </div>

        {/* Detalle: volver + acciones */}
        <div className={fade("detail")} style={content}>
          <Tip show={tips} label="Volver">
            <button type="button" aria-label="Volver" onClick={() => go("home")} onPointerDown={onDown("a")}
              className="absolute flex items-center justify-center rounded-pill motion-reduce:transition-none [&_svg]:size-icon-lg" style={place(a, "a")}>
              <ArrowLeft />
            </button>
          </Tip>
          <div className="absolute flex items-center gap-gap-2xs p-inset-2xs motion-reduce:transition-none" style={place(b, "b")} onPointerDown={onDown("b")}>
            <Tip show={tips} label="Favorito"><Button variant="ghost" size="icon" className={cn("aspect-square h-full w-auto shrink-0 rounded-pill", noHover ? "hover:bg-transparent" : "hover:bg-primary-subtle hover:text-link")} aria-label="Favorito"><Heart /></Button></Tip>
            <Tip show={tips} label="Compartir"><Button variant="ghost" size="icon" className={cn("aspect-square h-full w-auto shrink-0 rounded-pill", noHover ? "hover:bg-transparent" : "hover:bg-primary-subtle hover:text-link")} aria-label="Compartir"><Share2 /></Button></Tip>
            {/* El CTA principal nunca pasa a icono: en pequeño usa el tamaño sm del botón (mismo texto, menos relleno).
                Siempre ocupa el hueco que queda y nunca es más estrecho que su texto, así crece y encoge sin saltos */}
            <Button size={small ? "sm" : "default"} className="h-full min-w-max flex-1 rounded-pill">Añadir a la cesta</Button>
          </div>
        </div>

        {/* Ventana: una sola X para cerrar */}
        <div className={fade("modal")} style={content}>
          <Tip show={tips} label="Cerrar">
            <button type="button" aria-label="Cerrar" onClick={() => go("detail")} onPointerDown={onDown("a")}
              className="absolute flex items-center justify-center rounded-pill motion-reduce:transition-none [&_svg]:size-icon-lg" style={place(a, "a")}>
              <X />
            </button>
          </Tip>
        </div>
      </div>
    </div>
    {glass && (
      <div className="mx-auto grid w-full max-w-sheet gap-gap-md text-ui">
        {([["Opacidad del cristal", opacity, setOpacity, 0, 100, "%"], ["Desenfoque", blur, setBlur, 0, 24, "px"],
          ["Profundidad del material", thickness, setThickness, 0, 100, "%"], ["Difracción de la luz", diffraction, setDiffraction, 0, 100, "%"]] as const).map(([label, v, set, min, max, unit]) => (
          <label key={label} className="grid gap-gap-xs">
            <span className="flex justify-between"><span>{label}</span><span className="text-muted-foreground tabular-nums">{v} {unit}</span></span>
            <Slider aria-label={label} min={min} max={max} step={1} value={[v]} onValueChange={([n]) => set(n)} />
          </label>
        ))}
      </div>
    )}
    </div>
  )
}
