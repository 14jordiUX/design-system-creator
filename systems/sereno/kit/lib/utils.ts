import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge necesita conocer los nombres de nuestras clases de tokens para no
// confundirlas (por ejemplo, que `border-thin` es un grosor y `border-input` un color).
const twMerge = extendTailwindMerge<string>({
  extend: {
    theme: {
      spacing: ["inset-3xs", "inset-2xs", "inset-xs", "inset-sm", "inset-md", "inset-lg", "inset-xl", "inset-2xl", "inset-3xl", "inset-4xl", "gap-3xs", "gap-2xs", "gap-xs", "gap-sm", "gap-md", "gap-lg", "gap-xl", "gap-2xl", "gap-3xl", "gap-4xl", "section", "control-sm", "control-md", "control-lg", "thin", "icon-sm", "icon-md", "icon-lg", "avatar-sm", "avatar-md", "avatar-lg", "avatar-xl", "avatar-2xl", "indicator", "track", "progress", "menu-min", "popover", "tooltip", "dialog", "sheet", "menu-wide", "list-max", "handle", "line", "field-xs", "field-sm", "area-min", "fab-md", "fab-sm", "header", "sidebar", "prose", "content", "page", "sidebar-icon", "sidebar-mobile", "drawer-max", "drawer-gap"],
      text: ["caption", "ui", "body", "lead", "title", "h3", "h2", "h1", "display"],
      "font-weight": ["normal", "emphasis", "strong", "heavy"],
      font: ["base", "code"],
      leading: ["compact", "body", "prose"],
      tracking: ["heading", "body", "caps"],
      radius: ["control", "card", "overlay", "pill", "inner", "fine", "square"],
      shadow: ["flat", "raised", "overlay", "modal"],
      ease: ["default"],
    },
    classGroups: {
      "border-w": [{ border: ["thin", "thick"] }],
      "border-w-t": [{ "border-t": ["thin"] }],
      "border-w-b": [{ "border-b": ["thin"] }],
      "border-w-l": [{ "border-l": ["thin"] }],
      "border-w-r": [{ "border-r": ["thin"] }],
      "border-w-x": [{ "border-x": ["thin"] }],
      "border-w-y": [{ "border-y": ["thin"] }],
      opacity: [{ opacity: ["disabled", "overlay"] }],
      duration: [{ duration: ["micro", "default", "emphasis", "loop"] }],
      typo: [{ typo: [(v: string) => /^[a-z0-9-]+$/.test(v)] }],
      "focus-ring": ["focus-ring", "focus-ring-inset"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Lee un token de medida (en px) desde el CSS, por ejemplo tokenPx("space-1").
 *  Sirve para las props de JavaScript que piden un número (sideOffset de menús y popovers…),
 *  así tampoco ahí hay medidas escritas a mano. */
export function tokenPx(name: string, fallback = 0): number {
  if (typeof window === "undefined") return fallback
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--${name}`))
  return Number.isNaN(v) ? fallback : v
}
