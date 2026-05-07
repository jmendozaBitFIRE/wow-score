import Link from 'next/link'
import { Upload, Sliders, BarChart3 } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Upload,
    title: 'Sube tu pieza',
    description:
      'Arrastra o selecciona la imagen de tu anuncio. Aceptamos cualquier formato publicitario.',
  },
  {
    number: '02',
    icon: Sliders,
    title: 'Elige medio y objetivo',
    description:
      'Selecciona el canal (TV, Digital, OOH...) y el objetivo de tu campaña (Branding, Ventas, Lanzamiento...).',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Recibe tu WOW Score',
    description:
      'Obtén un análisis en 10 dimensiones con fortalezas, oportunidades y veredicto ejecutivo.',
  },
]

export function ComoFuncionaSection() {
  return (
    <section
      id="como-funciona"
      style={{ background: 'var(--color-bg-subtle)', padding: '96px 0' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(32px, 4vw, 42px)',
              color: 'var(--color-ink)',
              marginBottom: '16px',
            }}
          >
            Analiza en 3 pasos
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '17px',
              color: 'var(--color-text-secondary)',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            De la pieza a los insights en menos de 30 segundos.
          </p>
        </div>

        {/* Pasos */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="flex flex-col lg:flex-row items-stretch flex-1">
                {/* Card del paso */}
                <div
                  style={{
                    flex: 1,
                    background: 'white',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    padding: '32px 28px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Número grande de fondo */}
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '16px',
                      fontFamily: 'var(--font-grotesque)',
                      fontWeight: 800,
                      fontSize: '80px',
                      color: 'var(--color-flame)',
                      opacity: 0.12,
                      lineHeight: 1,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    {step.number}
                  </span>

                  {/* Ícono en círculo con gradiente */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--gradient-brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                      boxShadow: '0 4px 14px rgba(246,101,2,0.3)',
                    }}
                  >
                    <Icon size={22} color="white" strokeWidth={2} />
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: 'var(--color-ink)',
                      marginBottom: '10px',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '15px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Flecha entre pasos — solo en desktop, no en el último */}
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden lg:flex"
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 12px',
                      color: 'var(--color-flame)',
                      fontSize: '24px',
                      flexShrink: 0,
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '56px' }}>
          <Link
            href="/register"
            className="btn-primary"
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: '12px',
            }}
          >
            Analiza tu primera pieza →
          </Link>
        </div>
      </div>
    </section>
  )
}
