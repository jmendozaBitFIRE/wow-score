import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST } from '../route'

// ─────────────────────────────────────────────────────────────
// Mutable state — hoisted so it's available inside vi.mock()
// factories before any imports are resolved.
// ─────────────────────────────────────────────────────────────
const state = vi.hoisted(() => ({
  sessionUser: { id: 'user-1' } as { id: string } | null,
  profile: { company_id: 'company-1' } as { company_id: string } | null,
  company: {
    id: 'company-1',
    subscription_status: 'active',
    subscription_plan: 'solo_monthly',
    trial_credits: 0,
    monthly_credits: 5,
    credits_reset_at: null,
  } as Record<string, unknown> | null,
  insertedEvaluation: null as Record<string, unknown> | null,
  openaiResult: {
    score: 80,
    breakdown: { insight: 8, claridad: 8, stopping: 8, simplicidad: 8, pert: 8, adapt: 8, emocion: 8, recordacion: 8, estetica: 8, relevancia: 8 },
    targetFit: { tono: 10, codigo_visual: 10, legibilidad: 10, motivador_psicologico: 10, relevancia_cultural: 10 },
    raw: { wow_score: 80, dimensiones: {}, target_fit: {}, fortalezas: ['a', 'b', 'c'], oportunidades: ['x', 'y', 'z'], veredicto: 'ok openai' },
  },
  claudeResult: {
    score: 90,
    breakdown: { insight: 9, claridad: 9, stopping: 9, simplicidad: 9, pert: 9, adapt: 9, emocion: 9, recordacion: 9, estetica: 9, relevancia: 9 },
    targetFit: { tono: 10, codigo_visual: 10, legibilidad: 10, motivador_psicologico: 10, relevancia_cultural: 10 },
    raw: { wow_score: 90, dimensiones: {}, target_fit: {}, fortalezas: ['a', 'b', 'c'], oportunidades: ['x', 'y', 'z'], veredicto: 'ok claude' },
  },
  callOpenAICalls: 0,
  callClaudeCalls: 0,
  openaiThrowsInvalidResponse: false,
  claudeThrowsInvalidResponse: false,
}))

// ─────────────────────────────────────────────────────────────
// Module mocks
// ─────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () => Promise.resolve({ data: { user: state.sessionUser }, error: null }),
      },
    }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: state.profile, error: null }),
            }),
          }),
        }
      }
      if (table === 'companies') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: state.company, error: null }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
          }),
        }
      }
      if (table === 'evaluations') {
        return {
          insert: (data: Record<string, unknown>) => {
            state.insertedEvaluation = data
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: 'eval-1', created_at: '2026-01-01T00:00:00Z' },
                    error: null,
                  }),
              }),
            }
          },
        }
      }
      return {}
    },
    storage: {
      from: () => ({
        createSignedUrl: () =>
          Promise.resolve({ data: { signedUrl: 'https://signed.example/img.png' }, error: null }),
      }),
    },
  }),
}))

// No se usa importOriginal: el módulo real construye clientes OpenAI/Anthropic
// al importarse (requiere credenciales). Se redefine InvalidModelResponseError
// con la misma forma — route.ts importa la clase de este mismo mock, así que
// el `instanceof` sigue siendo válido dentro de su propio grafo de módulos.
vi.mock('@/lib/ai-providers', () => {
  class InvalidModelResponseError extends Error {
    readonly rawText: string
    constructor(rawText: string) {
      super('El modelo no devolvió un JSON válido.')
      this.name = 'InvalidModelResponseError'
      this.rawText = rawText
    }
  }
  return {
    InvalidModelResponseError,
    callOpenAI: () => {
      state.callOpenAICalls++
      if (state.openaiThrowsInvalidResponse) {
        return Promise.reject(new InvalidModelResponseError('respuesta no-json de openai'))
      }
      return Promise.resolve(state.openaiResult)
    },
    callClaude: () => {
      state.callClaudeCalls++
      if (state.claudeThrowsInvalidResponse) {
        return Promise.reject(new InvalidModelResponseError('respuesta no-json de claude'))
      }
      return Promise.resolve(state.claudeResult)
    },
  }
})

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function makeRequest(body: unknown) {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  image_url: 'https://x.supabase.co/storage/v1/object/sign/ad-images/company-1/user-1/123-test.png?token=abc',
  medio: 'TV',
  objetivo: 'Branding',
  genero: ['Hombres'],
  edad: ['35-44'],
  nse: ['ABC+'],
}

beforeEach(() => {
  state.sessionUser = { id: 'user-1' }
  state.profile = { company_id: 'company-1' }
  state.company = {
    id: 'company-1',
    subscription_status: 'active',
    subscription_plan: 'solo_monthly',
    trial_credits: 0,
    monthly_credits: 5,
    credits_reset_at: null,
  }
  state.insertedEvaluation = null
  state.callOpenAICalls = 0
  state.callClaudeCalls = 0
  state.openaiThrowsInvalidResponse = false
  state.claudeThrowsInvalidResponse = false
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─────────────────────────────────────────────────────────────
// POST /api/analyze — selección de proveedor A/B
// ─────────────────────────────────────────────────────────────
describe('POST /api/analyze — selección de proveedor A/B', () => {
  it('usa OpenAI y persiste provider="openai" cuando Math.random() < 0.5', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.provider).toBe('openai')
    expect(body.wow_base_score).toBe(80)
    expect(body.wow_score).toBe(84)
    expect(body.target_fit.wtm).toBe(1.05)
    expect(state.insertedEvaluation?.provider).toBe('openai')
    expect(state.callOpenAICalls).toBe(1)
    expect(state.callClaudeCalls).toBe(0)
  })

  it('usa Claude y persiste provider="claude" cuando Math.random() >= 0.5', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.provider).toBe('claude')
    expect(body.wow_base_score).toBe(90)
    expect(body.wow_score).toBe(94.5)
    expect(state.insertedEvaluation?.provider).toBe('claude')
    expect(state.callClaudeCalls).toBe(1)
    expect(state.callOpenAICalls).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// POST /api/analyze — respuesta de IA no parseable como JSON
// ─────────────────────────────────────────────────────────────
describe('POST /api/analyze — InvalidModelResponseError', () => {
  it('responde 502 con mensaje genérico y loguea provider + rawText sin exponerlo al cliente', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1) // fuerza provider = 'openai'
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    state.openaiThrowsInvalidResponse = true

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(502)

    const body = await res.json()
    expect(body.error).toBe('El análisis falló, intenta de nuevo.')
    expect(JSON.stringify(body)).not.toContain('respuesta no-json de openai')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[analyze]'),
      expect.objectContaining({ provider: 'openai', rawText: 'respuesta no-json de openai' })
    )
    expect(state.insertedEvaluation).toBeNull()
  })

  it('responde 502 también cuando falla Claude', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9) // fuerza provider = 'claude'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    state.claudeThrowsInvalidResponse = true

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(502)

    const body = await res.json()
    expect(body.error).toBe('El análisis falló, intenta de nuevo.')
  })
})
