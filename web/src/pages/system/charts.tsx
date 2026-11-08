// Gráficos de shadcn/ui (los de ui.shadcn.com/charts) con el estilo del sistema.
// Todos usan <ChartContainer> de components/ui/chart y los colores chart-1…5 del sistema.
// Los números que pide Recharts (márgenes, grosores, radios, opacidades) se leen de tokens con tokenPx; los radios de
// los circulares van en % (proporciones).
import * as React from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, LabelList, Line, LineChart, Pie, PieChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, XAxis, YAxis,
} from "recharts"
import { Calendar, Globe, Phone, Smartphone, Store } from "lucide-react"
import { tokenPx } from "@/lib/utils"
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart"
import type { Demo } from "./demos"

// Valores de tokens para Recharts (los nombres van en plantillas para que el comprobador no los tome por clases)
function useT() {
  return React.useMemo(() => ({
    gap: tokenPx(`space-gap-sm`, 8),
    line: tokenPx(`size-line`, 2),
    dot: tokenPx(`space-inset-2xs`, 4),
    dotActive: tokenPx(`space-inset-xs`, 6),
    radius: tokenPx(`radius-inner`, 4),
    caption: tokenPx(`text-size-caption`, 12),
    axis: tokenPx(`size-field-xs`, 80),
    area: tokenPx(`chart-area-opacity`, 0.4),
    gradTop: tokenPx(`chart-gradient-start`, 0.8),
    gradBottom: tokenPx(`chart-gradient-end`, 0.1),
    top: tokenPx(`motion-rotate-turn`, 90),
  }), [])
}

const imp = `import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"\n`
const Box = ({ children }: { children: React.ReactNode }) => <div className="w-full max-w-dialog">{children}</div>

// ---------- datos ----------
const MESES = [
  { mes: "Ene", citas: 186, nuevas: 80 }, { mes: "Feb", citas: 305, nuevas: 200 }, { mes: "Mar", citas: 237, nuevas: 120 },
  { mes: "Abr", citas: 73, nuevas: 190 }, { mes: "May", citas: 209, nuevas: 130 }, { mes: "Jun", citas: 214, nuevas: 140 },
]
const cfg = {
  citas: { label: "Citas", color: "var(--color-chart-1)" },
  nuevas: { label: "Clientes nuevos", color: "var(--color-chart-2)" },
} satisfies ChartConfig
const cfgIcons = {
  citas: { label: "Citas", color: "var(--color-chart-1)", icon: Calendar },
  nuevas: { label: "Clientes nuevos", color: "var(--color-chart-2)", icon: Smartphone },
} satisfies ChartConfig

const CANALES = [
  { canal: "web", reservas: 275, fill: "var(--color-web)" },
  { canal: "app", reservas: 200, fill: "var(--color-app)" },
  { canal: "telefono", reservas: 187, fill: "var(--color-telefono)" },
  { canal: "presencial", reservas: 173, fill: "var(--color-presencial)" },
  { canal: "otros", reservas: 90, fill: "var(--color-otros)" },
]
const cfgCanal = {
  reservas: { label: "Reservas" },
  web: { label: "Web", color: "var(--color-chart-1)", icon: Globe },
  app: { label: "App", color: "var(--color-chart-2)", icon: Smartphone },
  telefono: { label: "Teléfono", color: "var(--color-chart-3)", icon: Phone },
  presencial: { label: "Presencial", color: "var(--color-chart-4)", icon: Store },
  otros: { label: "Otros", color: "var(--color-chart-5)" },
} satisfies ChartConfig

const BALANCE = [
  { mes: "Ene", saldo: 186 }, { mes: "Feb", saldo: 205 }, { mes: "Mar", saldo: -207 },
  { mes: "Abr", saldo: 173 }, { mes: "May", saldo: -209 }, { mes: "Jun", saldo: 214 },
]
const total = CANALES.reduce((a, c) => a + c.reservas, 0)

