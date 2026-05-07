import Link from 'next/link'

const METRICS = [
  { label: 'Stopping Power', value: 88 },
  { label: 'Emoción',        value: 82 },
  { label: 'Insight',        value: 90 },
  { label: 'Claridad',       value: 85 },
  { label: 'Estética',       value: 79 },
]

export function HeroSection() {
  return (
    <section
      id="inicio"
      style={{
        minHeight: '100vh',
        paddingTop: '120px',
        paddingBottom: '96px',
        background: 'var(--color-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Círculo difuso naranja — decorativo top-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'var(--color-flame)',
          opacity: 0.06,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Dot pattern — decorativo bottom-left */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '400px',
          height: '400px',
          backgroundImage: 'radial-gradient(circle, var(--color-mist) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── Texto izquierda (55%) ── */}
          <div style={{ flex: '0 1 55%' }}>
            {/* Badge pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(246,101,2,0.08)',
                border: '1px solid rgba(246,101,2,0.18)',
                borderRadius: '100px',
                padding: '6px 16px',
                marginBottom: '28px',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-flame)',
              }}
            >
              🔥 Powered by IA + Fórmula WOW Score
            </div>

            {/* H1 */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(40px, 5vw, 64px)',
                lineHeight: 1.1,
                color: 'var(--color-ink)',
                marginBottom: '24px',
              }}
            >
              ¿Tu publicidad<br />
              realmente{' '}
              <span
                style={{
                  background: 'var(--gradient-brand)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                impacta?
              </span>
            </h1>

            {/* Párrafo */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                maxWidth: '480px',
                marginBottom: '36px',
              }}
            >
              Sube tu pieza publicitaria, selecciona el medio y objetivo,
              y obtén un análisis detallado basado en 10 dimensiones de creatividad.
              Decisiones más inteligentes. Campañas que conectan.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '28px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <Link
                href="/register"
                className="btn-primary"
                style={{
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                  borderRadius: '12px',
                }}
              >
                Evalúa ahora gratis →
              </Link>

              <a
                href="#como-funciona"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'var(--color-flame)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Ver cómo funciona{' '}
                <span className="bounce-arrow">↓</span>
              </a>
            </div>

            {/* Social proof */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}
            >
              ✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Primer análisis gratuito &nbsp;·&nbsp; ✓ Resultados en segundos
            </p>
          </div>

          {/* ── Card flotante derecha (45%) ── */}
          <div
            style={{
              flex: '0 1 45%',
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <div
              className="hero-card-float"
              style={{
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 32px 80px rgba(246,101,2,0.15), 0 8px 24px rgba(0,0,0,0.08)',
                padding: '28px',
                width: '100%',
                maxWidth: '360px',
              }}
            >
              {/* Header del card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      background: '#F4F4F3',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      display: 'inline-block',
                    }}
                  >
                    OOH · Branding
                  </span>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      marginTop: '10px',
                    }}
                  >
                    WOW Score
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-grotesque)',
                    fontWeight: 800,
                    fontSize: '56px',
                    color: 'var(--color-flame)',
                    lineHeight: 1,
                  }}
                >
                  87
                </span>
              </div>

              {/* Barras de métricas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {METRICS.map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                        width: '108px',
                        flexShrink: 0,
                      }}
                    >
                      {label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: '6px',
                        background: 'var(--color-mist)',
                        borderRadius: '100px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${value}%`,
                          background: 'var(--gradient-brand)',
                          borderRadius: '100px',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                        width: '22px',
                        textAlign: 'right',
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer del card */}
              <div
                style={{
                  borderTop: '1px solid var(--color-mist)',
                  paddingTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--color-flame)', fontWeight: 700, fontSize: '14px' }}>✓</span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Fortaleza: Alto impacto visual
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
