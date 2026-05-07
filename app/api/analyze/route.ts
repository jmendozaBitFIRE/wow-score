import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WOW_FORMULAS, type Medio, type Objetivo } from '@/lib/wow-formulas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MEDIOS: Medio[] = ['TV', 'Radio', 'OOH', 'DOOH', 'Digital', 'Impresos', 'Cine']
const OBJETIVOS: Objetivo[] = ['Branding', 'Ventas', 'Lanzamiento', 'Promocion', 'Informativo', 'BrandLove']

interface AnalyzeBody {
  image_url: string
  medio: Medio
  objetivo: Objetivo
}

interface Dimensiones {
  insight: number
  claridad: number
  stopping: number
  simplicidad: number
  pert: number
  adapt: number
  emocion: number
  recordacion: number
  estetica: number
  relevancia: number
}

interface OpenAIResult {
  wow_score: number
  dimensiones: Dimensiones
  fortalezas: [string, string, string]
  oportunidades: [string, string, string]
  veredicto: string
}

function buildSystemPrompt(medio: Medio, objetivo: Objetivo, formula: typeof WOW_FORMULAS[string]): string {
  const { bondad, pesos } = formula
  return `Eres un evaluador experto en creatividad publicitaria. \
Evalúa el anuncio usando la Fórmula WOW Score para ${medio} × ${objetivo}.
Bondad del medio: ${bondad}.

Evalúa cada dimensión de 0 a 100 con estos pesos exactos:
Insight ${pesos.insight}%, Claridad ${pesos.claridad}%, \
Stopping ${pesos.stopping}%, Simplicidad ${pesos.simplicidad}%,
Pertinencia ${pesos.pert}%, Adaptabilidad ${pesos.adapt}%,
Emoción ${pesos.emocion}%, Recordación ${pesos.recordacion}%,
Estética ${pesos.estetica}%, Relevancia ${pesos.relevancia}%.

El WOW Score final = suma de (score_dimension × peso/100).

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown:
{
  "wow_score": number,
  "dimensiones": {
    "insight": number, "claridad": number, "stopping": number,
    "simplicidad": number, "pert": number, "adapt": number,
    "emocion": number, "recordacion": number, "estetica": number,
    "relevancia": number
  },
  "fortalezas": [string, string, string],
  "oportunidades": [string, string, string],
  "veredicto": string
}`
}

export async function POST(request: Request) {
  // ── 1. Autenticación ──────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Verificar subscription activa ─────────────────────
  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: company } = await createAdminClient()
    .from('companies')
    .select('id, subscription_status')
    .eq('id', profile.company_id)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  if (company.subscription_status !== 'active') {
    return NextResponse.json(
      { error: 'Se requiere una suscripción activa para analizar imágenes.' },
      { status: 403 }
    )
  }

  // ── 3. Validar body ───────────────────────────────────────
  let body: AnalyzeBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const { image_url, medio, objetivo } = body

  if (!image_url || typeof image_url !== 'string') {
    return NextResponse.json({ error: 'image_url es requerido.' }, { status: 400 })
  }
  if (!MEDIOS.includes(medio)) {
    return NextResponse.json({ error: `Medio no válido. Valores: ${MEDIOS.join(', ')}` }, { status: 400 })
  }
  if (!OBJETIVOS.includes(objetivo)) {
    return NextResponse.json({ error: `Objetivo no válido. Valores: ${OBJETIVOS.join(', ')}` }, { status: 400 })
  }

  // ── 4. Seleccionar fórmula ────────────────────────────────
  const formulaKey = `${medio}_${objetivo}`
  const formula = WOW_FORMULAS[formulaKey]
  if (!formula) {
    return NextResponse.json(
      { error: 'Combinación medio/objetivo no válida' },
      { status: 400 }
    )
  }

  // ── 5. Generar signed URL para OpenAI ────────────────────
  const pathMatch = image_url.match(/\/object\/(?:public|sign)\/ad-images\/(.+)/)
  if (!pathMatch) {
    return NextResponse.json({ error: 'image_url con formato no reconocido.' }, { status: 400 })
  }
  const filePath = pathMatch[1].split('?')[0]

  const { data: signedData } = await createAdminClient()
    .storage
    .from('ad-images')
    .createSignedUrl(filePath, 60)

  if (!signedData?.signedUrl) {
    return NextResponse.json({ error: 'No se pudo generar signed URL para la imagen.' }, { status: 500 })
  }

  // ── 6. Llamar a OpenAI ────────────────────────────────────
  const systemPrompt = buildSystemPrompt(medio, objetivo, formula)

  let rawContent: string
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: signedData.signedUrl } },
            { type: 'text', text: 'Evalúa este anuncio.' },
          ],
        },
      ],
    })
    rawContent = completion.choices[0]?.message?.content ?? ''
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al llamar a OpenAI'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // ── 7. Parsear respuesta ──────────────────────────────────
  let result: OpenAIResult
  try {
    const clean = rawContent.replace(/```json|```/g, '').trim()
    result = JSON.parse(clean)
  } catch {
    return NextResponse.json(
      { error: 'La respuesta de OpenAI no es JSON válido.', raw: rawContent },
      { status: 502 }
    )
  }

  // ── 8. Guardar en evaluations ─────────────────────────────
  const { data: evaluation, error: dbError } = await createAdminClient()
    .from('evaluations')
    .insert({
      company_id: company.id,
      profile_id: user.id,
      image_url,
      medio,
      objetivo,
      score_overall: Math.round(result.wow_score),
      scores_detail: result.dimensiones,
      feedback_json: {
        veredicto: result.veredicto,
        fortalezas: result.fortalezas,
        oportunidades: result.oportunidades,
      },
    })
    .select('id, created_at')
    .single()

  if (dbError) {
    console.error('[analyze] db insert error:', dbError.message)
  }

  // ── 9. Responder (sin system prompt ni ponderaciones) ─────
  return NextResponse.json({
    id: evaluation?.id ?? null,
    medio,
    objetivo,
    wow_score: result.wow_score,
    dimensiones: result.dimensiones,
    fortalezas: result.fortalezas,
    oportunidades: result.oportunidades,
    veredicto: result.veredicto,
    image_url,
    created_at: evaluation?.created_at ?? new Date().toISOString(),
  })
}
