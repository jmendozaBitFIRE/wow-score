import Link from 'next/link'
import {
  LogOut,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOutAction } from '@/lib/actions/auth'
import { SidebarNav } from '@/components/dashboard/SidebarNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-zinc-950 dark:border-zinc-800 flex flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div 
              className="p-1.5 rounded-lg text-white"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <Sparkles size={20} fill="currentColor" />
            </div>
            <span className="text-zinc-900 dark:text-white">WowScore</span>
          </Link>
        </div>

        <SidebarNav />

        <div className="p-4 border-t dark:border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate dark:text-zinc-200">
                {user.email}
              </p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="nav-link w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 mt-2"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
