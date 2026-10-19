import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────
// Mutable state — hoisted so it's available inside vi.mock()
// factories before any imports are resolved.
// ─────────────────────────────────────────────────────────────
const state = vi.hoisted(() => ({
  signUpResult: { data: { user: { id: 'user-1', identities: [{}] } }, error: null } as {
    data: { user: { id: string; identities: unknown[] } | null }
    error: { message: string } | null
  },
  existingCompany: null as { id: string } | null,
  companyInsertResult: { data: { id: 'company-1' }, error: null } as {
    data: { id: string } | null
    error: { message: string; code?: string } | null
  },
  profileInsertResult: { error: null } as { error: { message: string } | null },
  insertedCompany: null as Record<string, unknown> | null,
  insertedProfile: null as Record<string, unknown> | null,
  deletedUserIds: [] as string[],
  deletedCompanyIds: [] as string[],
  redirectedTo: null as string | null,
}))

// registerAction() hace redirect() al final del camino feliz — fuera de un
// request real de Next.js esto no funciona solo, así que se mockea y se usa
// un throw como señal (igual a como Next.js lo implementa internamente).
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    state.redirectedTo = url
    throw new Error('NEXT_REDIRECT')
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        signUp: () => Promise.resolve(state.signUpResult),
      },
    }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'companies') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: state.existingCompany, error: null }),
            }),
          }),
          insert: (data: Record<string, unknown>) => {
            state.insertedCompany = data
            return { select: () => ({ single: () => Promise.resolve(state.companyInsertResult) }) }
          },
          delete: () => ({
            eq: (_col: string, id: string) => {
              state.deletedCompanyIds.push(id)
              return Promise.resolve({ error: null })
            },
          }),
        }
      }
      if (table === 'profiles') {
        return {
          insert: (data: Record<string, unknown>) => {
            state.insertedProfile = data
            return Promise.resolve(state.profileInsertResult)
          },
        }
      }
      return {}
    },
    auth: {
      admin: {
        deleteUser: (id: string) => {
          state.deletedUserIds.push(id)
          return Promise.resolve({ error: null })
        },
      },
    },
  }),
}))

const { registerAction } = await import('../auth')

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const VALID_FIELDS = {
  full_name: 'Jose Mendoza',
  company_name: 'Wow Agency',
  email: 'jose@wowagency.com',
  password: 'secret123',
}

beforeEach(() => {
  state.signUpResult = { data: { user: { id: 'user-1', identities: [{}] } }, error: null }
  state.existingCompany = null
  state.companyInsertResult = { data: { id: 'company-1' }, error: null }
  state.profileInsertResult = { error: null }
  state.insertedCompany = null
  state.insertedProfile = null
  state.deletedUserIds = []
  state.deletedCompanyIds = []
  state.redirectedTo = null
})

describe('registerAction', () => {
  it('bloquea el registro si ya existe una compañía con ese slug, sin tocar Auth', async () => {
    state.existingCompany = { id: 'company-existing' }

    const result = await registerAction(undefined, formData(VALID_FIELDS))

    expect(result?.error).toMatch(/ya existe una compañía/i)
    expect(state.insertedCompany).toBeNull()
    expect(state.insertedProfile).toBeNull()
    expect(state.deletedUserIds).toEqual([])
  })

  it('registra exitosamente cuando el nombre de compañía está libre', async () => {
    await expect(registerAction(undefined, formData(VALID_FIELDS))).rejects.toThrow('NEXT_REDIRECT')

    expect(state.redirectedTo).toBe('/login?registered=true')
    expect(state.insertedCompany).toMatchObject({ name: 'Wow Agency', slug: 'wow-agency' })
    expect(state.insertedProfile).toMatchObject({ id: 'user-1', company_id: 'company-1', role: 'owner' })
    expect(state.deletedUserIds).toEqual([])
  })

  it('condición de carrera en el insert de company (23505): borra el auth.user huérfano en vez de dejarlo atascado', async () => {
    state.companyInsertResult = {
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "companies_slug_key"' },
    }

    const result = await registerAction(undefined, formData(VALID_FIELDS))

    expect(result?.error).toMatch(/ya existe una compañía/i)
    expect(state.deletedUserIds).toEqual(['user-1'])
    expect(state.insertedProfile).toBeNull()
  })

  it('si el insert de profile falla, borra tanto el auth.user como la company recién creada', async () => {
    state.profileInsertResult = { error: { message: 'boom' } }

    const result = await registerAction(undefined, formData(VALID_FIELDS))

    expect(result?.error).toBe('boom')
    expect(state.deletedUserIds).toEqual(['user-1'])
    expect(state.deletedCompanyIds).toEqual(['company-1'])
  })

  it('rechaza si falta algún campo', async () => {
    const result = await registerAction(undefined, formData({ ...VALID_FIELDS, full_name: '' }))
    expect(result?.error).toMatch(/requeridos/i)
  })

  it('rechaza contraseñas cortas', async () => {
    const result = await registerAction(undefined, formData({ ...VALID_FIELDS, password: '123' }))
    expect(result?.error).toMatch(/al menos 6 caracteres/i)
  })
})
