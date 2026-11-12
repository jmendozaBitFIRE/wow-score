'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Buildings, CurrencyCircleDollar, SquaresFour, SignOut } from '@phosphor-icons/react'

const navItems = [
  { label: 'Clientes', href: '/admin/clients',  icon: Buildings },
  { label: 'Precios',  href: '/admin/pricing',   icon: CurrencyCircleDollar },
]

interface AdminSidebarProps {
  userInitial: string
  fullName: string
}

const linkBase = 'nav-link flex items-center gap-3 px-3 py-2 min-h-11 lg:min-h-0 text-sm font-medium rounded-lg'
const linkIdle = 'text-[var(--color-text-secondary)] hover:bg-zinc-100 hover:text-[var(--color-text-primary)] dark:hover:bg-zinc-900 dark:hover:text-zinc-50'

// Navegación + bloque de usuario. Lo comparten el sidebar de escritorio y el
// drawer móvil (AdminMobileNav); `onNavigate` cierra el drawer al elegir una ruta.
export function AdminNavBody({ userInitial, fullName, onNavigate }: AdminSidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname()
  const dashActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/')

  return (
    <>
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`${linkBase} ${isActive ? 'nav-link-active' : linkIdle}`}
            >
              <Icon size={20} weight={isActive ? 'fill' : 'duotone'} />
              {label}
            </Link>
          )
        })}

        <div className="pt-4 border-t dark:border-zinc-800 mt-4">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className={`${linkBase} ${dashActive ? 'nav-link-active' : linkIdle}`}
          >
            <SquaresFour size={20} weight={dashActive ? 'fill' : 'duotone'} />
            Ir al dashboard
          </Link>
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
            className="nav-link w-full flex items-center gap-3 px-3 py-2 min-h-11 lg:min-h-0 text-sm font-medium rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 mt-2"
          >
            <SignOut size={20} weight="duotone" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  )
}

// Sidebar fijo de escritorio (lg:). En móvil/tablet lo reemplaza AdminMobileNav.
export function AdminSidebar(props: AdminSidebarProps) {
  return (
    <aside className="no-print hidden lg:flex w-64 shrink-0 border-r bg-white dark:bg-zinc-950 dark:border-zinc-800 flex-col">
      <div className="p-6">
        <Link href="/admin/clients" className="flex items-center gap-2">
          <Image src="/logo-full.png" sizes="100px" alt="WowScore" width={1025} height={503} className="h-7 w-auto" />
          <span className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Admin</span>
        </Link>
      </div>
      <AdminNavBody {...props} />
    </aside>
  )
}
