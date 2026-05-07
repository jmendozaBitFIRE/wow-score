'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { User, Building2, Mail } from 'lucide-react'
import { registerAction } from '@/lib/actions/auth'
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
      {pending ? 'Creando cuenta…' : 'Crear cuenta'}
    </button>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, undefined)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <FormCard title="Crear cuenta" subtitle="Registra tu empresa y comienza a evaluar">
      <form action={action} className="space-y-4">
        <InputField
          label="Nombre completo"
          name="full_name"
          type="text"
          placeholder="María García"
          icon={User}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <InputField
          label="Empresa"
          name="company_name"
          type="text"
          placeholder="Mi Empresa"
          icon={Building2}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />

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
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
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
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-medium hover:underline"
          style={{ color: 'var(--color-flame)' }}
        >
          Inicia sesión
        </Link>
      </p>
    </FormCard>
  )
}
