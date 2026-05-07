import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const BUCKET = 'ad-images'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Obtener profile y company
  const { data: profile, error: profileError } = await createAdminClient()
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: company, error: companyError } = await createAdminClient()
    .from('companies')
    .select('id, subscription_status')
    .eq('id', profile.company_id)
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  if (company.subscription_status !== 'active') {
    return NextResponse.json(
      { error: 'Se requiere una suscripción activa para subir imágenes.' },
      { status: 403 }
    )
  }

  // Leer el archivo del FormData
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Formato no permitido. Usa JPG, PNG o WebP.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'El archivo supera el límite de 5 MB.' },
      { status: 400 }
    )
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${company.id}/${user.id}/${timestamp}-${safeName}`

  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await createAdminClient().storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = createAdminClient().storage.from(BUCKET).getPublicUrl(storagePath)

  return NextResponse.json({ image_url: publicUrl })
}
