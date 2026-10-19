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

const DUPLICATE_COMPANY_ERROR =
  'Ya existe una compañía registrada con este nombre. Si perteneces a ella, pide a tu administrador que te invite desde Equipo → Invitar miembro en vez de registrarte de nuevo.'

function translateAuthError(errorMsg: string): string {
  const msg = errorMsg.toLowerCase()
  if (msg.includes('email not confirmed')) return 'Por favor, confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o spam.'
  if (msg.includes('invalid login credentials')) return 'El correo o la contraseña son incorrectos.'
  if (msg.includes('user already registered')) return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.'
  if (msg.includes('password should be at least')) return 'La contraseña es demasiado corta. Debe tener al menos 6 caracteres.'
  if (msg.includes('rate limit')) return 'Demasiados intentos. Por favor espera un momento y vuelve a intentarlo.'
  if (msg.includes('should be different from the old password')) return 'La nueva contraseña debe ser diferente a la actual.'
  if (msg.includes('same password')) return 'La nueva contraseña debe ser diferente a la actual.'
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

  const slug = slugify(companyName)
  const admin = createAdminClient()

  // Verificar la compañía ANTES de crear el usuario de Auth. Si no, un choque
  // de slug (dos personas registrando el mismo nombre de compañía) deja un
  // auth.user huérfano sin profile ni company — atascado para siempre, porque
  // un reintento con el mismo correo dice "ya registrado" aunque nunca se
  // completó el registro. (Bug real: ya afectó cuentas en producción.)
  const { data: existingCompany } = await admin
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingCompany) {
    return { error: DUPLICATE_COMPANY_ERROR }
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

  // 2. Insertar company. Si falla (p. ej. condición de carrera: otro registro
  // tomó el mismo slug entre el check de arriba y este insert), hay que borrar
  // el auth.user recién creado para no dejarlo huérfano otra vez.
  const { data: company, error: companyError } = await admin
    .from('companies')
    .insert({ name: companyName, slug, max_members: 1 })
    .select('id')
    .single()

  if (companyError) {
    await admin.auth.admin.deleteUser(data.user.id)
    if (companyError.code === '23505') return { error: DUPLICATE_COMPANY_ERROR }
    return { error: companyError.message }
  }

  // 3. Insertar profile. Si falla, limpiar tanto el auth.user como la company
  // que se acaba de crear — ninguno de los dos debe quedar huérfano.
  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    company_id: company.id,
    full_name: fullName,
    email,
    role: 'owner',
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    await admin.from('companies').delete().eq('id', company.id)
    return { error: profileError.message }
  }

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

// Server Actions no tienen acceso directo a la URL del request; se deriva de
// los headers de forwarding. Se usa para construir redirectTo de Supabase Auth
// (reset de contraseña, invitación de miembros).
export async function getOrigin(): Promise<string> {
  const { headers } = await import('next/headers')
  const headersList = await headers()

  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const host = headersList.get('x-forwarded-host') || headersList.get('host')
  const derivedOrigin = host ? `${protocol}://${host}` : null

  return headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || derivedOrigin || 'http://localhost:3000'
}

export async function forgotPasswordAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim()
  if (!email) return { error: 'El email es requerido.' }

  const supabase = await createClient()
  const origin = await getOrigin()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) return { error: translateAuthError(error.message) }

  // Retornamos un "error" especial (o lo manejamos con otro type)
  // Pero lo más limpio es redirigir a una página de éxito, o retornar un objeto
  redirect('/forgot-password?success=true')
}

export async function updatePasswordAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get('password') as string
  if (!password || password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: translateAuthError(error.message) }

  redirect('/dashboard')
}
