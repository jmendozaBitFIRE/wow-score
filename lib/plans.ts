import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

export interface PlanRow {
  plan_key: string
  display_name: string
  stripe_price_id: string
  max_members: number
  monthly_credits: number
  trial_credits: number
  billing_interval: string
  livemode: boolean
  is_active: boolean
}

const PLAN_COLUMNS =
  'plan_key, display_name, stripe_price_id, max_members, monthly_credits, trial_credits, billing_interval, livemode, is_active'

// Busca el plan por su plan_key (metadata de la suscripción) o, si no viene,
// por el Price ID de Stripe. Así el webhook funciona con cualquier precio que
// el admin haya importado, sin variables de entorno por plan.
export async function findPlan(
  admin: Admin,
  { planKey, priceId }: { planKey?: string | null; priceId?: string | null }
): Promise<PlanRow | null> {
  if (planKey) {
    const { data } = await admin.from('plan_prices').select(PLAN_COLUMNS).eq('plan_key', planKey).maybeSingle()
    if (data) return data as PlanRow
  }
  if (priceId) {
    const { data } = await admin.from('plan_prices').select(PLAN_COLUMNS).eq('stripe_price_id', priceId).limit(1).maybeSingle()
    if (data) return data as PlanRow
  }
  return null
}

export function isAnnualPlan(planKey: string | null | undefined): boolean {
  return !!planKey && planKey.includes('annual')
}

export function slugifyPlanKey(name: string, interval: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30) || 'plan'
  const suffix = interval === 'year' ? 'annual' : 'monthly'
  return base.endsWith(`_${suffix}`) ? base : `${base}_${suffix}`
}

// Textos del plan compartidos entre la landing y la página de precios del
// dashboard, para que siempre digan lo mismo.
export function planFeatures(monthlyCredits: number): string[] {
  return [
    `${monthlyCredits} evaluaciones WOW Score cada mes`,
    'Los 7 medios y 6 objetivos de campaña',
    'Target Fit Score por género, edad y NSE',
    'Historial de todas tus evaluaciones',
    'Comparte cualquier diagnóstico con un enlace',
  ]
}

// plan_key → nombre visible, para mostrar el plan de un cliente.
export async function getPlanNames(admin: Admin): Promise<Record<string, string>> {
  const { data } = await admin.from('plan_prices').select('plan_key, display_name')
  return Object.fromEntries((data ?? []).map((p) => [p.plan_key, p.display_name]))
}
