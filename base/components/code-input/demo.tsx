import type { CustomDemo } from "@/lib/custom"
import { CodeInput } from "./code-input"

export default {
  label: "Code Input",
  description: "Código de verificación de 6 cifras, con su texto de ayuda o su error. Para verificación en dos pasos o confirmar un email.",
  examples: [
    { title: "Normal y con error", render: (
      <div className="flex w-full flex-col items-center gap-gap-2xl">
        <CodeInput id="ci-1" description="Se comprueba solo al escribir la última cifra." />
        <CodeInput id="ci-2" value="000000" error="Ese código no es válido. Prueba otra vez." />
      </div>),
      code: `import { CodeInput } from "@/components/custom/code-input"\n\n<CodeInput id="code" value={code} onChange={setCode}\n  description="Se comprueba solo al escribir la última cifra." />\n<CodeInput … error="Ese código no es válido." />` },
  ],
} satisfies CustomDemo
