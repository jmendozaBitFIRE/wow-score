'use client'

import { useEffect, useState } from 'react'

export interface PublicPlan {
  plan_key: string
  display_name: string
  price_amount: number
  currency: string
  monthly_credits: number
  trial_credits: number
  billing_interval: string
}

// Valor de respaldo mientras carga /api/stripe/prices (o si falla), con el
// plan vigente. El monto real siempre viene de Stripe.
export const FALLBACK_PLAN: PublicPlan = {
  plan_key: 'wow_score_monthly',
  display_name: 'WOW Score',
  price_amount: 8,
  currency: 'usd',
  monthly_credits: 100,
  trial_credits: 1,
  billing_interval: 'month',
}

export function formatPlanPrice(plan: PublicPlan): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: plan.currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: Number.isInteger(Number(plan.price_amount)) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(plan.price_amount))
}

export function planPeriod(plan: PublicPlan): string {
  return plan.billing_interval === 'year' ? '/año' : '/mes'
}

export function usePlans(): { plans: PublicPlan[]; loaded: boolean } {
  const [plans, setPlans] = useState<PublicPlan[]>([FALLBACK_PLAN])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stripe/prices')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.prices?.length) setPlans(data.prices)
      })
      .catch((err) => console.error('Error fetching prices:', err))
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { plans, loaded }
}
