'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { forgotPasswordAction } from '@/lib/actions/auth'
import { FormCard } from '@/components/ui/FormCard'
import { InputField } from '@/components/ui/InputField'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full"
      style={{ opacity: pending ? 0.7 : 1 }}
    >
      {pending ? 'Enviando...' : 'Enviar enlace'}
    </button>
  )
}

export function ForgotForm({ success }: { success: boolean }) {
  const [state, action] = useActionState(forgotPasswordAction, undefined)
  const [email, setEmail] = useState('')

  return (
    <FormCard title="Recuperar contraseña" subtitle="Ingresa tu correo para recibir un enlace de recuperación">
      {success ? (
        <div className="text-center space-y-4">
          <p
            className="rounded-lg p-3 text-sm"
            style={{
              background: 'rgba(22,163,74,0.08)',
              color: 'var(--color-success)',
              border: '1px solid rgba(22,163,74,0.2)',
            }}
          >
            Si el correo está registrado, recibirás un enlace de recuperación pronto. Revisa también tu bandeja de spam.
          </p>
          <Link
            href="/login"
            className="block text-sm font-medium hover:underline mt-4"
            style={{ color: 'var(--color-flame)' }}
          >
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <InputField
            label="Email"
            name="email"
            type="email"
            placeholder="maria@empresa.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {state?.error && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {state.error}
            </p>
          )}

          <SubmitButton />

          <p
            className="mt-6 text-center text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ¿Recordaste tu contraseña?{' '}
            <Link
              href="/login"
              className="font-medium hover:underline"
              style={{ color: 'var(--color-flame)' }}
            >
              Iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </FormCard>
  )
}
