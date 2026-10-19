import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ImageOff, FileText, Lock, UsersRound, Building2, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildVisibilityOrFilter } from '@/lib/visibility'
import { getScriptExtension } from '@/lib/extract-text'
import type { Visibility } from '@/lib/actions/evaluations'

export const metadata = { title: 'Historial — WowScore' }

interface Evaluation {
  id: string
  image_url: string
  medio: string
  objetivo: string
  score_overall: number | null
  feedback_json: { veredicto?: string } | null
  created_at: string
  profile_id: string
  visibility: Visibility
  profiles: { full_name: string }[] | null
}

const VISIBILITY_ICON: Record<Visibility, typeof Lock> = {
  private: Lock,
  team: UsersRound,
  company: Building2,
  public: Globe,
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

  const admin = createAdminClient()

  // ── 2. Obtener company_id del profile autenticado ─────────
  const { data: profile } = await admin
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // ── 3. Consultar evaluations: lo mío + lo compartido con mi equipo/company ──
  const orFilter = await buildVisibilityOrFilter(admin, user.id)

  const { data: evaluations } = await admin
    .from('evaluations')
    .select(`
      id,
      image_url,
      medio,
      objetivo,
      score_overall,
      feedback_json,
      created_at,
      profile_id,
      visibility,
      profiles ( full_name )
    `)
    .eq('company_id', profile.company_id)
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (evaluations ?? []) as unknown as Evaluation[]

  // ── 4. Signed URLs en paralelo (1 hora) ───────────────────
  const rowsWithImages: EvaluationWithImage[] = rows.map((ev) => {
    try {
      const filePath = new URL(ev.image_url).pathname.split('/ad-images/')[1]
      return { ...ev, signedUrl: `/api/image?path=${encodeURIComponent(filePath)}` }
    } catch {
      return { ...ev, signedUrl: null }
    }
  })

  // ── 5. Render ─────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8 reveal reveal-1">
        <h1 className="text-2xl font-semibold mb-1">Historial de análisis</h1>
        <p className="text-sm text-muted-foreground">
          Tus análisis y los que tu equipo compartió · {rowsWithImages.length} resultado{rowsWithImages.length !== 1 ? 's' : ''}
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
              className="rounded-xl border bg-card flex gap-3 sm:gap-4 p-3 sm:p-4 items-start cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(29,29,27,0.10)] hover:-translate-y-0.5 hover:border-[var(--color-flame)] block"
            >
              {/* Thumbnail */}
              <div className="relative h-14 w-14 sm:h-16 sm:w-24 shrink-0 rounded-md overflow-hidden bg-muted">
                {ev.signedUrl && getScriptExtension(ev.image_url) !== null ? (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <FileText size={20} />
                  </div>
                ) : ev.signedUrl ? (
                  <Image
                    src={ev.signedUrl}
                    alt="Pieza"
                    fill
                    className="object-cover"
                    unoptimized
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
                  {(() => {
                    const VisIcon = VISIBILITY_ICON[ev.visibility]
                    return (
                      <span className="text-muted-foreground" title={`Visibilidad: ${ev.visibility}`}>
                        <VisIcon size={12} />
                      </span>
                    )
                  })()}
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
                <p className={`text-xl sm:text-2xl font-bold leading-none ${scoreColor(ev.score_overall)}`}>
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
