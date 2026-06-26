'use client'

import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check } from 'lucide-react'
import type { StripePlan } from '@/lib/stripe'

// ── TYPES ────────────────────────────────────────────────────────────────────
interface PriceData {
  plan_key: string
  price_amount: number
  currency: string
}

// ── CONSTANTS ────────────────────────────────────────────────────────────────
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
  'Todo lo del plan anterior',
]

// Precios por defecto con el mismo formato que devuelve la API ($)
const DEFAULT_PRICES: Record<StripePlan, string> = {
  solo_monthly: '$50',
  solo_annual: '$500',
  team_monthly: '$150',
  team_annual: '$1,500',
}

// ── ANIMATION VARIANTS ────────────────────────────────────────────────────────
const headerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const headerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 14 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 80, damping: 15 },
  },
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

/**
 * SectionBadge displays the upper pill label for the section.
 */
function SectionBadge() {
  return (
    <motion.div
      variants={headerItemVariants}
      className="inline-flex items-center gap-2.5 bg-[#F97303]/10 border border-[#F97303]/25 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#F97303] mb-5 select-none"
    >
      <div className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97303] opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F97303]" />
      </div>
      Transparencia total
    </motion.div>
  )
}

/**
 * SectionHeader renders the title and subtitle block.
 */
function SectionHeader({ isInView }: { isInView: boolean }) {
  return (
    <motion.div
      variants={headerContainerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="text-center mb-14 md:mb-16"
    >
      <SectionBadge />

      <motion.h2
        variants={headerItemVariants}
        className="font-heading font-bold text-[clamp(32px,4.5vw,48px)] leading-[1.05] tracking-[-2px] text-[#FBFBFB] mb-5"
      >
        Planes simples, <br />
        <span className="text-[#F97303] relative inline-block">
          valor claro
          <svg
            className="absolute -bottom-2 left-0 w-full"
            viewBox="0 0 300 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M2 9C50 3 150 3 298 9"
              stroke="#F97303"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-60"
            />
          </svg>
        </span>
      </motion.h2>

      <motion.p
        variants={headerItemVariants}
        className="text-base text-[#FBFBFB] max-w-[500px] mx-auto leading-relaxed"
      >
        Cancela cuando quieras. Sin letra chica ni sorpresas ocultas.
      </motion.p>
    </motion.div>
  )
}

/**
 * FeatureItem renders a single feature with a check icon.
 */
function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 mb-3.5">
      <Check size={18} className="text-[#F97303] shrink-0 mt-0.5" strokeWidth={3} />
      <span className="text-sm font-medium text-[#FBFBFB] leading-relaxed">{text}</span>
    </li>
  )
}

/**
 * PriceDisplay - Componente para mostrar el precio de forma responsive
 */
function PriceDisplay({ price, period }: { price: string; period: string }) {
  // Separar el símbolo de moneda del número
  const match = price.match(/^([^\d]+)([\d,]+)$/)
  const symbol = match ? match[1] : ''
  const amount = match ? match[2] : price

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {symbol && (
        <span className="text-2xl md:text-4xl font-bold text-white">
          {symbol}
        </span>
      )}
      <span className="text-3xl md:text-5xl font-heading font-extrabold text-white whitespace-nowrap">
        {amount}
      </span>
      <span className="text-sm font-medium text-white/50">{period}</span>
    </div>
  )
}

// ── MAIN SECTION ─────────────────────────────────────────────────────────────

