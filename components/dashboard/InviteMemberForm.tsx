'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { inviteMemberAction } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="brand" disabled={pending} className="h-9 shrink-0">
      {pending ? 'Enviando…' : 'Invitar'}
    </Button>
  )
}

export function InviteMemberForm() {
  const [state, action] = useActionState(inviteMemberAction, undefined)

  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="correo@empresa.com"
          className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <SubmitButton />
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.success}</p>}
    </form>
  )
}
