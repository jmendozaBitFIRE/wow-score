'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PlayCircle, X } from '@phosphor-icons/react'

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const VIDEO_ID = '2V8RpzgGUxw'
// youtube-nocookie no deja cookies hasta que el visitante reproduce; sin autoplay.
const EMBED_URL = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1&playsinline=1`
const OPEN_EVENT = 'wow:open-tutorial-video'
const SEEN_KEY = 'wow-tutorial-video-seen'
const AUTO_OPEN_DELAY_MS = 1200

/** Abre el popup del video desde cualquier botón de la landing. */
export function openTutorialVideo() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

/** Marca el video como visto en esta sesión. Devuelve true si ya se había visto. */
function markSeenThisSession(): boolean {
  try {
    if (window.sessionStorage.getItem(SEEN_KEY)) return true
    window.sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Sin acceso a sessionStorage (modo privado estricto): se abre igual.
  }
  return false
}

// ── MODAL ────────────────────────────────────────────────────────────────────
/**
 * TutorialVideoModal muestra el video tutorial en un <dialog> nativo.
 * Se cierra con el botón, con Escape o con un clic fuera del video.
 * Con `autoOpen` se abre solo una vez por sesión del navegador.
 */
export function TutorialVideoModal({ autoOpen = false }: { autoOpen?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  // Botones de la página
  useEffect(() => {
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [open])

  // Apertura automática, una vez por sesión
  useEffect(() => {
    if (!autoOpen || markSeenThisSession()) return
    const timer = window.setTimeout(open, AUTO_OPEN_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [autoOpen, open])

  // Bloquea el scroll del fondo mientras está abierto
  useEffect(() => {
    if (!isOpen) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tutorial-video-title"
      // Escape dispara "close" de forma nativa; aquí solo sincronizamos el estado.
      onClose={() => setIsOpen(false)}
      // Un clic en el fondo oscuro llega con target === <dialog>.
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      className="m-auto w-[min(960px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] p-0 bg-transparent text-paper overflow-visible backdrop:bg-black/80 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95"
    >
      <div className="bg-ink border border-white/10 rounded-[20px] shadow-[0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-flame mb-1">
              Video tutorial
            </p>
            <h2
              id="tutorial-video-title"
              className="font-heading font-bold text-lg md:text-xl leading-tight text-white text-balance"
            >
              Así funciona WOW Score
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            autoFocus
            aria-label="Cerrar video"
            className="shrink-0 inline-flex items-center justify-center size-11 rounded-xl border border-white/15 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame transition"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="relative w-full aspect-video bg-black">
          {/* El iframe solo existe mientras está abierto: al cerrar, el video se detiene. */}
          {isOpen && (
            <iframe
              src={EMBED_URL}
              title="Video tutorial: cómo usar WOW Score"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </dialog>
  )
}

// ── SECCIÓN CON BOTÓN ────────────────────────────────────────────────────────
/**
 * TutorialVideoSection es una franja antes de los precios con el botón
 * para volver a ver el video en cualquier momento.
 */
export function TutorialVideoSection() {
  return (
    <section
      id="video-tutorial"
      aria-labelledby="video-tutorial-heading"
      className="relative bg-ink text-paper pt-4 pb-4 md:pt-8 md:pb-0"
    >
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[24px] border border-flame/30 bg-gradient-to-r from-flame/10 to-transparent px-6 py-7 md:px-10 md:py-8">
          <div className="max-w-xl">
            <h2
              id="video-tutorial-heading"
              className="font-heading font-bold text-2xl md:text-3xl leading-tight tracking-[-1px] text-white mb-2 text-balance"
            >
              Mira cómo funciona en un video corto
            </h2>
            <p className="text-sm md:text-base text-paper leading-relaxed">
              Te mostramos paso a paso cómo generar un análisis y cómo consultar tu historial.
            </p>
          </div>
          <button
            type="button"
            onClick={openTutorialVideo}
            className="shrink-0 inline-flex items-center justify-center gap-2.5 bg-flame text-on-flame font-bold tracking-[0.01em] text-base px-6 py-4 rounded-xl hover:bg-flame-strong transition duration-200 shadow-[0_4px_14px_rgba(246,101,2,0.15)] hover:shadow-[0_8px_24px_rgba(246,101,2,0.25)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <PlayCircle size={24} weight="fill" aria-hidden="true" />
            Ver video tutorial
          </button>
        </div>
      </div>
    </section>
  )
}
