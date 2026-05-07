'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Tag, LayoutDashboard, LogOut, Sparkles } from 'lucide-react'

const navItems = [
  { label: 'Clientes', href: '/admin/clients',  icon: Building2     },
  { label: 'Precios',  href: '/admin/pricing',   icon: Tag           },
]

interface AdminSidebarProps {
  userInitial: string
  fullName: string
}

export function AdminSidebar({ userInitial, fullName }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white dark:bg-zinc-950 dark:border-zinc-800 flex flex-col">
      <div className="p-6">
        <Link href="/admin/clients" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <span>Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                isActive
                  ? 'nav-link-active'
                  : 'text-[var(--color-text-secondary)] hover:bg-zinc-100 hover:text-[var(--color-text-primary)] dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}

        <div className="pt-4 border-t dark:border-zinc-800 mt-4">
          {(() => {
            const isActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
            return (
              <Link
                href="/dashboard"
                className={`nav-link flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive
                    ? 'nav-link-active'
                    : 'text-[var(--color-text-secondary)] hover:bg-zinc-100 hover:text-[var(--color-text-primary)] dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <LayoutDashboard size={18} />
                Ir al dashboard
              </Link>
            )
          })()}
        </div>
      </nav>

      <div className="p-4 border-t dark:border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Administrador</p>
            <p className="text-sm font-medium truncate dark:text-zinc-200">{fullName}</p>
          </div>
        </div>
        <form action="/auth/signout" method="post">
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
  )
}
