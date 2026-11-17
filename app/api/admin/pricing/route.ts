import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/require-admin'

// Los planes se importan desde Stripe en el admin; plan_key es un slug libre.
const PLAN_KEY_PATTERN = /^[a-z0-9_]{2,60}$/

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { plan_key, price_amount, stripe_price_id, is_active, monthly_credits } = body as {
    plan_key: string
    price_amount: number
    stripe_price_id: string
    is_active: boolean
    monthly_credits?: number
  }

  if (typeof plan_key !== 'string' || !PLAN_KEY_PATTERN.test(plan_key)) {
    return NextResponse.json(
      { error: 'plan_key must be lowercase letters, numbers or underscores' },
      { status: 400 }
    )
  }

  if (
    monthly_credits !== undefined &&
    (!Number.isInteger(monthly_credits) || monthly_credits < 0)
  ) {
    return NextResponse.json(
      { error: 'monthly_credits must be a non-negative integer' },
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
      ...(monthly_credits !== undefined ? { monthly_credits } : {}),
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
