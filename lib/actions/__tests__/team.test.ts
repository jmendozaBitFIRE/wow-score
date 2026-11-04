import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('./auth', () => ({ getOrigin: () => Promise.resolve('https://wowscore.test') }))

const state = vi.hoisted(() => ({
  sessionUser: { id: 'owner-1' } as { id: string } | null,
  profilesById: {
    'owner-1': { company_id: 'company-1', role: 'owner' },
    'member-1': { company_id: 'company-1', role: 'member' },
    'other-owner-1': { company_id: 'company-1', role: 'owner' },
    'outsider-1': { company_id: 'company-2', role: 'member' },
  } as Record<string, { company_id: string; role?: string }>,
  reassignedTo: null as { profileId: string; newOwnerId: string } | null,
  reassignError: null as { message: string } | null,
  deletedUserId: null as string | null,
  deleteUserError: null as { message: string } | null,
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
      if (table === 'evaluations') {
        return {
          update: (data: { profile_id: string }) => ({
            eq: (_col: string, memberId: string) => {
              state.reassignedTo = { profileId: memberId, newOwnerId: data.profile_id }
              return Promise.resolve({ error: state.reassignError })
            },
          }),
        }
      }
      return {}
    },
    auth: {
      admin: {
        deleteUser: (id: string) => {
          state.deletedUserId = id
          return Promise.resolve({ error: state.deleteUserError })
        },
      },
    },
  }),
}))

const { removeMemberAction } = await import('../team')

beforeEach(() => {
  state.sessionUser = { id: 'owner-1' }
  state.reassignedTo = null
  state.reassignError = null
  state.deletedUserId = null
  state.deleteUserError = null
})

describe('removeMemberAction', () => {
  it('rechaza si quien llama no es owner', async () => {
    state.sessionUser = { id: 'member-1' }
    await expect(removeMemberAction('member-1')).rejects.toThrow(/solo el propietario/i)
    expect(state.reassignedTo).toBeNull()
  })

  it('rechaza un miembro de otra compañía', async () => {
    await expect(removeMemberAction('outsider-1')).rejects.toThrow(/no encontrado/i)
  })

  it('rechaza quitar a un owner', async () => {
    await expect(removeMemberAction('other-owner-1')).rejects.toThrow(/no puedes quitar al propietario/i)
    expect(state.reassignedTo).toBeNull()
  })

  it('reasigna las evaluaciones del miembro al owner antes de borrarlo', async () => {
    await removeMemberAction('member-1')
    expect(state.reassignedTo).toEqual({ profileId: 'member-1', newOwnerId: 'owner-1' })
    expect(state.deletedUserId).toBe('member-1')
  })

  it('no borra al usuario si la reasignación falla', async () => {
    state.reassignError = { message: 'db error' }
    await expect(removeMemberAction('member-1')).rejects.toThrow('db error')
    expect(state.deletedUserId).toBeNull()
  })
})
