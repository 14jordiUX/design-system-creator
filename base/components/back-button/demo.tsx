import type { CustomDemo } from "@/lib/custom"
import { BackButton } from "./back-button"

export default {
  label: "Back Button",
  description: "Volver al paso o a la pantalla anterior. Siempre con la flecha y el mismo estilo.",
  examples: [
    { title: "Textos habituales", render: (
      <div className="flex flex-wrap items-center gap-gap-md"><BackButton /><BackButton>Atrás</BackButton><BackButton disabled>Volver</BackButton></div>),
      code: `import { BackButton } from "@/components/custom/back-button"\n\n<BackButton onClick={() => …} />\n<BackButton>Atrás</BackButton>` },
  ],
} satisfies CustomDemo
