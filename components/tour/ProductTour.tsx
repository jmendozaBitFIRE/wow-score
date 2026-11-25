'use client'

import { useCallback, useEffect } from 'react'
import { Question } from '@phosphor-icons/react'
import 'driver.js/dist/driver.css'

export interface TourStep {
  // Selector de data-tour (p. ej. '[data-tour="upload-dropzone"]'). El mismo
  // selector puede existir en más de un elemento (ej. tabla desktop + tarjetas
  // mobile) — se resalta el primero que esté realmente visible.
  selector: string
  title: string
  description: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

function storageKey(tourId: string) {
  return `wow-score:tour-seen:${tourId}`
}

function hasSeenTour(tourId: string): boolean {
  try {
    return localStorage.getItem(storageKey(tourId)) !== null
  } catch {
    return true // si localStorage falla, no insistimos con el auto-inicio
  }
}

function markTourSeen(tourId: string) {
  try {
    localStorage.setItem(storageKey(tourId), '1')
  } catch {
    // ponytail: si localStorage no está disponible (modo privado, etc.), el
    // tour simplemente se auto-inicia de nuevo la próxima vez — no es grave.
  }
}

// Un mismo data-tour puede estar en varios elementos a la vez (la versión de
// tabla y la de tarjetas del mismo módulo, mostradas/ocultas por CSS según el
// viewport) — nos quedamos con el primero que tenga tamaño real en pantalla.
function resolveVisibleElement(selector: string): Element | null {
  const candidates = document.querySelectorAll(selector)
  for (const el of candidates) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return el
  }
  return candidates[0] ?? null
}

// Tour guiado por módulo: resalta data-tour="..." en el orden dado, con
// botón para avanzar/retroceder/saltar. Pensado para roles distintos — los
// pasos cuyo elemento no existe o no es visible (ej. una sección solo para
// el propietario) se omiten solos, sin configuración extra por rol.
export function ProductTour({ tourId, steps }: { tourId: string; steps: TourStep[] }) {
  const start = useCallback(() => {
    const visibleSteps = steps.filter((s) => resolveVisibleElement(s.selector))
    if (visibleSteps.length === 0) return

    import('driver.js').then(({ driver }) => {
      const tour = driver({
        showProgress: true,
        allowClose: true,
        overlayOpacity: 0.55,
        nextBtnText: 'Siguiente',
        prevBtnText: 'Atrás',
        doneBtnText: 'Listo',
        progressText: '{{current}} de {{total}}',
        onDestroyed: () => markTourSeen(tourId),
        steps: visibleSteps.map((s) => ({
          element: () => resolveVisibleElement(s.selector) as Element,
          popover: {
            title: s.title,
            description: s.description,
            side: s.side ?? 'bottom',
            align: 'start',
          },
        })),
      })
      tour.drive()
    })
  }, [tourId, steps])

  // Auto-inicio solo la primera vez que este navegador visita el módulo.
  useEffect(() => {
    if (hasSeenTour(tourId)) return
    const t = setTimeout(start, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId])

  return (
    <button
      type="button"
      onClick={start}
      className="no-print inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-flame-text transition-colors shrink-0"
    >
      <Question size={15} weight="bold" />
      Ver tutorial
    </button>
  )
}
