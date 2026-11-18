'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { updateProfileNameAction, changePasswordAction, type ProfileState } from '@/lib/actions/profile'

const inputClass =
  'w-full px-3 py-2 h-11 lg:h-9 text-sm rounded-lg border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50'
const labelClass = 'text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide'

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending} className="h-11 lg:h-8 min-w-[140px] max-sm:w-full">
      {pending ? busy : idle}
    </Button>
  )
}

function Feedback({ state }: { state: ProfileState }) {
  if (state?.error) {
    return <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
  }
  if (state?.success) {
    return <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{state.success}</p>
  }
  return null
}

export function NameForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState(updateProfileNameAction, undefined)
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="full_name" className={labelClass}>Nombre</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={defaultName}
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Submit idle="Guardar nombre" busy="Guardando…" />
        <Feedback state={state} />
      </div>
    </form>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="current_password" className={labelClass}>Contraseña actual</label>
        <input id="current_password" name="current_password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="new_password" className={labelClass}>Nueva contraseña</label>
          <input id="new_password" name="new_password" type="password" autoComplete="new-password" required minLength={6} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm_password" className={labelClass}>Confirmar nueva</label>
          <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required minLength={6} className={inputClass} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Submit idle="Cambiar contraseña" busy="Cambiando…" />
        <Feedback state={state} />
      </div>
    </form>
  )
}
