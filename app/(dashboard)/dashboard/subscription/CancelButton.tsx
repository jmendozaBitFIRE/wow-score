'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscriptionAction } from '@/lib/actions/subscription'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export function CancelButton() {
  const [isPending, setIsPending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    setIsPending(true)
    try {
      await cancelSubscriptionAction()
      alert('Suscripción cancelada exitosamente. Estará activa hasta el final del periodo facturado actual.')
      setShowConfirm(false)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error al cancelar.')
    } finally {
      setIsPending(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-950/30 dark:bg-red-950/10 space-y-3">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
          <AlertTriangle size={18} />
          <span className="font-semibold text-sm">¿Confirmar cancelación?</span>
        </div>
        <p className="text-xs text-red-700/80 dark:text-red-400/80">
          Tu suscripción seguirá activa hasta el final de tu período de facturación actual. Después de eso, tu plan se cambiará al plan gratuito y perderás los límites ampliados.
        </p>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? 'Cancelando...' : 'Sí, cancelar suscripción'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
          >
            Atrás
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-950/30 dark:hover:bg-red-950/20"
      onClick={() => setShowConfirm(true)}
    >
      Cancelar suscripción
    </Button>
  )
}
