import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Refresca la sesión si existe y la cierra
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  const baseUrl = new URL(request.url).origin
  return NextResponse.redirect(`${baseUrl}/login`, {
    status: 302,
  })
}
