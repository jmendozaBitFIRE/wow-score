'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Trash2 } from 'lucide-react'
import { toggleTeamMemberAction, deleteTeamAction } from '@/lib/actions/teams'
import { Button } from '@/components/ui/button'

interface TeamCardProps {
  teamId: string
  name: string
  members: { id: string; full_name: string }[]
  nonMembers: { id: string; full_name: string }[]
  isOwner: boolean
}

export function TeamCard({ teamId, name, members, nonMembers, isOwner }: TeamCardProps) {
  const [isPending, setIsPending] = useState(false)
  const [selected, setSelected] = useState('')
  const router = useRouter()

  async function run(action: () => Promise<void>) {
    setIsPending(true)
    try {
      await action()
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{name}</p>
        {isOwner && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm(`¿Eliminar el equipo "${name}"?`)) return
              run(() => deleteTeamAction(teamId))
            }}
            className="text-muted-foreground hover:text-destructive disabled:opacity-50"
            aria-label={`Eliminar equipo ${name}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {members.length === 0 && <p className="text-xs text-muted-foreground">Sin miembros todavía.</p>}
        {members.map((m) => (
          <span key={m.id} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
            {m.full_name}
            {isOwner && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => toggleTeamMemberAction(teamId, m.id, false))}
                aria-label={`Quitar a ${m.full_name} de ${name}`}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
      </div>

      {isOwner && nonMembers.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={isPending}
            className="flex h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="" disabled>Añadir miembro…</option>
            {nonMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending || !selected}
            onClick={() => {
              const id = selected
              setSelected('')
              run(() => toggleTeamMemberAction(teamId, id, true))
            }}
          >
            Añadir
          </Button>
        </div>
      )}
    </div>
  )
}
