'use client'

import type { LucideIcon } from 'lucide-react'

interface InputFieldProps {
  label: string
  name: string
  type: 'text' | 'email' | 'password' | 'number'
  placeholder: string
  icon: LucideIcon
  error?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
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

export function InputField({
  label,
  name,
  type,
  placeholder,
  icon: Icon,
  error,
  value,
  onChange,
  required,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} style={labelStyle}>
        {label}
      </label>
      <div className="input-wrapper">
        <Icon className="input-icon" aria-hidden size={18} />
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`input-field${error ? ' error' : ''}`}
        />
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
