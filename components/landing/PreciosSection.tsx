'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check } from 'lucide-react'

const SOLO_FEATURES = [
  '1 usuario',
  'Análisis ilimitados',
  'Historial de 90 días',
  'Todos los medios y objetivos',
  'Exportar resultados',
]

const TEAM_FEATURES = [
  'Hasta 5 usuarios',
  'Historial ilimitado',
  'Dashboard compartido',
  'Prioridad en soporte',
  'Todo lo del plan Solo',
]

// Precios placeholder — serán reemplazados por valores de DB
const PRICES = {
  solo:  { monthly: 49,  annual: 39  },
  team:  { monthly: 149, annual: 119 },
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
      <Check
        size={16}
        style={{ color: 'var(--color-flame)', flexShrink: 0, marginTop: '2px' }}
        strokeWidth={2.5}
      />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        {text}
      </span>
    </li>
  )
}

export function PreciosSection() {
  const [annual, setAnnual] = useState(false)

  const soloPrice = annual ? PRICES.solo.annual  : PRICES.solo.monthly
  const teamPrice = annual ? PRICES.team.annual  : PRICES.team.monthly

  return (
    <section id="precios" style={{ background: 'var(--color-bg)', padding: '96px 0' }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(32px, 4vw, 42px)',
              color: 'var(--color-ink)',
              marginBottom: '12px',
            }}
          >
            Planes simples, valor claro
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)' }}>
            Cancela cuando quieras. Sin letra chica.
          </p>
        </div>

        {/* Toggle mensual / anual */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: '100px',
              padding: '4px',
              gap: '4px',
            }}
          >
            {['Mensual', 'Anual'].map((label) => {
              const isAnual = label === 'Anual'
              const active = annual === isAnual
              return (
                <button
                  key={label}
                  onClick={() => setAnnual(isAnual)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '8px 20px',
                    borderRadius: '100px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: active ? 'white' : 'transparent',
                    color: active ? 'var(--color-ink)' : 'var(--color-text-secondary)',
                    boxShadow: active ? '0 1px 4px rgba(29,29,27,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {label}
                  {isAnual && (
                    <span
                      style={{
                        background: 'var(--gradient-brand)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '100px',
                        opacity: annual ? 1 : 0.5,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      Ahorra 20%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: '32px' }}>

          {/* Card Solo */}
          <div
            style={{
              background: 'white',
              border: '1.5px solid var(--color-border)',
              borderRadius: '20px',
              padding: '36px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              Para creativos independientes
            </p>

            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-grotesque)',
                  fontWeight: 800,
                  fontSize: '48px',
                  color: 'var(--color-ink)',
                  lineHeight: 1,
                  transition: 'opacity 0.2s',
                }}
              >
                ${soloPrice}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
                /mes
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>
              1 usuario · Análisis ilimitados · Historial completo
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
              {SOLO_FEATURES.map((f) => <FeatureItem key={f} text={f} />)}
            </ul>

            <Link
              href="/register"
              style={{
                display: 'block',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '15px',
                padding: '13px',
                borderRadius: '12px',
                border: '1.5px solid var(--color-ink)',
                color: 'var(--color-ink)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Valida tu creatividad
            </Link>
          </div>

          {/* Card Team — destacada */}
          <div
            style={{
              background: 'white',
              border: '2px solid var(--color-flame)',
              borderRadius: '20px',
              padding: '36px',
              boxShadow: '0 0 0 4px rgba(246,101,2,0.1)',
              position: 'relative',
            }}
          >
            {/* Badge Más popular */}
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--gradient-brand)',
                color: 'white',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 16px',
                borderRadius: '100px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(246,101,2,0.35)',
              }}
            >
              Más popular
            </div>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-flame)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              Hasta 5 usuarios · Todo lo de Solo +
            </p>

            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-grotesque)',
                  fontWeight: 800,
                  fontSize: '48px',
                  color: 'var(--color-ink)',
                  lineHeight: 1,
                  transition: 'opacity 0.2s',
                }}
              >
                ${teamPrice}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
                /mes
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>
              Hasta 5 usuarios · Todo lo de Solo +
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
              {TEAM_FEATURES.map((f) => <FeatureItem key={f} text={f} />)}
            </ul>

            <Link
              href="/register"
              className="btn-primary"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '13px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              Mi equipo necesita esto
            </Link>
          </div>
        </div>

        {/* Nota inferior */}
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          💳 Sin tarjeta de crédito para empezar · Pago seguro con Stripe
        </p>
      </div>
    </section>
  )
}
