// Laboratorio · Barra flotante (la de ayer: AppTabBar floating + AppDetailBar + AppModal) en un móvil de prueba.
// Se puede hacer scroll (la barra se encoge), cambiar de pestaña y navegar: página → detalle → ventana y vuelta.
// Novedades que se prueban (cada opción de laboratorio.json activa unas u otras):
//   · gota: el fondo de la pestaña sigue al dedo o al ratón y se estira como una gota (borde de delante y de detrás a distinto ritmo)
//   · fusión: al pasar de nivel, el fondo de la barra se separa o se junta como un líquido; después aparecen iconos y botones
//   · empuje: al pulsar, la barra se hunde desde el punto que tocas, como si empujaras una pieza sólida
// Todos los valores (tiempos, curvas, ángulos) llegan como variables --lab-* desde laboratorio.json.
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react"
import { ArrowLeft, Calendar, Heart, Home, Inbox, MessageSquare, MoreHorizontal, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Option } from "./previews"

type Level = "home" | "detail" | "modal"
type Rect = { x: number; w: number; h: number }
type Press = { blob: "a" | "b"; x: number } | null

const TABS = [
  { icon: Home, label: "Inicio" }, { icon: Inbox, label: "Bandeja" }, { icon: Calendar, label: "Agenda" },
  { icon: MessageSquare, label: "Chat" }, { icon: MoreHorizontal, label: "Más" },
]
const PRODUCTS = ["Zapatillas", "Mochilas", "Gorras", "Botellas", "Chaquetas", "Calcetines", "Camisetas", "Gafas", "Relojes", "Bolsas"]

const px = (el: Element | null, name: string) => (el ? parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0 : 0)
const ms = (el: Element | null, name: string) => {
  const v = el ? getComputedStyle(el).getPropertyValue(name).trim() : ""
  return v.endsWith("ms") ? parseFloat(v) : v.endsWith("s") ? parseFloat(v) * 1000 : 0
}

