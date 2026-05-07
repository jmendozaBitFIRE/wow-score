import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, ArrowRight, History, Sparkles, ImageOff } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Dashboard — WowScore' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: evaluations } = await createAdminClient()
    .from('evaluations')
    .select(`
      id,
      image_url,
      medio,
      objetivo,
      score_overall,
      created_at
    `)
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(3)

  const evaluationsWithImages = await Promise.all(
    (evaluations ?? []).map(async (ev) => {
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

  const stats = [
    { label: 'Evaluaciones totales', value: '12', icon: History },
    { label: 'Promedio WOW Score', value: '78', icon: Sparkles },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">¡Hola, {profile.full_name.split(' ')[0]}!</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Bienvenido de nuevo a tu panel de control de WowScore.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="col-span-1 md:col-span-2 relative overflow-hidden rounded-2xl p-8 text-white shadow-lg shadow-orange-500/20"
          style={{ background: 'var(--gradient-brand)' }}
        >
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-bold">Analiza tu próxima pieza</h2>
            <p className="text-white/80 max-w-sm">
              Sube una imagen publicitaria y obtén un análisis detallado basado en la fórmula WOW Score en segundos.
            </p>
            <Link href="/dashboard/upload" className={cn(buttonVariants(), 'bg-white text-orange-600 hover:bg-zinc-100 rounded-full px-6 flex items-center gap-2 shadow-sm')}>
              <Plus size={18} />
              Nuevo análisis
            </Link>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-15 transform translate-x-1/4 -translate-y-1/4">
             <Sparkles size={160} />
          </div>
        </div>

        <div className="rounded-2xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-sm">
          <div>
             <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Plan Actual</h3>
             <p className="text-sm text-zinc-500 mt-1">Plan Pro · Suscripción activa</p>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/pricing" className={cn(buttonVariants({ variant: 'outline' }), 'w-full rounded-full flex items-center justify-center gap-2 hover:border-orange-500 hover:text-orange-600')}>
              Gestionar plan
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Análisis recientes</h3>
          <Link href="/dashboard/history" className={cn(buttonVariants({ variant: 'ghost' }), 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex items-center gap-1 text-sm')}>
            Ver todo
            <ArrowRight size={14} />
          </Link>
        </div>

        {evaluationsWithImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {evaluationsWithImages.map((ev) => (
              <Link
                key={ev.id}
                href={`/results/${ev.id}`}
                className="group block rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {ev.signedUrl ? (
                    <Image
                      src={ev.signedUrl}
                      alt={ev.medio}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <ImageOff size={28} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-sm border border-orange-100">
                    <span className="text-sm font-bold text-orange-600">{ev.score_overall}</span>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase">WOW</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold truncate uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                    {ev.medio} · {ev.objetivo}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(ev.created_at).toLocaleDateString('es-MX', {
                      day: '2-digit', month: 'short'
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20">
            <History className="mx-auto text-zinc-300 dark:text-zinc-700" size={40} />
            <p className="text-zinc-500 dark:text-zinc-400">Aún no has realizado ningún análisis.</p>
            <Link href="/dashboard/upload" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full border-orange-200 text-orange-600 hover:bg-orange-50')}>
              Empezar ahora
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
