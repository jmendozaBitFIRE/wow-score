'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Upload,
  History,
  CreditCard,
} from 'lucide-react'

const navItems = [
  { label: 'Inicio',      href: '/dashboard',         icon: LayoutDashboard, exact: true  },
  { label: 'Analizar',    href: '/dashboard/upload',  icon: Upload,          exact: false },
  { label: 'Historial',   href: '/dashboard/history', icon: History,         exact: false },
  { label: 'Suscripción', href: '/dashboard/pricing', icon: CreditCard,      exact: false },
]

interface SidebarNavProps {
  isAdmin?: boolean
}

export function SidebarNav({ isAdmin = false }: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const inAdminMode = pathname.startsWith('/admin')

  return (
    <div className="flex-1 flex flex-col px-4 overflow-hidden">
      {/* Nav items */}
      <nav className="space-y-1">
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

      {/* Admin view switcher — solo visible para admins */}
      {isAdmin && (
        <div className="mt-auto pb-3 pt-4">
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              opacity: 0.6,
              marginBottom: '8px',
              paddingLeft: '2px',
            }}
          >
            Modo de vista
          </p>

          <div
            style={{
              display: 'flex',
              border: '1px solid var(--color-mist)',
              borderRadius: '10px',
              padding: '2px',
              gap: '2px',
            }}
          >
            {/* Botón Cliente */}
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '7px 12px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: !inAdminMode ? 'var(--gradient-brand)' : 'transparent',
                color: !inAdminMode ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              👤 Cliente
            </button>

            {/* Botón Admin */}
            <button
              onClick={() => router.push('/admin/clients')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '7px 12px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: inAdminMode ? 'var(--gradient-brand)' : 'transparent',
                color: inAdminMode ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
