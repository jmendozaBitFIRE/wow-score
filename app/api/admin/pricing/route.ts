import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/require-admin'
import type { StripePlan } from '@/lib/stripe'

const VALID_PLAN_KEYS: StripePlan[] = [
  'solo_monthly',
  'solo_annual',
  'team_monthly',
  'team_annual',
]

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { plan_key, price_amount, stripe_price_id, is_active } = body as {
    plan_key: StripePlan
    price_amount: number
    stripe_price_id: string
    is_active: boolean
  }

  if (!VALID_PLAN_KEYS.includes(plan_key)) {
    return NextResponse.json(
      { error: `plan_key must be one of: ${VALID_PLAN_KEYS.join(', ')}` },
      { status: 400 }
    )
  }

  if (typeof price_amount !== 'number' || price_amount < 0) {
    return NextResponse.json(
      { error: 'price_amount must be a non-negative number' },
      { status: 400 }
    )
  }

  if (typeof stripe_price_id !== 'string' || !stripe_price_id.startsWith('price_')) {
    return NextResponse.json(
      { error: 'stripe_price_id must be a string starting with "price_"' },
      { status: 400 }
    )
  }

  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
  }

  const { data: plan, error } = await createAdminClient()
    .from('plan_prices')
    .update({
      price_amount,
      stripe_price_id,
      is_active,
      updated_at: new Date().toISOString(),
      updated_by: auth.userId,
    })
    .eq('plan_key', plan_key)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, plan })
}
