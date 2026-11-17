'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'
import { slugifyPlanKey } from '@/lib/plans'

async function verifyAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')
  return user.id
}

export async function setCompanyStatus(companyId: string, status: string) {
  await verifyAdmin()
  await createAdminClient()
    .from('companies')
    .update({ subscription_status: status })
    .eq('id', companyId)
  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${companyId}`)
}

function toCredits(value: unknown, field: string): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 100000) {
    throw new Error(`${field} debe ser un número entero entre 0 y 100000.`)
  }
  return n
}

export async function updatePlan(data: {
  id: string
  display_name: string
  monthly_credits: number
  trial_credits: number
  is_active: boolean
}) {
  const userId = await verifyAdmin()
  const displayName = data.display_name?.trim()
  if (!displayName) throw new Error('El nombre del plan es requerido.')

  const { error } = await createAdminClient()
    .from('plan_prices')
    .update({
      display_name: displayName.slice(0, 60),
      monthly_credits: toCredits(data.monthly_credits, 'Evaluaciones por mes'),
      trial_credits: toCredits(data.trial_credits, 'Evaluaciones de prueba'),
      is_active: !!data.is_active,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', data.id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/pricing')
}

export interface ImportableStripePrice {
  id: string
  productName: string
  nickname: string | null
  amount: number
  currency: string
  interval: string
  livemode: boolean
}

// Precios recurrentes activos de la cuenta de Stripe configurada (pruebas o
// producción, según STRIPE_SECRET_KEY) que todavía no están registrados.
export async function listImportableStripePrices(): Promise<ImportableStripePrice[]> {
  await verifyAdmin()

  const { data: registered } = await createAdminClient().from('plan_prices').select('stripe_price_id')
  const known = new Set((registered ?? []).map((r) => r.stripe_price_id))

  const result: ImportableStripePrice[] = []
  for await (const price of stripe.prices.list({ active: true, type: 'recurring', limit: 100, expand: ['data.product'] })) {
    if (known.has(price.id) || price.unit_amount === null || !price.recurring) continue
    const product = typeof price.product === 'string' ? null : price.product
    if (product && 'deleted' in product && product.deleted) continue
    if (product && 'active' in product && !product.active) continue
    result.push({
      id: price.id,
      productName: product && 'name' in product ? product.name : price.id,
      nickname: price.nickname,
      amount: price.unit_amount / 100,
      currency: price.currency,
      interval: price.recurring.interval,
      livemode: price.livemode,
    })
    if (result.length >= 100) break
  }
  return result
}

export async function importStripePrice(data: {
  stripe_price_id: string
  display_name: string
  monthly_credits: number
  trial_credits: number
}): Promise<{ error?: string }> {
  const userId = await verifyAdmin()

  const displayName = data.display_name?.trim()
  if (!displayName) return { error: 'Ponle un nombre al plan.' }
  let monthlyCredits: number, trialCredits: number
  try {
    monthlyCredits = toCredits(data.monthly_credits, 'Evaluaciones por mes')
    trialCredits = toCredits(data.trial_credits, 'Evaluaciones de prueba')
  } catch (err) {
    return { error: (err as Error).message }
  }

  // Validar contra Stripe: el precio debe existir en la cuenta configurada.
  let price
  try {
    price = await stripe.prices.retrieve(data.stripe_price_id)
  } catch {
    return { error: 'Ese precio no existe en la cuenta de Stripe configurada.' }
  }
  if (!price.active || !price.recurring || price.unit_amount === null) {
    return { error: 'Solo se pueden importar precios recurrentes y activos.' }
  }

  const admin = createAdminClient()
  const { data: existing } = await admin.from('plan_prices').select('id').eq('stripe_price_id', price.id).limit(1)
  if (existing?.length) return { error: 'Ese precio ya está registrado.' }

  // plan_key único y legible a partir del nombre.
  const baseKey = slugifyPlanKey(displayName, price.recurring.interval)
  const { data: sameKeys } = await admin.from('plan_prices').select('plan_key').like('plan_key', `${baseKey}%`)
  const taken = new Set((sameKeys ?? []).map((r) => r.plan_key))
  let planKey = baseKey
  for (let i = 2; taken.has(planKey); i++) planKey = `${baseKey}_${i}`

  const { error } = await admin.from('plan_prices').insert({
    plan_key: planKey,
    display_name: displayName.slice(0, 60),
    price_amount: price.unit_amount / 100,
    currency: price.currency,
    stripe_price_id: price.id,
    max_members: 1,
    monthly_credits: monthlyCredits,
    trial_credits: trialCredits,
    billing_interval: price.recurring.interval,
    livemode: price.livemode,
    is_active: true,
    updated_by: userId,
  })
  if (error) return { error: error.message }

  revalidatePath('/admin/pricing')
  return {}
}
