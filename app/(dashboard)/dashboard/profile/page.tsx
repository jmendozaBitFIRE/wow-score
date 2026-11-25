import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NameForm, PasswordForm } from './ProfileForms'
import { ProductTour } from '@/components/tour/ProductTour'

export const metadata = { title: 'Mi perfil — WowScore' }

const TOUR_STEPS = [
  { selector: '[data-tour="profile-title"]', title: 'Mi perfil', description: 'Aquí administras tus datos personales y tu contraseña.' },
  { selector: '[data-tour="profile-account-section"]', title: 'Datos de la cuenta', description: 'Tu nombre (editable), tu correo y la empresa a la que perteneces (fija desde el registro).' },
  { selector: '[data-tour="profile-password-section"]', title: 'Cambiar contraseña', description: 'Actualiza tu contraseña de acceso cuando quieras.' },
]

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, company_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: company } = await admin
    .from('companies')
    .select('name')
    .eq('id', profile.company_id)
    .single()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div data-tour="profile-title" className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">Tu nombre y tu contraseña.</p>
        </div>
        <ProductTour tourId="dashboard-profile" steps={TOUR_STEPS} />
      </div>

      <section data-tour="profile-account-section" className="rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 p-6 space-y-5 shadow-sm">
        <h2 className="text-base font-semibold">Datos de la cuenta</h2>

        <NameForm defaultName={profile.full_name ?? ''} />

        <dl className="grid gap-4 sm:grid-cols-2 pt-4 border-t dark:border-zinc-800">
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Correo</dt>
            <dd className="text-sm mt-1 truncate">{profile.email ?? user.email}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Empresa</dt>
            <dd className="text-sm mt-1 truncate">{company?.name ?? '—'}</dd>
            <dd className="text-xs text-muted-foreground mt-1">Se fija al registrarte y no se puede cambiar.</dd>
          </div>
        </dl>
      </section>

      <section data-tour="profile-password-section" className="rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 p-6 space-y-5 shadow-sm">
        <h2 className="text-base font-semibold">Cambiar contraseña</h2>
        <PasswordForm />
      </section>
    </div>
  )
}
