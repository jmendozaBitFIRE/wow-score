'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { loginAction } from '@/lib/actions/auth'
import { FormCard } from '@/components/ui/FormCard'
import { InputField } from '@/components/ui/InputField'
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
      {pending ? 'Entrando…' : 'Iniciar sesión'}
    </button>
  )
}

export function LoginForm({ registered }: { registered: boolean }) {
  const [state, action] = useActionState(loginAction, undefined)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <FormCard title="Iniciar sesión" subtitle="Accede a tu cuenta de WowScore">
      {registered && (
        <p
          className="mb-4 rounded-lg p-3 text-sm"
          style={{
            background: 'rgba(22,163,74,0.08)',
            color: 'var(--color-success)',
            border: '1px solid rgba(22,163,74,0.2)',
          }}
        >
          Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.
        </p>
      )}

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

        <PasswordField
          label="Contraseña"
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

      <p
        className="mt-6 text-center text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        ¿No tienes cuenta?{' '}
        <Link
          href="/register"
          className="font-medium hover:underline"
          style={{ color: 'var(--color-flame)' }}
        >
          Regístrate
        </Link>
      </p>
    </FormCard>
  )
}
