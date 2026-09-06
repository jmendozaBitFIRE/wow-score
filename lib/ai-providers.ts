import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic()

export interface Dimensiones {
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

export interface TargetFitDimensiones {
  tono: number
  codigo_visual: number
  legibilidad: number
  motivador_psicologico: number
  relevancia_cultural: number
}

export interface ParsedAnalysis {
  wow_score: number
  dimensiones: Dimensiones
  target_fit: TargetFitDimensiones
  fortalezas: string[]
  oportunidades: string[]
  veredicto: string
}

export interface AIProviderResult {
  score: number
  breakdown: Dimensiones
  targetFit: TargetFitDimensiones
  raw: ParsedAnalysis
}

// La pieza a evaluar es una imagen (la mayoría de medios) o un guion de
// texto (audio/radio, donde no hay nada que "ver").
export type CreativeInput = { kind: 'image'; url: string } | { kind: 'text'; content: string }

function creativeUserContent(input: CreativeInput) {
  if (input.kind === 'text') {
    return [{ type: 'text' as const, text: `Evalúa este guion/spot de audio:\n\n${input.content}` }]
  }
  return [
    { type: 'image_url' as const, image_url: { url: input.url } },
    { type: 'text' as const, text: 'Evalúa este anuncio.' },
  ]
}

function creativeClaudeContent(input: CreativeInput) {
  if (input.kind === 'text') {
    return [{ type: 'text' as const, text: `Evalúa este guion/spot de audio:\n\n${input.content}` }]
  }
  return [
    { type: 'image' as const, source: { type: 'url' as const, url: input.url } },
    { type: 'text' as const, text: 'Evalúa este anuncio.' },
  ]
}

export class InvalidModelResponseError extends Error {
  readonly rawText: string

  constructor(rawText: string) {
    super('El modelo no devolvió un JSON válido.')
    this.name = 'InvalidModelResponseError'
    this.rawText = rawText
  }
}

function stripMarkdownFences(text: string): string {
  return text.replace(/```(?:json)?/gi, '').trim()
}

export function parseModelJSON(rawText: string): ParsedAnalysis {
  const clean = stripMarkdownFences(rawText)

  try {
    return JSON.parse(clean)
  } catch {
    // sigue abajo con el fallback de substring
  }

  // El modelo pudo haber devuelto texto antes/después del JSON (o truncado).
  // Reintenta con el substring entre la primera '{' y la última '}'.
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(clean.slice(start, end + 1))
    } catch {
      // sigue abajo
    }
  }

  throw new InvalidModelResponseError(rawText)
}

const JSON_ONLY_INSTRUCTION = 'Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.'
const RETRY_DELAYS_MS = [500, 1500]

function reinforceJsonInstruction(systemPrompt: string): string {
  if (systemPrompt.includes(JSON_ONLY_INSTRUCTION)) return systemPrompt
  return `${systemPrompt}\n\n${JSON_ONLY_INSTRUCTION}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Reintenta la llamada completa al modelo (no solo el parseo) hasta agotar
// RETRY_DELAYS_MS — 3 intentos totales, reforzando el prompt tras cada fallo.
async function callWithJsonRetry(
  systemPrompt: string,
  callModel: (systemPrompt: string) => Promise<string>
): Promise<ParsedAnalysis> {
  let prompt = systemPrompt

  for (let attempt = 0; ; attempt++) {
    const rawText = await callModel(prompt)
    try {
      return parseModelJSON(rawText)
    } catch (err) {
      if (!(err instanceof InvalidModelResponseError) || attempt >= RETRY_DELAYS_MS.length) {
        throw err
      }
      prompt = reinforceJsonInstruction(prompt)
      await sleep(RETRY_DELAYS_MS[attempt])
    }
  }
}

// La estandarización de resultados (hasta 5 fortalezas + 5 oportunidades muy
// detalladas + veredicto de 120-200 palabras) puede superar fácilmente los
// 800 tokens que bastaban con el formato viejo (3 items cortos) — con ese
// límite la respuesta se corta a mitad de un string y el JSON queda inválido,
// y los reintentos no ayudan porque repiten el mismo max_tokens.
const MAX_OUTPUT_TOKENS = 2000

export async function callOpenAI(systemPrompt: string, input: CreativeInput): Promise<AIProviderResult> {
  const parsed = await callWithJsonRetry(systemPrompt, async (prompt) => {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: creativeUserContent(input) },
      ],
    })
    return completion.choices[0]?.message?.content ?? ''
  })
  return { score: parsed.wow_score, breakdown: parsed.dimensiones, targetFit: parsed.target_fit, raw: parsed }
}

export async function callClaude(systemPrompt: string, input: CreativeInput): Promise<AIProviderResult> {
  const parsed = await callWithJsonRetry(systemPrompt, async (prompt) => {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: MAX_OUTPUT_TOKENS,
      system: prompt,
      messages: [
        { role: 'user', content: creativeClaudeContent(input) },
      ],
    })
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    return textBlock?.text ?? ''
  })
  return { score: parsed.wow_score, breakdown: parsed.dimensiones, targetFit: parsed.target_fit, raw: parsed }
}