export function FloatingBarPreview({ option }: { option: Option }) {
  const p = option.params ?? {}
  const goo = !!p.goo, drop = !!p.drop, push = !!p.push
  const gooId = useId().replace(/:/g, "")
  const frame = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
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
  const [merging, setMerging] = useState(false)   // la fusión líquida solo actúa mientras la barra cambia de forma

  useLayoutEffect(() => {
    const el = dock.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // Al cambiar de nivel: primero se van iconos y botones, luego se mueve el fondo y al final aparecen los del nuevo nivel
  useEffect(() => {
    if (level === shown) return
    setVisible(false)
    const t = window.setTimeout(() => { setShown(level); setVisible(true) }, ms(frame.current, "--lab-shape-time") * 0.6)
    return () => window.clearTimeout(t)
  }, [level, shown])
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setMerging(true)
    const u = window.setTimeout(() => setMerging(false), ms(frame.current, "--lab-shape-time"))
    return () => window.clearTimeout(u)
  }, [level])

  // Al bajar se encoge, al subir (o arriba del todo) vuelve a ser grande (igual que AppTabBar floating)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const step = px(el, "--motion-distance-scroll")
    let last = el.scrollTop, run = 0
    const onScroll = () => {
      const y = Math.max(0, el.scrollTop), d = y - last
      last = y
      if (y <= step) { run = 0; setCompact(false); return }
      run = Math.sign(d) === Math.sign(run) ? run + d : d
      if (run > step) setCompact(true)
      else if (run < -step) setCompact(false)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  const go = (l: Level) => {
    if (l !== "modal" && scroller.current) scroller.current.scrollTop = 0
    setCompact(false); setHover(null); setLevel(l)
  }

  // ---------- geometría (todo sale de tokens del sistema) ----------
  const root = frame.current
  const H = px(root, "--size-tab-bar-expanded"), Hc = px(root, "--size-tab-bar-compact")
  const item = px(root, "--size-tab-bar-item"), pad = px(root, "--space-inset-2xs"), gap = px(root, "--space-gap-sm")
  const W = width
  const n = TABS.length
  const small = level === "home" && compact
  let a: Rect, b: Rect
  if (level === "home") {
    const w = small ? n * item + pad * 2 : W
    a = b = { x: (W - w) / 2, w, h: small ? Hc : H }
  } else if (level === "detail") {
    a = { x: 0, w: H, h: H }
    b = { x: H + gap, w: Math.max(H, W - H - gap), h: H }
  } else {
    a = b = { x: (W - H) / 2, w: H, h: H }
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
  const follow = (i: number | null) => {
    if (i === null) { setHover(null); return }
    const from = hover ?? tab
    if (i !== from) setDir(i > from ? 1 : -1)
    setHover(drop ? i : null)
  }
  const pick = (i: number) => { setDir(i > tab ? 1 : i < tab ? -1 : dir); setTab(i) }
  const itemAt = (e: RPointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - box.left - pad) / (box.width - pad * 2)) * n)))
  }

  const content: CSSProperties = {
    transitionProperty: "opacity", transitionDuration: "var(--motion-duration-default)", transitionTimingFunction: "var(--motion-easing-default)",
  }
  const fade = (l: Level) => cn("absolute inset-0 flex", shown === l && visible ? "opacity-100" : "pointer-events-none opacity-0")

  return (
    <div ref={frame} className="relative mx-auto h-dialog w-full max-w-sheet overflow-hidden rounded-overlay border-thin bg-background">
      {/* Páginas */}
      <div ref={scroller} className="absolute inset-0 overflow-y-auto">
        <header className="sticky top-0 z-raised flex h-header items-center gap-gap-sm border-b-thin bg-background px-inset-lg">
          <span className="font-strong">{level === "home" ? TABS[tab].label === "Inicio" ? "Tienda" : TABS[tab].label : product}</span>
        </header>
        {level === "home" ? (
          <div className="grid grid-cols-2 gap-gap-lg p-inset-lg pb-section">
            {PRODUCTS.map((t) => (
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
            {["Envío gratis", "Devolución en 30 días", "Garantía de 2 años"].map((t) => <p key={t} className="border-b-thin pb-inset-sm text-ui">{t}</p>)}
          </div>
        )}
      </div>

      {/* Tercer nivel: ventana que sube desde abajo */}
      <div aria-hidden={level !== "modal"}
        className={cn("absolute inset-0 z-raised flex flex-col gap-gap-md bg-background p-inset-lg transition-transform duration-emphasis ease-emphasis motion-reduce:transition-none",
          level === "modal" ? "translate-y-0" : "pointer-events-none translate-y-full")}>
        <p className="text-title font-strong">Guía de tallas</p>
        {["36 · 23 cm", "38 · 24,5 cm", "40 · 25,5 cm", "42 · 27 cm", "44 · 28 cm"].map((t) => <p key={t} className="border-b-thin pb-inset-sm text-ui">{t}</p>)}
      </div>

      {/* Barra: capa de fondo (con fusión líquida) + capa de iconos y botones */}
      <div ref={dock} className="absolute inset-x-inset-md bottom-inset-md z-overlay h-tab-bar-expanded" onPointerUp={release} onPointerLeave={release} onPointerCancel={release}>
        {goo && (
          <svg aria-hidden className="absolute size-0">
            <filter id={gooId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation={p.blur} result="blur" />
              <feColorMatrix in="blur" mode="matrix" values={p.matrix} />
            </filter>
          </svg>
        )}
        <div aria-hidden className="absolute inset-0" style={{ filter: goo && merging ? `url(#${gooId}) var(--lab-bar-shadow)` : "var(--lab-bar-shadow)" }}>
          <span className="absolute rounded-pill bg-popover motion-reduce:transition-none" style={place(a, "a")} />
          <span className="absolute rounded-pill bg-popover motion-reduce:transition-none" style={place(b, "b")} />
        </div>

        {/* Inicio: pestañas */}
        <div className={fade("home")} style={content}>
          <nav aria-label="Navegación de prueba" className="absolute flex p-inset-2xs motion-reduce:transition-none" style={place(a, "a")}
            onPointerDown={onDown("a")} onPointerMove={(e) => (e.buttons || e.pointerType === "mouse") && follow(itemAt(e))} onPointerLeave={() => follow(null)}>
            <span aria-hidden className="absolute inset-y-inset-2xs rounded-pill bg-primary-subtle motion-reduce:transition-none"
              style={{ left: indLeft, right: indRight, transition: dir > 0 ? `right ${lead}, left ${trail}` : `left ${lead}, right ${trail}` }} />
            {TABS.map(({ icon: Icon, label }, i) => (
              <button key={label} type="button" onClick={() => pick(i)} aria-current={tab === i ? "page" : undefined} aria-label={small ? label : undefined}
                className={cn("relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-pill text-caption transition-colors",
                  tab === i ? "font-emphasis text-link" : "text-muted-foreground")}>
                <Icon className="size-icon-md" />
                <span className={cn("grid w-full grid-cols-[minmax(0,1fr)] text-center transition-[grid-template-rows,opacity] duration-emphasis ease-emphasis",
                  small ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")}>
                  <span className="min-h-0 overflow-hidden"><span className="block truncate pt-inset-3xs">{label}</span></span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Detalle: volver + acciones */}
        <div className={fade("detail")} style={content}>
          <button type="button" aria-label="Volver" onClick={() => go("home")} onPointerDown={onDown("a")}
            className="absolute flex items-center justify-center rounded-pill motion-reduce:transition-none [&_svg]:size-icon-lg" style={place(a, "a")}>
            <ArrowLeft />
          </button>
          <div className="absolute flex items-center gap-gap-2xs p-inset-2xs motion-reduce:transition-none" style={place(b, "b")} onPointerDown={onDown("b")}>
            <Button variant="ghost" size="icon" className="size-full max-w-tab-bar-compact rounded-pill" aria-label="Favorito"><Heart /></Button>
            <Button variant="ghost" size="icon" className="size-full max-w-tab-bar-compact rounded-pill" aria-label="Compartir"><Share2 /></Button>
            <Button className="h-full flex-1 rounded-pill">Añadir a la cesta</Button>
          </div>
        </div>

        {/* Ventana: una sola X para cerrar */}
        <div className={fade("modal")} style={content}>
          <button type="button" aria-label="Cerrar" onClick={() => go("detail")} onPointerDown={onDown("a")}
            className="absolute flex items-center justify-center rounded-pill motion-reduce:transition-none [&_svg]:size-icon-lg" style={place(a, "a")}>
            <X />
          </button>
        </div>
      </div>
    </div>
  )
}

