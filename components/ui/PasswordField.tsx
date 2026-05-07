'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps {
  label: string
  name: string
  placeholder: string
  error?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  minLength?: number
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const errorStyle: React.CSSProperties = {
  color: 'var(--color-error)',
  fontSize: '12px',
}

export function PasswordField({
  label,
  name,
  placeholder,
  error,
  value,
  onChange,
  required,
  minLength,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} style={labelStyle}>
        {label}
      </label>
      <div className="input-wrapper">
        <Lock className="input-icon" aria-hidden size={18} />
        <input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          className={`input-field has-right-icon${error ? ' error' : ''}`}
        />
        {/* Both icons rendered simultaneously for opacity cross-fade */}
        <button
          type="button"
          className="input-icon-right"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{ background: 'none', border: 'none', padding: 0, width: 18, height: 18 }}
        >
          <Eye
            size={18}
            aria-hidden
            style={{ position: 'absolute', top: 0, left: 0, opacity: showPassword ? 0 : 1, transition: 'opacity 0.15s' }}
          />
          <EyeOff
            size={18}
            aria-hidden
            style={{ position: 'absolute', top: 0, left: 0, opacity: showPassword ? 1 : 0, transition: 'opacity 0.15s' }}
          />
        </button>
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
