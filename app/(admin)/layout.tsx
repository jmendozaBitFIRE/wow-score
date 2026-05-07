import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminSidebar } from '@/components/ui/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('is_admin, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const userInitial = (profile.email ?? user.email ?? 'A')[0].toUpperCase()

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <AdminSidebar userInitial={userInitial} fullName={profile.full_name} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
