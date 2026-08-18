import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ponytail: 7 días de margen sobre la expiración del link de invite de
// Supabase (24h) — evita borrar invitaciones válidas por relojes/reintentos.
const PENDING_INVITE_TTL_DAYS = 7

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - PENDING_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: candidates, error } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'member')
    .lt('created_at', cutoff)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let deleted = 0
  for (const { id } of candidates ?? []) {
    const { data } = await admin.auth.admin.getUserById(id)
    if (data?.user && !data.user.email_confirmed_at) {
      await admin.auth.admin.deleteUser(id) // cascada: borra también el profile
      deleted++
    }
  }

  return NextResponse.json({ checked: candidates?.length ?? 0, deleted })
}
