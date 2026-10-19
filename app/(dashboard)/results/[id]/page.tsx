import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DownloadPdfButton } from '@/components/dashboard/DownloadPdfButton'
import { EvaluationResultCard } from '@/components/dashboard/EvaluationResultCard'
import { VisibilityControl } from '@/components/dashboard/VisibilityControl'
import type { Visibility } from '@/lib/actions/evaluations'

export const metadata = { title: 'Resultado — WowScore' }

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ── 1. Auth ───────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // ── 2. Obtener company_id ─────────────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // ── 3. Cargar evaluación, restringida a la company ────────
  const { data: evaluation } = await admin
    .from('evaluations')
    .select('id, image_url, medio, objetivo, score_overall, scores_detail, feedback_json, created_at, profile_id, visibility, shared_team_id')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!evaluation) notFound()

  const isOwner = evaluation.profile_id === user.id

  if (!isOwner) {
    // Privado: solo quien lo hizo puede verlo, aunque sea de la misma empresa.
    if (evaluation.visibility === 'private') notFound()

    // Compartido con un equipo: solo quien esté en ESE equipo puede verlo.
    // Sin shared_team_id (p. ej. se borró el equipo) se trata como privado.
    if (evaluation.visibility === 'team') {
      if (!evaluation.shared_team_id) notFound()
      const { data: membership } = await admin
        .from('team_members')
        .select('team_id')
        .eq('team_id', evaluation.shared_team_id)
        .eq('profile_id', user.id)
        .maybeSingle()
      if (!membership) notFound()
    }
  }

  // Equipos de la compañía, para el selector de "compartir con un equipo".
  const { data: teams } = isOwner
    ? await admin.from('teams').select('id, name').eq('company_id', profile.company_id).order('name')
    : { data: null }

  let imageSrc = evaluation.image_url
  try {
    const filePath = new URL(evaluation.image_url).pathname.split('/ad-images/')[1]
    if (filePath) {
      imageSrc = `/api/image?path=${encodeURIComponent(filePath)}`
    }
  } catch {
    // If invalid URL, fallback to original
  }

  const feedback = evaluation.feedback_json as {
    veredicto?: string
    fortalezas?: string[]
    oportunidades?: string[]
  } | null

  const isTextCreative = /\.txt(\?|$)/i.test(evaluation.image_url)

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-4">
      {/* Header */}
      <div className="reveal reveal-1">
        <Link href="/dashboard/history" className="no-print text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Volver al historial
        </Link>
        <div className="flex items-start justify-between gap-3 mt-3 mb-1">
          <h1 className="text-2xl font-semibold">Resultado del análisis</h1>
          <DownloadPdfButton />
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(evaluation.created_at).toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {isOwner && (
        <div className="no-print rounded-xl border bg-card p-4 reveal reveal-1">
          <VisibilityControl
            evaluationId={evaluation.id}
            visibility={evaluation.visibility as Visibility}
            sharedTeamId={evaluation.shared_team_id}
            teams={teams ?? []}
          />
        </div>
      )}

      <EvaluationResultCard
        imageSrc={imageSrc}
        isTextCreative={isTextCreative}
        medio={evaluation.medio}
        objetivo={evaluation.objetivo}
        score={evaluation.score_overall ?? 0}
        dimensiones={evaluation.scores_detail as Record<string, number> | null}
        fortalezas={feedback?.fortalezas}
        oportunidades={feedback?.oportunidades}
        veredicto={feedback?.veredicto}
      />

      <div className="no-print reveal reveal-5">
        <Link
          href="/dashboard/upload"
          className="flex items-center justify-center w-full rounded-lg border px-4 py-3 sm:py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Analizar otra pieza
        </Link>
      </div>
    </div>
  )
}
