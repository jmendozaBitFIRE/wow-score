'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Zap,
  FlaskConical,
  Eye,
  Building2,
  History,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Ventaja {
  id: number
  icon: LucideIcon
  title: string
  description: string
}

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const VENTAJAS: Ventaja[] = [
  {
    id: 1,
    icon: Zap,
    title: 'Resultados al instante',
    description:
      'Sin esperas. Tu WOW Score aparece en segundos, listo para presentar o ajustar.',
  },
  {
    id: 2,
    icon: FlaskConical,
    title: 'Fórmula científica',
    description:
      '42 combinaciones únicas de medio × objetivo. Cada campaña evaluada con los pesos correctos.',
  },
  {
    id: 3,
    icon: Eye,
    title: '10 dimensiones de análisis',
    description:
      'Insight, Emoción, Stopping Power, Claridad y 6 más. Un diagnóstico completo, no una opinión.',
  },
  {
    id: 4,
    icon: Building2,
    title: 'Para equipos y agencias',
    description:
      'Multiusuario por empresa. Historial compartido. Todos en la misma página creativa.',
  },
  {
    id: 5,
    icon: History,
    title: 'Historial de evaluaciones',
    description:
      'Compara versiones de una campaña. Ve la evolución de tu creatividad en el tiempo.',
  },
  {
    id: 6,
    icon: ShieldCheck,
    title: 'Datos privados y seguros',
    description:
      'Tus piezas publicitarias son confidenciales. Almacenamiento cifrado, acceso solo tuyo.',
  },
] as const

// ── ANIMATION VARIANTS ────────────────────────────────────────────────────────
const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 14, delay: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 18,
      delay: 0.2 + i * 0.1,
    },
  }),
}

const lineVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: {
      delay: 1.2,
      duration: 0.8,
      ease: 'easeOut' as const,
    },
  },
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

/**
 * VentajaIcon - Icono con contenedor y efectos hover/active
 */
function VentajaIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="relative shrink-0">
      <div className="absolute inset-0 w-12 h-12 rounded-2xl bg-[#F97303]/20 blur-lg group-hover:bg-[#F97303]/40 transition-all duration-500" />
      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F97303]/25 to-[#F97303]/10 border border-[#F97303]/40 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 active:scale-110 active:rotate-3 transition-all duration-500">
        <Icon size={22} className="text-[#F97303]" strokeWidth={1.75} />
      </div>
    </div>
  )
}

/**
 * VentajaCard - Tarjeta unificada responsive (Desktop y Mobile)
 */
function VentajaCard({ ventaja, index }: { ventaja: Ventaja; index: number }) {
  const Icon = ventaja.icon

  return (
    <div className="relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-5 lg:p-6 transition-all duration-500 hover:border-[#F97303]/40 hover:from-white/[0.08] hover:to-white/[0.03] hover:shadow-[0_20px_60px_rgba(249,115,3,0.15)] active:border-[#F97303]/40 active:from-white/[0.08] active:to-white/[0.03] active:shadow-[0_20px_60px_rgba(249,115,3,0.15)] overflow-hidden">
      {/* Hover/Active glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#F97303]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Mobile number badge */}
      <div className="absolute top-4 right-4 lg:hidden font-heading font-black text-5xl text-[#F97303]/15 select-none" aria-hidden="true">
        {index + 1}
      </div>

      <div className="relative z-10 flex items-start gap-4">
        <VentajaIcon Icon={Icon} />

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg text-[#FBFBFB] mb-1.5 max-w-[220px] lg:max-w-none group-hover:text-[#F97303] active:text-[#F97303] transition-colors duration-300">
            {ventaja.title}
          </h3>
          <p className="text-sm text-[#FBFBFB] leading-relaxed group-hover:text-[#FBFBFB]/85 active:text-[#FBFBFB]/85 transition-colors duration-300">
            {ventaja.description}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * VentajaNumber - Número gigante decorativo (solo desktop)
 */
function VentajaNumber({ index }: { index: number }) {
  return (
    <div className="relative" aria-hidden="true">
      <span className="font-heading font-black text-[120px] leading-none text-transparent bg-clip-text bg-gradient-to-br from-[#F97303]/40 to-[#F97303]/5 select-none">
        {index + 1}
      </span>
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle,rgba(249,115,3,0.15),transparent_70%)] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </div>
  )
}

/**
 * VentajaItem - Item completo con layout responsive
 */
function VentajaItem({
  ventaja,
  index,
  isInView,
}: {
  ventaja: Ventaja
  index: number
  isInView: boolean
}) {
  const isEven = index % 2 === 0

  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="group relative"
    >
      {/* Desktop layout */}
      <div className="hidden lg:flex items-center gap-8">
        {/* Left side */}
        <div className="flex-1 flex items-center justify-end">
          {isEven && <VentajaNumber index={index} />}
        </div>

        {/* Center card */}
        <div className="w-96 relative">
          <VentajaCard ventaja={ventaja} index={index} />
        </div>

        {/* Right side */}
        <div className="flex-1 flex items-center justify-start">
          {!isEven && <VentajaNumber index={index} />}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden relative">
        <VentajaCard ventaja={ventaja} index={index} />
      </div>
    </motion.div>
  )
}

// ── MAIN SECTION ─────────────────────────────────────────────────────────────
export function VentajasSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section
      id="ventajas"
      ref={sectionRef}
      aria-label="Ventajas competitivas de WOW Score"
      className="relative bg-[#1D1D1D] text-[#FBFBFB] py-16 lg:py-24 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[radial-gradient(ellipse,rgba(249,115,3,0.08)_0%,transparent_60%)] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(249,115,3,0.05),transparent_70%)] pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-center mb-12 lg:mb-16 max-w-3xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-[#F97303]/10 border border-[#F97303]/25 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#F97303] mb-5 select-none">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97303] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F97303]" />
            </div>
            Ventajas Competitivas
          </div>

          {/* Title */}
          <h2 className="font-heading font-bold text-[clamp(32px,4.5vw,48px)] leading-[1.05] tracking-[-2px] text-[#FBFBFB] mb-5">
            La fórmula que la{' '}
            <br/>
            <span className="text-[#F97303] relative inline-block">
              industria no tenía
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
          </h2>

          {/* Description */}
          <p className="text-base lg:text-lg text-[#FBFBFB] leading-relaxed max-w-2xl mx-auto">
            Descubre cómo nuestro análisis científico transforma la manera en que evalúas y optimizas tus campañas creativas.
          </p>
        </motion.div>

        {/* Ventajas Flow */}
        <div className="relative flex flex-col gap-8 lg:gap-16">
          {/* Continuous vertical line */}
          <motion.div
            variants={lineVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#F97303]/40 to-transparent -translate-x-1/2 origin-top"
            aria-hidden="true"
          />

          {VENTAJAS.map((ventaja, index) => (
            <VentajaItem
              key={ventaja.id}
              ventaja={ventaja}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: 1 }}
          className="mt-12 lg:mt-16 text-center"
        >
         <Link
        href="/register"
        className="bg-[#F97303] text-white font-bold px-8 py-4 rounded-xl text-sm hover:bg-[#ff8c20] transition-all duration-200 shadow-[0_4px_14px_rgba(249,115,3,0.15)] hover:shadow-[0_12px_32_rgba(249,115,3,0.3)] hover:-translate-y-0.5 inline-flex items-center"
      >
       Empieza sin costo →
      </Link>
        </motion.div>
      </div>
    </section>
  )
}
