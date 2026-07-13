'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { rateEvaluationAction } from '@/lib/actions/ratings'

export function RatingWidget({ evaluationId }: { evaluationId: string }) {
  const [rating, setRating] = useState<number | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleRate(value: number) {
    if (isPending || rating !== null) return
    setIsPending(true)
    try {
      await rateEvaluationAction(evaluationId, value)
      setRating(value)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo guardar la calificación.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={isPending || rating !== null}
          onClick={() => handleRate(value)}
          aria-label={`Calificar con ${value} estrella${value > 1 ? 's' : ''}`}
          className="flex h-11 w-11 items-center justify-center disabled:cursor-default"
        >
          <Star
            size={20}
            className={(rating ?? 0) >= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
          />
        </button>
      ))}
    </div>
  )
}
