import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const state = vi.hoisted(() => ({
  sessionUser: { id: 'user-1' } as { id: string } | null,
  evaluation: { profile_id: 'user-1', company_id: 'company-1' } as { profile_id: string; company_id: string } | null,
  teamsById: { 'team-1': { company_id: 'company-1' }, 'other-team': { company_id: 'company-2' } } as Record<string, { company_id: string }>,
  updateError: null as { message: string } | null,
  updatedWith: null as Record<string, unknown> | null,
  updatedId: null as string | null,
}))

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
      if (table === 'evaluations') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: state.evaluation, error: null }),
            }),
          }),
          update: (data: Record<string, unknown>) => ({
            eq: (_col: string, id: string) => {
              state.updatedWith = data
              state.updatedId = id
              return Promise.resolve({ error: state.updateError })
            },
          }),
        }
      }
      if (table === 'teams') {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              single: () => Promise.resolve({ data: state.teamsById[id] ?? null, error: null }),
            }),
          }),
        }
      }
      return {}
    },
  }),
}))

const { updateVisibilityAction } = await import('../evaluations')

beforeEach(() => {
  state.sessionUser = { id: 'user-1' }
  state.evaluation = { profile_id: 'user-1', company_id: 'company-1' }
  state.updateError = null
  state.updatedWith = null
  state.updatedId = null
})

describe('updateVisibilityAction', () => {
  it('rechaza una visibilidad que no sea private/team/company/public', async () => {
    // @ts-expect-error -- probando un valor inválido a propósito
    await expect(updateVisibilityAction('eval-1', 'everyone')).rejects.toThrow(/no válida/i)
    expect(state.updatedWith).toBeNull()
  })

  it('rechaza sin sesión', async () => {
    state.sessionUser = null
    await expect(updateVisibilityAction('eval-1', 'public')).rejects.toThrow(/no autorizado/i)
    expect(state.updatedWith).toBeNull()
  })

  it('rechaza si quien llama no es el dueño del análisis', async () => {
    state.evaluation = { profile_id: 'otro-usuario', company_id: 'company-1' }
    await expect(updateVisibilityAction('eval-1', 'public')).rejects.toThrow(/solo quien hizo el análisis/i)
    expect(state.updatedWith).toBeNull()
  })

  it('rechaza si la evaluación no existe', async () => {
    state.evaluation = null
    await expect(updateVisibilityAction('eval-1', 'public')).rejects.toThrow(/solo quien hizo el análisis/i)
  })

  it('actualiza la visibilidad cuando quien llama es el dueño', async () => {
    await updateVisibilityAction('eval-1', 'public')
    expect(state.updatedId).toBe('eval-1')
    expect(state.updatedWith).toEqual({ visibility: 'public', shared_team_id: null })
  })

  it('propaga el error si el update falla', async () => {
    state.updateError = { message: 'boom' }
    await expect(updateVisibilityAction('eval-1', 'company')).rejects.toThrow('boom')
  })

  it('rechaza visibility="team" sin teamId', async () => {
    await expect(updateVisibilityAction('eval-1', 'team')).rejects.toThrow(/selecciona un equipo/i)
    expect(state.updatedWith).toBeNull()
  })

  it('rechaza un equipo de otra compañía (no se puede compartir a un equipo ajeno)', async () => {
    await expect(updateVisibilityAction('eval-1', 'team', 'other-team')).rejects.toThrow(/equipo no encontrado/i)
    expect(state.updatedWith).toBeNull()
  })

  it('comparte con el equipo cuando pertenece a la misma compañía', async () => {
    await updateVisibilityAction('eval-1', 'team', 'team-1')
    expect(state.updatedWith).toEqual({ visibility: 'team', shared_team_id: 'team-1' })
  })
})
