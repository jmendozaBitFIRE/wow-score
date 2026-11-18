'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check } from '@phosphor-icons/react'
import { planFeatures } from '@/lib/plans'
import { usePlans, formatPlanPrice, planPeriod, type PublicPlan } from '@/components/pricing/usePlans'

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
      className="inline-flex items-center gap-2.5 bg-flame/10 border border-flame/25 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-flame mb-5 select-none"
    >
      <div className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-flame opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-flame" />
      </div>
      Transparencia total
    </motion.div>
  )
}

/**
 * SectionHeader renders the title and subtitle block.
 */
function SectionHeader({ isInView, multiple }: { isInView: boolean; multiple: boolean }) {
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
        className="font-heading font-bold text-[clamp(32px,4.5vw,48px)] leading-[1.05] tracking-[-2px] text-paper mb-5"
      >
        {multiple ? 'Planes simples,' : 'Un plan simple,'} <br />
        <span className="text-flame relative inline-block">
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
              stroke="var(--color-flame)"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-60"
            />
          </svg>
        </span>
      </motion.h2>

      <motion.p
        variants={headerItemVariants}
        className="text-base text-paper max-w-[500px] mx-auto leading-relaxed"
      >
        {multiple
          ? 'Elige el plan que mejor se adapta a tu ritmo de trabajo. Cancela cuando quieras, sin letra chica.'
          : 'Un solo plan, todo incluido. Cancela cuando quieras, sin letra chica.'}
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
      <Check size={18} className="text-flame shrink-0 mt-0.5" />
      <span className="text-sm font-medium text-paper leading-relaxed">{text}</span>
    </li>
  )
}

/**
 * PriceDisplay muestra el monto grande con su periodo.
 */
function PriceDisplay({ price, period }: { price: string; period: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-5xl md:text-6xl font-heading font-extrabold text-white whitespace-nowrap tabular-nums">
        {price}
      </span>
      <span className="text-sm font-medium text-white/60">USD {period}</span>
    </div>
  )
}

/**
 * PlanCard es la tarjeta de un plan con su precio, evaluaciones y beneficios.
 */
function PlanCard({ plan }: { plan: PublicPlan }) {
  return (
    <motion.div
      variants={cardVariants}
      className="relative flex flex-col bg-gradient-to-b from-flame/10 to-transparent border-2 border-flame rounded-[24px] p-8 md:p-10 shadow-[0_0_30px_rgba(246,101,2,0.15)]"
    >
      <p className="text-xs font-semibold text-flame tracking-wider uppercase mb-5">
        {plan.display_name}
      </p>

      <div className="mb-3">
        <PriceDisplay price={formatPlanPrice(plan)} period={planPeriod(plan)} />
      </div>

      <p className="text-sm font-medium text-white mb-8">
        Para validar cada pieza antes de lanzarla
      </p>

      <div className="w-full h-px bg-white/10 mb-8" />

      <ul className="flex-1 list-none p-0 m-0 mb-10">
        {planFeatures(plan.monthly_credits).map((f) => (
          <FeatureItem key={f} text={f} />
        ))}
      </ul>

      <Link
        href="/register"
        className="block w-full text-center bg-flame hover:bg-flame-strong text-on-flame font-bold tracking-[0.01em] text-sm px-6 py-4 rounded-xl transition duration-200 shadow-[0_4px_14px_rgba(246,101,2,0.15)] hover:shadow-[0_8px_24px_rgba(246,101,2,0.25)] hover:-translate-y-0.5"
      >
        Valida tu creatividad →
      </Link>
    </motion.div>
  )
}

// ── MAIN SECTION ─────────────────────────────────────────────────────────────

export function PreciosSection() {
  const { plans } = usePlans()
  const trialCredits = plans[0]?.trial_credits ?? 1

  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section
      id="precios"
      ref={sectionRef}
      className="relative bg-ink text-paper py-20 md:py-28 overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(246,101,2,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(246,101,2,0.04),transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader isInView={isInView} multiple={plans.length > 1} />

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ staggerChildren: 0.15, delayChildren: 0.3 }}
          className={
            plans.length > 1
              ? 'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-12'
              : 'max-w-md mx-auto mb-12'
          }
        >
          {plans.map((plan) => (
            <PlanCard key={plan.plan_key} plan={plan} />
          ))}
        </motion.div>

        {/* Nota inferior */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm font-medium text-paper text-balance"
        >
          Pruébalo 5 días con {trialCredits} {trialCredits === 1 ? 'evaluación gratis' : 'evaluaciones gratis'} · Pago seguro con Stripe
        </motion.p>
      </div>
    </section>
  )
}
