// Botón «QR para el móvil»: abre una ventana con el código QR de un enlace, para escanearlo con la cámara del teléfono.
// El QR siempre es oscuro sobre claro (también en modo oscuro), que es como lo leen todas las cámaras.
import { useMemo } from "react"
import qrcode from "qrcode-generator"
import { QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const QUIET = 4   // margen en blanco alrededor, en módulos (lo que pide el estándar del QR)

export function QrCodeImage({ url, label }: { url: string; label: string }) {
  const { n, path } = useMemo(() => {
    const qr = qrcode(0, "M")
    qr.addData(url)
    qr.make()
    const n = qr.getModuleCount()
    let path = ""
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) path += `M${x + QUIET} ${y + QUIET}h1v1h-1z`
    return { n, path }
  }, [url])
  const size = n + QUIET * 2
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges"
      className="aspect-square w-full rounded-card bg-background text-foreground dark:bg-foreground dark:text-background">
      <path d={path} fill="currentColor" />
    </svg>
  )
}

export function QrButton({ url, title, size = "sm" }: { url: string; title: string; size?: "sm" | "default" }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size={size}><QrCode />QR para el móvil</Button>
      </DialogTrigger>
      <DialogContent className="max-w-popover">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Escanea el código con la cámara del teléfono para abrirlo a pantalla completa.</DialogDescription>
        </DialogHeader>
        <QrCodeImage url={url} label={`Código QR de ${title}`} />
        <p className="text-caption break-all text-muted-foreground">{url}</p>
      </DialogContent>
    </Dialog>
  )
}
