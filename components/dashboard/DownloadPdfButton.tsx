'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ponytail: usa el diálogo de impresión nativo del navegador ("Guardar como PDF")
// en vez de una librería de generación de PDF — cero dependencias nuevas.
export function DownloadPdfButton() {
  return (
    <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
      <Download className="size-4" />
      Descargar PDF
    </Button>
  )
}
