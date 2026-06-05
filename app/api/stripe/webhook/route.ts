import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, PRICE_PLAN_MAP, maxMembersForPlan, type StripePlan } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Stripe necesita el body sin parsear para validar la firma
export const dynamic = 'force-dynamic'

async function updateCompanySubscription(
  customerId: string,
  status: string,
  plan?: StripePlan,
  extraUpdates?: Record<string, unknown>
) {
  const update: Record<string, unknown> = { subscription_status: status, ...extraUpdates }
  if (plan) {
    update.subscription_plan = plan
    update.max_members = maxMembersForPlan(plan)
  }

  const { error } = await createAdminClient()
    .from('companies')
    .update(update)
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[webhook] supabase update error:', error.message)
  }
}

function resolvePlan(subscription: Stripe.Subscription): StripePlan | undefined {
  // Intentar desde metadata primero, luego desde el price ID
  const metaPlan = subscription.metadata?.plan as StripePlan | undefined
  if (metaPlan) return metaPlan

  const priceId = subscription.items.data[0]?.price?.id
  return priceId ? PRICE_PLAN_MAP[priceId] : undefined
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const plan = resolvePlan(sub)

      const stripeStatus = sub.status // 'active' | 'trialing' | 'past_due' | ...
      const dbStatus =
        stripeStatus === 'active'
          ? 'active'
          : stripeStatus === 'trialing'
            ? 'trialing'
            : stripeStatus === 'past_due'
              ? 'past_due'
              : 'inactive'

      const extraUpdates: Record<string, unknown> = {}
      if (event.type === 'customer.subscription.created' && dbStatus === 'trialing') {
        let trialToAssign = 1
        if (plan) {
          const { data: planData } = await createAdminClient()
            .from('plan_prices')
            .select('trial_credits')
            .eq('plan_key', plan)
            .single()
          if (planData) trialToAssign = planData.trial_credits
        }
        extraUpdates.trial_credits = trialToAssign
      }

      await updateCompanySubscription(customerId, dbStatus, plan, extraUpdates)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateCompanySubscription(sub.customer as string, 'inactive')
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id

      if (customerId) {
        await updateCompanySubscription(customerId, 'past_due')
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id

      if (customerId) {
        const subId = (invoice as any).subscription
        let isAnnual = false
        let planKey = ''
        if (typeof subId === 'string') {
          try {
            const sub = await stripe.subscriptions.retrieve(subId)
            const plan = resolvePlan(sub)
            if (plan) {
              planKey = plan
              if (plan.includes('annual')) isAnnual = true
            }
          } catch (e) {
            console.error('[webhook] Error retrieving subscription for invoice.paid:', e)
          }
        }

        let creditsToAssign = 10
        if (planKey) {
          const { data: planData } = await createAdminClient()
            .from('plan_prices')
            .select('monthly_credits')
            .eq('plan_key', planKey)
            .single()
          if (planData) creditsToAssign = planData.monthly_credits
        }

        const extraUpdates: Record<string, unknown> = { monthly_credits: creditsToAssign }
        
        if (isAnnual) {
          const nextMonth = new Date()
          nextMonth.setMonth(nextMonth.getMonth() + 1)
          extraUpdates.credits_reset_at = nextMonth.toISOString()
        } else {
          extraUpdates.credits_reset_at = null
        }

        // We don't change the plan here, just update credits and ensure status is active
        await updateCompanySubscription(customerId, 'active', undefined, extraUpdates)
      }
      break
    }

    default:
      // Ignorar eventos no relevantes
      break
  }

  return NextResponse.json({ received: true })
}
