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
  if (signUpError) return { error: signUpError.message }
  if (!data.user) return { error: 'No se pudo crear el usuario.' }

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
  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
