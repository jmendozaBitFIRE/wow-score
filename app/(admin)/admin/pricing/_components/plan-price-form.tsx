'use client'

import { useState, useTransition } from 'react'
import { updatePlanPrice } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'

interface PlanPrice {
  id: string
  plan_key: string
  display_name: string
  price_amount: number
  stripe_price_id: string
  is_active: boolean
}

export function PlanPriceForm({ plan }: { plan: PlanPrice }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [priceAmount, setPriceAmount] = useState(plan.price_amount)
  const [stripePriceId, setStripePriceId] = useState(plan.stripe_price_id)
  const [isActive, setIsActive] = useState(plan.is_active)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    startTransition(async () => {
      await updatePlanPrice({ id: plan.id, price_amount: priceAmount, stripe_price_id: stripePriceId, is_active: isActive })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Precio (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceAmount}
            onChange={(e) => setPriceAmount(parseFloat(e.target.value) || 0)}
            className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Stripe Price ID
        </label>
        <input
          type="text"
          value={stripePriceId}
          onChange={(e) => setStripePriceId(e.target.value)}
          placeholder="price_..."
          className="w-full px-3 py-2 text-sm font-mono rounded-lg border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            role="checkbox"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
              isActive ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm font-medium dark:text-zinc-300">
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        </label>

        <Button type="submit" size="sm" disabled={isPending} className="min-w-[120px]">
          {isPending ? (
            <><Loader2 size={14} className="animate-spin mr-1.5" />Guardando…</>
          ) : saved ? (
            <><Check size={14} className="mr-1.5" />Guardado</>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  )
}
