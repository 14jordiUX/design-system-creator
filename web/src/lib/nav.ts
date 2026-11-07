export type NavItem = { slug: string; label: string; ready?: boolean }

export const FOUNDATIONS: NavItem[] = [
  { slug: "color", label: "Color", ready: true },
  { slug: "tipografia", label: "Tipografía", ready: true },
  { slug: "espaciado", label: "Espaciado", ready: true },
  { slug: "radios", label: "Radios", ready: true },
  { slug: "elevacion", label: "Elevación", ready: true },
  { slug: "movimiento", label: "Movimiento", ready: true },
]

// Grupos del PRD. ready = ya tiene página con demo en esta versión.
export const COMPONENT_GROUPS: { group: string; items: NavItem[] }[] = [
  { group: "Acciones", items: [
    { slug: "button", label: "Button", ready: true },
    { slug: "toggle", label: "Toggle", ready: true },
    { slug: "toggle-group", label: "Toggle Group", ready: true },
    { slug: "dropdown-menu", label: "Dropdown Menu", ready: true },
    { slug: "context-menu", label: "Context Menu", ready: true },
    { slug: "menubar", label: "Menubar", ready: true },
  ]},
  { group: "Formularios", items: [
    { slug: "input", label: "Input", ready: true },
    { slug: "textarea", label: "Textarea", ready: true },
    { slug: "select", label: "Select", ready: true },
    { slug: "combobox", label: "Combobox", ready: true },
    { slug: "checkbox", label: "Checkbox", ready: true },
    { slug: "radio-group", label: "Radio Group", ready: true },
    { slug: "switch", label: "Switch", ready: true },
    { slug: "slider", label: "Slider", ready: true },
    { slug: "label", label: "Label", ready: true },
    { slug: "form", label: "Form", ready: true },
    { slug: "calendar", label: "Calendar", ready: true },
    { slug: "date-picker", label: "Date Picker", ready: true },
    { slug: "input-otp", label: "Input OTP", ready: true },
  ]},
  { group: "Contenido", items: [
    { slug: "card", label: "Card", ready: true },
    { slug: "table", label: "Table", ready: true },
    { slug: "data-table", label: "Data Table", ready: true },
    { slug: "badge", label: "Badge", ready: true },
    { slug: "avatar", label: "Avatar", ready: true },
    { slug: "accordion", label: "Accordion", ready: true },
    { slug: "collapsible", label: "Collapsible", ready: true },
    { slug: "tabs", label: "Tabs", ready: true },
    { slug: "separator", label: "Separator", ready: true },
    { slug: "aspect-ratio", label: "Aspect Ratio", ready: true },
    { slug: "carousel", label: "Carousel", ready: true },
    { slug: "chart", label: "Chart", ready: true },
  ]},
  { group: "Navegación", items: [
    { slug: "navigation-menu", label: "Navigation Menu", ready: true },
    { slug: "breadcrumb", label: "Breadcrumb", ready: true },
    { slug: "pagination", label: "Pagination", ready: true },
    { slug: "sidebar", label: "Sidebar", ready: true },
    { slug: "command", label: "Command", ready: true },
  ]},
  { group: "Superposiciones", items: [
    { slug: "dialog", label: "Dialog", ready: true },
    { slug: "alert-dialog", label: "Alert Dialog", ready: true },
    { slug: "sheet", label: "Sheet", ready: true },
    { slug: "drawer", label: "Drawer", ready: true },
    { slug: "popover", label: "Popover", ready: true },
    { slug: "hover-card", label: "Hover Card", ready: true },
    { slug: "tooltip", label: "Tooltip", ready: true },
  ]},
  { group: "Feedback", items: [
    { slug: "alert", label: "Alert", ready: true },
    { slug: "toast", label: "Toast (Sonner)", ready: true },
    { slug: "progress", label: "Progress", ready: true },
    { slug: "skeleton", label: "Skeleton", ready: true },
  ]},
]

export const ALL_COMPONENTS = COMPONENT_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })))
