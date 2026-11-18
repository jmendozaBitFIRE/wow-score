import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, isStripeLiveMode } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// Planes públicos para la landing y /dashboard/pricing. Solo devuelve los
// activos del mismo modo (pruebas/producción) que la llave de Stripe, y toma
// el monto directo de Stripe para que nunca se desincronice.
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data: dbPrices, error } = await supabase
      .from('plan_prices')
      .select('id, plan_key, display_name, price_amount, currency, stripe_price_id, monthly_credits, trial_credits, billing_interval')
      .eq('is_active', true)
      .eq('livemode', isStripeLiveMode())
      .order('price_amount')

    if (error || !dbPrices) {
      return NextResponse.json({ error: 'Error fetching prices' }, { status: 500 })
    }

    const prices = await Promise.all(
      dbPrices.map(async (dbPrice) => {
        try {
          const stripePrice = await stripe.prices.retrieve(dbPrice.stripe_price_id)
          if (stripePrice.unit_amount !== null) {
            const amount = stripePrice.unit_amount / 100
            const interval = stripePrice.recurring?.interval ?? dbPrice.billing_interval
            if (
              amount !== Number(dbPrice.price_amount) ||
              stripePrice.currency !== dbPrice.currency ||
              interval !== dbPrice.billing_interval
            ) {
              await supabase
                .from('plan_prices')
                .update({ price_amount: amount, currency: stripePrice.currency, billing_interval: interval })
                .eq('id', dbPrice.id)
            }
            dbPrice.price_amount = amount
            dbPrice.currency = stripePrice.currency
            dbPrice.billing_interval = interval
          }
        } catch (err) {
          console.error(`Error fetching stripe price ${dbPrice.stripe_price_id}:`, err)
        }
        // El Price ID no se expone al cliente.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, stripe_price_id, ...publicFields } = dbPrice
        return publicFields
      })
    )

    return NextResponse.json({ prices })
  } catch (err) {
    console.error('Error in /api/stripe/prices:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
