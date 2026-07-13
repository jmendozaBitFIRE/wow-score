import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateEvaluationAction } from '../ratings'

// ─────────────────────────────────────────────────────────────
// Mutable state — hoisted so it's available inside vi.mock()
// factories before any imports are resolved.
// ─────────────────────────────────────────────────────────────
const state = vi.hoisted(() => ({
  sessionUser: { id: 'user-1' } as { id: string } | null,
  profile: { company_id: 'company-1' } as { company_id: string } | null,
  insertedRow: null as Record<string, unknown> | null,
  insertError: null as { message: string } | null,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () => Promise.resolve({ data: { user: state.sessionUser }, error: null }),
      },
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
        if (table === 'evaluation_ratings') {
          return {
            insert: (data: Record<string, unknown>) => {
              state.insertedRow = data
              return Promise.resolve({ data: null, error: state.insertError })
            },
          }
        }
        return {}
      },
    }),
}))

beforeEach(() => {
  state.sessionUser = { id: 'user-1' }
  state.profile = { company_id: 'company-1' }
  state.insertedRow = null
  state.insertError = null
})

describe('rateEvaluationAction', () => {
  it('rechaza sin sesión', async () => {
    state.sessionUser = null
    await expect(rateEvaluationAction('eval-1', 5)).rejects.toThrow(/no autorizado/i)
    expect(state.insertedRow).toBeNull()
  })

  it.each([0, 6, -1, 3.5])('rechaza rating fuera de 1-5 (%s)', async (rating) => {
    await expect(rateEvaluationAction('eval-1', rating)).rejects.toThrow(/1 y 5/)
    expect(state.insertedRow).toBeNull()
  })

  it('inserta la calificación con datos válidos y respeta RLS (createClient, no admin)', async () => {
    await rateEvaluationAction('eval-1', 4)
    expect(state.insertedRow).toEqual({
      evaluation_id: 'eval-1',
      company_id: 'company-1',
      user_id: 'user-1',
      rating: 4,
    })
  })

  it('propaga el error si el insert falla (p. ej. RLS deniega la escritura)', async () => {
    state.insertError = { message: 'new row violates row-level security policy' }
    await expect(rateEvaluationAction('eval-1', 3)).rejects.toThrow(/row-level security/)
  })
})
