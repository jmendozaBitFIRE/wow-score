import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar que el usuario sea 'owner' de su company
  const { data: profile, error: profileError } = await createAdminClient()
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.role !== 'owner') {
    return NextResponse.json(
      { error: 'Only owners can manage billing' },
      { status: 403 }
    )
  }

  const { data: company, error: companyError } = await createAdminClient()
    .from('companies')
    .select('stripe_customer_id')
    .eq('id', profile.company_id)
    .single()

  if (companyError || !company?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 404 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: `${baseUrl}/dashboard/pricing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
