import type { createAdminClient } from '@/lib/supabase/admin'
import { teamsEnabled } from '@/lib/features'

type Admin = ReturnType<typeof createAdminClient>

// Filtro PostgREST .or() para listar evaluaciones: lo mío + lo compartido con
// la company + lo compartido con cualquier equipo al que pertenezca.
// Usado por history/page.tsx y el widget de "Análisis recientes" del dashboard.
export async function buildVisibilityOrFilter(admin: Admin, userId: string): Promise<string> {
  // Sin equipos cada quien solo ve lo suyo.
  if (!teamsEnabled()) return `profile_id.eq.${userId}`

  const { data: myTeams } = await admin.from('team_members').select('team_id').eq('profile_id', userId)
  const myTeamIds = (myTeams ?? []).map((t) => t.team_id)

  let orFilter = `profile_id.eq.${userId},visibility.eq.company`
  if (myTeamIds.length > 0) {
    orFilter += `,and(visibility.eq.team,shared_team_id.in.(${myTeamIds.join(',')}))`
  }
  return orFilter
}
