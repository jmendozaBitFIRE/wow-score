import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  WOW_FORMULAS, GLOSARIO, calcTargetFitScore, calcWTM, calcWowFinal,
  type Medio, type Objetivo, type Genero, type Edad, type NSE,
} from '@/lib/wow-formulas'
import { callOpenAI, callClaude, InvalidModelResponseError, type AIProviderResult } from '@/lib/ai-providers'

const MEDIOS: Medio[] = ['TV', 'Radio', 'OOH', 'DOOH', 'Digital', 'Impresos', 'Cine']
const OBJETIVOS: Objetivo[] = ['Branding', 'Ventas', 'Lanzamiento', 'Promocion', 'Informativo', 'BrandLove']
const GENEROS: Genero[] = ['Mujeres', 'Hombres']
const EDADES: Edad[] = ['18-24', '25-34', '35-44', '45-54', '55+']
const NSES: NSE[] = ['ABC+', 'C/C-', 'D+/D', 'E']

interface AnalyzeBody {
  image_url: string
  medio: Medio
  objetivo: Objetivo
  genero: Genero
  edad: Edad
  nse: NSE
}

function buildSystemPrompt(
  medio: Medio, objetivo: Objetivo, formula: typeof WOW_FORMULAS[string],
  genero: Genero, edad: Edad, nse: NSE
): string {
  const { bondad, pesos } = formula
  return `Eres un evaluador experto en creatividad publicitaria de una consultora internacional de innovación y branding. \
Evalúa el anuncio usando la Fórmula WOW Score para ${medio} × ${objetivo}.
Bondad del medio: ${bondad}.

Glosario oficial de variables — usa exclusivamente estas definiciones al calificar, ninguna variable puede evaluarse con un criterio distinto:
- Insight: ${GLOSARIO.insight}
- Claridad: ${GLOSARIO.claridad}
- Stopping: ${GLOSARIO.stopping}
- Simplicidad: ${GLOSARIO.simplicidad}
- Pertinencia: ${GLOSARIO.pert}
- Adaptación: ${GLOSARIO.adapt}
- Emoción: ${GLOSARIO.emocion}
- Recordación: ${GLOSARIO.recordacion}
- Estética: ${GLOSARIO.estetica}
- Relevancia: ${GLOSARIO.relevancia}

Evalúa cada dimensión de 0 a 100 con estos pesos exactos:
Insight ${pesos.insight}%, Claridad ${pesos.claridad}%, \
Stopping ${pesos.stopping}%, Simplicidad ${pesos.simplicidad}%,
Pertinencia ${pesos.pert}%, Adaptabilidad ${pesos.adapt}%,
Emoción ${pesos.emocion}%, Recordación ${pesos.recordacion}%,
Estética ${pesos.estetica}%, Relevancia ${pesos.relevancia}%.

El WOW Base Score = suma de (score_dimension × peso/100).

Target Fit (WTM 3.1) — el target de esta evaluación es: género ${genero}, edad ${edad}, NSE ${nse}.
Califica de 1 a 10 qué tan bien conecta la pieza con ESE target en estas 5 variables:
- Tono de Comunicación: ¿le habla en su idioma? ¿usa el tono correcto? ¿se siente aspiracional, cercano o confiable para ese target?
- Código Visual: ¿la imagen representa al target? ¿los colores y la estética generan conexión o se sienten familiares/aspiracionales para él?
- Legibilidad: ¿el tamaño de letra es adecuado? ¿hay demasiada información? ¿el contraste ayuda a leer rápido?
- Motivador Psicológico: ¿el mensaje activa los drivers típicos de ese NSE (ABC+: status/exclusividad/innovación/prestigio; C/C-: valor/familia/practicidad; D+/D: ahorro/necesidad/confianza; E: accesibilidad/seguridad/solución inmediata)?
- Relevancia Cultural: ¿se siente actual? ¿usa referencias culturales correctas para ese target? ¿habla desde su mundo?

Estandarización de resultados ejecutivos (obligatoria):
- "fortalezas": máximo 5, cada una específica, sustentada en los resultados, explicando por qué es ventaja competitiva. Lenguaje ejecutivo, estratégico, creativo y mercadológico. Nada genérico ni repetido.
- "oportunidades": máximo 5, cada una explicando el área de mejora con una recomendación concreta y accionable, priorizadas por impacto. Lenguaje técnico y estratégico. Nada superficial ni repetido.
- "veredicto": un único texto de 120 a 200 palabras que integre los resultados, explique el potencial real de la propuesta, identifique el principal diferenciador estratégico, señale el principal riesgo (si existe), establezca el nivel de madurez creativa, explique el potencial de impacto para audiencia y marca, y cierre con una recomendación clara de si está lista para implementarse o requiere optimización. Lenguaje de consultora internacional, sin ambigüedades ni repetir fortalezas/oportunidades.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown:
{
  "wow_score": number,
  "dimensiones": {
    "insight": number, "claridad": number, "stopping": number,
    "simplicidad": number, "pert": number, "adapt": number,
    "emocion": number, "recordacion": number, "estetica": number,
    "relevancia": number
  },
  "target_fit": {
    "tono": number, "codigo_visual": number, "legibilidad": number,
    "motivador_psicologico": number, "relevancia_cultural": number
  },
  "fortalezas": string[],
  "oportunidades": string[],
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

  const { image_url, medio, objetivo, genero, edad, nse } = body

  if (!image_url || typeof image_url !== 'string') {
    return NextResponse.json({ error: 'image_url es requerido.' }, { status: 400 })
  }
  if (!MEDIOS.includes(medio)) {
    return NextResponse.json({ error: `Medio no válido. Valores: ${MEDIOS.join(', ')}` }, { status: 400 })
  }
  if (!OBJETIVOS.includes(objetivo)) {
    return NextResponse.json({ error: `Objetivo no válido. Valores: ${OBJETIVOS.join(', ')}` }, { status: 400 })
  }
  if (!GENEROS.includes(genero)) {
    return NextResponse.json({ error: `Género no válido. Valores: ${GENEROS.join(', ')}` }, { status: 400 })
  }
  if (!EDADES.includes(edad)) {
    return NextResponse.json({ error: `Edad no válida. Valores: ${EDADES.join(', ')}` }, { status: 400 })
  }
  if (!NSES.includes(nse)) {
    return NextResponse.json({ error: `NSE no válido. Valores: ${NSES.join(', ')}` }, { status: 400 })
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
  const systemPrompt = buildSystemPrompt(medio, objetivo, formula, genero, edad, nse)
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

  // ── 7. Target Fit Multiplier (WTM 3.1) ────────────────────
  // El WOW Base Score (medio × objetivo) viene del modelo; el ajuste por
  // target es una tabla determinística, así que se calcula en servidor
  // en vez de confiar en la aritmética del modelo.
  const wowBaseScore = result.score
  const targetFitScore = calcTargetFitScore({
    tono: result.targetFit.tono,
    codigoVisual: result.targetFit.codigo_visual,
    legibilidad: result.targetFit.legibilidad,
    motivador: result.targetFit.motivador_psicologico,
    culturalRelevancia: result.targetFit.relevancia_cultural,
  })
  const wtm = calcWTM(targetFitScore)
  const wowFinal = calcWowFinal(wowBaseScore, wtm)

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
      score_overall: Math.round(wowFinal),
      scores_detail: result.breakdown,
      feedback_json: {
        veredicto: result.raw.veredicto,
        fortalezas: result.raw.fortalezas,
        oportunidades: result.raw.oportunidades,
        genero,
        edad,
        nse,
        wow_base_score: wowBaseScore,
        target_fit: { dimensiones: result.targetFit, score: targetFitScore, wtm },
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
    genero,
    edad,
    nse,
    provider,
    wow_score: wowFinal,
    wow_base_score: wowBaseScore,
    dimensiones: result.breakdown,
    target_fit: { dimensiones: result.targetFit, score: targetFitScore, wtm },
    fortalezas: result.raw.fortalezas,
    oportunidades: result.raw.oportunidades,
    veredicto: result.raw.veredicto,
    image_url,
    created_at: evaluation?.created_at ?? new Date().toISOString(),
  })
}
