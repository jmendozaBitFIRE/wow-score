'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// 'use server' solo permite exportar funciones async — este array y el tipo
// que deriva de él no pueden ser `export` directo desde aquí.
const VISIBILITIES = ['private', 'team', 'company', 'public'] as const
export type Visibility = typeof VISIBILITIES[number]

// Solo quien hizo el análisis controla su visibilidad — ni siquiera el owner
// de la empresa puede compartir el análisis privado de otra persona.
// `teamId` es obligatorio cuando visibility='team' y debe ser un equipo de la
// misma compañía que el análisis (si no, cualquiera podría apuntar a un
// equipo ajeno adivinando su id).
export async function updateVisibilityAction(
  evaluationId: string,
  visibility: Visibility,
  teamId?: string
): Promise<void> {
  if (!VISIBILITIES.includes(visibility)) {
    throw new Error('Visibilidad no válida.')
  }
  if (visibility === 'team' && !teamId) {
    throw new Error('Selecciona un equipo.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado.')

  const admin = createAdminClient()
  const { data: evaluation } = await admin
    .from('evaluations')
    .select('profile_id, company_id')
    .eq('id', evaluationId)
    .single()

  if (!evaluation || evaluation.profile_id !== user.id) {
    throw new Error('Solo quien hizo el análisis puede cambiar su visibilidad.')
  }

  let sharedTeamId: string | null = null
  if (visibility === 'team') {
    const { data: team } = await admin.from('teams').select('company_id').eq('id', teamId).single()
    if (!team || team.company_id !== evaluation.company_id) {
      throw new Error('Equipo no encontrado.')
    }
    sharedTeamId = teamId!
  }

  const { error } = await admin
    .from('evaluations')
    .update({ visibility, shared_team_id: sharedTeamId })
    .eq('id', evaluationId)
  if (error) throw new Error(error.message)

  revalidatePath(`/results/${evaluationId}`)
  revalidatePath('/dashboard/history')
  revalidatePath('/dashboard')
}
