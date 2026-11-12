'use client'

import { useState } from 'react'
import { Star } from '@phosphor-icons/react'
import { rateEvaluationAction } from '@/lib/actions/ratings'

export function RatingWidget({ evaluationId }: { evaluationId: string }) {
  const [rating, setRating] = useState<number | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRate(value: number) {
    if (isPending || rating !== null) return
    setIsPending(true)
    setError(null)
    try {
      await rateEvaluationAction(evaluationId, value)
      setRating(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la calificación.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={isPending || rating !== null}
          onClick={() => handleRate(value)}
          aria-label={`Calificar con ${value} estrella${value > 1 ? 's' : ''}`}
          className="flex h-11 w-11 items-center justify-center rounded-md disabled:cursor-default focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Star
            size={20}
            weight={(rating ?? 0) >= value ? 'fill' : 'regular'}
            className={(rating ?? 0) >= value ? 'text-yellow-400' : 'text-muted-foreground'}
          />
        </button>
      ))}
      {rating !== null && (
        <p role="status" className="ml-2 text-xs text-muted-foreground">Gracias por tu calificación</p>
      )}
      {error && (
        <p role="alert" className="ml-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
