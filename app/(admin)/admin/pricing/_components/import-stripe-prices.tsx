'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { listImportableStripePrices, importStripePrice, type ImportableStripePrice } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { CircleNotch, DownloadSimple, X } from '@phosphor-icons/react'
import { adminInputClass, adminLabelClass } from './plan-price-form'

function formatAmount(p: ImportableStripePrice) {
  const amount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: p.currency,
    currencyDisplay: 'narrowSymbol',
  }).format(p.amount)
  const interval = p.interval === 'year' ? 'año' : p.interval === 'month' ? 'mes' : p.interval
  return `${amount} ${p.currency.toUpperCase()} / ${interval}`
}

function ImportRow({ price, onDone }: { price: ImportableStripePrice; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(price.nickname || price.productName)
  const [credits, setCredits] = useState('100')
  const [trial, setTrial] = useState('1')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await importStripePrice({
        stripe_price_id: price.id,
        display_name: name,
        monthly_credits: Number(credits),
        trial_credits: Number(trial),
      })
      if (res.error) setError(res.error)
      else onDone()
    })
  }

  return (
    <form onSubmit={submit} className="rounded-lg border dark:border-zinc-800 p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold dark:text-zinc-100">{price.productName}</p>
        <p className="text-sm tabular-nums dark:text-zinc-200">{formatAmount(price)}</p>
      </div>
      <p className="text-xs font-mono text-zinc-500 break-all">{price.id}</p>

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem]">
        <div className="space-y-1 min-w-0">
          <label htmlFor={`imp-name-${price.id}`} className={adminLabelClass}>Nombre visible</label>
          <input id={`imp-name-${price.id}`} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={adminInputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor={`imp-cred-${price.id}`} className={adminLabelClass}>Eval. / mes</label>
          <input id={`imp-cred-${price.id}`} type="number" min="0" step="1" inputMode="numeric" value={credits} onChange={(e) => setCredits(e.target.value)} className={adminInputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor={`imp-trial-${price.id}`} className={adminLabelClass}>De prueba</label>
          <input id={`imp-trial-${price.id}`} type="number" min="0" step="1" inputMode="numeric" value={trial} onChange={(e) => setTrial(e.target.value)} className={adminInputClass} />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending} className="h-11 lg:h-8 max-sm:w-full">
          {isPending ? <><CircleNotch size={14} className="animate-spin mr-1.5" />Registrando…</> : 'Registrar plan'}
        </Button>
      </div>
    </form>
  )
}

export function ImportStripePrices({ liveMode }: { liveMode: boolean }) {
  const router = useRouter()
  const [isLoading, startLoading] = useTransition()
  const [prices, setPrices] = useState<ImportableStripePrice[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setError(null)
    startLoading(async () => {
      try {
        setPrices(await listImportableStripePrices())
      } catch {
        setError('No se pudo consultar Stripe. Revisa que la llave secreta esté configurada.')
      }
    })
  }

  function handleImported(id: string) {
    setPrices((prev) => prev?.filter((p) => p.id !== id) ?? null)
    router.refresh()
  }

  return (
    <section className="rounded-xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold dark:text-zinc-100">Importar precios de Stripe</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Crea el precio en Stripe ({liveMode ? 'producción' : 'modo de pruebas'}) y regístralo aquí con sus evaluaciones.
          </p>
        </div>
        {prices === null ? (
          <Button type="button" size="sm" variant="outline" onClick={load} disabled={isLoading} className="h-11 lg:h-8 max-sm:w-full">
            {isLoading ? <CircleNotch size={14} className="animate-spin mr-1.5" /> : <DownloadSimple size={14} className="mr-1.5" />}
            Buscar precios en Stripe
          </Button>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setPrices(null)} className="h-11 lg:h-8">
            <X size={14} className="mr-1.5" />Cerrar
          </Button>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {prices !== null && prices.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No hay precios nuevos: todos los precios recurrentes activos de Stripe ya están registrados.
        </p>
      )}

      {prices && prices.length > 0 && (
        <div className="space-y-3">
          {prices.map((p) => (
            <ImportRow key={p.id} price={p} onDone={() => handleImported(p.id)} />
          ))}
        </div>
      )}
    </section>
  )
}
