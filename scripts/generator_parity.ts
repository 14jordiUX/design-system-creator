// Lo usa scripts/check_generator.py: aplica el generador de la web a unos casos y devuelve los primitivos.
import { buildTokens, DEFAULT_ANSWERS, fromCharacter } from "../web/src/lib/generator.ts"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
const R = fileURLToPath(new URL("../base/tokens/", import.meta.url))
const L = (n: string) => JSON.parse(fs.readFileSync(R + n + ".tokens.json", "utf8"))
const base = { primitives: L("primitives"), semantic: L("semantic"), light: L("color.light"), dark: L("color.dark") }
const cases = JSON.parse(fs.readFileSync(process.argv[2], "utf8"))
const out = cases.map((raw: any) => {
  let a: any = { ...DEFAULT_ANSWERS }
  for (const k of ["sober", "serious", "dense"]) if (k in raw) a = { ...a, ...fromCharacter(a, k as any, raw[k]) }
  a = { ...a, ...raw }
  return buildTokens(base as any, a).primitives
})
console.log(JSON.stringify(out))
