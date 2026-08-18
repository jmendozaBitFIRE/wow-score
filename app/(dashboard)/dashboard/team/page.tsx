import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { InviteMemberForm } from '@/components/dashboard/InviteMemberForm'
import { MemberActions } from '@/components/dashboard/MemberActions'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Equipo — WowScore' }

interface Member {
  id: string
  full_name: string
  email: string
  role: 'owner' | 'member'
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: company } = await admin
    .from('companies')
    .select('max_members')
    .eq('id', profile.company_id)
    .single()

  if (!company) redirect('/dashboard')

  const { data: members } = await admin
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: true })

  const rows = (members ?? []) as Member[]
  const atLimit = rows.length >= company.max_members

  // Un miembro invitado que aún no confirmó su cuenta (nunca puso contraseña)
  // sigue "pendiente" — solo aplica a role='member', el owner siempre está confirmado.
  const pendingIds = new Set(
    (
      await Promise.all(
        rows
          .filter((m) => m.role === 'member')
          .map(async (m) => {
            const { data } = await admin.auth.admin.getUserById(m.id)
            return data?.user?.email_confirmed_at ? null : m.id
          })
      )
    ).filter((id): id is string => id !== null)
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
          <Users size={22} className="text-primary" />
          Equipo
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} de {company.max_members} miembro{company.max_members === 1 ? '' : 's'} de tu plan.
        </p>
      </div>

      <div className="rounded-xl border bg-card divide-y">
        {rows.map((m) => {
          const isPending = pendingIds.has(m.id)
          return (
            <div key={m.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.full_name} {m.id === user.id && <span className="text-muted-foreground">(Tú)</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isPending && (
                  <span className="text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    Pendiente
                  </span>
                )}
                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                  {m.role === 'owner' ? 'Propietario' : 'Miembro'}
                </span>
                {profile.role === 'owner' && m.role !== 'owner' && (
                  <MemberActions memberId={m.id} pending={isPending} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {profile.role === 'owner' && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invitar miembro</p>
          {atLimit ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Alcanzaste el límite de miembros de tu plan.</p>
              <Link href="/dashboard/pricing" className={cn(buttonVariants({ variant: 'brand' }), 'h-9')}>
                Ver planes con más miembros
              </Link>
            </div>
          ) : (
            <InviteMemberForm />
          )}
        </div>
      )}
    </div>
  )
}
