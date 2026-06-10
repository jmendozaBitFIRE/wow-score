import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return new NextResponse('Path is required', { status: 400 })
  }

  // Verificar sesión
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Obtener el company_id del usuario para asegurar tenant isolation
  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return new NextResponse('Forbidden: Profile not found', { status: 403 })
  }

  // Validar que el archivo pertenezca al company_id del usuario actual
  // El formato del path es: company_id/user_id/timestamp-filename
  const expectedPrefix = `${profile.company_id}/`
  if (!path.startsWith(expectedPrefix)) {
    return new NextResponse('Forbidden: Cross-tenant access denied', { status: 403 })
  }

  // Descargar el binario directamente desde el bucket usando service_role
  const { data, error } = await createAdminClient()
    .storage
    .from('ad-images')
    .download(path)

  if (error || !data) {
    console.error('[api/image] Error downloading from storage:', error?.message)
    return new NextResponse('Not Found', { status: 404 })
  }

  // Devolver el binario al navegador con cabeceras para que cachee en el cliente
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
