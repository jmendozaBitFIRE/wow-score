'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AuthState = { error?: string } | undefined

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
}

function translateAuthError(errorMsg: string): string {
  const msg = errorMsg.toLowerCase()
  if (msg.includes('email not confirmed')) return 'Por favor, confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o spam.'
  if (msg.includes('invalid login credentials')) return 'El correo o la contraseña son incorrectos.'
  if (msg.includes('user already registered')) return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.'
  if (msg.includes('password should be at least')) return 'La contraseña es demasiado corta. Debe tener al menos 6 caracteres.'
  if (msg.includes('rate limit')) return 'Demasiados intentos. Por favor espera un momento y vuelve a intentarlo.'
  return errorMsg // Retorna el mensaje original si no coincide con ninguno
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = (formData.get('full_name') as string)?.trim()
  const companyName = (formData.get('company_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!fullName || !companyName || !email || !password) {
    return { error: 'Todos los campos son requeridos.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const supabase = await createClient()

  // 1. Crear usuario en Supabase Auth
  const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
  if (signUpError) return { error: translateAuthError(signUpError.message) }
  if (!data.user) return { error: 'No se pudo crear el usuario.' }

  // Supabase devuelve un usuario falso (identities = []) si el correo ya existe
  // Esto evita errores de "foreign key" al intentar insertar en perfiles con un ID irreal
  if (data.user.identities && data.user.identities.length === 0) {
    return { error: 'Este correo electrónico ya está registrado. Intenta iniciar sesión.' }
  }

  // 2. Insertar company (con createAdminClient(), usuario aún sin sesión activa)
  const { data: company, error: companyError } = await createAdminClient()
    .from('companies')
    .insert({ name: companyName, slug: slugify(companyName), max_members: 1 })
    .select('id')
    .single()

  if (companyError) return { error: companyError.message }

  // 3. Insertar profile (con createAdminClient())
  const { error: profileError } = await createAdminClient().from('profiles').insert({
    id: data.user.id,
    company_id: company.id,
    full_name: fullName,
    email,
    role: 'owner',
  })

  if (profileError) return { error: profileError.message }

  redirect('/login?registered=true')
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: translateAuthError(error.message) }

  redirect('/dashboard')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
