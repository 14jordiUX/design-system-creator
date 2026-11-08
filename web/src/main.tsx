import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import "./index.css"
import Library from "./pages/Library"
import NewSystem from "./pages/NewSystem"
import SystemLayout from "./pages/system/SystemLayout"
import SystemHome from "./pages/system/SystemHome"
import Foundation from "./pages/system/Foundation"
import { ComponentPage, ComponentsIndex } from "./pages/system/Components"
import Patterns, { PatternPage } from "./pages/system/Patterns"
import Downloads from "./pages/system/Downloads"
import Prototypes, { PrototypePage, PrototypeFullscreen } from "./pages/system/Prototypes"
import { TooltipProvider } from "./components/ui/tooltip"

// Las mismas páginas sirven para el modo cliente (/s/id/...) y el modo editor (/s/id/editar/...)
const systemPages = (
  <>
    <Route index element={<SystemHome />} />
    <Route path="fundamentos" element={<Navigate to="color" replace />} />
    <Route path="fundamentos/:page" element={<Foundation />} />
    <Route path="componentes" element={<ComponentsIndex />} />
    <Route path="componentes/:slug" element={<ComponentPage />} />
    <Route path="patrones" element={<Patterns />} />
    <Route path="patrones/:slug" element={<PatternPage />} />
    <Route path="prototipos" element={<Prototypes />} />
    <Route path="prototipos/:slug" element={<PrototypePage />} />
    <Route path="descargas" element={<Downloads />} />
  </>
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/nuevo" element={<NewSystem />} />
          <Route path="/s/:id" element={<SystemLayout />}>
            {systemPages}
            <Route path="editar">{systemPages}</Route>
          </Route>
          {/* Prototipo a pantalla completa (test con usuarios, incrustar en presentaciones) */}
          <Route path="/p/:id/:slug" element={<PrototypeFullscreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  </StrictMode>,
)
