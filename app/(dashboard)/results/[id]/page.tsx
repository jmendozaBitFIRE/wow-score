import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Resultado — WowScore' }

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

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ── 1. Auth ───────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 2. Obtener company_id ─────────────────────────────────
  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // ── 3. Cargar evaluación, restringida a la company ────────
  const { data: evaluation } = await createAdminClient()
    .from('evaluations')
    .select('id, image_url, medio, objetivo, score_overall, scores_detail, feedback_json, created_at')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!evaluation) notFound()

  // ── 4. Signed URL de la imagen (1 hora) ───────────────────
  const filePath = new URL(evaluation.image_url).pathname.split('/ad-images/')[1]
  const { data: signedData } = await createAdminClient()
    .storage
    .from('ad-images')
    .createSignedUrl(filePath, 3600)

  const imageSrc = signedData?.signedUrl ?? evaluation.image_url

  const feedback = evaluation.feedback_json as {
    veredicto?: string
    fortalezas?: string[]
    oportunidades?: string[]
  } | null

  const dimensiones = evaluation.scores_detail as Record<string, number> | null
  const score = evaluation.score_overall ?? 0

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-4">
      {/* Header */}
      <div className="reveal reveal-1">
        <Link href="/dashboard/history" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Volver al historial
        </Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Resultado del análisis</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(evaluation.created_at).toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Imagen + score */}
      <div className="rounded-xl border overflow-hidden bg-card reveal reveal-2">
        <div className="relative aspect-video bg-muted">
          <Image
            src={imageSrc}
            alt="Pieza analizada"
            fill
            className="object-contain"
          />
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {evaluation.medio} · {label(evaluation.objetivo)}
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
      {(feedback?.fortalezas || feedback?.oportunidades) && (
        <div className="grid grid-cols-2 gap-4 reveal reveal-4">
          {feedback.fortalezas && (
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fortalezas</p>
              <ul className="space-y-1.5">
                {feedback.fortalezas.map((f, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.oportunidades && (
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Oportunidades</p>
              <ul className="space-y-1.5">
                {feedback.oportunidades.map((o, i) => (
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
      {feedback?.veredicto && (
        <div className="rounded-xl border bg-card p-4 space-y-1 reveal reveal-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Veredicto</p>
          <p className="text-sm leading-relaxed">{feedback.veredicto}</p>
        </div>
      )}

      <div className="reveal reveal-5">
        <Link
          href="/dashboard/upload"
          className="flex items-center justify-center w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Analizar otra pieza
        </Link>
      </div>
    </div>
  )
}
