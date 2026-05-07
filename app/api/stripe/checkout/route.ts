import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, type StripePlan } from '@/lib/stripe'

const VALID_PLANS: StripePlan[] = ['solo_monthly', 'solo_annual', 'team_monthly', 'team_annual']

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { plan } = body as { plan: StripePlan }

  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Leer el stripe_price_id desde plan_prices para que los cambios del admin
  // se reflejen en el checkout sin redeployar.
  const { data: planPrice } = await createAdminClient()
    .from('plan_prices')
    .select('stripe_price_id')
    .eq('plan_key', plan)
    .eq('is_active', true)
    .single()

  if (!planPrice?.stripe_price_id) {
    return NextResponse.json({ error: 'Plan not available' }, { status: 400 })
  }

  const priceId = planPrice.stripe_price_id

  // Obtener el perfil y la company del usuario autenticado
  const { data: profile, error: profileError } = await createAdminClient()
    .from('profiles')
    .select('company_id, email, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: company, error: companyError } = await createAdminClient()
    .from('companies')
    .select('id, stripe_customer_id')
    .eq('id', profile.company_id)
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  // Crear o recuperar stripe_customer_id
  let customerId = company.stripe_customer_id as string | null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.full_name,
      metadata: { company_id: company.id },
    })
    customerId = customer.id

    await createAdminClient()
      .from('companies')
      .update({ stripe_customer_id: customerId })
      .eq('id', company.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { plan, company_id: company.id },
    },
    success_url: `${baseUrl}/dashboard?subscribed=true`,
    cancel_url: `${baseUrl}/dashboard/pricing`,
  })

  return NextResponse.json({ url: session.url })
}
