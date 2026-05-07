import { createAdminClient } from '@/lib/supabase/admin'
import { setCompanyStatus } from '@/lib/actions/admin'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Building2, ExternalLink } from 'lucide-react'

export const metadata = { title: 'Clientes — Admin WowScore' }

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  active:   { label: 'Activo',    classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  inactive: { label: 'Inactivo',  classes: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  trialing: { label: 'Trial',     classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  past_due: { label: 'Vencido',   classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const PLAN_LABELS: Record<string, string> = {
  solo_monthly: 'Solo Mensual',
  solo_annual:  'Solo Anual',
  team_monthly: 'Team Mensual',
  team_annual:  'Team Anual',
}

export default async function ClientsPage() {
  const admin = createAdminClient()

  const { data: companies } = await admin
    .from('companies')
    .select('id, name, subscription_status, subscription_plan, max_members, created_at, profiles(id)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {companies?.length ?? 0} empresas registradas
        </p>
      </div>

      <div className="rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Empresa</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Plan</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Estado</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Miembros</th>
              <th className="text-left px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Fecha de registro</th>
              <th className="text-right px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-zinc-800">
            {!companies?.length && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  <Building2 className="mx-auto mb-2 text-zinc-300" size={32} />
                  No hay empresas registradas
                </td>
              </tr>
            )}
            {companies?.map((company) => {
              const status = company.subscription_status ?? 'inactive'
              const badge = STATUS_LABELS[status] ?? STATUS_LABELS.inactive
              const memberCount = Array.isArray(company.profiles) ? company.profiles.length : 0
              const isActive = status === 'active'

              const activateAction = setCompanyStatus.bind(null, company.id, 'active')
              const deactivateAction = setCompanyStatus.bind(null, company.id, 'inactive')

              return (
                <tr key={company.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium dark:text-zinc-100">{company.name}</td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    {company.subscription_plan ? PLAN_LABELS[company.subscription_plan] ?? company.subscription_plan : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    {memberCount} / {company.max_members}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    {new Date(company.created_at).toLocaleDateString('es-MX', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
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
                      <Link href={`/admin/clients/${company.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'flex items-center gap-1')}>
                        Ver detalle
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
