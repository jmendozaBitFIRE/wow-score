import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { EvaluationResultCard } from '@/components/dashboard/EvaluationResultCard'
import { DownloadPdfButton } from '@/components/dashboard/DownloadPdfButton'

export const metadata = { title: 'Análisis compartido — WowScore' }

// Página pública, sin auth — solo accesible si visibility='public'.
export default async function SharedResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const admin = createAdminClient()
  const { data: evaluation } = await admin
    .from('evaluations')
    .select('id, image_url, medio, objetivo, score_overall, scores_detail, feedback_json, created_at, visibility')
    .eq('id', id)
    .single()

  if (!evaluation || evaluation.visibility !== 'public') notFound()

  const isTextCreative = /\.txt(\?|$)/i.test(evaluation.image_url)
  const imageSrc = isTextCreative ? evaluation.image_url : `/api/share-image?evaluationId=${evaluation.id}`

  const feedback = evaluation.feedback_json as {
    veredicto?: string
    fortalezas?: string[]
    oportunidades?: string[]
  } | null

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-4">
      <div className="reveal reveal-1">
        <Link href="/" className="inline-block">
          <Image src="/logo-full.png" alt="WowScore" width={1025} height={503} className="h-7 w-auto" />
        </Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Análisis compartido</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(evaluation.created_at).toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex justify-end">
        <DownloadPdfButton />
      </div>

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
    </div>
  )
}
