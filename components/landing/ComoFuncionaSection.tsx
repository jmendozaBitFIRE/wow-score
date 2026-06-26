'use client'

import Link from 'next/link'
import { Fragment, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Upload, Sliders, BarChart3 } from 'lucide-react'

// ── CONSTANTS ────────────────────────────────────────────────────────────────
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
] as const

const STEP_STAGGER = 0.55

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

const timelineVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STEP_STAGGER, delayChildren: 0.25 },
  },
}

const stepVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 16 },
  },
}

const connectorHorizontalVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.55, ease: 'easeOut' as const },
  },
}

const connectorDotHorizontalVariants = {
  hidden: { left: '0%', opacity: 0 },
  visible: {
    left: '100%',
    opacity: [0, 1, 1, 0],
    transition: { duration: 0.55, ease: 'easeOut' as const, delay: 0.05 },
  },
}

const connectorVerticalVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
}

const connectorDotVerticalVariants = {
  hidden: { top: '0%', opacity: 0 },
  visible: {
    top: '100%',
    opacity: [0, 1, 0],
    transition: { duration: 0.45, ease: 'easeOut' as const, delay: 0.05 },
  },
}

// ── TYPES ────────────────────────────────────────────────────────────────────
type StepData = (typeof STEPS)[number]

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
      Proceso simple
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
      className="text-center mb-14 md:mb-20"
    >
      <SectionBadge />

     <motion.h2
  variants={headerItemVariants}
  className="font-heading font-bold text-[clamp(32px,4.5vw,48px)] leading-[1.05] tracking-[-2px] text-[#FBFBFB] mb-5"
>
  Analiza en{' '}
    <br />
  <span className="text-[#F97303] relative inline-block">
    3 pasos
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
        De la pieza a los insights en menos de 30 segundos.
      </motion.p>
    </motion.div>
  )
}

/**
 * StepNode renders the numbered circle with icon on the timeline.
 */
function StepNode({ step }: { step: StepData }) {
  const Icon = step.icon

  return (
    <div className="relative flex flex-col items-center">
      {/* Outer glow ring */}
      <div className="absolute inset-0 m-auto w-20 h-20 md:w-[88px] md:h-[88px] rounded-full bg-[#F97303]/10 blur-md pointer-events-none" />

      {/* Circle node */}
      <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1D1D1D] border-2 border-[#F97303]/50 flex items-center justify-center shadow-[0_0_24px_rgba(249,115,3,0.2)]">
        <Icon size={28} className="text-[#F97303] md:w-8 md:h-8" strokeWidth={1.75} />

        {/* Number badge */}
        <span className="absolute -top-1.5 -right-1.5 min-w-[26px] h-[26px] px-1 flex items-center justify-center rounded-full bg-[#F97303] text-[#FBFBFB] text-[10px] font-bold tracking-wide shadow-[0_4px_12px_rgba(249,115,3,0.4)]">
          {step.number}
        </span>
      </div>
    </div>
  )
}

/**
 * StepCard renders the glass card with title and description below each node.
 */
function StepCard({ step }: { step: StepData }) {
  return (
    <div className="mt-5 md:mt-6 w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[20px] md:rounded-[24px] p-5 md:p-6 text-center transition-colors duration-300 hover:border-[#F97303]/25 hover:bg-white/[0.05]">
      <h3 className="font-heading font-bold text-base md:text-lg text-[#FBFBFB] mb-2">
        {step.title}
      </h3>
      <p className="text-sm text-[#FBFBFB] leading-relaxed">
        {step.description}
      </p>
    </div>
  )
}

/**
 * StepItem groups the node and card for a single timeline step.
 */
function StepItem({ step }: { step: StepData }) {
  return (
    <motion.div variants={stepVariants} className="flex flex-col items-center w-full md:flex-1 md:min-w-0">
      <StepNode step={step} />
      <StepCard step={step} />
    </motion.div>
  )
}

