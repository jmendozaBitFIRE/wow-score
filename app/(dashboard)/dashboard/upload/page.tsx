import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { UploadClient } from './UploadClient'

export const metadata = { title: 'Analizar — WowScore' }

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener perfil y company_id del usuario
  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Obtener datos de la empresa para ver el estado de la suscripción
  const { data: company } = await createAdminClient()
    .from('companies')
    .select('subscription_status, trial_credits, monthly_credits')
    .eq('id', profile.company_id)
    .single()

  return <UploadClient 
    subscriptionStatus={company?.subscription_status || 'inactive'}
    trialCredits={company?.trial_credits || 0}
    monthlyCredits={company?.monthly_credits || 0}
  />
}
