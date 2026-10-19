import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type Admin = ReturnType<typeof createAdminClient>

// Confirma que el usuario en sesión es owner y devuelve su company_id.
// Compartido por las Server Actions de miembros (team.ts) y equipos (teams.ts).
export async function requireOwner(admin: Admin): Promise<{ companyId: string } | { error: string }> {
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