/**
 * HorizontalConnector draws an animated line between steps on desktop.
 */
function HorizontalConnector() {
  return (
    <motion.div
      variants={connectorHorizontalVariants}
      className="hidden md:flex items-center shrink-0 w-10 lg:w-16 xl:w-24 self-start mt-9 lg:mt-10 origin-left"
      aria-hidden
    >
      {/* Track */}
      <div className="relative w-full h-[2px] bg-white/10 rounded-full overflow-visible">
        {/* Animated fill */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F97303] via-[#F97303]/70 to-[#F97303]/30 rounded-full" />

        {/* Traveling dot */}
        <motion.span
          variants={connectorDotHorizontalVariants}
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F97303] shadow-[0_0_8px_rgba(249,115,3,0.8)]"
        />
      </div>

      {/* Arrow head */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F97303"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 ml-0.5 opacity-80"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </motion.div>
  )
}

/**
 * VerticalConnector draws an animated line between steps on mobile.
 */
function VerticalConnector() {
  return (
    <motion.div
      variants={connectorVerticalVariants}
      className="flex md:hidden flex-col items-center py-1 origin-top"
      aria-hidden
    >
      <div className="relative w-[2px] h-10 bg-white/10 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F97303] to-[#F97303]/30 rounded-full" />
        <motion.span
          variants={connectorDotVerticalVariants}
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#F97303] shadow-[0_0_8px_rgba(249,115,3,0.8)]"
        />
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F97303"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 opacity-70"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </motion.div>
  )
}

/**
 * StepsTimeline orchestrates sequential step reveal with connectors.
 */
function StepsTimeline({ isInView }: { isInView: boolean }) {
  return (
    <>
      {/* Desktop: horizontal timeline */}
      <motion.ol
        variants={timelineVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="hidden md:flex items-start justify-center w-full list-none m-0 p-0"
      >
        {STEPS.map((step, index) => (
          <Fragment key={step.number}>
            <li className="flex flex-1 min-w-0">
              <StepItem step={step} />
            </li>
            {index < STEPS.length - 1 && (
              <li aria-hidden className="list-none">
                <HorizontalConnector />
              </li>
            )}
          </Fragment>
        ))}
      </motion.ol>

      {/* Mobile: vertical timeline */}
      <motion.ol
        variants={timelineVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="flex md:hidden flex-col items-center w-full max-w-md mx-auto list-none m-0 p-0"
      >
        {STEPS.map((step, index) => (
          <Fragment key={step.number}>
            <li className="w-full">
              <StepItem step={step} />
            </li>
            {index < STEPS.length - 1 && (
              <li aria-hidden className="list-none">
                <VerticalConnector />
              </li>
            )}
          </Fragment>
        ))}
      </motion.ol>
    </>
  )
}

/**
 * SectionCTA renders the call-to-action buttons at the bottom.
 */
function SectionCTA({ isInView }: { isInView: boolean }) {
  return (
    <motion.div
      variants={headerItemVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ delay: STEP_STAGGER * STEPS.length + 0.3 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-14 md:mt-16"
    >
      <Link
        href="/register"
        className="bg-[#F97303] text-white font-bold px-8 py-4 rounded-xl text-sm hover:bg-[#ff8c20] transition-all duration-200 shadow-[0_4px_14px_rgba(249,115,3,0.15)] hover:shadow-[0_12px_32px_rgba(249,115,3,0.3)] hover:-translate-y-0.5 inline-flex items-center"
      >
        Analiza tu primera pieza →
      </Link>
      
    </motion.div>
  )
}

// ── MAIN SECTION ─────────────────────────────────────────────────────────────
export function ComoFuncionaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="relative bg-[#1D1D1D] text-[#FBFBFB] py-20 md:py-28 overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,3,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(249,115,3,0.04),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader isInView={isInView} />
        <StepsTimeline isInView={isInView} />
        <SectionCTA isInView={isInView} />
      </div>
    </section>
  )
}
