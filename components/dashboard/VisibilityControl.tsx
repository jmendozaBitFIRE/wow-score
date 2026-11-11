'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, UsersThree, Buildings, Globe, Copy, Check } from '@phosphor-icons/react'
import { updateVisibilityAction, type Visibility } from '@/lib/actions/evaluations'
import { useToast } from '@/components/ui/toast'

const OPTIONS: { value: Visibility; label: string; icon: typeof Lock }[] = [
  { value: 'private', label: 'Privado', icon: Lock },
  { value: 'team', label: 'Equipo', icon: UsersThree },
  { value: 'company', label: 'Compañía', icon: Buildings },
  { value: 'public', label: 'Público', icon: Globe },
]

interface VisibilityControlProps {
  evaluationId: string
  visibility: Visibility
  sharedTeamId: string | null
  teams: { id: string; name: string }[]
}

export function VisibilityControl({ evaluationId, visibility, sharedTeamId, teams }: VisibilityControlProps) {
  const toast = useToast()
  const [current, setCurrent] = useState(visibility)
  const [teamId, setTeamId] = useState(sharedTeamId ?? '')
  const [isPending, setIsPending] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${evaluationId}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar el link. Cópialo manualmente desde la barra de direcciones.')
    }
  }

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
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la visibilidad.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visibilidad</p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => change(value, value === 'team' ? teamId || undefined : undefined)}
            className={[
              'flex min-w-0 min-h-11 lg:min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50',
              current === value
                ? 'border-primary bg-primary/10 text-flame-text'
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <p className="flex-1">Cualquiera con el link puede verlo, sin iniciar sesión.</p>
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 flex items-center gap-1 rounded-md border px-2 py-1 font-medium text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
        </div>
      )}
    </div>
  )
}
