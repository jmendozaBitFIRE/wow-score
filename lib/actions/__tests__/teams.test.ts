import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const state = vi.hoisted(() => ({
  sessionUser: { id: 'user-1' } as { id: string } | null,
  profilesById: {
    'user-1': { company_id: 'company-1', role: 'owner' },
    'member-1': { company_id: 'company-1' },
    'outsider-1': { company_id: 'company-2' },
  } as Record<string, { company_id: string; role?: string }>,
  teamsById: {
    'team-1': { company_id: 'company-1' },
    'other-team': { company_id: 'company-2' },
  } as Record<string, { company_id: string }>,
  teamInsertError: null as { message: string; code?: string } | null,
  insertedTeam: null as Record<string, unknown> | null,
  deletedTeamId: null as string | null,
  teamDeleteError: null as { message: string } | null,
  teamMemberInsertError: null as { message: string; code?: string } | null,
  insertedTeamMember: null as Record<string, unknown> | null,
  teamMemberDeleteError: null as { message: string } | null,
  deletedTeamMember: null as { teamId: string; profileId: string } | null,
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
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              single: () => Promise.resolve({ data: state.profilesById[id] ?? null, error: null }),
            }),
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
          insert: (data: Record<string, unknown>) => {
            state.insertedTeam = data
            return Promise.resolve({ error: state.teamInsertError })
          },
          delete: () => ({
            eq: (_col: string, id: string) => {
              state.deletedTeamId = id
              return Promise.resolve({ error: state.teamDeleteError })
            },
          }),
        }
      }
      if (table === 'team_members') {
        return {
          insert: (data: Record<string, unknown>) => {
            state.insertedTeamMember = data
            return Promise.resolve({ error: state.teamMemberInsertError })
          },
          delete: () => ({
            eq: (_col1: string, teamId: string) => ({
              eq: (_col2: string, profileId: string) => {
                state.deletedTeamMember = { teamId, profileId }
                return Promise.resolve({ error: state.teamMemberDeleteError })
              },
            }),
          }),
        }
      }
      return {}
    },
  }),
}))

const { createTeamAction, deleteTeamAction, toggleTeamMemberAction } = await import('../teams')

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

beforeEach(() => {
  state.sessionUser = { id: 'user-1' }
  state.teamInsertError = null
  state.insertedTeam = null
  state.deletedTeamId = null
  state.teamDeleteError = null
  state.teamMemberInsertError = null
  state.insertedTeamMember = null
  state.teamMemberDeleteError = null
  state.deletedTeamMember = null
})

describe('createTeamAction', () => {
  it('rechaza sin nombre', async () => {
    const result = await createTeamAction(undefined, formData({ name: '' }))
    expect(result?.error).toMatch(/requerido/i)
  })

  it('rechaza si quien llama no es owner', async () => {
    state.sessionUser = { id: 'member-1' }
    // member-1 no tiene role en el mock -> requireOwner lo rechaza
    const result = await createTeamAction(undefined, formData({ name: 'Marketing' }))
    expect(result?.error).toMatch(/solo el propietario/i)
    expect(state.insertedTeam).toBeNull()
  })

  it('crea el equipo cuando quien llama es owner', async () => {
    const result = await createTeamAction(undefined, formData({ name: 'Marketing' }))
    expect(result?.success).toMatch(/Marketing/)
    expect(state.insertedTeam).toEqual({ company_id: 'company-1', name: 'Marketing' })
  })

  it('traduce la violación de unicidad (23505) a un mensaje claro', async () => {
    state.teamInsertError = { message: 'duplicate key value', code: '23505' }
    const result = await createTeamAction(undefined, formData({ name: 'Marketing' }))
    expect(result?.error).toMatch(/ya existe un equipo/i)
  })
})

describe('deleteTeamAction', () => {
  it('rechaza si quien llama no es owner', async () => {
    state.sessionUser = { id: 'member-1' }
    await expect(deleteTeamAction('team-1')).rejects.toThrow(/solo el propietario/i)
    expect(state.deletedTeamId).toBeNull()
  })

  it('rechaza un equipo de otra compañía', async () => {
    await expect(deleteTeamAction('other-team')).rejects.toThrow(/no encontrado/i)
    expect(state.deletedTeamId).toBeNull()
  })

  it('borra el equipo cuando pertenece a la compañía del owner', async () => {
    await deleteTeamAction('team-1')
    expect(state.deletedTeamId).toBe('team-1')
  })
})

describe('toggleTeamMemberAction', () => {
  it('rechaza si quien llama no es owner', async () => {
    state.sessionUser = { id: 'member-1' }
    await expect(toggleTeamMemberAction('team-1', 'member-1', true)).rejects.toThrow(/solo el propietario/i)
  })

  it('rechaza un equipo de otra compañía', async () => {
    await expect(toggleTeamMemberAction('other-team', 'member-1', true)).rejects.toThrow(/equipo no encontrado/i)
  })

  it('rechaza un perfil de otra compañía (no se puede meter gente ajena)', async () => {
    await expect(toggleTeamMemberAction('team-1', 'outsider-1', true)).rejects.toThrow(/miembro no encontrado/i)
  })

  it('añade al miembro cuando add=true', async () => {
    await toggleTeamMemberAction('team-1', 'member-1', true)
    expect(state.insertedTeamMember).toEqual({ team_id: 'team-1', profile_id: 'member-1' })
  })

  it('tolera que ya estuviera en el equipo (23505) sin lanzar error', async () => {
    state.teamMemberInsertError = { message: 'duplicate key value', code: '23505' }
    await expect(toggleTeamMemberAction('team-1', 'member-1', true)).resolves.toBeUndefined()
  })

  it('quita al miembro cuando add=false', async () => {
    await toggleTeamMemberAction('team-1', 'member-1', false)
    expect(state.deletedTeamMember).toEqual({ teamId: 'team-1', profileId: 'member-1' })
  })
})
