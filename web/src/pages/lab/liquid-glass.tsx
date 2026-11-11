// Cristal líquido para el laboratorio: UNA sola pieza de cristal con la forma de las piezas de fondo de la barra.
// - Cuando dos piezas se acercan se funden en gota (metaball) en vez de pasar una por detrás de otra.
// - Los bordes actúan como una lente: doblan lo que hay detrás y separan los colores (dispersión, el arcoíris del canto).
// - La forma, el mapa de refracción y el brillo se calculan en un canvas siguiendo a las piezas fotograma a fotograma.
// La refracción usa un filtro SVG dentro de backdrop-filter: solo Chrome y Edge. Safari y Firefox ven tinte + desenfoque.
import { Fragment, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"

const num = (el: Element | null, name: string, fallback: number) => {
  const v = el ? parseFloat(getComputedStyle(el).getPropertyValue(name)) : NaN
  return Number.isFinite(v) ? v : fallback
}

type Shape = { x: number; y: number; w: number; h: number }

export function LiquidGlass({ trackers, id, opacity, blur, refraction, dispersion, edge, merge }: {
  trackers: RefObject<HTMLElement | null>[]
  id: string
  opacity: number      // opacidad del tinte (%)
  blur: number         // desenfoque de lo de detrás (px)
  refraction: number   // cuánto dobla el borde (px)
  dispersion: number   // separación de colores en el borde (0 = nada)
  edge: number         // ancho del canto que hace de lente (px)
  merge: number        // a qué distancia empiezan a fundirse dos piezas (px)
}) {
  const host = useRef<HTMLDivElement>(null)
  const glassEl = useRef<HTMLDivElement>(null)
  const shadowEl = useRef<HTMLDivElement>(null)
  const mapEl = useRef<SVGFEImageElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0, m: 0 })

  useEffect(() => {
    const el = host.current
    if (!el) return
    let raf = 0, last = ""
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const mask = document.createElement("canvas"), map = document.createElement("canvas"), rim = document.createElement("canvas")

    const draw = (shapes: Shape[], W: number, H: number) => {
      // 1) Forma: piezas desenfocadas y cortadas al 50 % → se funden en gota cuando se acercan
      const sigma = merge / 2
      mask.width = Math.round(W * dpr); mask.height = Math.round(H * dpr)
      const g = mask.getContext("2d", { willReadFrequently: true })
      if (!g) return
      g.filter = `blur(${sigma * dpr}px)`
      g.fillStyle = "white"
      for (const s of shapes) { g.beginPath(); g.roundRect(s.x * dpr, s.y * dpr, s.w * dpr, s.h * dpr, (Math.min(s.w, s.h) / 2) * dpr); g.fill() }
      g.filter = "none"
      const md = g.getImageData(0, 0, mask.width, mask.height), d = md.data, k = sigma * dpr * 2.5
      for (let i = 0; i < d.length; i += 4) {
        const a = Math.min(1, Math.max(0, (d[i + 3] / 255 - 0.5) * k + 0.5))
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255)
      }
      g.putImageData(md, 0, 0)

      // 2) Normales del borde: la forma desenfocada da la pendiente → hacia dónde dobla la lente
      const w = Math.round(W), h = Math.round(H), se = edge / 2
      map.width = rim.width = w; map.height = rim.height = h
      const mg = map.getContext("2d", { willReadFrequently: true }), rg = rim.getContext("2d")
      if (!mg || !rg) return
      mg.filter = `blur(${se}px)`
      mg.drawImage(mask, 0, 0, w, h)
      mg.filter = "none"
      const A = mg.getImageData(0, 0, w, h).data
      mg.drawImage(mask, 0, 0, w, h)
      const inside = mg.getImageData(0, 0, w, h).data
      const out = mg.createImageData(w, h), o = out.data
      const light = rg.createImageData(w, h), l = light.data
      const norm = se * 2.5, lx = -0.45, ly = -0.89   // luz desde arriba a la izquierda
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        const xl = Math.max(0, x - 1), xr = Math.min(w - 1, x + 1), yu = Math.max(0, y - 1), yd = Math.min(h - 1, y + 1)
        let nx = ((A[(y * w + xr) * 4 + 3] - A[(y * w + xl) * 4 + 3]) / 510) * norm
        let ny = ((A[(yd * w + x) * 4 + 3] - A[(yu * w + x) * 4 + 3]) / 510) * norm
        nx = Math.max(-1, Math.min(1, nx)); ny = Math.max(-1, Math.min(1, ny))
        const inn = inside[i + 3] / 255
        o[i] = 128 - nx * 127 * inn; o[i + 1] = 128 - ny * 127 * inn; o[i + 2] = 128; o[i + 3] = 255
        const mag = Math.min(1, Math.hypot(nx, ny)), facing = -(nx * lx + ny * ly)   // normal hacia fuera · luz
        const band = mag * mag * mag * inn
        if (facing > 0) { l[i] = l[i + 1] = l[i + 2] = 255; l[i + 3] = Math.round(band * facing * 230) }
        else { l[i] = l[i + 1] = l[i + 2] = 0; l[i + 3] = Math.round(band * -facing * 60) }
      }
      mg.putImageData(out, 0, 0)
      rg.putImageData(light, 0, 0)

      const maskUrl = `url(${mask.toDataURL()})`
      mapEl.current?.setAttribute("href", map.toDataURL())
      if (glassEl.current) { glassEl.current.style.maskImage = maskUrl; glassEl.current.style.webkitMaskImage = maskUrl; glassEl.current.style.backgroundImage = `url(${rim.toDataURL()})` }
      if (shadowEl.current) { shadowEl.current.style.maskImage = maskUrl; shadowEl.current.style.webkitMaskImage = maskUrl }
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const parent = el.parentElement
      if (!parent) return
      const pr = parent.getBoundingClientRect(), m = num(el, "--space-inset-xl", 0)
      const W = pr.width + m * 2, H = pr.height + m * 2
      const shapes = trackers.map((t) => t.current?.getBoundingClientRect()).filter((r): r is DOMRect => !!r && r.width > 0)
        .map((r) => ({ x: r.left - pr.left + m, y: r.top - pr.top + m, w: r.width, h: r.height }))
      const key = [W, H, ...shapes.flatMap((s) => [s.x, s.y, s.w, s.h])].map((v) => v.toFixed(1)).join(",")
      if (key === last) return
      last = key
      setBox((b) => (b.w === W && b.h === H && b.m === m ? b : { w: W, h: H, m }))
      draw(shapes, W, H)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [trackers, edge, merge])

  const layer: CSSProperties = { inset: -box.m, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }
  const channel = (c: 0 | 1 | 2) => [0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((col) => (r === c && col === c) || (r === 3 && col === 3) ? 1 : 0).join(" ")).join("  ")
  const scales = [1, 1 - dispersion, 1 - dispersion * 2]

  return (
    <div ref={host} aria-hidden className="pointer-events-none absolute inset-0">
      <svg className="absolute size-0">
        <filter id={id} x="0" y="0" width={box.w} height={box.h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage ref={mapEl} x="0" y="0" width={box.w} height={box.h} preserveAspectRatio="none" result="map" />
          {scales.map((s, c) => (
            <Fragment key={c}>
              <feDisplacementMap in="SourceGraphic" in2="map" scale={refraction * s} xChannelSelector="R" yChannelSelector="G" result={`d${c}`} />
              <feColorMatrix in={`d${c}`} type="matrix" values={channel(c as 0 | 1 | 2)} result={`c${c}`} />
            </Fragment>
          ))}
          <feComposite in="c0" in2="c1" operator="arithmetic" k2="1" k3="1" result="c01" />
          <feComposite in="c01" in2="c2" operator="arithmetic" k2="1" k3="1" />
        </filter>
      </svg>
      {/* sombra suave con la misma forma */}
      <div className="absolute" style={{ ...layer, filter: "blur(var(--lab-glass-shadow-blur))", transform: "translateY(var(--lab-glass-shadow-y))" }}>
        <div ref={shadowEl} className="absolute inset-0" style={{ background: "var(--lab-glass-shadow)", maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }} />
      </div>
      {/* el cristal: tinte + brillo del canto, y detrás lo que haya doblado por la lente */}
      <div ref={glassEl} className="absolute" style={{
        ...layer, backgroundColor: `color-mix(in oklch, var(--color-bg-default) ${opacity}%, transparent)`, backgroundSize: "100% 100%",
        backdropFilter: `url(#${id}) blur(${blur}px) saturate(var(--lab-glass-saturate))`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(var(--lab-glass-saturate))`,
      }} />
    </div>
  )
}
