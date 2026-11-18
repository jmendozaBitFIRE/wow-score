'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type ProfileState = { error?: string; success?: string } | undefined

// El nombre de la empresa no se edita aquí a propósito: se fija al registrarse.
export async function updateProfileNameAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const fullName = (formData.get('full_name') as string | null)?.trim() ?? ''
  if (fullName.length < 2) return { error: 'Escribe tu nombre (mínimo 2 caracteres).' }
  if (fullName.length > 100) return { error: 'El nombre es demasiado largo (máximo 100 caracteres).' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }

  const { error } = await createAdminClient()
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)
  if (error) return { error: 'No se pudo guardar tu nombre. Intenta de nuevo.' }

  revalidatePath('/dashboard', 'layout')
  return { success: 'Nombre actualizado.' }
}

export async function changePasswordAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const current = (formData.get('current_password') as string | null) ?? ''
  const next = (formData.get('new_password') as string | null) ?? ''
  const confirm = (formData.get('confirm_password') as string | null) ?? ''

  if (!current) return { error: 'Escribe tu contraseña actual.' }
  if (next.length < 6) return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
  if (next !== confirm) return { error: 'Las contraseñas nuevas no coinciden.' }
  if (next === current) return { error: 'La nueva contraseña debe ser diferente a la actual.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }

  // Confirmar la contraseña actual antes de cambiarla, para que una sesión
  // abierta en otra computadora no baste para tomar la cuenta.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  })
  if (signInError) return { error: 'Tu contraseña actual no es correcta.' }

  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('different') || msg.includes('same password')) {
      return { error: 'La nueva contraseña debe ser diferente a la actual.' }
    }
    if (msg.includes('weak') || msg.includes('at least')) {
      return { error: 'La contraseña es muy débil. Usa una más larga o con más variedad.' }
    }
    return { error: 'No se pudo cambiar la contraseña. Intenta de nuevo.' }
  }

  return { success: 'Contraseña actualizada.' }
}
