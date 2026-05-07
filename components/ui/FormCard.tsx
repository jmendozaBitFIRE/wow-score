import type { ReactNode } from 'react'

interface FormCardProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function FormCard({ title, subtitle, children }: FormCardProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse 600px 400px at top right, rgba(246,101,2,0.07) 0%, transparent 70%), var(--color-bg-subtle)',
      }}
    >
      <div className="card w-full max-w-md">
        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '26px',
              color: 'var(--color-flame)',
              letterSpacing: '-0.02em',
            }}
          >
            WOW
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '26px',
              color: 'var(--color-ink)',
              letterSpacing: '-0.02em',
            }}
          >
            Score
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '24px',
            color: 'var(--color-text-primary)',
            marginBottom: subtitle ? '6px' : '24px',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-secondary)',
              fontSize: '15px',
              marginBottom: '24px',
            }}
          >
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </div>
  )
}
