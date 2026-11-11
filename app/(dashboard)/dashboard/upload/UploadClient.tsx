'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnalyzingSkeleton } from '@/components/ui/AnalyzingSkeleton'
import { RatingWidget } from '@/components/dashboard/RatingWidget'
import { DownloadPdfButton } from '@/components/dashboard/DownloadPdfButton'
import { CreativePreview } from '@/components/dashboard/CreativePreview'
import { EvaluationResultCard } from '@/components/dashboard/EvaluationResultCard'
import type { Medio, Objetivo, Genero, Edad, NSE } from '@/lib/wow-formulas'

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

const GENEROS: { value: Genero; label: string }[] = [
  { value: 'Mujeres', label: 'Mujeres' },
  { value: 'Hombres', label: 'Hombres' },
]

const EDADES: { value: Edad; label: string }[] = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+', label: '55+' },
]

const NSES: { value: NSE; label: string }[] = [
  { value: 'ABC+', label: 'ABC+' },
  { value: 'C/C-', label: 'C / C-' },
  { value: 'D+/D', label: 'D+ / D' },
  { value: 'E', label: 'E' },
]

// ── Tipos ───────────────────────────────────────────────────
interface AnalyzeResult {
  id: string | null
  wow_score: number
  dimensiones: Record<string, number>
  target_fit?: { score?: number }
  fortalezas: string[]
  oportunidades: string[]
  veredicto: string
  sugerencia_alternativa?: string
  // Solo presentes en la respuesta cuando quien analiza es admin (ver /api/analyze).
  tokens?: { input: number; output: number }
  cost_usd?: number | null
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
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SCRIPT_TYPES = [
  'text/plain', 'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_TYPES = [...IMAGE_TYPES, ...SCRIPT_TYPES]
const MAX_BYTES = 5 * 1024 * 1024

const selectClass =
  'flex h-11 lg:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

// Opción tipo chip: el checkbox sigue siendo real (teclado y lector de pantalla);
// el chip entero es el objetivo táctil (44px en móvil).
const chipClass =
  'inline-flex min-h-11 lg:min-h-9 cursor-pointer items-center gap-2 rounded-full border border-ink/30 bg-card px-3 text-sm hover:border-ink/50 ' +
  'transition-colors has-[:checked]:border-flame has-[:checked]:bg-flame/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-flame/60 ' +
  'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50'
const checkClass = 'size-4 accent-flame'

// Grupo de checkboxes multi-selección + "Todas" — usado por Edad y NSE.
function MultiCheckboxGroup<T extends string>({
  label, options, selected, onChange, disabled,
}: {
  label: string
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (next: T[]) => void
  disabled?: boolean
}) {
  const allSelected = selected.length === options.length
  return (
    <fieldset className="space-y-1.5 min-w-0">
      <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-2">
        <label className={chipClass + ' font-medium'}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onChange(allSelected ? [] : options.map((o) => o.value))}
            disabled={disabled}
            className={checkClass}
          />
          Todas
        </label>
        {options.map((o) => (
          <label key={o.value} className={chipClass}>
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() =>
                onChange(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value])
              }
              disabled={disabled}
              className={checkClass}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
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
  const [genero, setGenero] = useState<Genero[]>([])
  const [edad, setEdad] = useState<Edad[]>([])
  const [nse, setNse] = useState<NSE[]>([])
  const [isTextFile, setIsTextFile] = useState(false)
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
      setState({ status: 'error', message: 'Formato no permitido. Usa JPG, PNG, WebP, o PDF/DOC/DOCX/TXT (guion).' })
      return
    }
    if (file.size > MAX_BYTES) {
      setState({ status: 'error', message: 'El archivo supera el límite de 5 MB.' })
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setIsTextFile(SCRIPT_TYPES.includes(file.type))
    setPreview(URL.createObjectURL(file))
    uploadFile(file)
  }

  // ── Género (multi-selección: Hombres, Mujeres o ambos) ────
  function toggleGenero(value: Genero) {
    setGenero((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    )
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
    if (state.status !== 'uploaded' || !medio || !objetivo || genero.length === 0 || edad.length === 0 || nse.length === 0) return
    const { imageUrl } = state
    setState({ status: 'analyzing' })

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, medio, objetivo, genero, edad, nse }),
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
    setIsTextFile(false)
    setMedio('')
    setObjetivo('')
    setGenero([])
    setEdad([])
    setNse([])
    setState({ status: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Helpers ───────────────────────────────────────────────
  const isUploading = state.status === 'uploading'
  const isAnalyzing = state.status === 'analyzing'
  const isBusy = isUploading || isAnalyzing
  const canAnalyze = state.status === 'uploaded' && medio !== '' && objetivo !== '' && genero.length > 0 && edad.length > 0 && nse.length > 0

  // Evita perder un análisis en curso por un cierre/recarga accidental de la pestaña.
  useEffect(() => {
    if (!isAnalyzing) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isAnalyzing])

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="reveal reveal-1">
        <h1 className="text-2xl font-semibold mb-1">Analizar creatividad</h1>
        <p className="text-sm text-muted-foreground">
          Sube una pieza publicitaria, elige el medio y el objetivo, y obtén el WOW Score.
        </p>
      </div>

      {/* ── Mensaje de suscripción requerida ── */}
      {!hasActiveOrTrial && (
        <div className="rounded-xl border bg-card p-8 flex flex-col items-center text-center space-y-4 reveal reveal-2 mt-8">
          <div className="bg-flame/10 p-4 rounded-full text-flame-text mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Suscripción requerida</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Necesitas una suscripción activa para utilizar la herramienta de análisis. Revisa nuestros planes para comenzar a obtener tu WOW Score.
          </p>
          <div className="pt-4">
            <Link href="/dashboard/pricing">
              <Button className="bg-flame hover:bg-flame-strong text-on-flame rounded-full px-8 py-3 sm:py-2 h-auto">
                Ver planes y precios
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Mensaje Trial Consumido ── */}
      {isTrialExhausted && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 flex flex-col items-center text-center space-y-4 reveal reveal-2 mt-8">
          <div className="bg-primary/20 p-4 rounded-full text-flame-text mb-2">
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
              className="bg-flame hover:bg-flame-strong text-on-flame rounded-full px-8 py-3 sm:py-2 h-auto text-base font-semibold"
            >
              {isAuthorizing ? 'Autorizando...' : 'Autorizar Cobro'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Mensaje Créditos Mensuales Agotados ── */}
      {isMonthlyExhausted && (
        <div className="rounded-xl border border-flame/20 bg-flame/5 p-8 flex flex-col items-center text-center space-y-4 reveal reveal-2 mt-8">
          <div className="bg-flame/20 p-4 rounded-full text-flame-text mb-2">
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
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-flame-text text-sm flex gap-3 items-start reveal reveal-1 shadow-sm">
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
            'has-[:focus-visible]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/60 has-[:focus-visible]:ring-offset-2',
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
              Arrastra tu imagen o guion aquí o{' '}
              <span className="text-flame-text underline underline-offset-2">selecciona un archivo</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, o PDF/DOC/DOCX/TXT (guion) · Máx. 5 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            aria-label="Seleccionar imagen o guion para analizar"
            accept={[...ALLOWED_TYPES, '.txt', '.pdf', '.doc', '.docx'].join(',')}
            className="sr-only"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* ── Skeleton mientras analiza ── */}
      {isAnalyzing && preview && <AnalyzingSkeleton preview={preview} isText={isTextFile} />}

      {/* ── Preview + controles (después de seleccionar) ── */}
      {preview && state.status !== 'done' && !isAnalyzing && (
        <div className="rounded-xl border overflow-hidden bg-card reveal reveal-2 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Imagen o guion */}
          <div className="relative aspect-video bg-muted lg:aspect-auto lg:min-h-[420px]">
            <CreativePreview src={preview} isText={isTextFile} alt="Preview" />
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
          <div className="p-4 lg:p-6 space-y-4 lg:border-l">
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

            <div className="rounded-xl border border-ink/20 bg-muted/40 p-3 sm:p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold">Target</p>
                <p className="text-xs text-muted-foreground">¿A quién va dirigida la pieza? Elige género, edad y NSE.</p>
              </div>
              {/* Género (multi-selección) */}
              <fieldset className="space-y-1.5 min-w-0">
                <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  Género
                </legend>
                <div className="flex flex-wrap gap-2">
                  {GENEROS.map((g) => (
                    <label key={g.value} className={chipClass}>
                      <input
                        type="checkbox"
                        checked={genero.includes(g.value)}
                        onChange={() => toggleGenero(g.value)}
                        disabled={isBusy}
                        className={checkClass}
                      />
                      {g.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Edad (multi-selección) */}
              <MultiCheckboxGroup
                label="Edad"
                options={EDADES}
                selected={edad}
                onChange={setEdad}
                disabled={isBusy}
              />

              {/* NSE (multi-selección) */}
              <MultiCheckboxGroup
                label="NSE"
                options={NSES}
                selected={nse}
                onChange={setNse}
                disabled={isBusy}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={reset} disabled={isBusy} className="h-11 lg:h-7 sm:shrink-0">
                Cambiar imagen
              </Button>
              <Button
                variant="brand"
                className="h-11 lg:h-8 sm:flex-1"
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
                Selecciona medio, objetivo y target (género, edad, NSE) para habilitar el análisis.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {state.status === 'error' && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
          <p className="text-sm text-destructive flex-1">{state.message}</p>
          <button type="button" onClick={reset} className="text-xs text-destructive underline underline-offset-2 shrink-0 min-h-11 px-2 -my-2 rounded focus-visible:outline-2 focus-visible:outline-destructive">
            Reintentar
          </button>
        </div>
      )}

      {/* ── Resultados ── */}
      {state.status === 'done' && (
        <div className="space-y-4">
          <div className="no-print flex justify-end reveal reveal-1">
            <DownloadPdfButton />
          </div>

          <EvaluationResultCard
            imageSrc={preview || state.result.image_url}
            isTextCreative={isTextFile}
            medio={state.result.medio}
            objetivo={state.result.objetivo}
            score={Math.round(state.result.wow_score)}
            dimensiones={state.result.dimensiones}
            targetFitScore={state.result.target_fit?.score}
            fortalezas={state.result.fortalezas}
            oportunidades={state.result.oportunidades}
            veredicto={state.result.veredicto}
            sugerenciaAlternativa={state.result.sugerencia_alternativa}
            costInfo={state.result.tokens
              ? { inputTokens: state.result.tokens.input, outputTokens: state.result.tokens.output, costUsd: state.result.cost_usd ?? null }
              : null}
          />

          {/* Calificación */}
          {state.result.id && (
            <div className="no-print flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 reveal reveal-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">¿Qué tan útil fue?</p>
              <RatingWidget evaluationId={state.result.id} />
            </div>
          )}

          <div className="no-print reveal reveal-5">
            <Button variant="outline" className="w-full" onClick={reset}>
              Analizar otra pieza
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
