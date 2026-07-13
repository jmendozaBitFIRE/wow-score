'use server'

import { createClient } from '@/lib/supabase/server'

export async function rateEvaluationAction(evaluationId: string, rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('El rating debe ser un entero entre 1 y 5.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Perfil no encontrado')

  const { error } = await supabase.from('evaluation_ratings').insert({
    evaluation_id: evaluationId,
    company_id: profile.company_id,
    user_id: user.id,
    rating,
  })

  if (error) throw new Error(error.message)
}