export function PreciosSection() {
  const [annual, setAnnual] = useState(false)
  const [prices, setPrices] = useState<Record<StripePlan, string>>(DEFAULT_PRICES)

  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  // Cargar precios desde el endpoint API en background
  useEffect(() => {
    async function loadPrices() {
      try {
        const res = await fetch('/api/stripe/prices')
        if (res.ok) {
          const data = await res.json()
          if (data.prices && data.prices.length > 0) {
            const newPrices = { ...DEFAULT_PRICES }
            data.prices.forEach((p: PriceData) => {
              const formatted = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: p.currency,
                currencyDisplay: 'narrowSymbol',
                maximumFractionDigits: 0,
              }).format(Number(p.price_amount))

              newPrices[p.plan_key as StripePlan] = formatted
            })
            setPrices(newPrices)
          }
        }
      } catch (err) {
        console.error('Error fetching prices:', err)
      }
    }

    loadPrices()
  }, [])

  const soloPrice = annual ? prices.solo_annual : prices.solo_monthly
  const teamPrice = annual ? prices.team_annual : prices.team_monthly

  return (
    <section
      id="precios"
      ref={sectionRef}
      className="relative bg-[#1D1D1D] text-[#FBFBFB] py-20 md:py-28 overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,3,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(249,115,3,0.04),transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader isInView={isInView} />

        {/* Toggle mensual / anual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-16"
        >
          <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1.5 relative">
            {['Mensual', 'Anual'].map((label) => {
              const isAnual = label === 'Anual'
              const active = annual === isAnual
              return (
                <button
                  key={label}
                  onClick={() => setAnnual(isAnual)}
                  className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 z-10 ${
                    active ? 'text-[#1D1D1B]' : 'text-white hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="pricing-toggle"
                      className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                  {label}
                  {isAnual && (
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full transition-colors ${active ? 'bg-[#F97303] text-white' : 'bg-white/10 text-white'}`}>
                      -20%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ staggerChildren: 0.15, delayChildren: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-12"
        >
          {/* Card Solo */}
          <motion.div
            variants={cardVariants}
            className="flex flex-col bg-white/[0.02] border border-white/10 rounded-[24px] p-8 md:p-10 transition-colors duration-300 hover:bg-white/[0.04] hover:border-white/20"
          >
            <p className="text-xs font-semibold text-white tracking-wider uppercase mb-5">
              Para creativos independientes
            </p>

            <div className="mb-2">
              <PriceDisplay price={soloPrice} period="/mes" />
            </div>

            <p className="text-sm font-medium text-white mb-8 h-10">
              1 usuario · Análisis ilimitados · Historial completo
            </p>

            <div className="w-full h-px bg-white/10 mb-8" />

            <ul className="flex-1 list-none p-0 m-0 mb-10">
              {SOLO_FEATURES.map((f) => (
                <FeatureItem key={f} text={f} />
              ))}
            </ul>

            <Link
              href="/register"
              className="block w-full text-center bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm px-6 py-4 rounded-xl transition-all duration-200"
            >
              Valida tu creatividad →
            </Link>
          </motion.div>

          {/* Card Team */}
          <motion.div
            variants={cardVariants}
            className="relative flex flex-col bg-gradient-to-b from-[#F97303]/10 to-transparent border-2 border-[#F97303] rounded-[24px] p-8 md:p-10 shadow-[0_0_30px_rgba(249,115,3,0.15)]"
          >
            {/* Badge Más popular */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#F97303] to-[#F04601] text-white text-[11px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(249,115,3,0.3)]">
              Más popular
            </div>

            <p className="text-xs font-semibold text-[#F97303] tracking-wider uppercase mb-5">
              Para agencias y equipos
            </p>

            <div className="mb-2">
              <PriceDisplay price={teamPrice} period="/mes" />
            </div>

            <p className="text-sm font-medium text-white mb-8 h-10">
              Hasta 5 usuarios · Todo lo del plan anterior
            </p>

            <div className="w-full h-px bg-white/10 mb-8" />

            <ul className="flex-1 list-none p-0 m-0 mb-10">
              {TEAM_FEATURES.map((f) => (
                <FeatureItem key={f} text={f} />
              ))}
            </ul>

            <Link
              href="/register"
              className="block w-full text-center bg-[#F97303] hover:bg-[#ff8c20] text-white font-bold text-sm px-6 py-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(249,115,3,0.15)] hover:shadow-[0_8px_24px_rgba(249,115,3,0.25)] hover:-translate-y-0.5"
            >
              Mi equipo necesita esto →
            </Link>
          </motion.div>
        </motion.div>

        {/* Nota inferior */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm font-medium text-[#FBFBFB] flex items-center justify-center gap-2"
        >
          <span>💳</span> Sin tarjeta de crédito para empezar · Pago seguro con Stripe
        </motion.p>
      </div>
    </section>
  )
}