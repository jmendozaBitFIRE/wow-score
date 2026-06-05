'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { StripePlan } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    key: 'solo' as const,
    name: 'Solo',
    description: 'Para profesionales independientes.',
    maxMembers: 1,
    monthly: { plan: 'solo_monthly' as StripePlan, period: '/mes' },
    annual: { plan: 'solo_annual' as StripePlan, period: '/año' },
    features: ['1 usuario', 'Evaluaciones ilimitadas', 'Historial completo'],
  },
  {
    key: 'team' as const,
    name: 'Team',
    description: 'Para equipos creativos.',
    maxMembers: 5,
    monthly: { plan: 'team_monthly' as StripePlan, period: '/mes' },
    annual: { plan: 'team_annual' as StripePlan, period: '/año' },
    features: ['Hasta 5 usuarios', 'Evaluaciones ilimitadas', 'Historial completo', 'Panel de equipo'],
  },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [isPending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<StripePlan | null>(null)
  const router = useRouter()

  const [prices, setPrices] = useState<Record<StripePlan, string>>({
    solo_monthly: '$0',
    solo_annual: '$0',
    team_monthly: '$0',
    team_annual: '$0',
  })
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

      // 1. Cargar precios sincronizados dinámicamente desde Stripe y BD
      try {
        const res = await fetch('/api/stripe/prices')
        if (res.ok) {
          const data = await res.json()
          if (data.prices && data.prices.length > 0) {
            const newPrices = { ...prices }
            data.prices.forEach((p: any) => {
              const formatted = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: p.currency,
                maximumFractionDigits: 0
              }).format(Number(p.price_amount))
              newPrices[p.plan_key as StripePlan] = `${formatted} ${p.currency.toUpperCase()}`
            })
            setPrices(newPrices)
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic prices:', err)
      }

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

  async function handleSubscribe(plan: StripePlan) {
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
        alert(err instanceof Error ? err.message : 'Error inesperado')
      } finally {
        setLoadingPlan(null)
      }
    })
  }

  function handlePortal() {
    router.push('/dashboard/subscription')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
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
        <div className="mb-8 p-4 rounded-xl border border-orange-200 bg-orange-50/50 dark:border-orange-950/30 dark:bg-orange-950/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 w-9 h-9">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-white">Suscripción Activa</p>
              <p className="text-xs text-muted-foreground">Tienes contratado el plan <span className="font-bold capitalize text-foreground">{activePlan.replace('_', ' ')}</span>.</p>
            </div>
          </div>
          <button
            onClick={handlePortal}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
          >
            Gestionar suscripción →
          </button>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Planes y precios</h1>
        <p className="text-muted-foreground">Elige el plan que se adapta a tu equipo</p>

        {/* Toggle mensual / anual */}
        <div className="inline-flex items-center gap-2 mt-6 rounded-full border p-1 bg-muted">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              billing === 'monthly'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              billing === 'annual'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Anual
            <span className="ml-1.5 text-xs font-semibold text-primary">−17%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const option = plan[billing]
          const priceDisplay = prices[option.plan]
          const isCurrentActive = activePlan === option.plan && activeStatus === 'active'
          const isLoading = isPending && loadingPlan === option.plan

          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-8 flex flex-col gap-6 relative transition-all ${
                isCurrentActive
                  ? 'border-orange-500 bg-orange-50/5 dark:bg-orange-950/10 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500'
                  : 'bg-card'
              }`}
            >
              {isCurrentActive && (
                <div className="absolute -top-3 right-6 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Plan Activo
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">{priceDisplay}</span>
                <span className="text-muted-foreground mb-1">{option.period}</span>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
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
                onClick={() => handleSubscribe(option.plan)}
                disabled={isPending || isCurrentActive}
                className={`w-full ${
                  isCurrentActive
                    ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400'
                    : ''
                }`}
              >
                {isLoading ? 'Redirigiendo…' : isCurrentActive ? 'Plan actual' : 'Suscribirse'}
              </Button>
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
