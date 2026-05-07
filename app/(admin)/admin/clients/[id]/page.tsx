import { createAdminClient } from '@/lib/supabase/admin'
import { setCompanyStatus } from '@/lib/actions/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Detalle de cliente — Admin WowScore' }

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  active:   { label: 'Activo',   classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  inactive: { label: 'Inactivo', classes: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  trialing: { label: 'Trial',    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  past_due: { label: 'Vencido',  classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const PLAN_LABELS: Record<string, string> = {
  solo_monthly: 'Solo Mensual',
  solo_annual:  'Solo Anual',
  team_monthly: 'Team Mensual',
  team_annual:  'Team Anual',
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: company }, { data: members }, { data: evaluations }] = await Promise.all([
    admin.from('companies').select('*').eq('id', id).single(),
    admin.from('profiles').select('id, full_name, email, role, created_at').eq('company_id', id).order('created_at'),
    admin.from('evaluations')
      .select('id, created_at, medio, objetivo, score_overall')
      .eq('company_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!company) notFound()

  const status = company.subscription_status ?? 'inactive'
  const badge = STATUS_LABELS[status] ?? STATUS_LABELS.inactive
  const isActive = status === 'active'

  const activateAction = setCompanyStatus.bind(null, company.id, 'active')
  const deactivateAction = setCompanyStatus.bind(null, company.id, 'inactive')

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'flex items-center gap-2')}>
          <ArrowLeft size={16} />
          Volver
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {/* Datos de la empresa */}
      <section className="rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Datos de la empresa</h2>
          <div className="flex gap-2">
            {isActive ? (
              <form action={deactivateAction}>
                <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                  Desactivar
                </Button>
              </form>
            ) : (
              <form action={activateAction}>
                <Button type="submit" variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950">
                  Activar
                </Button>
              </form>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Nombre</dt>
            <dd className="font-medium mt-0.5 dark:text-zinc-100">{company.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Plan</dt>
            <dd className="font-medium mt-0.5 dark:text-zinc-100">
              {company.subscription_plan ? PLAN_LABELS[company.subscription_plan] ?? company.subscription_plan : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Estado</dt>
            <dd className="mt-0.5">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                {badge.label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Stripe Customer ID</dt>
            <dd className="font-mono text-xs mt-0.5 text-zinc-600 dark:text-zinc-400 break-all">
              {company.stripe_customer_id ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Máx. miembros</dt>
            <dd className="font-medium mt-0.5 dark:text-zinc-100">{company.max_members}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Fecha de registro</dt>
            <dd className="font-medium mt-0.5 dark:text-zinc-100">
              {new Date(company.created_at).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </section>

      {/* Miembros */}
      <section className="rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Miembros ({members?.length ?? 0})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900">
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Nombre</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Email</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Rol</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Fecha de alta</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-zinc-800">
            {!members?.length && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Sin miembros</td>
              </tr>
            )}
            {members?.map((member) => (
              <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-3 font-medium dark:text-zinc-100">{member.full_name}</td>
                <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">{member.email}</td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    member.role === 'owner'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                  {new Date(member.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Últimas evaluaciones */}
      <section className="rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Últimas evaluaciones</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900">
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Fecha</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Medio</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Objetivo</th>
              <th className="text-right px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">WOW Score</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-zinc-800">
            {!evaluations?.length && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Sin evaluaciones</td>
              </tr>
            )}
            {evaluations?.map((ev) => (
              <tr key={ev.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                  {new Date(ev.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-3 uppercase text-xs font-medium tracking-wide dark:text-zinc-100">{ev.medio}</td>
                <td className="px-6 py-3 uppercase text-xs font-medium tracking-wide dark:text-zinc-100">{ev.objetivo}</td>
                <td className="px-6 py-3 text-right">
                  <span className="font-bold text-primary">{ev.score_overall ?? '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
