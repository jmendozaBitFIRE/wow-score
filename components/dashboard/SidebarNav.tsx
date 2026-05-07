'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  CreditCard 
} from 'lucide-react'

const navItems = [
  { label: 'Inicio',       href: '/dashboard',         icon: LayoutDashboard, exact: true  },
  { label: 'Analizar',     href: '/dashboard/upload',  icon: Upload,          exact: false },
  { label: 'Historial',    href: '/dashboard/history', icon: History,         exact: false },
  { label: 'Suscripción',  href: '/dashboard/pricing', icon: CreditCard,      exact: false },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-4 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'nav-link flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg',
              isActive
                ? 'nav-link-active'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50',
            ].join(' ')}
          >
            <Icon size={18} className={isActive ? 'text-flame' : ''} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
