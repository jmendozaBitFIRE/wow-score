'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const MESSAGES = [
  'Aplicando fórmula WOW Score...',
  'Analizando impacto visual...',
  'Evaluando creatividad...',
  'Calculando dimensiones...',
]

interface AnalyzingSkeletonProps {
  preview: string
}

export function AnalyzingSkeleton({ preview }: AnalyzingSkeletonProps) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-4 reveal reveal-1">
      {/* Imagen con overlay sutil */}
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="relative aspect-video bg-muted">
          <Image src={preview} alt="Pieza en análisis" fill className="object-contain" unoptimized />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
        </div>
      </div>

      {/* Progress + texto + skeleton de dimensiones */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        {/* Barra de progreso */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="progress-fill" />
        </div>

        {/* Texto rotatorio */}
        <p className="text-sm text-center text-muted-foreground min-h-[1.25rem] transition-opacity">
          {MESSAGES[msgIndex]}
        </p>

        {/* 10 skeleton rows representando las dimensiones */}
        <div className="space-y-2.5 pt-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-3 w-24 shrink-0" />
              <div className="skeleton h-1.5 flex-1" style={{ opacity: 1 - i * 0.04 }} />
              <div className="skeleton h-3 w-6 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
