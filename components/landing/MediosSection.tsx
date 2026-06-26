'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Tv, Radio, Building2, Monitor, Globe, Newspaper, Film, type LucideIcon, } from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Medio {
  id: string
  name: string
  icon: LucideIcon
  description: string
}

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const MEDIOS: Medio[] = [
  { id: 'tv', name: 'TV', icon: Tv, description: 'Televisión abierta y de paga' },
  { id: 'radio', name: 'Radio', icon: Radio, description: 'AM, FM y streaming' },
  { id: 'ooh', name: 'OOH', icon: Building2, description: 'Exterior tradicional' },
  { id: 'dooh', name: 'DOOH', icon: Monitor, description: 'Exterior digital' },
  { id: 'digital', name: 'Digital', icon: Globe, description: 'Web, social y apps' },
  { id: 'impresos', name: 'Impresos', icon: Newspaper, description: 'Prensa y revistas' },
  { id: 'cine', name: 'Cine', icon: Film, description: 'Pantallas cinematográficas' },
]

// ── ANIMATION VARIANTS ────────────────────────────────────────────────────────
const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 14, delay: 0.1 },
  },
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

/**
 * MedioCard - Tarjeta individual de cada medio
 */
function MedioCard({ medio }: { medio: Medio }) {
  const Icon = medio.icon

  return (
    <div className="group relative shrink-0 w-[220px] md:w-[300px] flex">
      <div className="relative flex-1 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 transition-all duration-500 hover:border-[#F97303]/40 hover:from-white/[0.08] hover:to-white/[0.03] hover:shadow-[0_20px_60px_rgba(249,115,3,0.15)] overflow-hidden">
        {/* Hover glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#F97303]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 md:gap-4 h-full">
          {/* Icon */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-[#F97303]/20 blur-lg group-hover:bg-[#F97303]/40 transition-all duration-500" />
            <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[#F97303]/25 to-[#F97303]/10 border border-[#F97303]/40 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icon size={20} className="md:hidden text-[#F97303]" strokeWidth={1.75} />
              <Icon size={22} className="hidden md:block text-[#F97303]" strokeWidth={1.75} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base md:text-lg text-[#FBFBFB] mb-0.5 group-hover:text-[#F97303] transition-colors duration-300">
              {medio.name}
            </h3>
            <p className="text-xs text-[#FBFBFB]/55 leading-snug group-hover:text-[#FBFBFB]/75 transition-colors duration-300">
              {medio.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * SliderTrack - Pista del slider con animación infinita continua
 */
function SliderTrack() {
  const [isDesktop, setIsDesktop] = useState(false)
  // Triplicamos los medios para asegurar un loop completamente seamless
  const duplicatedMedios = [...MEDIOS, ...MEDIOS, ...MEDIOS]

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const duration = isDesktop ? 40 : 20

  return (
    <div className="relative overflow-hidden">
      {/* Fade gradient izquierdo */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-[#1D1D1D] to-transparent z-10 pointer-events-none" />

      {/* Track animado */}
      <motion.div
        className="flex items-stretch gap-3 md:gap-6 w-max py-4"
        animate={{ x: ['0%', '-33.333%'] }}
        transition={{
          x: {
            duration: duration,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {duplicatedMedios.map((medio, index) => (
          <MedioCard key={`${medio.id}-${index}`} medio={medio} />
        ))}
      </motion.div>

      {/* Fade gradient derecho */}
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-[#1D1D1D] to-transparent z-10 pointer-events-none" />
    </div>
  )
}

// ── MAIN SECTION ─────────────────────────────────────────────────────────────
export function MediosSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section
      id="medios"
      ref={sectionRef}
      aria-label="Medios publicitarios disponibles"
      className="relative bg-[#1D1D1D] text-[#FBFBFB] py-16 md:py-24 overflow-hidden"
    >
      {/* Background elements */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse,rgba(249,115,3,0.06)_0%,transparent_60%)] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-center mb-12 md:mb-16 max-w-3xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-[#F97303]/10 border border-[#F97303]/25 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#F97303] mb-5 select-none">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97303] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F97303]" />
            </div>
            Medios soportados
          </div>

          {/* Title */}
          <h2 className="font-heading font-bold text-[clamp(32px,4.5vw,48px)] leading-[1.05] tracking-[-2px] text-[#FBFBFB] mb-5">
            Evalúa publicidad en{' '}
              <br/>
            <span className="text-[#F97303] relative inline-block">
              todos los medios
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
          <p className="text-base md:text-lg text-[#FBFBFB] leading-relaxed max-w-2xl mx-auto">
            Desde la televisión tradicional hasta el exterior digital. Analiza cualquier pieza publicitaria sin importar el medio.
          </p>
        </motion.div>

        {/* Slider */}
        <SliderTrack />
      </div>
    </section>
  )
}