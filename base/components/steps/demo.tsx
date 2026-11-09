import type { CustomDemo } from "@/lib/custom"
import { Steps } from "./steps"

export default {
  label: "Steps",
  description: "Pasos de un proceso (onboarding, registro, pago): «Paso 2 de 3» y una barra por tramos. Cada tramo está hecho, actual o pendiente.",
  examples: [
    { title: "Un paso por estado", render: (
      <div className="flex w-full max-w-sheet flex-col gap-gap-lg">
        <Steps current={1} total={3} />
        <Steps current={2} total={3} />
        <Steps current={3} total={3} />
      </div>),
      code: `import { Steps } from "@/components/custom/steps"\n\n<Steps current={2} total={3} />` },
    { title: "Con el nombre del paso", render: (
      <div className="w-full max-w-sheet"><Steps current={2} total={4} label="Tus intereses" /></div>),
      code: `<Steps current={2} total={4} label="Tus intereses" />` },
  ],
} satisfies CustomDemo
