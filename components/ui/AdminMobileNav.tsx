'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { List, X } from '@phosphor-icons/react'
import { AdminNavBody } from '@/components/ui/AdminSidebar'

// Barra superior + drawer para el admin en móvil/tablet (< lg). Mismo patrón que
// el MobileNav del dashboard: modal con foco atrapado, Escape cierra y el fondo no hace scroll.
export function AdminMobileNav({ userInitial, fullName }: { userInitial: string; fullName: string }) {
  const [open, setOpen] = useState(false)
  const openerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const opener = openerRef.current
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab' || !drawerRef.current) return
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      opener?.focus()
    }
  }, [open])

  return (
    <>
      <header className="no-print lg:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-white px-4 py-3 dark:bg-zinc-950 dark:border-zinc-800">
        <Link href="/admin/clients" className="flex items-center gap-2">
          <Image src="/logo-full.png" sizes="100px" alt="WowScore" width={1025} height={503} className="h-7 w-auto" priority />
          <span className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Admin</span>
        </Link>
        <button
          ref={openerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-haspopup="dialog"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <List size={22} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de administración"
            className="absolute inset-y-0 left-0 flex h-dvh w-72 max-w-[85vw] flex-col bg-white dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800 mb-4">
              <Link href="/admin/clients" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <Image src="/logo-full.png" sizes="100px" alt="WowScore" width={1025} height={503} className="h-7 w-auto" />
                <span className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Admin</span>
              </Link>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <X size={22} />
              </button>
            </div>
            <AdminNavBody userInitial={userInitial} fullName={fullName} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
