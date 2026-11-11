import Link from 'next/link'

export function CTAFinalSection() {
  return (
    <section style={{ background: 'var(--gradient-brand)', padding: '96px 0' }}>
      <div
        className="max-w-3xl mx-auto px-6"
        style={{ textAlign: 'center' }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-on-flame)',
            marginBottom: '20px',
          }}
        >
          ¿Listo para crear publicidad que impacta?
        </p>

        {/* H2 */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(32px, 5vw, 52px)',
            lineHeight: 1.1,
            color: 'var(--color-on-flame)',
            marginBottom: '24px',
          }}
        >
          Deja de adivinar.<br />
          Empieza a saber.
        </h2>

        {/* Párrafo */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'var(--color-on-flame)',
            lineHeight: 1.65,
            maxWidth: '480px',
            margin: '0 auto 40px',
          }}
        >
          Miles de piezas publicitarias analizadas.
          La tuya puede ser la siguiente.
        </p>

        {/* CTA botón */}
        <Link
          href="/register"
          className="cta-final-btn"
          style={{
            display: 'inline-block',
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '17px',
            padding: '18px 40px',
            borderRadius: '14px',
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            marginBottom: '20px',
          }}
        >
          Crear mi cuenta gratis →
        </Link>

        {/* Nota */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-on-flame)',
            marginTop: '16px',
          }}
        >
          Sin compromisos · Cancela cuando quieras
        </p>
      </div>
    </section>
  )
}
