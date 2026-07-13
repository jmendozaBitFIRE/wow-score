import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WOW_FORMULAS, type Medio, type Objetivo } from '@/lib/wow-formulas'
import { callOpenAI, callClaude, InvalidModelResponseError, type AIProviderResult } from '@/lib/ai-providers'

const MEDIOS: Medio[] = ['TV', 'Radio', 'OOH', 'DOOH', 'Digital', 'Impresos', 'Cine']
const OBJETIVOS: Objetivo[] = ['Branding', 'Ventas', 'Lanzamiento', 'Promocion', 'Informativo', 'BrandLove']

interface AnalyzeBody {
  image_url: string
  medio: Medio
  objetivo: Objetivo
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
    .select('id, subscription_status, subscription_plan, trial_credits, monthly_credits, credits_reset_at')
    .eq('id', profile.company_id)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  if (company.subscription_status !== 'active' && company.subscription_status !== 'trialing') {
    return NextResponse.json(
      { error: 'Se requiere una suscripción activa o en periodo de prueba para analizar imágenes.' },
      { status: 403 }
    )
  }

  // Lazy reset de créditos para planes anuales
  let currentMonthlyCredits = company.monthly_credits
  let currentResetAt = company.credits_reset_at

  if (
    company.subscription_status === 'active' &&
    company.subscription_plan?.includes('annual') &&
    currentResetAt
  ) {
    const resetDate = new Date(currentResetAt)
    const now = new Date()

    if (now >= resetDate) {
      // Avanzar el mes
      resetDate.setMonth(resetDate.getMonth() + 1)
      currentResetAt = resetDate.toISOString()
      
      let creditsToReset = 10
      if (company.subscription_plan) {
        const { data: planData } = await createAdminClient()
          .from('plan_prices')
          .select('monthly_credits')
          .eq('plan_key', company.subscription_plan)
          .single()
        if (planData) creditsToReset = planData.monthly_credits
      }
      currentMonthlyCredits = creditsToReset

      await createAdminClient()
        .from('companies')
        .update({ monthly_credits: creditsToReset, credits_reset_at: currentResetAt })
        .eq('id', company.id)
    }
  }

  // Verificar si tiene créditos
  let consumeType: 'trial' | 'monthly' | null = null
  if (company.trial_credits > 0) {
    consumeType = 'trial'
  } else if (currentMonthlyCredits > 0) {
    consumeType = 'monthly'
  }

  if (!consumeType) {
    return NextResponse.json(
      { error: 'No tienes créditos disponibles.' },
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

  // ── 6. Llamar al proveedor de IA (A/B) ────────────────────
  const systemPrompt = buildSystemPrompt(medio, objetivo, formula)
  const provider: 'openai' | 'claude' = Math.random() < 0.5 ? 'openai' : 'claude'

  let result: AIProviderResult
  try {
    result = provider === 'openai'
      ? await callOpenAI(systemPrompt, signedData.signedUrl)
      : await callClaude(systemPrompt, signedData.signedUrl)
  } catch (err) {
    if (err instanceof InvalidModelResponseError) {
      // evaluationId: aún no existe — el fallo ocurre antes del insert en `evaluations`.
      console.error('[analyze] respuesta de IA no parseable como JSON tras reintentos', {
        provider,
        evaluationId: null,
        rawText: err.rawText,
      })
      return NextResponse.json(
        { error: 'El análisis falló, intenta de nuevo.' },
        { status: 502 }
      )
    }
    const message = err instanceof Error ? err.message : `Error al llamar a ${provider}`
    return NextResponse.json({ error: message }, { status: 502 })
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
      provider,
      score_overall: Math.round(result.score),
      scores_detail: result.breakdown,
      feedback_json: {
        veredicto: result.raw.veredicto,
        fortalezas: result.raw.fortalezas,
        oportunidades: result.raw.oportunidades,
      },
    })
    .select('id, created_at')
    .single()

  if (dbError) {
    console.error('[analyze] db insert error:', dbError.message)
  }

  // ── Descontar crédito ─────────────────────────────────────
  const updateData: Record<string, unknown> = {}
  if (consumeType === 'trial') {
    updateData.trial_credits = company.trial_credits - 1
    updateData.trial_used = true
  } else {
    updateData.monthly_credits = currentMonthlyCredits - 1
  }

  await createAdminClient()
    .from('companies')
    .update(updateData)
    .eq('id', company.id)

  // ── 9. Responder (sin system prompt ni ponderaciones) ─────
  return NextResponse.json({
    id: evaluation?.id ?? null,
    medio,
    objetivo,
    provider,
    wow_score: result.score,
    dimensiones: result.breakdown,
    fortalezas: result.raw.fortalezas,
    oportunidades: result.raw.oportunidades,
    veredicto: result.raw.veredicto,
    image_url,
    created_at: evaluation?.created_at ?? new Date().toISOString(),
  })
}
