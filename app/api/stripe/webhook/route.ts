import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPlan, isAnnualPlan, type PlanRow } from '@/lib/plans'

// Stripe necesita el body sin parsear para validar la firma
export const dynamic = 'force-dynamic'

async function updateCompanySubscription(
  customerId: string,
  status: string,
  plan?: PlanRow | null,
  extraUpdates?: Record<string, unknown>
) {
  const update: Record<string, unknown> = { subscription_status: status, ...extraUpdates }
  if (plan) {
    update.subscription_plan = plan.plan_key
    update.max_members = plan.max_members
  }

  const { error } = await createAdminClient()
    .from('companies')
    .update(update)
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[webhook] supabase update error:', error.message)
  }
}

// Intentar desde metadata primero, luego desde el price ID registrado en plan_prices.
function resolvePlan(subscription: Stripe.Subscription): Promise<PlanRow | null> {
  return findPlan(createAdminClient(), {
    planKey: subscription.metadata?.plan,
    priceId: subscription.items.data[0]?.price?.id,
  })
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
      const plan = await resolvePlan(sub)

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
      if (stripeStatus === 'trialing' && sub.trial_end) {
        extraUpdates.trial_end = new Date(sub.trial_end * 1000).toISOString()
      }

      if (event.type === 'customer.subscription.created' && dbStatus === 'trialing') {
        extraUpdates.trial_credits = plan?.trial_credits ?? 1
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
        // Desde la API 2025-03-31 la suscripción vive en invoice.parent; antes
        // estaba en invoice.subscription. Leer ambos para no perder el plan.
        const parentSub = invoice.parent?.subscription_details?.subscription
        const subId =
          (typeof parentSub === 'string' ? parentSub : parentSub?.id) ??
          (invoice as unknown as { subscription?: string | null }).subscription
        let plan: PlanRow | null = null
        if (typeof subId === 'string') {
          try {
            const sub = await stripe.subscriptions.retrieve(subId)
            
            // Si la suscripción está en trial, esta es una factura de $0. No debemos asignar créditos mensuales aún.
            if (sub.status === 'trialing') {
              return NextResponse.json({ received: true, ignored: 'trial_invoice' })
            }

            plan = await resolvePlan(sub)
          } catch (e) {
            console.error('[webhook] Error retrieving subscription for invoice.paid:', e)
          }
        }

        // Cada cobro reinicia los créditos al número del plan (no se acumulan).
        const creditsToAssign = plan?.monthly_credits ?? 10
        const extraUpdates: Record<string, unknown> = { monthly_credits: creditsToAssign }

        if (plan && (plan.billing_interval === 'year' || isAnnualPlan(plan.plan_key))) {
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
