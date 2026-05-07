import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export type StripePlan =
  | 'solo_monthly'
  | 'solo_annual'
  | 'team_monthly'
  | 'team_annual'

export const PLAN_PRICE_MAP: Record<StripePlan, string> = {
  solo_monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY!,
  solo_annual: process.env.STRIPE_PRICE_SOLO_ANNUAL!,
  team_monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY!,
  team_annual: process.env.STRIPE_PRICE_TEAM_ANNUAL!,
}

export const PRICE_PLAN_MAP: Record<string, StripePlan> = Object.fromEntries(
  Object.entries(PLAN_PRICE_MAP).map(([plan, priceId]) => [priceId, plan as StripePlan])
)

export function maxMembersForPlan(plan: StripePlan): number {
  return plan.startsWith('team') ? 5 : 1
}
