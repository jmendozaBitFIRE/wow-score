import Link from 'next/link'
import { Zap, FlaskConical, Eye, Building2, History, ShieldCheck } from 'lucide-react'

const VENTAJAS = [
  {
    icon: Zap,
    title: 'Resultados al instante',
    description:
      'Sin esperas. Tu WOW Score aparece en segundos, listo para presentar o ajustar.',
  },
  {
    icon: FlaskConical,
    title: 'Fórmula científica',
    description:
      '42 combinaciones únicas de medio × objetivo. Cada campaña evaluada con los pesos correctos.',
  },
  {
    icon: Eye,
    title: '10 dimensiones de análisis',
    description:
      'Insight, Emoción, Stopping Power, Claridad y 6 más. Un diagnóstico completo, no una opinión.',
  },
  {
    icon: Building2,
    title: 'Para equipos y agencias',
    description:
      'Multiusuario por empresa. Historial compartido. Todos en la misma página creativa.',
  },
  {
    icon: History,
    title: 'Historial de evaluaciones',
    description:
      'Compara versiones de una campaña. Ve la evolución de tu creatividad en el tiempo.',
  },
  {
    icon: ShieldCheck,
    title: 'Datos privados y seguros',
    description:
      'Tus piezas publicitarias son confidenciales. Almacenamiento cifrado, acceso solo tuyo.',
  },
]

export function VentajasSection() {
  return (
    <section
      id="ventajas"
      style={{ background: 'var(--color-ink)', padding: '96px 0' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(32px, 4vw, 42px)',
              color: 'var(--color-paper)',
              marginBottom: '16px',
            }}
          >
            La fórmula que la industria no tenía
          </h2>
        </div>

        {/* Grid 2×3 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '56px',
          }}
        >
          {VENTAJAS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="ventaja-card">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(246,101,2,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Icon size={20} color="var(--color-flame)" strokeWidth={1.75} />
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '17px',
                  color: 'var(--color-paper)',
                  marginBottom: '10px',
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--color-paper)',
                  opacity: 0.6,
                  lineHeight: 1.65,
                }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/register"
            style={{
              display: 'inline-block',
              background: 'white',
              color: 'var(--color-flame)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '16px',
              padding: '14px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            Empieza sin costo →
          </Link>
        </div>
      </div>
    </section>
  )
}
