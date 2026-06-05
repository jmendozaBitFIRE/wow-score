import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createAdminClient()
    const { data: dbPrices, error } = await supabase
      .from('plan_prices')
      .select('*')
      .eq('is_active', true)

    if (error || !dbPrices) {
      return NextResponse.json({ error: 'Error fetching prices' }, { status: 500 })
    }

    const updatedPrices = []

    for (const dbPrice of dbPrices) {
      if (dbPrice.stripe_price_id && dbPrice.stripe_price_id.startsWith('price_')) {
        try {
          const stripePrice = await stripe.prices.retrieve(dbPrice.stripe_price_id)
          if (stripePrice.unit_amount !== null) {
            const amount = stripePrice.unit_amount / 100
            
            // Si el precio en Stripe es diferente al de la BD, lo actualizamos
            if (amount !== Number(dbPrice.price_amount)) {
              await supabase
                .from('plan_prices')
                .update({ price_amount: amount, currency: stripePrice.currency })
                .eq('id', dbPrice.id)
              
              dbPrice.price_amount = amount
              dbPrice.currency = stripePrice.currency
            }
          }
        } catch (err) {
          console.error(`Error fetching stripe price ${dbPrice.stripe_price_id}:`, err)
        }
      }
      updatedPrices.push(dbPrice)
    }

    return NextResponse.json({ prices: updatedPrices })
  } catch (err) {
    console.error('Error in /api/stripe/prices:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
