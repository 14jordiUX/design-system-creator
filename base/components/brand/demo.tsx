import { Leaf } from "lucide-react"
import type { CustomDemo } from "@/lib/custom"
import { Brand } from "./brand"

export default {
  label: "Brand",
  description: "Logo y nombre del producto. Va arriba en las pantallas de acceso, registro o bienvenida.",
  examples: [
    { title: "Por defecto y con otro logo", render: (
      <div className="flex flex-wrap items-center gap-gap-2xl">
        <Brand />
        <Brand name="Clínica Sonrisa" icon={<Leaf />} />
      </div>),
      code: `import { Brand } from "@/components/custom/brand"\n\n<Brand />\n<Brand name="Clínica Sonrisa" icon={<Leaf />} />` },
  ],
} satisfies CustomDemo
