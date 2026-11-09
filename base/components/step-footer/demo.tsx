import type { CustomDemo } from "@/lib/custom"
import { StepFooter } from "./step-footer"

export default {
  label: "Step Footer",
  description: "Los botones de un paso a paso: «Atrás» y la acción principal. En el primer paso solo sale la principal.",
  examples: [
    { title: "Primer paso, paso intermedio y último", render: (
      <div className="flex w-full max-w-sheet flex-col gap-gap-lg">
        <StepFooter nextLabel="Empezar" onNext={() => {}} />
        <StepFooter onBack={() => {}} onNext={() => {}} />
        <StepFooter onBack={() => {}} onNext={() => {}} nextLabel="Terminar" />
      </div>),
      code: `import { StepFooter } from "@/components/custom/step-footer"\n\n<StepFooter onBack={() => go("antes")} onNext={() => go("despues")} />\n<StepFooter onBack={…} onNext={…} nextLabel="Terminar" />` },
  ],
} satisfies CustomDemo
