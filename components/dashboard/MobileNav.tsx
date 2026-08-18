'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, LogOut } from 'lucide-react'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { signOutAction } from '@/lib/actions/auth'

interface MobileNavProps {
  isAdmin: boolean
  userEmail: string
}

export function MobileNav({ isAdmin, userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top bar — solo móvil/tablet, oculta en desktop (lg:) donde vive el sidebar fijo */}
      <header className="no-print lg:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-white px-4 py-3 dark:bg-zinc-950 dark:border-zinc-800">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo-full.png" alt="WowScore" width={1025} height={503} className="h-7 w-auto" priority />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Overlay + drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center"
              >
                <Image src="/logo-full.png" alt="WowScore" width={1025} height={503} className="h-7 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4" onClick={() => setOpen(false)}>
              <SidebarNav isAdmin={isAdmin} />
            </div>

            <div className="p-4 border-t dark:border-zinc-800">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
                  {userEmail[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate dark:text-zinc-200">{userEmail}</p>
                </div>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="nav-link w-full flex items-center gap-3 px-3 py-2 min-h-11 text-sm font-medium rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 mt-2"
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
