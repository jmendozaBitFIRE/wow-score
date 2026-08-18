'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { removeMemberAction, resendInviteAction } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'

export function MemberActions({ memberId, pending }: { memberId: string; pending: boolean }) {
  const [isPending, setIsPending] = useState<'remove' | 'resend' | null>(null)
  const router = useRouter()

  async function run(kind: 'remove' | 'resend', action: () => Promise<void>) {
    setIsPending(kind)
    try {
      await action()
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.')
    } finally {
      setIsPending(null)
    }
  }

  return (
    <div className="flex gap-1.5 shrink-0">
      {pending && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending !== null}
          onClick={() => run('resend', () => resendInviteAction(memberId))}
        >
          {isPending === 'resend' ? 'Reenviando…' : 'Reenviar'}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={isPending !== null}
        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-950/30 dark:hover:bg-red-950/20"
        onClick={() => {
          if (!confirm('¿Quitar a este miembro de la empresa?')) return
          run('remove', () => removeMemberAction(memberId))
        }}
      >
        {isPending === 'remove' ? 'Quitando…' : 'Quitar'}
      </Button>
    </div>
  )
}
