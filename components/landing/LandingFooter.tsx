import Link from 'next/link'

const PRODUCTO_LINKS = [
  { label: '¿Cómo funciona?', href: '#como-funciona' },
  { label: 'Ventajas',        href: '#ventajas'      },
  { label: 'Precios',         href: '#precios'       },
]

const CUENTA_LINKS = [
  { label: 'Crear cuenta',    href: '/register' },
  { label: 'Iniciar sesión',  href: '/login'    },
]

export function LandingFooter() {
  return (
    <footer style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
        {/* Fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12">
          {/* Logo + tagline */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-0.5 mb-4">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  color: 'var(--color-flame)',
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                }}
              >
                WOW
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  color: 'var(--color-paper)',
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Score
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                opacity: 0.6,
                lineHeight: 1.6,
                maxWidth: '260px',
              }}
            >
              La fórmula que mide la creatividad publicitaria.
            </p>
          </div>

          {/* Links en 2 grupos */}
          <div className="md:col-span-2 grid grid-cols-2 gap-8">
            {/* Producto */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.4,
                  marginBottom: '16px',
                }}
              >
                Producto
              </p>
              <ul className="space-y-3">
                {PRODUCTO_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="footer-nav-link"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px',
                        color: 'var(--color-paper)',
                        textDecoration: 'none',
                      }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cuenta */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.4,
                  marginBottom: '16px',
                }}
              >
                Cuenta
              </p>
              <ul className="space-y-3">
                {CUENTA_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="footer-nav-link"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '15px',
                        color: 'var(--color-paper)',
                        textDecoration: 'none',
                      }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider + copyright */}
        <div style={{ borderTop: '1px solid rgba(251,251,251,0.15)', paddingTop: '24px' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                opacity: 0.5,
              }}
            >
              © 2026 WOW Score. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              {[
                { label: 'Política de privacidad', href: '/privacy' },
                { label: 'Términos de uso',         href: '/terms'   },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="footer-legal-link"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'var(--color-paper)',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
