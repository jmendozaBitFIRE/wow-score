'use client'

import { useState, useTransition } from 'react'
import { updatePlan, deletePlan } from '@/lib/actions/admin'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, CircleNotch, Trash } from '@phosphor-icons/react'

interface Plan {
  id: string
  display_name: string
  monthly_credits: number
  trial_credits: number
  is_active: boolean
}

export const adminInputClass =
  'w-full px-3 py-2 h-11 lg:h-9 text-sm rounded-lg border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50'
export const adminLabelClass = 'text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide'

export function PlanPriceForm({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState(plan.display_name)
  const [monthlyCredits, setMonthlyCredits] = useState(String(plan.monthly_credits))
  const [trialCredits, setTrialCredits] = useState(String(plan.trial_credits))
  const [isActive, setIsActive] = useState(plan.is_active)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, startDelete] = useTransition()
  const router = useRouter()

  function handleDelete() {
    setError(null)
    startDelete(async () => {
      const res = await deletePlan(plan.id)
      if (res.error) {
        setError(res.error)
        setConfirmDelete(false)
      } else {
        router.refresh()
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setError(null)
    startTransition(async () => {
      try {
        await updatePlan({
          id: plan.id,
          display_name: displayName,
          monthly_credits: Number(monthlyCredits),
          trial_credits: Number(trialCredits),
          is_active: isActive,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor={`name-${plan.id}`} className={adminLabelClass}>Nombre visible</label>
        <input
          id={`name-${plan.id}`}
          type="text"
          value={displayName}
          maxLength={60}
          onChange={(e) => setDisplayName(e.target.value)}
          className={adminInputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={`credits-${plan.id}`} className={adminLabelClass}>Evaluaciones / mes</label>
          <input
            id={`credits-${plan.id}`}
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={monthlyCredits}
            onChange={(e) => setMonthlyCredits(e.target.value)}
            className={adminInputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`trial-${plan.id}`} className={adminLabelClass}>De prueba</label>
          <input
            id={`trial-${plan.id}`}
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={trialCredits}
            onChange={(e) => setTrialCredits(e.target.value)}
            className={adminInputClass}
          />
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Las evaluaciones se reinician a este número en cada cobro mensual; las que sobran no se acumulan.
        Un cambio aplica desde la siguiente renovación de cada cliente.
      </p>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((v) => !v)}
          className="flex min-h-11 lg:min-h-0 items-center gap-2 select-none rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span
            aria-hidden
            className={`relative inline-block w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
          </span>
          <span className="text-sm font-medium dark:text-zinc-300">{isActive ? 'Visible en precios' : 'Oculto'}</span>
        </button>

        <Button type="submit" size="sm" disabled={isPending} className="h-11 lg:h-7 min-w-[120px] max-sm:flex-1">
          {isPending ? (
            <><CircleNotch size={14} className="animate-spin mr-1.5" />Guardando…</>
          ) : saved ? (
            <><Check size={14} className="mr-1.5" />Guardado</>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-300 flex-1 min-w-[12rem]">
              ¿Eliminar este plan de la app? El precio sigue en Stripe.
            </p>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={isDeleting} className="h-11 lg:h-7">
              Cancelar
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="h-11 lg:h-7">
              {isDeleting ? <><CircleNotch size={14} className="animate-spin mr-1.5" />Eliminando…</> : 'Sí, eliminar'}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex min-h-11 lg:min-h-0 items-center gap-1.5 text-sm text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 rounded focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Trash size={14} aria-hidden />
            Eliminar plan
          </button>
        )}
      </div>
    </form>
  )
}
