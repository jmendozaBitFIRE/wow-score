'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePasswordAction } from '@/lib/actions/auth'
import { FormCard } from '@/components/ui/FormCard'
import { PasswordField } from '@/components/ui/PasswordField'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full"
      style={{ opacity: pending ? 0.7 : 1 }}
    >
      {pending ? 'Actualizando...' : 'Actualizar contraseña'}
    </button>
  )
}

export function ResetForm() {
  const [state, action] = useActionState(updatePasswordAction, undefined)
  const [password, setPassword] = useState('')

  return (
    <FormCard title="Nueva contraseña" subtitle="Ingresa tu nueva contraseña para acceder">
      <form action={action} className="space-y-4">
        <PasswordField
          label="Nueva contraseña"
          name="password"
          placeholder="········"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {state?.error && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </FormCard>
  )
}
