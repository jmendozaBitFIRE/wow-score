import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

process.env.OPENAI_API_KEY ||= 'sk-test'
process.env.ANTHROPIC_API_KEY ||= 'sk-ant-test'

// The OpenAI/Anthropic SDKs capture `fetch` once at client-construction time
// (module load), so the mock must exist on `globalThis` *before* importing
// lib/ai-providers — reassigning global.fetch afterwards would not be seen.
const fetchMock = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch

const { callOpenAI, callClaude, parseModelJSON, InvalidModelResponseError } = await import('@/lib/ai-providers')

const ANALYSIS_JSON = {
  wow_score: 82,
  dimensiones: {
    insight: 8, claridad: 8, stopping: 8, simplicidad: 8, pert: 8,
    adapt: 8, emocion: 8, recordacion: 8, estetica: 8, relevancia: 8,
  },
  target_fit: {
    tono: 8, codigo_visual: 8, legibilidad: 8, motivador_psicologico: 8, relevancia_cultural: 8,
  },
  fortalezas: ['a', 'b', 'c'],
  oportunidades: ['x', 'y', 'z'],
  veredicto: 'Buen anuncio.',
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function openAIResponse(content: string) {
  return jsonResponse({
    id: 'chatcmpl-1',
    object: 'chat.completion',
    created: 0,
    model: 'gpt-4o',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
  })
}

function claudeResponse(text: string) {
  return jsonResponse({
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-6',
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  })
}

beforeEach(() => {
  fetchMock.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('parseModelJSON', () => {
  it('parsea JSON limpio', () => {
    const result = parseModelJSON(JSON.stringify(ANALYSIS_JSON))
    expect(result).toEqual(ANALYSIS_JSON)
  })

  it('parsea JSON envuelto en fences de markdown (```json ... ```)', () => {
    const raw = '```json\n' + JSON.stringify(ANALYSIS_JSON) + '\n```'
    const result = parseModelJSON(raw)
    expect(result).toEqual(ANALYSIS_JSON)
  })

  it('parsea JSON envuelto en fences genéricos (``` ... ```)', () => {
    const raw = '```\n' + JSON.stringify(ANALYSIS_JSON) + '\n```'
    const result = parseModelJSON(raw)
    expect(result).toEqual(ANALYSIS_JSON)
  })

  it('extrae el JSON cuando hay texto antes y después', () => {
    const raw = `Aquí está tu análisis:\n${JSON.stringify(ANALYSIS_JSON)}\nEspero que te sea útil.`
    const result = parseModelJSON(raw)
    expect(result).toEqual(ANALYSIS_JSON)
  })

  it('lanza InvalidModelResponseError con el rawText si el JSON está roto', () => {
    const raw = 'Lo siento, no puedo generar ese análisis en este momento.'
    expect(() => parseModelJSON(raw)).toThrow(InvalidModelResponseError)
    try {
      parseModelJSON(raw)
      expect.unreachable()
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidModelResponseError)
      expect((err as InstanceType<typeof InvalidModelResponseError>).rawText).toBe(raw)
    }
  })

  it('lanza InvalidModelResponseError si el JSON está truncado (sin cierre)', () => {
    const raw = '{"wow_score": 82, "dimensiones": {"insight": 8'
    expect(() => parseModelJSON(raw)).toThrow(InvalidModelResponseError)
  })
})

describe('callOpenAI', () => {
  it('retorna { score, breakdown, raw } parseando la respuesta de OpenAI', async () => {
    fetchMock.mockResolvedValueOnce(openAIResponse(JSON.stringify(ANALYSIS_JSON)))

    const result = await callOpenAI('system prompt', { kind: 'image', url: 'https://example.com/image.png' })

    expect(result.score).toBe(82)
    expect(result.breakdown).toEqual(ANALYSIS_JSON.dimensiones)
    expect(result.raw).toEqual(ANALYSIS_JSON)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('api.openai.com')
  })

  it('manda el guion como texto (sin image_url) cuando el input es kind:"text"', async () => {
    fetchMock.mockResolvedValueOnce(openAIResponse(JSON.stringify(ANALYSIS_JSON)))

    await callOpenAI('system prompt', { kind: 'text', content: 'GUION: hola mundo' })

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    const userContent = body.messages[1].content
    expect(userContent).toHaveLength(1)
    expect(userContent[0].type).toBe('text')
    expect(userContent[0].text).toContain('GUION: hola mundo')
    expect(JSON.stringify(userContent)).not.toContain('image_url')
  })

  it('activa response_format json_object en la petición', async () => {
    fetchMock.mockResolvedValueOnce(openAIResponse(JSON.stringify(ANALYSIS_JSON)))

    await callOpenAI('system prompt', { kind: 'image', url: 'https://example.com/image.png' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.response_format).toEqual({ type: 'json_object' })
  })

  it('pide suficientes tokens para no truncar 5 fortalezas + 5 oportunidades + veredicto largo', async () => {
    fetchMock.mockResolvedValueOnce(openAIResponse(JSON.stringify(ANALYSIS_JSON)))

    await callOpenAI('system prompt', { kind: 'image', url: 'https://example.com/image.png' })

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.max_tokens).toBeGreaterThanOrEqual(2000)
  })

  it('reintenta tras un primer intento con JSON inválido y devuelve bien en el segundo', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(openAIResponse('No puedo procesar esta imagen.'))
      .mockResolvedValueOnce(openAIResponse(JSON.stringify(ANALYSIS_JSON)))

    const promise = callOpenAI('system prompt', { kind: 'image', url: 'https://example.com/image.png' })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.score).toBe(82)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('propaga InvalidModelResponseError tras 3 intentos fallidos', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(openAIResponse('texto no json'))
      .mockResolvedValueOnce(openAIResponse('texto no json otra vez'))
      .mockResolvedValueOnce(openAIResponse('sigue sin ser json'))

    const promise = callOpenAI('system prompt', { kind: 'image', url: 'https://example.com/image.png' })
    // Adjunta el handler de rechazo antes de avanzar los timers falsos, para
    // que la promesa nunca quede "unhandled" mientras corre el backoff.
    const assertion = expect(promise).rejects.toThrow(InvalidModelResponseError)
    await vi.runAllTimersAsync()
    await assertion

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})

describe('callClaude', () => {
  it('retorna { score, breakdown, raw } parseando la respuesta de Claude', async () => {
    fetchMock.mockResolvedValueOnce(claudeResponse(JSON.stringify(ANALYSIS_JSON)))

    const result = await callClaude('system prompt', { kind: 'image', url: 'https://example.com/image.png' })

    expect(result.score).toBe(82)
    expect(result.breakdown).toEqual(ANALYSIS_JSON.dimensiones)
    expect(result.raw).toEqual(ANALYSIS_JSON)
    const claudeBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(claudeBody.max_tokens).toBeGreaterThanOrEqual(2000)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('api.anthropic.com')
  })

  it('reintenta tras un primer intento con JSON inválido y devuelve bien en el segundo', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(claudeResponse('No puedo procesar esta imagen.'))
      .mockResolvedValueOnce(claudeResponse(JSON.stringify(ANALYSIS_JSON)))

    const promise = callClaude('system prompt', { kind: 'image', url: 'https://example.com/image.png' })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.score).toBe(82)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('propaga InvalidModelResponseError tras 3 intentos fallidos, reforzando el prompt en cada reintento', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(claudeResponse('texto no json'))
      .mockResolvedValueOnce(claudeResponse('texto no json otra vez'))
      .mockResolvedValueOnce(claudeResponse('sigue sin ser json'))

    const promise = callClaude('system prompt', { kind: 'image', url: 'https://example.com/image.png' })
    const assertion = expect(promise).rejects.toThrow(InvalidModelResponseError)
    await vi.runAllTimersAsync()
    await assertion

    expect(fetchMock).toHaveBeenCalledTimes(3)

    // El 2do y 3er intento deben llevar el system prompt reforzado, una sola vez.
    const secondBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    const thirdBody = JSON.parse((fetchMock.mock.calls[2][1] as RequestInit).body as string)
    const reinforcementCount = (text: string) =>
      (text.match(/Responde ÚNICAMENTE con JSON válido/g) ?? []).length
    expect(reinforcementCount(secondBody.system)).toBe(1)
    expect(reinforcementCount(thirdBody.system)).toBe(1)
  })
})
