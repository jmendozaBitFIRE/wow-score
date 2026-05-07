'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { StripePlan } from '@/lib/stripe'

const PLANS = [
  {
    key: 'solo' as const,
    name: 'Solo',
    description: 'Para profesionales independientes.',
    maxMembers: 1,
    monthly: { plan: 'solo_monthly' as StripePlan, price: '$19', period: '/mes' },
    annual: { plan: 'solo_annual' as StripePlan, price: '$190', period: '/año' },
    features: ['1 usuario', 'Evaluaciones ilimitadas', 'Historial completo'],
  },
  {
    key: 'team' as const,
    name: 'Team',
    description: 'Para equipos creativos.',
    maxMembers: 5,
    monthly: { plan: 'team_monthly' as StripePlan, price: '$49', period: '/mes' },
    annual: { plan: 'team_annual' as StripePlan, price: '$490', period: '/año' },
    features: ['Hasta 5 usuarios', 'Evaluaciones ilimitadas', 'Historial completo', 'Panel de equipo'],
  },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [isPending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<StripePlan | null>(null)
  const router = useRouter()

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

  async function handlePortal() {
    startTransition(async () => {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) router.push(data.url)
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
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
          const isLoading = isPending && loadingPlan === option.plan

          return (
            <div
              key={plan.key}
              className="rounded-xl border bg-card p-8 flex flex-col gap-6"
            >
              <div>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">{option.price}</span>
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
                disabled={isPending}
                className="w-full"
              >
                {isLoading ? 'Redirigiendo…' : 'Suscribirse'}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Enlace al portal de facturación para owners con suscripción activa */}
      <div className="mt-10 text-center">
        <button
          onClick={handlePortal}
          disabled={isPending}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors disabled:opacity-50"
        >
          Gestionar suscripción existente →
        </button>
      </div>
    </div>
  )
}
