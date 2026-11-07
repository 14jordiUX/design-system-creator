// Guardar desde la web publicada (GitHub Pages): escribe los cambios directamente en el repositorio.
// Usa una llave de acceso de GitHub (token) que solo da permiso sobre este repositorio; se guarda en este navegador.
// Después, GitHub regenera CSS, Figma y kit y vuelve a publicar la web (.github/workflows/web.yml).

import type { TokenFiles } from "./tokens"
import { toFileText } from "./orderedJson"

const KEY = "dsc.github.token"
const API = "https://api.github.com"

/** Repositorio de la web publicada: usuario.github.io/repositorio → { owner, repo } */
export function hostedRepo(): { owner: string; repo: string } | null {
  const m = window.location.hostname.match(/^([^.]+)\.github\.io$/)
  const repo = window.location.pathname.split("/").filter(Boolean)[0]
  return m && repo ? { owner: m[1], repo } : null
}

export const getToken = () => localStorage.getItem(KEY)
export const setToken = (t: string) => localStorage.setItem(KEY, t.trim())
export const clearToken = () => localStorage.removeItem(KEY)

async function gh(path: string, init: RequestInit = {}, token = getToken()) {
  const r = await fetch(API + path, {
    ...init,
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    cache: "no-store",
  })
  if (r.status === 401) { clearToken(); throw new Error("La llave de GitHub no es válida o ha caducado. Vuelve a conectarla.") }
  if (!r.ok && r.status !== 404) throw new Error(`GitHub respondió ${r.status}: ${(await r.json().catch(() => ({}))).message ?? ""}`)
  return r
}

/** Comprueba que la llave puede escribir en el repositorio. */
export async function checkToken(token: string): Promise<string | null> {
  const repo = hostedRepo()
  if (!repo) return "Esta web no está publicada en GitHub Pages."
  try {
    const r = await gh(`/repos/${repo.owner}/${repo.repo}`, {}, token.trim())
    if (r.status === 404) return "La llave no da acceso a este repositorio."
    const j = await r.json()
    return j.permissions?.push ? null : "La llave solo puede leer: dale permiso de escritura en «Contents»."
  } catch (e: any) { return e.message }
}

/** Texto actual de un archivo del repositorio (null si no existe). */
export async function readFile(path: string): Promise<string | null> {
  const { owner, repo } = hostedRepo()!
  const r = await gh(`/repos/${owner}/${repo}/contents/${encodeURI(path)}?ref=main`, { headers: { Accept: "application/vnd.github.raw" } })
  return r.status === 404 ? null : r.text()
}

export async function exists(path: string) {
  const { owner, repo } = hostedRepo()!
  const r = await gh(`/repos/${owner}/${repo}/contents/${encodeURI(path)}?ref=main`)
  return r.status !== 404
}

/** Sube varios archivos en un solo cambio (commit) a la rama main. */
export async function commitFiles(files: { path: string; content: string }[], message: string) {
  const { owner, repo } = hostedRepo()!
  const base = `/repos/${owner}/${repo}/git`
  const json = (r: Response) => r.json()
  const ref = await gh(`${base}/ref/heads/main`).then(json)
  const parent = await gh(`${base}/commits/${ref.object.sha}`).then(json)
  const tree = await gh(`${base}/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: parent.tree.sha, tree: files.map((f) => ({ path: f.path, mode: "100644", type: "blob", content: f.content })) }),
  }).then(json)
  const commit = await gh(`${base}/commits`, { method: "POST", body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] }) }).then(json)
  try { await gh(`${base}/refs/heads/main`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) }) }
  catch { throw new Error("El repositorio ha cambiado mientras guardabas. Vuelve a pulsar Guardar.") }
  return commit.sha as string
}

/** Enlace para crear la llave con los permisos justos (solo este repositorio, solo contenido). */
export function newTokenUrl() {
  const repo = hostedRepo()
  const p = new URLSearchParams({
    name: "Design System Creator",
    description: "Guardar cambios desde la web del Design System Creator",
    ...(repo ? { target_name: repo.owner } : {}),
    expires_in: "none",
    contents: "write",
  })
  return `https://github.com/settings/personal-access-tokens/new?${p}`
}

// ---------- sistemas ----------

const FILES: [keyof TokenFiles, string][] = [["primitives", "primitives"], ["semantic", "semantic"], ["light", "color.light"], ["dark", "color.dark"]]
const today = () => new Date().toISOString().slice(0, 10)
const dirOf = (id: string) => (id === "base" ? "base" : `systems/${id}`)

/** Guarda los cambios del modo editor de un sistema. */
export async function saveSystemToGitHub(id: string, name: string, tokens: TokenFiles) {
  const dir = dirOf(id)
  const files = await Promise.all(FILES.map(async ([key, file]) => {
    const path = `${dir}/tokens/${file}.tokens.json`
    return { path, content: toFileText(tokens[key], await readFile(path)) }
  }))
  const metaText = await readFile(`${dir}/system.json`)
  if (metaText) files.push({ path: `${dir}/system.json`, content: toFileText({ ...JSON.parse(metaText), updatedAt: today() }, metaText) })
  return commitFiles(files, `Editor: cambios en «${name}»`)
}

/** Crea un sistema nuevo (cuestionario). Devuelve el id final. */
export async function createSystemOnGitHub(meta: Record<string, any>, tokens: TokenFiles, answers: unknown) {
  let base = String(meta.id || "sistema"), id = base === "base" ? "base-2" : base, n = 2
  while (await exists(`systems/${id}/system.json`)) id = `${base}-${n++}`
  const dir = `systems/${id}`
  const { id: _, createdAt: __, updatedAt: ___, ...rest } = meta
  const files = [
    { path: `${dir}/system.json`, content: toFileText({ id, ...rest, createdAt: today(), updatedAt: today() }) },
    { path: `${dir}/config.json`, content: toFileText({ cuestionario: answers }) },
    ...(await Promise.all(FILES.map(async ([key, file]) => ({
      path: `${dir}/tokens/${file}.tokens.json`,
      // el orden de las claves se copia de la plantilla base
      content: toFileText(tokens[key], await readFile(`base/tokens/${file}.tokens.json`)),
    })))),
  ]
  await commitFiles(files, `Nuevo sistema: «${meta.name}»`)
  return id
}
