import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Historial — WowScore' }

interface Evaluation {
  id: string
  image_url: string
  medio: string
  objetivo: string
  score_overall: number | null
  feedback_json: { veredicto?: string } | null
  created_at: string
  profiles: { full_name: string }[] | null
}

interface EvaluationWithImage extends Evaluation {
  signedUrl: string | null
}

const OBJETIVO_LABEL: Record<string, string> = {
  Promocion: 'Promoción',
}

function label(key: string) {
  return OBJETIVO_LABEL[key] ?? key
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-muted-foreground'
  if (score >= 75) return 'text-green-600 dark:text-green-400'
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-destructive'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function HistoryPage() {
  // ── 1. Sesión ─────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 2. Obtener company_id del profile autenticado ─────────
  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // ── 3. Consultar evaluations filtrando por company_id ──────
  const { data: evaluations } = await createAdminClient()
    .from('evaluations')
    .select(`
      id,
      image_url,
      medio,
      objetivo,
      score_overall,
      feedback_json,
      created_at,
      profiles ( full_name )
    `)
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (evaluations ?? []) as unknown as Evaluation[]

  // ── 4. Signed URLs en paralelo (1 hora) ───────────────────
  const rowsWithImages: EvaluationWithImage[] = await Promise.all(
    rows.map(async (ev) => {
      try {
        const filePath = new URL(ev.image_url).pathname.split('/ad-images/')[1]
        const { data } = await createAdminClient()
          .storage
          .from('ad-images')
          .createSignedUrl(filePath, 3600)
        return { ...ev, signedUrl: data?.signedUrl ?? null }
      } catch {
        return { ...ev, signedUrl: null }
      }
    })
  )

  // ── 5. Render ─────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 reveal reveal-1">
        <h1 className="text-2xl font-semibold mb-1">Historial de análisis</h1>
        <p className="text-sm text-muted-foreground">
          Todas las evaluaciones de tu empresa · {rowsWithImages.length} resultado{rowsWithImages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {rowsWithImages.length === 0 ? (
        <div className="rounded-xl border border-dashed flex flex-col items-center justify-center py-20 text-center reveal reveal-2">
          <p className="text-muted-foreground text-sm">Aún no hay evaluaciones registradas.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Sube una pieza en <span className="font-medium">Analizar creatividad</span> para comenzar.
          </p>
        </div>
      ) : (
        <div className="space-y-3 reveal reveal-2">
          {rowsWithImages.map((ev) => (
            <Link
              key={ev.id}
              href={`/results/${ev.id}`}
              className="rounded-xl border bg-card flex gap-4 p-4 items-start cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(29,29,27,0.10)] hover:-translate-y-0.5 hover:border-[var(--color-flame)] block"
            >
              {/* Thumbnail */}
              <div className="relative h-16 w-24 shrink-0 rounded-md overflow-hidden bg-muted">
                {ev.signedUrl ? (
                  <Image
                    src={ev.signedUrl}
                    alt="Pieza"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <ImageOff size={20} />
                  </div>
                )}
              </div>

              {/* Datos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                    {ev.medio}
                  </span>
                  <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                    {label(ev.objetivo)}
                  </span>
                  {ev.profiles?.[0]?.full_name && (
                    <span className="text-xs text-muted-foreground">
                      por {ev.profiles[0].full_name}
                    </span>
                  )}
                </div>

                {ev.feedback_json?.veredicto && (
                  <p className="text-sm mt-1.5 line-clamp-2 text-muted-foreground">
                    {ev.feedback_json.veredicto}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-1.5">
                  {formatDate(ev.created_at)}
                </p>
              </div>

              {/* Score */}
              <div className="shrink-0 text-right">
                <p className={`text-2xl font-bold leading-none ${scoreColor(ev.score_overall)}`}>
                  {ev.score_overall ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">WOW Score</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
