'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  label: string
  children?: React.ReactNode
}

export function NavLink({ href, label, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`nav-link flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
        isActive
          ? 'nav-link-active'
          : 'text-[var(--color-text-secondary)] hover:bg-zinc-100 hover:text-[var(--color-text-primary)] dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
      }`}
    >
      {children}
      {label}
    </Link>
  )
}
