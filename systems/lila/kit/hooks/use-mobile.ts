import * as React from "react"

// El punto de ruptura sale del token breakpoint.md (no hay números escritos a mano).
function mobileQuery() {
  const md = getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-md").trim() || "768px"
  return `(max-width: calc(${md} - 1px))`
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(mobileQuery())
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
