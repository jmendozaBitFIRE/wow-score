'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { AnalyzingSkeleton } from '@/components/ui/AnalyzingSkeleton'
import type { Medio, Objetivo } from '@/lib/wow-formulas'

// ── Opciones de los dropdowns ───────────────────────────────
const MEDIOS: { value: Medio; label: string }[] = [
  { value: 'TV', label: 'TV' },
  { value: 'Radio', label: 'Radio' },
  { value: 'OOH', label: 'OOH' },
  { value: 'DOOH', label: 'DOOH' },
  { value: 'Digital', label: 'Digital' },
  { value: 'Impresos', label: 'Impresos' },
  { value: 'Cine', label: 'Cine' },
]

const OBJETIVOS: { value: Objetivo; label: string }[] = [
  { value: 'Branding', label: 'Branding' },
  { value: 'Ventas', label: 'Ventas' },
  { value: 'Lanzamiento', label: 'Lanzamiento' },
  { value: 'Promocion', label: 'Promoción' },
  { value: 'Informativo', label: 'Informativo' },
  { value: 'BrandLove', label: 'BrandLove' },
]

// ── Tipos ───────────────────────────────────────────────────
interface AnalyzeResult {
  id: string | null
  wow_score: number
  dimensiones: Record<string, number>
  fortalezas: [string, string, string]
  oportunidades: [string, string, string]
  veredicto: string
  medio: Medio
  objetivo: Objetivo
  image_url: string
}

type PageState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'uploaded'; imageUrl: string }
  | { status: 'analyzing' }
  | { status: 'done'; result: AnalyzeResult }
  | { status: 'error'; message: string }


// ── Constantes ──────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const DIM_LABELS: Record<string, string> = {
  insight: 'Insight', claridad: 'Claridad', stopping: 'Stopping power',
  simplicidad: 'Simplicidad', pert: 'Pertinencia', adapt: 'Adaptabilidad',
  emocion: 'Emoción', recordacion: 'Recordación', estetica: 'Estética', relevancia: 'Relevancia',
}

