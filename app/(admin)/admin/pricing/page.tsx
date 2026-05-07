import { createAdminClient } from '@/lib/supabase/admin'
import { PlanPriceForm } from './_components/plan-price-form'
import { Tag } from 'lucide-react'

export const metadata = { title: 'Precios — Admin WowScore' }

const PLAN_DESCRIPTIONS: Record<string, string> = {
  solo_monthly: 'Un usuario · facturación mensual',
  solo_annual:  'Un usuario · facturación anual',
  team_monthly: 'Hasta 5 usuarios · facturación mensual',
  team_annual:  'Hasta 5 usuarios · facturación anual',
}

export default async function PricingAdminPage() {
  const { data: plans } = await createAdminClient()
    .from('plan_prices')
    .select('id, plan_key, display_name, price_amount, stripe_price_id, is_active, max_members, updated_at')
    .order('max_members')
    .order('stripe_price_id')

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Precios</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Gestiona los planes y sus Stripe Price IDs.
        </p>
      </div>

      {!plans?.length && (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <Tag className="mx-auto text-zinc-300" size={32} />
          <p className="text-zinc-500">No se encontraron planes en la base de datos.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border bg-white dark:bg-zinc-950 p-6 space-y-4 transition-opacity ${
              plan.is_active ? 'border-zinc-200 dark:border-zinc-800' : 'border-dashed opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold dark:text-zinc-100">{plan.display_name}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {PLAN_DESCRIPTIONS[plan.plan_key] ?? plan.plan_key}
                </p>
              </div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                plan.is_active
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
              }`}>
                {plan.plan_key}
              </span>
            </div>

            <PlanPriceForm plan={plan} />

            {plan.updated_at && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 pt-1">
                Actualizado: {new Date(plan.updated_at).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
