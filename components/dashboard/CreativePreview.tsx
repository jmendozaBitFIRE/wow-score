import Image from 'next/image'
import { FileText } from 'lucide-react'

// Un guion de audio no tiene nada que "ver" — se muestra un placeholder
// en vez de intentar renderizar el .txt como imagen.
export function CreativePreview({ src, isText, alt, label }: { src: string; isText: boolean; alt: string; label?: string }) {
  if (isText) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileText size={32} />
        <span className="text-xs">{label ?? 'Guion de texto'}</span>
      </div>
    )
  }
  return <Image src={src} alt={alt} fill className="object-contain" unoptimized />
}