// ── Componente ──────────────────────────────────────────────
export function UploadClient({ 
  subscriptionStatus, 
  trialCredits, 
  monthlyCredits,
  trialEnd
}: { 
  subscriptionStatus: string, 
  trialCredits: number, 
  monthlyCredits: number,
  trialEnd: string | null
}) {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [state, setState] = useState<PageState>({ status: 'idle' })
  const [isDragging, setIsDragging] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [medio, setMedio] = useState<Medio | ''>('')
  const [objetivo, setObjetivo] = useState<Objetivo | ''>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const hasActiveOrTrial = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'
  const isTrialExhausted = subscriptionStatus === 'trialing' && trialCredits === 0
  const isMonthlyExhausted = subscriptionStatus === 'active' && monthlyCredits === 0
  const hasNoCredits = isTrialExhausted || isMonthlyExhausted

  let trialDaysLeft = 0
  if (subscriptionStatus === 'trialing' && trialEnd) {
    trialDaysLeft = Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (trialDaysLeft < 0) trialDaysLeft = 0
  }

  async function authorizeCharge() {
    setIsAuthorizing(true)
    try {
      const res = await fetch('/api/stripe/authorize-charge', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setState({ status: 'error', message: data.error || 'Error al autorizar el cobro' })
        setIsAuthorizing(false)
        return
      }
      window.location.reload()
    } catch (err) {
      setState({ status: 'error', message: 'Error de red al autorizar.' })
      setIsAuthorizing(false)
    }
  }

  // ── Selección de archivo ──────────────────────────────────
  function selectFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setState({ status: 'error', message: 'Formato no permitido. Usa JPG, PNG o WebP.' })
      return
    }
    if (file.size > MAX_BYTES) {
      setState({ status: 'error', message: 'El archivo supera el límite de 5 MB.' })
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    uploadFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) selectFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) selectFile(f)
  }, [preview]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Subida al storage ─────────────────────────────────────
  async function uploadFile(file: File) {
    setState({ status: 'uploading' })
    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Error al subir el archivo.' })
        return
      }
      setState({ status: 'uploaded', imageUrl: data.image_url })
    } catch {
      setState({ status: 'error', message: 'Error de red. Intenta de nuevo.' })
    }
  }

  // ── Análisis ──────────────────────────────────────────────
  async function handleAnalyze() {
    if (state.status !== 'uploaded' || !medio || !objetivo) return
    const { imageUrl } = state
    setState({ status: 'analyzing' })

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, medio, objetivo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Error al analizar.' })
        return
      }
      if (data.id) {
        router.push(`/results/${data.id}`)
      } else {
        setState({ status: 'done', result: data as AnalyzeResult })
      }
    } catch {
      setState({ status: 'error', message: 'Error de red. Intenta de nuevo.' })
    }
  }

  // ── Reset ─────────────────────────────────────────────────
  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setMedio('')
    setObjetivo('')
    setState({ status: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Helpers ───────────────────────────────────────────────
  const isUploading = state.status === 'uploading'
  const isAnalyzing = state.status === 'analyzing'
  const isBusy = isUploading || isAnalyzing
  const canAnalyze = state.status === 'uploaded' && medio !== '' && objetivo !== ''

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="reveal reveal-1">
        <h1 className="text-2xl font-semibold mb-1">Analizar creatividad</h1>
        <p className="text-sm text-muted-foreground">
          Sube una pieza publicitaria, elige el medio y el objetivo, y obtén el WOW Score.
        </p>
      </div>

      {/* ── Mensaje de suscripción requerida ── */}
      {!hasActiveOrTrial && (
        <div className="rounded-xl border bg-card p-8 flex flex-col items-center text-center space-y-4 reveal reveal-2 mt-8">
          <div className="bg-orange-500/10 p-4 rounded-full text-orange-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Suscripción requerida</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Necesitas una suscripción activa para utilizar la herramienta de análisis. Revisa nuestros planes para comenzar a obtener tu WOW Score.
          </p>
          <div className="pt-4">
            <Link href="/dashboard/pricing">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 py-2 h-auto">
                Ver planes y precios
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Mensaje Trial Consumido ── */}
      {isTrialExhausted && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 flex flex-col items-center text-center space-y-4 reveal reveal-2 mt-8">
          <div className="bg-primary/20 p-4 rounded-full text-primary mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Crédito de prueba consumido</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Esperamos que el resultado de tu análisis te haya sido muy útil. Para seguir obteniendo tu WOW Score, autoriza el cobro de tu plan.
          </p>
          <div className="pt-4">
            <Button 
              onClick={authorizeCharge} 
              disabled={isAuthorizing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-2 h-auto text-base font-semibold"
            >
              {isAuthorizing ? 'Autorizando...' : 'Autorizar Cobro'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Mensaje Créditos Mensuales Agotados ── */}
      {isMonthlyExhausted && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-8 flex flex-col items-center text-center space-y-4 reveal reveal-2 mt-8">
          <div className="bg-orange-500/20 p-4 rounded-full text-orange-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Créditos agotados</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Has consumido todos tus créditos para este ciclo. Tus créditos se restablecerán automáticamente en tu próxima fecha de facturación.
          </p>
        </div>
      )}

      {/* ── Mensaje Días de Prueba ── */}
      {subscriptionStatus === 'trialing' && trialCredits > 0 && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm flex gap-3 items-start reveal reveal-1 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p>
            Te quedan <strong>{trialDaysLeft} {trialDaysLeft === 1 ? 'día' : 'días'}</strong> de tu periodo de prueba.
            Si no utilizas tu crédito en este tiempo, se eliminará y se cobrará a tu tarjeta automáticamente.
          </p>
        </div>
      )}

      {/* ── Contadores de Créditos ── */}
      {hasActiveOrTrial && !hasNoCredits && (
        <div className="flex justify-center mb-4 reveal reveal-1">
          <div className="bg-muted px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground flex items-center gap-2 border shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {trialCredits > 0 
              ? `Crédito de prueba disponible: ${trialCredits}`
              : `Créditos mensuales: ${monthlyCredits}`
            }
          </div>
        </div>
      )}

      {/* ── Zona de drop (solo cuando no hay preview) ── */}
      {hasActiveOrTrial && !hasNoCredits && !preview && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={[
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed',
            'cursor-pointer py-14 px-6 text-center transition-colors select-none reveal reveal-2',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/40',
          ].join(' ')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div>
            <p className="text-sm font-medium">
              Arrastra tu imagen aquí o{' '}
              <span className="text-primary underline underline-offset-2">selecciona un archivo</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP · Máx. 5 MB</p>
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
            className="sr-only" onChange={handleInputChange} />
        </div>
      )}

      {/* ── Skeleton mientras analiza ── */}
      {isAnalyzing && preview && <AnalyzingSkeleton preview={preview} />}

      {/* ── Preview + controles (después de seleccionar) ── */}
      {preview && state.status !== 'done' && !isAnalyzing && (
        <div className="rounded-xl border overflow-hidden bg-card reveal reveal-2">
          {/* Imagen */}
          <div className="relative aspect-video bg-muted">
            <Image src={preview} alt="Preview" fill className="object-contain" unoptimized />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs text-muted-foreground">Subiendo imagen…</span>
                </div>
              </div>
            )}
          </div>

          {/* Dropdowns + botón */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Medio */}
              <div className="space-y-1">
                <label htmlFor="medio" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Medio
                </label>
                <select
                  id="medio"
                  value={medio}
                  onChange={(e) => setMedio(e.target.value as Medio)}
                  disabled={isBusy}
                  className={selectClass}
                >
                  <option value="" disabled>Selecciona…</option>
                  {MEDIOS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Objetivo */}
              <div className="space-y-1">
                <label htmlFor="objetivo" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Objetivo
                </label>
                <select
                  id="objetivo"
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value as Objetivo)}
                  disabled={isBusy}
                  className={selectClass}
                >
                  <option value="" disabled>Selecciona…</option>
                  {OBJETIVOS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset} disabled={isBusy} className="shrink-0">
                Cambiar imagen
              </Button>
              <Button
                variant="brand"
                className="flex-1"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isBusy}
              >
                {isAnalyzing
                  ? 'Analizando…'
                  : isUploading
                    ? 'Subiendo…'
                    : 'Analizar creatividad'}
              </Button>
            </div>

            {!canAnalyze && !isBusy && (
              <p className="text-xs text-muted-foreground text-center">
                Selecciona medio y objetivo para habilitar el análisis.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {state.status === 'error' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
          <p className="text-sm text-destructive flex-1">{state.message}</p>
          <button onClick={reset} className="text-xs text-destructive underline underline-offset-2 shrink-0">
            Reintentar
          </button>
        </div>
      )}

      {/* ── Resultados ── */}
      {state.status === 'done' && (
        <div className="space-y-4">
          {/* Imagen + score */}
          <div className="rounded-xl border overflow-hidden bg-card reveal reveal-1">
            <div className="relative aspect-video bg-muted">
              <Image src={preview || state.result.image_url} alt="Pieza analizada" fill className="object-contain" unoptimized />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {state.result.medio} · {OBJETIVOS.find(o => o.value === state.result.objetivo)?.label}
                </p>
                <p className="text-sm font-medium mt-0.5">Análisis completado</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary leading-none">
                  {Math.round(state.result.wow_score)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">WOW Score</p>
              </div>
            </div>
          </div>

          {/* Dimensiones */}
          <div className="rounded-xl border bg-card p-4 space-y-2 reveal reveal-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Dimensiones</p>
            {Object.entries(state.result.dimensiones).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs w-28 shrink-0 text-muted-foreground">{DIM_LABELS[key] ?? key}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-7 text-right">{val}</span>
              </div>
            ))}
          </div>

          {/* Fortalezas y oportunidades */}
          <div className="grid grid-cols-2 gap-4 reveal reveal-3">
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fortalezas</p>
              <ul className="space-y-1.5">
                {state.result.fortalezas.map((f, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Oportunidades</p>
              <ul className="space-y-1.5">
                {state.result.oportunidades.map((o, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-muted-foreground mt-0.5">↑</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Veredicto */}
          <div className="rounded-xl border bg-card p-4 space-y-1 reveal reveal-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Veredicto</p>
            <p className="text-sm leading-relaxed">{state.result.veredicto}</p>
          </div>

          <div className="reveal reveal-5">
            <Button variant="outline" className="w-full" onClick={reset}>
              Analizar otra pieza
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
