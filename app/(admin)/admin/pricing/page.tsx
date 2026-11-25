import { createAdminClient } from '@/lib/supabase/admin'
import { isStripeLiveMode } from '@/lib/stripe'
import { PlanPriceForm } from './_components/plan-price-form'
import { ImportStripePrices } from './_components/import-stripe-prices'
import { Tag } from '@phosphor-icons/react/ssr'
import { ProductTour } from '@/components/tour/ProductTour'

export const metadata = { title: 'Precios — Admin WowScore' }
export const dynamic = 'force-dynamic'

const TOUR_STEPS = [
  { selector: '[data-tour="admin-pricing-title"]', title: 'Precios', description: 'Administra qué planes de Stripe se muestran a los clientes, en la landing y en Planes y Precios.' },
  { selector: '[data-tour="admin-pricing-import"]', title: 'Importar desde Stripe', description: 'Trae un precio ya creado en Stripe para poder mostrarlo y editarlo aquí.' },
  { selector: '[data-tour="admin-pricing-plans"]', title: 'Planes', description: 'Cada tarjeta es un plan: su precio viene de Stripe, y aquí ajustas nombre, créditos y si está activo.' },
]

function formatPrice(amount: number, currency: string, interval: string) {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(Number(amount))
  return `${formatted} ${currency.toUpperCase()} / ${interval === 'year' ? 'año' : 'mes'}`
}

export default async function PricingAdminPage() {
  const liveMode = isStripeLiveMode()
  const { data: plans } = await createAdminClient()
    .from('plan_prices')
    .select('id, plan_key, display_name, price_amount, currency, stripe_price_id, is_active, monthly_credits, trial_credits, billing_interval, livemode, updated_at')
    .order('is_active', { ascending: false })
    .order('updated_at', { ascending: false })

  // Los precios del otro modo de Stripe no se pueden cobrar con la llave
  // actual; se listan aparte para no confundirlos con los vigentes.
  const current = (plans ?? []).filter((p) => p.livemode === liveMode)
  const otherMode = (plans ?? []).filter((p) => p.livemode !== liveMode)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div data-tour="admin-pricing-title" className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Precios</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Los planes visibles aparecen en la landing y en Planes y Precios. El monto se toma de Stripe.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1 border border-zinc-200 dark:border-zinc-800">
            <span aria-hidden className={`h-2 w-2 rounded-full ${liveMode ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            Stripe en {liveMode ? 'producción' : 'modo de pruebas'}
          </p>
        </div>
        <ProductTour tourId="admin-pricing" steps={TOUR_STEPS} />
      </div>

      <div data-tour="admin-pricing-import">
        <ImportStripePrices liveMode={liveMode} />
      </div>

      {!current.length && (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <Tag className="mx-auto text-zinc-300" size={32} />
          <p className="text-zinc-500">
            Aún no hay planes de {liveMode ? 'producción' : 'pruebas'}. Importa uno desde Stripe.
          </p>
        </div>
      )}

      <div data-tour="admin-pricing-plans" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {current.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border bg-white dark:bg-zinc-950 p-4 sm:p-6 space-y-4 min-w-0 transition-opacity ${
              plan.is_active ? 'border-zinc-200 dark:border-zinc-800' : 'border-dashed opacity-70'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <p className="text-2xl font-bold tabular-nums dark:text-zinc-100">
                {formatPrice(plan.price_amount, plan.currency, plan.billing_interval)}
              </p>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 break-all">{plan.stripe_price_id}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Clave: {plan.plan_key}</p>
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

      {otherMode.length > 0 && (
        <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
          <summary className="cursor-pointer text-sm font-semibold dark:text-zinc-200">
            Planes de {liveMode ? 'pruebas' : 'producción'} ({otherMode.length}) · no se muestran con la llave actual
          </summary>
          <ul className="mt-4 space-y-2 text-sm">
            {otherMode.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 text-zinc-600 dark:text-zinc-400">
                <span>{p.display_name} · {p.monthly_credits} evaluaciones/mes</span>
                <span className="font-mono text-xs break-all">{p.stripe_price_id}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
