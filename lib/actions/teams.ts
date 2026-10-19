'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireOwner } from './require-owner'

export type TeamState = { error?: string; success?: string } | undefined

export async function createTeamAction(
  _prevState: TeamState,
  formData: FormData
): Promise<TeamState> {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'El nombre del equipo es requerido.' }

  const admin = createAdminClient()
  const owner = await requireOwner(admin)
  if ('error' in owner) return owner

  const { error } = await admin.from('teams').insert({ company_id: owner.companyId, name })

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un equipo con ese nombre.' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/team')
  return { success: `Equipo "${name}" creado.` }
}

export async function deleteTeamAction(teamId: string): Promise<void> {
  const admin = createAdminClient()
  const owner = await requireOwner(admin)
  if ('error' in owner) throw new Error(owner.error)

  const { data: team } = await admin.from('teams').select('company_id').eq('id', teamId).single()
  if (!team || team.company_id !== owner.companyId) {
    throw new Error('Equipo no encontrado.')
  }

  const { error } = await admin.from('teams').delete().eq('id', teamId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/team')
}

// Añade o quita a un miembro de un equipo. Verifica que tanto el equipo como
// el perfil pertenezcan a la compañía del owner que llama, para que nadie
// pueda meter/sacar gente de un equipo ajeno adivinando IDs.
export async function toggleTeamMemberAction(teamId: string, profileId: string, add: boolean): Promise<void> {
  const admin = createAdminClient()
  const owner = await requireOwner(admin)
  if ('error' in owner) throw new Error(owner.error)

  const [{ data: team }, { data: profile }] = await Promise.all([
    admin.from('teams').select('company_id').eq('id', teamId).single(),
    admin.from('profiles').select('company_id').eq('id', profileId).single(),
  ])

  if (!team || team.company_id !== owner.companyId) throw new Error('Equipo no encontrado.')
  if (!profile || profile.company_id !== owner.companyId) throw new Error('Miembro no encontrado.')

  if (add) {
    const { error } = await admin.from('team_members').insert({ team_id: teamId, profile_id: profileId })
    if (error && error.code !== '23505') throw new Error(error.message) // 23505: ya estaba, no pasa nada
  } else {
    const { error } = await admin.from('team_members').delete().eq('team_id', teamId).eq('profile_id', profileId)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard/team')
}
