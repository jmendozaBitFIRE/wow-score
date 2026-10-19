'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, UsersRound, Building2, Globe } from 'lucide-react'
import { updateVisibilityAction, type Visibility } from '@/lib/actions/evaluations'

const OPTIONS: { value: Visibility; label: string; icon: typeof Lock }[] = [
  { value: 'private', label: 'Privado', icon: Lock },
  { value: 'team', label: 'Equipo', icon: UsersRound },
  { value: 'company', label: 'Compañía', icon: Building2 },
  { value: 'public', label: 'Público', icon: Globe },
]

interface VisibilityControlProps {
  evaluationId: string
  visibility: Visibility
  sharedTeamId: string | null
  teams: { id: string; name: string }[]
}

export function VisibilityControl({ evaluationId, visibility, sharedTeamId, teams }: VisibilityControlProps) {
  const [current, setCurrent] = useState(visibility)
  const [teamId, setTeamId] = useState(sharedTeamId ?? '')
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  async function change(value: Visibility, nextTeamId?: string) {
    if (isPending) return
    if (value === 'team' && !nextTeamId) {
      setCurrent('team') // solo abre el selector, no llama a la acción todavía
      return
    }
    setIsPending(true)
    try {
      await updateVisibilityAction(evaluationId, value, nextTeamId)
      setCurrent(value)
      if (nextTeamId) setTeamId(nextTeamId)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo actualizar la visibilidad.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visibilidad</p>
      <div className="flex gap-2">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => change(value, value === 'team' ? teamId || undefined : undefined)}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50',
              current === value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {current === 'team' && (
        teams.length > 0 ? (
          <select
            value={teamId}
            onChange={(e) => change('team', e.target.value)}
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50"
          >
            <option value="" disabled>Selecciona un equipo…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tu compañía no tiene equipos todavía — créalos en Equipo.
          </p>
        )
      )}
      {current === 'private' && (
        <p className="text-xs text-muted-foreground">Solo tú puedes ver este análisis.</p>
      )}
      {current === 'company' && (
        <p className="text-xs text-muted-foreground">Cualquiera en tu empresa puede verlo.</p>
      )}
      {current === 'public' && (
        <p className="text-xs text-muted-foreground">
          Cualquiera con el link puede verlo, sin iniciar sesión: <span className="font-mono">/share/{evaluationId}</span>
        </p>
      )}
    </div>
  )
}
