import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PATCH as statusPATCH } from '../clients/[id]/status/route'
import { PATCH as pricingPATCH } from '../pricing/route'

// ─────────────────────────────────────────────────────────────
// Mutable state — hoisted so it's available inside vi.mock()
// factories before any imports are resolved.
// ─────────────────────────────────────────────────────────────
const state = vi.hoisted(() => ({
  sessionUser: { id: 'admin-1' } as { id: string } | null,
  isAdmin: true,
  // companies update result
  companyUpdateData: [{ id: 'test-company' }] as { id: string }[],
  companyUpdateError: null as { message: string } | null,
  // plan_prices update result
  planPriceUpdateData: {
    id: 'price-uuid',
    plan_key: 'solo_monthly',
    price_amount: 19,
    stripe_price_id: 'price_test123',
    is_active: true,
  } as Record<string, unknown>,
  planPriceUpdateError: null as { message: string } | null,
  // spy — records the last .update(payload) call
  capturedUpdate: null as Record<string, unknown> | null,
}))

// ─────────────────────────────────────────────────────────────
// Module mocks
// ─────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: state.sessionUser }, error: null }),
      },
    }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      // ── requireAdmin() reads this ──────────────────────────
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: state.sessionUser ? { is_admin: state.isAdmin } : null,
                  error: null,
                }),
            }),
          }),
        }
      }

      // ── /clients/[id]/status handler ──────────────────────
      // Chain: .update(data).eq('id', id).select('id') → { data, error }
      if (table === 'companies') {
        return {
          update: (data: Record<string, unknown>) => {
            state.capturedUpdate = data
            return {
              eq: () => ({
                select: () =>
                  Promise.resolve({
                    data: state.companyUpdateData,
                    error: state.companyUpdateError,
                  }),
              }),
            }
          },
        }
      }

      // ── /pricing handler ──────────────────────────────────
      // Chain: .update(data).eq('plan_key', key).select().single() → { data, error }
      if (table === 'plan_prices') {
        return {
          update: (data: Record<string, unknown>) => {
            state.capturedUpdate = data
            return {
              eq: () => ({
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: state.planPriceUpdateData,
                      error: state.planPriceUpdateError,
                    }),
                }),
              }),
            }
          },
        }
      }

      return {}
    },
  }),
}))

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function makeStatusRequest(body: unknown) {
  return new Request('http://localhost/api/admin/clients/company-id/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(id = 'company-123') {
  return { params: Promise.resolve({ id }) }
}

function makePricingRequest(body: unknown) {
  return new Request('http://localhost/api/admin/pricing', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_PRICING_BODY = {
  plan_key: 'solo_monthly',
  price_amount: 19.0,
  stripe_price_id: 'price_test123',
  is_active: true,
}

// ─────────────────────────────────────────────────────────────
// Reset to admin-user defaults before every test
// ─────────────────────────────────────────────────────────────
beforeEach(() => {
  state.sessionUser = { id: 'admin-1' }
  state.isAdmin = true
  state.companyUpdateData = [{ id: 'test-company' }]
  state.companyUpdateError = null
  state.planPriceUpdateData = {
    id: 'price-uuid',
    plan_key: 'solo_monthly',
    price_amount: 19,
    stripe_price_id: 'price_test123',
    is_active: true,
  }
  state.planPriceUpdateError = null
  state.capturedUpdate = null
})

// ─────────────────────────────────────────────────────────────
// 1. /api/admin/clients/[id]/status
// ─────────────────────────────────────────────────────────────
describe('/api/admin/clients/[id]/status (PATCH)', () => {
  it('a. retorna 401 si no hay sesión', async () => {
    state.sessionUser = null
    const res = await statusPATCH(makeStatusRequest({ action: 'activate' }), makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('b. retorna 403 si is_admin = false', async () => {
    state.sessionUser = { id: 'user-1' }
    state.isAdmin = false
    const res = await statusPATCH(makeStatusRequest({ action: 'activate' }), makeParams())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('c. activa la company correctamente con action = "activate"', async () => {
    const res = await statusPATCH(makeStatusRequest({ action: 'activate' }), makeParams('company-abc'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, company_id: 'company-abc', new_status: 'active' })
    expect(state.capturedUpdate).toEqual({ subscription_status: 'active' })
  })

  it('d. desactiva la company correctamente con action = "deactivate"', async () => {
    const res = await statusPATCH(makeStatusRequest({ action: 'deactivate' }), makeParams('company-xyz'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, company_id: 'company-xyz', new_status: 'inactive' })
    expect(state.capturedUpdate).toEqual({ subscription_status: 'inactive' })
  })

  it('e. retorna 400 si action no es "activate" ni "deactivate"', async () => {
    const res = await statusPATCH(makeStatusRequest({ action: 'suspend' }), makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/activate/)
  })

  it('f. retorna 404 si el company_id no existe', async () => {
    state.companyUpdateData = []
    const res = await statusPATCH(makeStatusRequest({ action: 'activate' }), makeParams('nonexistent-id'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })
})

// ─────────────────────────────────────────────────────────────
// 2. /api/admin/pricing
// ─────────────────────────────────────────────────────────────
describe('/api/admin/pricing (PATCH)', () => {
  it('a. retorna 403 si is_admin = false', async () => {
    state.sessionUser = { id: 'user-1' }
    state.isAdmin = false
    const res = await pricingPATCH(makePricingRequest(VALID_PRICING_BODY))
    expect(res.status).toBe(403)
  })

  it('b. retorna 400 si plan_key no es uno de los 4 válidos', async () => {
    const res = await pricingPATCH(
      makePricingRequest({ ...VALID_PRICING_BODY, plan_key: 'enterprise_monthly' })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/plan_key/)
  })

  it('c. retorna 400 si price_amount es negativo', async () => {
    const res = await pricingPATCH(
      makePricingRequest({ ...VALID_PRICING_BODY, price_amount: -0.01 })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/price_amount/)
  })

  it('d. retorna 400 si stripe_price_id no empieza con "price_"', async () => {
    const res = await pricingPATCH(
      makePricingRequest({ ...VALID_PRICING_BODY, stripe_price_id: 'prod_invalid123' })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/stripe_price_id/)
  })

  it('e. actualiza correctamente con datos válidos', async () => {
    const res = await pricingPATCH(makePricingRequest(VALID_PRICING_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.plan).toMatchObject({ plan_key: 'solo_monthly' })
  })

  it('f. guarda updated_by con el id del admin autenticado', async () => {
    state.sessionUser = { id: 'admin-1' }
    await pricingPATCH(makePricingRequest(VALID_PRICING_BODY))
    expect(state.capturedUpdate?.updated_by).toBe('admin-1')
  })
})
