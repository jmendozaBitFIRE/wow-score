import { CreativePreview } from '@/components/dashboard/CreativePreview'

const DIM_LABELS: Record<string, string> = {
  insight: 'Insight',
  claridad: 'Claridad',
  stopping: 'Stopping power',
  simplicidad: 'Simplicidad',
  pert: 'Pertinencia',
  adapt: 'Adaptabilidad',
  emocion: 'Emoción',
  recordacion: 'Recordación',
  estetica: 'Estética',
  relevancia: 'Relevancia',
}

const OBJETIVO_LABEL: Record<string, string> = { Promocion: 'Promoción' }
function label(key: string) { return OBJETIVO_LABEL[key] ?? key }

function scoreColor(score: number) {
  if (score >= 75) return 'text-green-600 dark:text-green-400'
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-destructive'
}

interface EvaluationResultCardProps {
  imageSrc: string
  isTextCreative: boolean
  medio: string
  objetivo: string
  score: number
  dimensiones: Record<string, number> | null
  fortalezas?: string[] | null
  oportunidades?: string[] | null
  veredicto?: string | null
}

// Bloque visual del resultado de un análisis — compartido entre la vista
// autenticada (/results/[id]) y la pública (/share/[id]).
export function EvaluationResultCard({
  imageSrc, isTextCreative, medio, objetivo, score, dimensiones, fortalezas, oportunidades, veredicto,
}: EvaluationResultCardProps) {
  return (
    <>
      {/* Imagen o guion + score */}
      <div className="rounded-xl border overflow-hidden bg-card reveal reveal-2">
        <div className="relative aspect-video bg-muted">
          <CreativePreview src={imageSrc} isText={isTextCreative} alt="Pieza analizada" />
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {medio} · {label(objetivo)}
            </p>
            <p className="text-sm font-medium mt-0.5">Análisis completado</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold leading-none ${scoreColor(score)}`}>
              {score}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">WOW Score</p>
          </div>
        </div>
      </div>

      {/* Dimensiones */}
      {dimensiones && (
        <div className="rounded-xl border bg-card p-4 space-y-2 reveal reveal-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Dimensiones</p>
          {Object.entries(dimensiones).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs w-28 shrink-0 text-muted-foreground">{DIM_LABELS[key] ?? key}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${val}%` }} />
              </div>
              <span className="text-xs font-medium w-7 text-right">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fortalezas y oportunidades */}
      {((fortalezas?.length ?? 0) > 0 || (oportunidades?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 reveal reveal-4">
          {fortalezas && fortalezas.length > 0 && (
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fortalezas</p>
              <ul className="space-y-1.5">
                {fortalezas.map((f, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {oportunidades && oportunidades.length > 0 && (
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Oportunidades</p>
              <ul className="space-y-1.5">
                {oportunidades.map((o, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-muted-foreground mt-0.5">↑</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Veredicto */}
      {veredicto && (
        <div className="rounded-xl border bg-card p-4 space-y-1 reveal reveal-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Veredicto</p>
          <p className="text-sm leading-relaxed">{veredicto}</p>
        </div>
      )}
    </>
  )
}
