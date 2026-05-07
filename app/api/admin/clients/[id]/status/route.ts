import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/require-admin'

const VALID_ACTIONS = ['activate', 'deactivate'] as const
type Action = (typeof VALID_ACTIONS)[number]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  const body = await request.json().catch(() => null)
  const action = body?.action as Action | undefined

  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: 'Body must include action: "activate" | "deactivate"' },
      { status: 400 }
    )
  }

  const newStatus = action === 'activate' ? 'active' : 'inactive'

  const { data: updated, error } = await createAdminClient()
    .from('companies')
    .update({ subscription_status: newStatus })
    .eq('id', id)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!updated || (updated as unknown[]).length === 0) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, company_id: id, new_status: newStatus })
}
