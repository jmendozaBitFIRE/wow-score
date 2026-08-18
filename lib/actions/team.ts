'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getOrigin } from './auth'

export type InviteState = { error?: string; success?: string } | undefined

type Admin = ReturnType<typeof createAdminClient>

// Confirma que el usuario en sesión es owner y devuelve su company_id.
// Todas las acciones de equipo (invitar, quitar, reenviar) pasan por aquí.
async function requireOwner(admin: Admin): Promise<{ companyId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const { data: profile } = await admin
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { error: 'Solo el propietario de la empresa puede gestionar el equipo.' }
  }

  return { companyId: profile.company_id }
}

// Invita por email y crea el profile del nuevo miembro. Usado tanto por
// inviteMemberAction como por resendInviteAction (reenviar = borrar el
// invite viejo + invitar de nuevo con este mismo helper).
async function inviteAndCreateProfile(
  admin: Admin, email: string, companyId: string
): Promise<{ error: string } | { success: true }> {
  const origin = await getOrigin()
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (inviteError) {
    if (inviteError.message.toLowerCase().includes('already been registered')) {
      return { error: 'Este correo ya está registrado.' }
    }
    return { error: inviteError.message }
  }
  if (!invited.user) return { error: 'No se pudo invitar al usuario.' }

  const { error: profileError } = await admin.from('profiles').insert({
    id: invited.user.id,
    company_id: companyId,
    full_name: email,
    email,
    role: 'member',
  })

  if (profileError) return { error: profileError.message }
  return { success: true }
}

export async function inviteMemberAction(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email) return { error: 'El email es requerido.' }

  const admin = createAdminClient()
  const owner = await requireOwner(admin)
  if ('error' in owner) return owner

  const { data: company } = await admin
    .from('companies')
    .select('max_members')
    .eq('id', owner.companyId)
    .single()

  if (!company) return { error: 'Empresa no encontrada.' }

  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', owner.companyId)

  if ((count ?? 0) >= company.max_members) {
    return {
      error: `Tu plan permite hasta ${company.max_members} miembro${company.max_members === 1 ? '' : 's'}. Actualiza tu plan para añadir más.`,
    }
  }

  const result = await inviteAndCreateProfile(admin, email, owner.companyId)
  if ('error' in result) return result

  revalidatePath('/dashboard/team')
  return { success: `Invitación enviada a ${email}.` }
}

// Quita a un miembro (borra su auth user; el profile se borra en cascada).
// No permite quitar al propio owner.
export async function removeMemberAction(memberId: string): Promise<void> {
  const admin = createAdminClient()
  const owner = await requireOwner(admin)
  if ('error' in owner) throw new Error(owner.error)

  const { data: member } = await admin
    .from('profiles')
    .select('company_id, role')
    .eq('id', memberId)
    .single()

  if (!member || member.company_id !== owner.companyId) {
    throw new Error('Miembro no encontrado.')
  }
  if (member.role === 'owner') {
    throw new Error('No puedes quitar al propietario de la empresa.')
  }

  const { error } = await admin.auth.admin.deleteUser(memberId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/team')
}

// Reenvía una invitación pendiente: borra el auth user sin confirmar y
// vuelve a invitar el mismo email, lo que emite un link nuevo (el anterior
// pudo haber expirado — Supabase no ofrece un "resend" directo del link viejo).
export async function resendInviteAction(memberId: string): Promise<void> {
  const admin = createAdminClient()
  const owner = await requireOwner(admin)
  if ('error' in owner) throw new Error(owner.error)

  const { data: member } = await admin
    .from('profiles')
    .select('company_id, role, email')
    .eq('id', memberId)
    .single()

  if (!member || member.company_id !== owner.companyId) {
    throw new Error('Miembro no encontrado.')
  }
  if (member.role === 'owner') {
    throw new Error('El propietario no tiene invitación pendiente.')
  }

  const { data: authUser } = await admin.auth.admin.getUserById(memberId)
  if (authUser?.user?.email_confirmed_at) {
    throw new Error('Este miembro ya aceptó su invitación.')
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(memberId)
  if (deleteError) throw new Error(deleteError.message)

  const result = await inviteAndCreateProfile(admin, member.email, owner.companyId)
  if ('error' in result) throw new Error(result.error)

  revalidatePath('/dashboard/team')
}
