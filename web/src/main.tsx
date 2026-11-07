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
import Patterns from "./pages/system/Patterns"
import Downloads from "./pages/system/Downloads"
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  </StrictMode>,
)