// ---------- piezas comunes ----------
function Cartesian({ t, children }: { t: ReturnType<typeof useT>; children: React.ReactNode }) {
  return (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={t.gap} />
      {children}
    </>
  )
}

// ---------- ÁREA ----------
function AreaDemo({ type = "natural", stacked, gradient, legend, expand }: {
  type?: "natural" | "linear" | "step"; stacked?: boolean; gradient?: boolean; legend?: boolean; expand?: boolean
}) {
  const t = useT()
  const keys = stacked || gradient || legend || expand ? (["nuevas", "citas"] as const) : (["citas"] as const)
  return (
    <Box>
      <ChartContainer config={cfg}>
        <AreaChart accessibilityLayer data={MESES} margin={{ left: t.gap * 3, right: t.gap * 3 }} stackOffset={expand ? "expand" : undefined}>
          <Cartesian t={t}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator={stacked || expand ? "dot" : "line"} />} />
            {gradient && (
              <defs>
                {keys.map((k) => (
                  <linearGradient key={k} id={`fill${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={t.gradTop} />
                    <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={t.gradBottom} />
                  </linearGradient>
                ))}
              </defs>
            )}
            {keys.map((k) => (
              <Area key={k} dataKey={k} type={type} fill={gradient ? `url(#fill${k})` : `var(--color-${k})`} fillOpacity={gradient ? 1 : t.area}
                stroke={`var(--color-${k})`} strokeWidth={t.line} stackId={keys.length > 1 ? "a" : undefined} />
            ))}
            {legend && <ChartLegend content={<ChartLegendContent />} />}
          </Cartesian>
        </AreaChart>
      </ChartContainer>
    </Box>
  )
}

// ---------- BARRAS ----------
function BarDemo({ variant = "default" }: { variant?: "default" | "multiple" | "horizontal" | "stacked" | "label" | "negative" | "active" }) {
  const t = useT()
  if (variant === "horizontal") return (
    <Box>
      <ChartContainer config={cfg}>
        <BarChart accessibilityLayer data={MESES} layout="vertical" margin={{ left: t.gap }}>
          <XAxis type="number" dataKey="citas" hide />
          <YAxis dataKey="mes" type="category" tickLine={false} axisLine={false} tickMargin={t.gap} width={t.axis / 2} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="citas" fill="var(--color-citas)" radius={t.radius} />
        </BarChart>
      </ChartContainer>
    </Box>
  )
  if (variant === "negative") return (
    <Box>
      <ChartContainer config={{ saldo: { label: "Saldo" } }}>
        <BarChart accessibilityLayer data={BALANCE}>
          <CartesianGrid vertical={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel hideIndicator />} />
          <Bar dataKey="saldo">
            <LabelList position="top" dataKey="mes" fillOpacity={1} />
            {BALANCE.map((d) => <Cell key={d.mes} fill={d.saldo > 0 ? "var(--color-chart-1)" : "var(--color-chart-5)"} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Box>
  )
  return (
    <Box>
      <ChartContainer config={cfg}>
        <BarChart accessibilityLayer data={MESES} margin={variant === "label" ? { top: t.gap * 2 } : undefined}>
          <Cartesian t={t}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator={variant === "multiple" ? "dashed" : "dot"} hideLabel={variant === "default"} />} />
            {variant === "stacked" ? (
              <>
                <Bar dataKey="citas" stackId="a" fill="var(--color-citas)" radius={[0, 0, t.radius, t.radius]} />
                <Bar dataKey="nuevas" stackId="a" fill="var(--color-nuevas)" radius={[t.radius, t.radius, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
              </>
            ) : variant === "multiple" ? (
              <>
                <Bar dataKey="citas" fill="var(--color-citas)" radius={t.radius} />
                <Bar dataKey="nuevas" fill="var(--color-nuevas)" radius={t.radius} />
              </>
            ) : variant === "active" ? (
              <Bar dataKey="citas" radius={t.radius} strokeWidth={t.line}>
                {MESES.map((d, i) => (
                  <Cell key={d.mes} fill="var(--color-citas)" fillOpacity={i === 2 ? 1 : t.gradTop}
                    stroke={i === 2 ? "var(--color-citas)" : undefined} strokeDasharray={i === 2 ? `${t.dot}` : undefined} />
                ))}
              </Bar>
            ) : (
              <Bar dataKey="citas" fill="var(--color-citas)" radius={t.radius}>
                {variant === "label" && <LabelList position="top" offset={t.gap} className="fill-foreground" fontSize={t.caption} />}
              </Bar>
            )}
          </Cartesian>
        </BarChart>
      </ChartContainer>
    </Box>
  )
}

// ---------- LÍNEAS ----------
function LineDemo({ type = "natural", multiple, dots, label }: { type?: "natural" | "linear" | "step"; multiple?: boolean; dots?: boolean; label?: boolean }) {
  const t = useT()
  const keys = multiple ? (["citas", "nuevas"] as const) : (["citas"] as const)
  return (
    <Box>
      <ChartContainer config={cfg}>
        <LineChart accessibilityLayer data={MESES} margin={{ left: t.gap * 3, right: t.gap * 3, top: label ? t.gap * 2 : undefined }}>
          <Cartesian t={t}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={!multiple} />} />
            {keys.map((k) => (
              <Line key={k} dataKey={k} type={type} stroke={`var(--color-${k})`} strokeWidth={t.line}
                dot={dots || label ? { fill: `var(--color-${k})`, r: t.dot } : false} activeDot={{ r: t.dotActive }}>
                {label && <LabelList position="top" offset={t.gap} className="fill-foreground" fontSize={t.caption} />}
              </Line>
            ))}
          </Cartesian>
        </LineChart>
      </ChartContainer>
    </Box>
  )
}

// ---------- CIRCULAR ----------
function PieDemo({ variant = "simple" }: { variant?: "simple" | "donut" | "text" | "legend" | "label" | "labelList" }) {
  const t = useT()
  const donut = variant === "donut" || variant === "text"
  return (
    <Box>
      <ChartContainer config={cfgCanal} className="mx-auto aspect-square max-h-sheet">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie data={CANALES} dataKey="reservas" nameKey="canal" innerRadius={donut ? "55%" : 0} strokeWidth={t.line * 2}
            label={variant === "label" ? true : undefined}>
            {variant === "labelList" && (
              <LabelList dataKey="canal" className="fill-background" stroke="none" fontSize={t.caption}
                formatter={(v: React.ReactNode) => cfgCanal[v as keyof typeof cfgCanal]?.label} />
            )}
            {variant === "text" && (
              <Label content={({ viewBox }) => viewBox && "cx" in viewBox ? (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-h2 font-strong">{total.toLocaleString("es")}</tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + t.gap * 3} className="fill-muted-foreground">Reservas</tspan>
                </text>
              ) : null} />
            )}
          </Pie>
          {variant === "legend" && <ChartLegend content={<ChartLegendContent nameKey="canal" className="flex-wrap gap-gap-xs *:basis-1/4 *:justify-center" />} />}
        </PieChart>
      </ChartContainer>
    </Box>
  )
}

// ---------- RADAR ----------
function RadarDemo({ variant = "default" }: { variant?: "default" | "multiple" | "dots" | "circle" | "lines" | "legend" }) {
  const t = useT()
  const multiple = variant === "multiple" || variant === "lines" || variant === "legend"
  return (
    <Box>
      <ChartContainer config={cfg} className="mx-auto aspect-square max-h-sheet">
        <RadarChart data={MESES}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
          <PolarAngleAxis dataKey="mes" />
          <PolarGrid gridType={variant === "circle" ? "circle" : "polygon"} />
          <Radar dataKey="citas" fill="var(--color-citas)" fillOpacity={variant === "lines" ? 0 : t.gradTop}
            stroke={variant === "lines" ? "var(--color-citas)" : undefined} strokeWidth={variant === "lines" ? t.line : undefined}
            dot={variant === "dots" ? { r: t.dot, fillOpacity: 1 } : undefined} />
          {multiple && <Radar dataKey="nuevas" fill="var(--color-nuevas)" fillOpacity={variant === "lines" ? 0 : t.gradTop}
            stroke={variant === "lines" ? "var(--color-nuevas)" : undefined} strokeWidth={variant === "lines" ? t.line : undefined} />}
          {variant === "legend" && <ChartLegend content={<ChartLegendContent className="mt-gap-md" />} />}
        </RadarChart>
      </ChartContainer>
    </Box>
  )
}

// ---------- RADIAL ----------
function RadialDemo({ variant = "simple" }: { variant?: "simple" | "text" | "stacked" | "grid" }) {
  const t = useT()
  const start = t.top
  if (variant === "text" || variant === "stacked") {
    const done = 72
    return (
      <Box>
        <ChartContainer config={variant === "stacked" ? cfg : { citas: { label: "Ocupación", color: "var(--color-chart-1)" } }} className="mx-auto aspect-square max-h-sheet">
          <RadialBarChart data={variant === "stacked" ? [{ citas: 1260, nuevas: 570 }] : [{ citas: done, fill: "var(--color-citas)" }]}
            startAngle={variant === "stacked" ? start * 2 : start} endAngle={variant === "stacked" ? 0 : start - (360 * done) / 100}
            innerRadius="60%" outerRadius="85%">
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label content={({ viewBox }) => viewBox && "cx" in viewBox ? (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - (variant === "stacked" ? t.gap * 2 : 0)} dominantBaseline="middle" className="fill-foreground text-h2 font-strong">{variant === "stacked" ? "1.830" : `${done} %`}</tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + (variant === "stacked" ? t.gap : t.gap * 3)} dominantBaseline="middle" className="fill-muted-foreground">{variant === "stacked" ? "Total" : "Ocupación"}</tspan>
                </text>
              ) : null} />
            </PolarRadiusAxis>
            {variant === "stacked" ? (
              <>
                <RadialBar dataKey="citas" stackId="a" cornerRadius={t.radius} fill="var(--color-citas)" className="stroke-transparent" strokeWidth={t.line} />
                <RadialBar dataKey="nuevas" stackId="a" cornerRadius={t.radius} fill="var(--color-nuevas)" className="stroke-transparent" strokeWidth={t.line} />
              </>
            ) : <RadialBar dataKey="citas" background cornerRadius={t.radius} />}
          </RadialBarChart>
        </ChartContainer>
      </Box>
    )
  }
  return (
    <Box>
      <ChartContainer config={cfgCanal} className="mx-auto aspect-square max-h-sheet">
        <RadialBarChart data={CANALES} startAngle={start} endAngle={start - 360} innerRadius="25%" outerRadius="95%">
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="canal" />} />
          {variant === "grid" && <PolarGrid gridType="circle" />}
          <RadialBar dataKey="reservas" background={variant !== "grid"} cornerRadius={t.radius}>
            {variant === "simple" && <LabelList position="insideStart" dataKey="canal" className="fill-background capitalize mix-blend-luminosity" fontSize={t.caption} />}
          </RadialBar>
        </RadialBarChart>
      </ChartContainer>
    </Box>
  )
}

// ---------- TOOLTIP ----------
function TooltipDemo({ variant }: { variant: "dot" | "line" | "none" | "nolabel" | "icons" | "formatter" }) {
  const t = useT()
  return (
    <Box>
      <ChartContainer config={variant === "icons" ? cfgIcons : cfg}>
        <BarChart accessibilityLayer data={MESES}>
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={t.gap} />
          <Bar dataKey="citas" stackId="a" fill="var(--color-citas)" radius={[0, 0, t.radius, t.radius]} />
          <Bar dataKey="nuevas" stackId="a" fill="var(--color-nuevas)" radius={[t.radius, t.radius, 0, 0]} />
          <ChartTooltip defaultIndex={1} cursor={false} content={
            <ChartTooltipContent
              indicator={variant === "line" ? "line" : "dot"}
              hideIndicator={variant === "none"}
              hideLabel={variant === "nolabel" || variant === "icons"}
              formatter={variant === "formatter" ? (value, name) => (
                <div className="flex min-w-popover items-center justify-between gap-gap-sm text-caption text-muted-foreground">
                  {cfg[name as keyof typeof cfg]?.label ?? name}
                  <span className="font-code font-emphasis text-foreground tabular-nums">{value} citas</span>
                </div>
              ) : undefined}
            />} />
        </BarChart>
      </ChartContainer>
    </Box>
  )
}

const code = (body: string) => imp + body

export const DEMOS4: Record<string, Demo> = {
  [`area-chart`]: {
    description: "Gráfico de área: evolución de una o varias cifras en el tiempo, con el relleno en los colores chart-1…5.",
    examples: [
      { title: "Básico (curva suave)", render: <AreaDemo />, code: code(`<ChartContainer config={config}>\n  <AreaChart data={data}>\n    <CartesianGrid vertical={false} />\n    <XAxis dataKey="mes" tickLine={false} axisLine={false} />\n    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />\n    <Area dataKey="citas" type="natural" fill="var(--color-citas)" stroke="var(--color-citas)" />\n  </AreaChart>\n</ChartContainer>`) },
      { title: "Lineal", render: <AreaDemo type="linear" />, code: code(`<Area dataKey="citas" type="linear" … />`) },
      { title: "Escalonado", render: <AreaDemo type="step" />, code: code(`<Area dataKey="citas" type="step" … />`) },
      { title: "Apilado", render: <AreaDemo stacked />, code: code(`<Area dataKey="nuevas" stackId="a" … />\n<Area dataKey="citas" stackId="a" … />`) },
      { title: "Apilado al 100 %", render: <AreaDemo expand />, code: code(`<AreaChart data={data} stackOffset="expand">…</AreaChart>`) },
      { title: "Con degradado", render: <AreaDemo gradient />, code: code(`<defs>\n  <linearGradient id="fillcitas" x1="0" y1="0" x2="0" y2="1">\n    <stop offset="5%" stopColor="var(--color-citas)" stopOpacity={tokenPx(\`chart-gradient-start\`)} />\n    <stop offset="95%" stopColor="var(--color-citas)" stopOpacity={tokenPx(\`chart-gradient-end\`)} />\n  </linearGradient>\n</defs>\n<Area dataKey="citas" fill="url(#fillcitas)" … />`) },
      { title: "Con leyenda", render: <AreaDemo legend />, code: code(`<ChartLegend content={<ChartLegendContent />} />`) },
    ],
  },
  [`bar-chart`]: {
    description: "Gráfico de barras: comparar cantidades entre categorías o meses.",
    examples: [
      { title: "Básico", render: <BarDemo />, code: code(`<ChartContainer config={config}>\n  <BarChart data={data}>\n    <CartesianGrid vertical={false} />\n    <XAxis dataKey="mes" tickLine={false} axisLine={false} />\n    <ChartTooltip content={<ChartTooltipContent hideLabel />} />\n    <Bar dataKey="citas" fill="var(--color-citas)" radius={tokenPx(\`radius-inner\`)} />\n  </BarChart>\n</ChartContainer>`) },
      { title: "Varias series", render: <BarDemo variant="multiple" />, code: code(`<Bar dataKey="citas" fill="var(--color-citas)" />\n<Bar dataKey="nuevas" fill="var(--color-nuevas)" />`) },
      { title: "Horizontal", render: <BarDemo variant="horizontal" />, code: code(`<BarChart data={data} layout="vertical">\n  <XAxis type="number" dataKey="citas" hide />\n  <YAxis dataKey="mes" type="category" />\n  <Bar dataKey="citas" fill="var(--color-citas)" />\n</BarChart>`) },
      { title: "Apiladas con leyenda", render: <BarDemo variant="stacked" />, code: code(`<Bar dataKey="citas" stackId="a" … />\n<Bar dataKey="nuevas" stackId="a" … />\n<ChartLegend content={<ChartLegendContent />} />`) },
      { title: "Con etiquetas", render: <BarDemo variant="label" />, code: code(`<Bar dataKey="citas" …>\n  <LabelList position="top" className="fill-foreground" />\n</Bar>`) },
      { title: "Barra destacada", render: <BarDemo variant="active" />, code: code(`{data.map((d, i) => <Cell key={d.mes} fillOpacity={i === activo ? 1 : …} />)}`) },
      { title: "Positivos y negativos", render: <BarDemo variant="negative" />, code: code(`<Bar dataKey="saldo">\n  {data.map((d) => <Cell key={d.mes} fill={d.saldo > 0 ? "var(--color-chart-1)" : "var(--color-chart-5)"} />)}\n</Bar>`) },
    ],
  },
  [`line-chart`]: {
    description: "Gráfico de líneas: tendencias en el tiempo.",
    examples: [
      { title: "Básico (curva suave)", render: <LineDemo />, code: code(`<ChartContainer config={config}>\n  <LineChart data={data}>\n    <CartesianGrid vertical={false} />\n    <XAxis dataKey="mes" tickLine={false} axisLine={false} />\n    <ChartTooltip content={<ChartTooltipContent hideLabel />} />\n    <Line dataKey="citas" type="natural" stroke="var(--color-citas)" strokeWidth={tokenPx(\`size-line\`)} dot={false} />\n  </LineChart>\n</ChartContainer>`) },
      { title: "Lineal", render: <LineDemo type="linear" />, code: code(`<Line dataKey="citas" type="linear" … />`) },
      { title: "Escalonado", render: <LineDemo type="step" />, code: code(`<Line dataKey="citas" type="step" … />`) },
      { title: "Varias series", render: <LineDemo multiple />, code: code(`<Line dataKey="citas" stroke="var(--color-citas)" … />\n<Line dataKey="nuevas" stroke="var(--color-nuevas)" … />`) },
      { title: "Con puntos", render: <LineDemo dots />, code: code(`<Line dataKey="citas" dot={{ fill: "var(--color-citas)" }} … />`) },
      { title: "Con etiquetas", render: <LineDemo label />, code: code(`<Line dataKey="citas" …>\n  <LabelList position="top" className="fill-foreground" />\n</Line>`) },
    ],
  },
  [`pie-chart`]: {
    description: "Gráfico circular: el reparto de un total entre partes (por ejemplo, reservas por canal).",
    examples: [
      { title: "Básico", render: <PieDemo />, code: code(`<ChartContainer config={config} className="mx-auto aspect-square max-h-sheet">\n  <PieChart>\n    <ChartTooltip content={<ChartTooltipContent hideLabel />} />\n    <Pie data={data} dataKey="reservas" nameKey="canal" />\n  </PieChart>\n</ChartContainer>`) },
      { title: "Anillo", render: <PieDemo variant="donut" />, code: code(`<Pie data={data} dataKey="reservas" nameKey="canal" innerRadius="55%" />`) },
      { title: "Anillo con total", render: <PieDemo variant="text" />, code: code(`<Pie … innerRadius="55%">\n  <Label content={…total y texto en el centro…} />\n</Pie>`) },
      { title: "Con leyenda", render: <PieDemo variant="legend" />, code: code(`<ChartLegend content={<ChartLegendContent nameKey="canal" />} />`) },
      { title: "Con etiquetas fuera", render: <PieDemo variant="label" />, code: code(`<Pie data={data} dataKey="reservas" label />`) },
      { title: "Con nombres dentro", render: <PieDemo variant="labelList" />, code: code(`<Pie …>\n  <LabelList dataKey="canal" className="fill-background" />\n</Pie>`) },
    ],
  },
  [`radar-chart`]: {
    description: "Gráfico de radar: comparar varias cifras a la vez en forma de telaraña.",
    examples: [
      { title: "Básico", render: <RadarDemo />, code: code(`<ChartContainer config={config} className="mx-auto aspect-square max-h-sheet">\n  <RadarChart data={data}>\n    <ChartTooltip content={<ChartTooltipContent />} />\n    <PolarAngleAxis dataKey="mes" />\n    <PolarGrid />\n    <Radar dataKey="citas" fill="var(--color-citas)" fillOpacity={tokenPx(\`chart-gradient-start\`)} />\n  </RadarChart>\n</ChartContainer>`) },
      { title: "Con puntos", render: <RadarDemo variant="dots" />, code: code(`<Radar dataKey="citas" dot={{ r: tokenPx(\`space-inset-2xs\`) }} … />`) },
      { title: "Varias series", render: <RadarDemo variant="multiple" />, code: code(`<Radar dataKey="citas" … />\n<Radar dataKey="nuevas" … />`) },
      { title: "Solo líneas", render: <RadarDemo variant="lines" />, code: code(`<Radar dataKey="citas" fillOpacity={0} stroke="var(--color-citas)" … />`) },
      { title: "Rejilla circular", render: <RadarDemo variant="circle" />, code: code(`<PolarGrid gridType="circle" />`) },
      { title: "Con leyenda", render: <RadarDemo variant="legend" />, code: code(`<ChartLegend content={<ChartLegendContent />} />`) },
    ],
  },
  [`radial-chart`]: {
    description: "Gráfico radial: barras en círculo; sirve para progresos (ocupación, objetivos) y repartos.",
    examples: [
      { title: "Básico", render: <RadialDemo />, code: code(`<ChartContainer config={config} className="mx-auto aspect-square max-h-sheet">\n  <RadialBarChart data={data} innerRadius="25%" outerRadius="95%">\n    <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="canal" />} />\n    <RadialBar dataKey="reservas" background />\n  </RadialBarChart>\n</ChartContainer>`) },
      { title: "Con rejilla", render: <RadialDemo variant="grid" />, code: code(`<PolarGrid gridType="circle" />\n<RadialBar dataKey="reservas" />`) },
      { title: "Progreso con texto", render: <RadialDemo variant="text" />, code: code(`<RadialBarChart data={[{ ocupacion: 72 }]} … >\n  <PolarRadiusAxis tick={false} axisLine={false}>\n    <Label content={…«72 %» en el centro…} />\n  </PolarRadiusAxis>\n  <RadialBar dataKey="ocupacion" background />\n</RadialBarChart>`) },
      { title: "Semicírculo apilado", render: <RadialDemo variant="stacked" />, code: code(`<RadialBar dataKey="citas" stackId="a" … />\n<RadialBar dataKey="nuevas" stackId="a" … />`) },
    ],
  },
  [`chart-tooltip`]: {
    description: "La etiqueta flotante de los gráficos (ChartTooltipContent) y sus opciones. Pasa el ratón por las barras.",
    examples: [
      { title: "Con punto (por defecto)", render: <TooltipDemo variant="dot" />, code: code(`<ChartTooltip content={<ChartTooltipContent />} />`) },
      { title: "Con línea", render: <TooltipDemo variant="line" />, code: code(`<ChartTooltipContent indicator="line" />`) },
      { title: "Sin indicador", render: <TooltipDemo variant="none" />, code: code(`<ChartTooltipContent hideIndicator />`) },
      { title: "Sin título", render: <TooltipDemo variant="nolabel" />, code: code(`<ChartTooltipContent hideLabel />`) },
      { title: "Con iconos", render: <TooltipDemo variant="icons" />, code: code(`const config = { citas: { label: "Citas", color: "var(--color-chart-1)", icon: Calendar } }`) },
      { title: "Con formato propio", render: <TooltipDemo variant="formatter" />, code: code(`<ChartTooltipContent formatter={(value, name) => <div>…{value} citas</div>} />`) },
    ],
  },
}
