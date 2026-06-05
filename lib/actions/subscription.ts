'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'

export async function cancelSubscriptionAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    throw new Error('Solo los propietarios de la cuenta de empresa pueden cancelar la suscripción.')
  }

  const { data: company } = await createAdminClient()
    .from('companies')
    .select('stripe_customer_id')
    .eq('id', profile.company_id)
    .single()

  if (!company?.stripe_customer_id) {
    throw new Error('No hay una suscripción activa.')
  }

  // Buscar suscripción activa en Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: company.stripe_customer_id,
    limit: 1,
    status: 'active'
  })

  if (subscriptions.data.length === 0) {
    throw new Error('No se encontró ninguna suscripción activa en Stripe.')
  }

  // Cancelar al final del período de facturación
  await stripe.subscriptions.update(subscriptions.data[0].id, {
    cancel_at_period_end: true
  })

  revalidatePath('/dashboard/subscription')
  revalidatePath('/dashboard/pricing')
}
