import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Sirve el archivo de una evaluación SIN sesión, para /share/[id] — el bucket
// `ad-images` es privado, así que /api/image (que exige auth) no sirve aquí.
// Cada request revalida visibility='public' por su cuenta, sin confiar en
// que quien llama ya lo haya comprobado en la página.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const evaluationId = searchParams.get('evaluationId')

  if (!evaluationId) {
    return new NextResponse('evaluationId is required', { status: 400 })
  }

  const admin = createAdminClient()
  const { data: evaluation } = await admin
    .from('evaluations')
    .select('image_url, visibility')
    .eq('id', evaluationId)
    .single()

  if (!evaluation || evaluation.visibility !== 'public') {
    return new NextResponse('Not Found', { status: 404 })
  }

  let path: string | undefined
  try {
    path = new URL(evaluation.image_url).pathname.split('/ad-images/')[1]
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
  if (!path) return new NextResponse('Not Found', { status: 404 })

  const { data, error } = await admin.storage.from('ad-images').download(path)
  if (error || !data) return new NextResponse('Not Found', { status: 404 })

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
