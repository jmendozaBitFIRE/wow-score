'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function verifyAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')
  return user.id
}

export async function setCompanyStatus(companyId: string, status: string) {
  await verifyAdmin()
  await createAdminClient()
    .from('companies')
    .update({ subscription_status: status })
    .eq('id', companyId)
  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${companyId}`)
}

export async function updatePlanPrice(data: {
  id: string
  price_amount: number
  stripe_price_id: string
  is_active: boolean
}) {
  const userId = await verifyAdmin()
  await createAdminClient()
    .from('plan_prices')
    .update({
      price_amount: data.price_amount,
      stripe_price_id: data.stripe_price_id,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', data.id)
  revalidatePath('/admin/pricing')
}
