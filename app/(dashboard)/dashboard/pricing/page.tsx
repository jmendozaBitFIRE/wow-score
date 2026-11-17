'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { planFeatures } from '@/lib/plans'
import { usePlans, formatPlanPrice, planPeriod } from '@/components/pricing/usePlans'

export default function PricingPage() {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const router = useRouter()
  const { plans, loaded } = usePlans()

  const [activePlan, setActivePlan] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [isSubscribedQuery, setIsSubscribedQuery] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('subscribed') === 'true') {
        setIsSubscribedQuery(true)
      }
    }

    async function loadPricingData() {
      const supabase = createClient()

      // 2. Cargar estado de suscripción de la empresa del usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (profile?.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('subscription_plan, subscription_status')
            .eq('id', profile.company_id)
            .single()

          if (company) {
            setActivePlan(company.subscription_plan)
            setActiveStatus(company.subscription_status)
          }
        }
      }
    }

    loadPricingData()
  }, [])

  async function handleSubscribe(plan: string) {
    setLoadingPlan(plan)
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Error al iniciar el pago')
        if (data.url) router.push(data.url)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error inesperado')
      } finally {
        setLoadingPlan(null)
      }
    })
  }

  function handlePortal() {
    router.push('/dashboard/subscription')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {isSubscribedQuery && (
        <div className="mb-8 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">¡Suscripción completada con éxito!</p>
            <p className="text-sm opacity-90">Tu plan ya está activo y puedes empezar a disfrutar de todas las funcionalidades.</p>
          </div>
        </div>
      )}

      {activePlan && activeStatus === 'active' && (
        <div className="mb-8 p-4 rounded-xl border border-flame/30 bg-flame/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-flame/10 text-flame-text flex items-center justify-center shrink-0 w-9 h-9">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-white">Suscripción Activa</p>
              <p className="text-xs text-muted-foreground">Tienes contratado el plan <span className="font-bold text-foreground">{plans.find((p) => p.plan_key === activePlan)?.display_name ?? 'WOW Score'}</span>.</p>
            </div>
          </div>
          <button
            onClick={handlePortal}
            className="text-xs font-semibold text-flame-text hover:text-ink transition-colors"
          >
            Gestionar suscripción →
          </button>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Plan y precio</h1>
        <p className="text-muted-foreground">Un solo plan, todo incluido. Cancela cuando quieras.</p>
      </div>

      <div className={plans.length > 1 ? 'grid md:grid-cols-2 gap-6' : 'max-w-md mx-auto'}>
        {plans.map((plan) => {
          const isCurrentActive = activePlan === plan.plan_key && (activeStatus === 'active' || activeStatus === 'trialing')
          const isLoading = isPending && loadingPlan === plan.plan_key

          return (
            <div
              key={plan.plan_key}
              className={`rounded-xl border p-8 flex flex-col gap-6 relative transition ${
                isCurrentActive
                  ? 'border-flame bg-flame/5 shadow-lg shadow-flame/5 ring-1 ring-flame'
                  : 'bg-card border-flame/40'
              }`}
            >
              {isCurrentActive && (
                <div className="absolute -top-3 right-6 bg-flame text-on-flame text-xs font-bold tracking-[0.01em] px-3 py-1 rounded-full shadow-sm">
                  Plan Activo
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold">{plan.display_name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Para validar cada pieza antes de lanzarla
                </p>
              </div>

              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-bold tabular-nums">{formatPlanPrice(plan)}</span>
                <span className="text-muted-foreground mb-1">USD {planPeriod(plan)}</span>
              </div>

              <ul className="space-y-2 flex-1">
                {planFeatures(plan.monthly_credits).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-flame-text shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.plan_key)}
                disabled={isPending || isCurrentActive || !loaded}
                className={`w-full h-11 lg:h-9 ${
                  isCurrentActive
                    ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400'
                    : ''
                }`}
              >
                {isLoading ? 'Redirigiendo…' : isCurrentActive ? 'Plan actual' : 'Suscribirme'}
              </Button>

              {!isCurrentActive && (
                <p className="text-xs text-muted-foreground text-center -mt-2">
                  Incluye 5 días de prueba con {plan.trial_credits} {plan.trial_credits === 1 ? 'evaluación gratis' : 'evaluaciones gratis'}.
                  El cobro se hace solo al terminar la prueba, y puedes pagar antes si quieres.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Enlace a la pantalla de gestión local para owners con suscripción activa */}
      <div className="mt-10 text-center">
        <button
          onClick={handlePortal}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Gestionar suscripción existente →
        </button>
      </div>
    </div>
  )
}
