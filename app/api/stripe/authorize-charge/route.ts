import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Obtener el perfil y la company
  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: company } = await createAdminClient()
    .from('companies')
    .select('id, stripe_customer_id, subscription_status')
    .eq('id', profile.company_id)
    .single()

  if (!company || !company.stripe_customer_id) {
    return NextResponse.json({ error: 'Company or customer not found' }, { status: 404 })
  }

  if (company.subscription_status !== 'trialing') {
    return NextResponse.json({ error: 'No tienes un periodo de prueba activo para autorizar.' }, { status: 400 })
  }

  try {
    // Buscar la suscripción en trial del customer
    const subscriptions = await stripe.subscriptions.list({
      customer: company.stripe_customer_id,
      status: 'trialing',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'Suscripción no encontrada en Stripe.' }, { status: 404 })
    }

    const sub = subscriptions.data[0]

    // Actualizar la suscripción para terminar el trial inmediatamente
    await stripe.subscriptions.update(sub.id, {
      trial_end: 'now',
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error authorizing charge:', err)
    return NextResponse.json({ error: err.message || 'Error al procesar el cobro' }, { status: 500 })
  }
}
