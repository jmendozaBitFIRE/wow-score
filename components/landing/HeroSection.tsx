'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const METRICS = [
  { label: 'Stopping Power', value: 88, isGreen: false },
  { label: 'Emoción',        value: 82, isGreen: false },
  { label: 'Insight',        value: 90, isGreen: true  },
  { label: 'Claridad',       value: 85, isGreen: false },
  { label: 'Estética',       value: 79, isGreen: false },
]

const TRUST_ITEMS = [
  'Sin tarjeta de crédito',
  'Primer análisis gratuito',
  'Resultados en segundos',
]

// ── ANIMATION VARIANTS ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 14 },
  },
}

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { delay: 1.1, duration: 0.6, ease: 'easeOut' as const },
  },
}

// ── SCROLL INDICATOR COMPONENT ───────────────────────────────────────────────
/**
 * ScrollIndicator displays an animated mouse/arrow indicator at the bottom
 * of the hero section that fades out when the user scrolls down.
 */
function ScrollIndicator() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      // Hide when scrolled more than 100px
      setIsVisible(window.scrollY < 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => {
            document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          {/* Text label */}
          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white/40 font-medium select-none">
            Scroll
          </span>
          
          {/* Animated mouse icon */}
          <div className="relative w-6 h-10 md:w-7 md:h-11 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              animate={{
                y: [0, 12, 0],
                opacity: [1, 0.3, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-1 h-2 md:w-1.5 md:h-2.5 bg-[#F97303] rounded-full mt-2"
            />
          </div>
          
          {/* Small chevron arrow */}
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/40"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── ANIMATED BACKGROUND COMPONENT ────────────────────────────────────────────
/**
 * AnimatedBackground renders an interactive particle/geometry background
 * that responds to cursor movement and has continuous animations
 */
function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const particlesRef = useRef<Particle[]>([])

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    targetOpacity: number
    color: string
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize particles
    const initializeParticles = () => {
      particlesRef.current = []
      const particleCount = Math.min(60, Math.floor(window.innerWidth / 20))
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.1,
          targetOpacity: Math.random() * 0.5 + 0.1,
          color: Math.random() > 0.5 ? '#F97303' : '#4ade80',
        })
      }
    }
    initializeParticles()

    // Mouse move listener
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      // Clear canvas with semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(29, 29, 27, 0.02)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Move towards mouse with damping
        const dx = mouseRef.current.x - particle.x
        const dy = mouseRef.current.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 150

        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * 0.08
          particle.vx += (dx / distance) * force
          particle.vy += (dy / distance) * force
          particle.targetOpacity = 0.8
        } else {
          particle.targetOpacity = Math.random() * 0.5 + 0.1
        }

        // Apply damping
        particle.vx *= 0.95
        particle.vy *= 0.95

        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Smooth opacity transition
        particle.opacity += (particle.targetOpacity - particle.opacity) * 0.05

        // Wrap around edges
        if (particle.x < -10) particle.x = canvas.width + 10
        if (particle.x > canvas.width + 10) particle.x = -10
        if (particle.y < -10) particle.y = canvas.height + 10
        if (particle.y > canvas.height + 10) particle.y = -10

        // Draw particle
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections to nearby particles
        for (let j = index + 1; j < particles.length; j++) {
          const other = particles[j]
          const dist = Math.hypot(particle.x - other.x, particle.y - other.y)
          
          if (dist < 100) {
            ctx.strokeStyle = particle.color
            ctx.globalAlpha = (1 - dist / 100) * 0.1
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            ctx.stroke()
          }
        }
      })

      ctx.globalAlpha = 1

      // Draw animated geometric shapes
      const time = Date.now() * 0.0003
      
      // Rotating hexagons
      for (let i = 0; i < 3; i++) {
        ctx.save()
        ctx.translate(canvas.width / 2 + Math.sin(time + i) * 200, canvas.height / 2 + Math.cos(time + i * 1.5) * 200)
        ctx.rotate(time + i * Math.PI / 3)
        
        ctx.strokeStyle = `rgba(249, 115, 3, ${0.05 + Math.sin(time + i) * 0.03})`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let j = 0; j < 6; j++) {
          const angle = (j / 6) * Math.PI * 2
          const x = Math.cos(angle) * (50 + Math.sin(time + i) * 20)
          const y = Math.sin(angle) * (50 + Math.sin(time + i) * 20)
          if (j === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      }

      // Pulsing circles
      for (let i = 0; i < 2; i++) {
        const radius = 100 + Math.sin(time + i) * 50
        ctx.strokeStyle = `rgba(74, 222, 128, ${0.03 + Math.sin(time + i) * 0.02})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  )
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

/**
 * HeroBadge displays the premium IA powered badge with a pulsing animation.
 */
function HeroBadge() {
  return (
    <motion.div
      variants={itemVariants}
      className="inline-flex items-center gap-2.5 bg-[#F97303]/10 border border-[#F97303]/25 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#F97303] mb-2 select-none"
    >
      <div className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97303] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F97303]"></span>
      </div>
      Powered by IA · Fórmula WOW Score
    </motion.div>
  )
}

/**
 * HeroActions renders primary call to action and the informative link buttons.
 */
function HeroActions() {
  return (
    <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
      <Link
        href="/register"
        className="bg-[#F97303] text-white font-bold px-8 py-4 rounded-xl text-sm hover:bg-[#ff8c20] transition-all duration-200 shadow-[0_4px_14px_rgba(249,115,3,0.15)] hover:shadow-[0_12px_32px_rgba(249,115,3,0.3)] hover:-translate-y-0.5 inline-flex items-center"
      >
        Evalúa ahora gratis →
      </Link>
      <a
        href="#como-funciona"
        className="bg-[#F97303]/25 border border-[#F97303]/80 text-white font-bold px-6 py-4 rounded-xl text-sm transition-all duration-200 inline-flex items-center gap-1.5 hover:bg-[#F97303]/20 hover:border-[#F97303]/40 hover:shadow-[0_8px_20px_rgba(249,115,3,0.1)] hover:-translate-y-0.5"
      >
        Ver cómo funciona →
      </a> 
    </motion.div>
  )
}

/**
 * HeroTrust lists trust indicators/benefits.
 */
function HeroTrust() {
  return (
    <motion.div variants={itemVariants} className="flex flex-wrap gap-5  mb-6">
      {TRUST_ITEMS.map((item) => (
        <div key={item} className="flex items-center gap-1.5 text-xs text-[#FBFBFB] font-medium">
          <span className="text-[#F97303] font-bold text-sm">✓</span>
          {item}
        </div>
      ))}
    </motion.div>
  )
}

/**
 * MetricRow component for individual dimensions inside ScoreCard.
 */
interface MetricRowProps {
  label: string
  value: number
  isGreen: boolean
}

function MetricRow({ label, value, isGreen }: MetricRowProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[12px] text-[#fbfbfb] w-[110px] shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.8, duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
          className={`h-full rounded-full ${isGreen ? 'bg-[#4ade80]' : 'bg-[#F97303]'}`}
        />
      </div>
      <span className="text-[12px] font-bold text-white w-6 text-right select-none">{value}</span>
    </div>
  )
}

/**
 * ScoreCard renders the mock advertising analysis dashboard.
 */
function ScoreCard() {
  const [score, setScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      let startTimestamp: number | null = null
      const duration = 1600
      const target = 87

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        setScore(Math.round(ease * target))
        if (progress < 1) {
          window.requestAnimationFrame(step)
        }
      }
      window.requestAnimationFrame(step)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
      className="relative w-full max-w-[420px] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden"
    >
      {/* Top right gradient glow */}
      <div className="absolute -top-[60px] -right-[60px] w-[180px] h-[180px] bg-[radial-gradient(circle,rgba(249,115,3,0.12),transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-[#FBFBFB] font-medium">OOH · Branding</span>
        <span className="bg-[#F97303]/10 border border-[#F97303]/20 text-[#FBFBFB] text-[11px] font-semibold px-2.5 py-0.5 rounded-full tracking-wider">
          WOW Score
        </span>
      </div>

      {/* Score Row */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[13px] text-[#FBFBFB] font-semibold mb-1">WOW Score</div>
          <div className="font-heading text-8xl font-extrabold text-[#F97303] leading-none tracking-[-3px]">
            {score}
          </div>
          <div className="text-[13px] text-[#FBFBFB] mt-1">/ 100 puntos</div>
        </div>
      </div>

      {/* Tag */}
      <div className="bg-[#4ade80]/12 border border-[#4ade80]/20 text-[#4ade80] text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase w-fit mb-5">
        ✓ Fantástico: Alto impacto visual
      </div>

      {/* Metrics List */}
      <div className="flex flex-col gap-3">
        {METRICS.map(({ label, value, isGreen }) => (
          <MetricRow
            key={label}
            label={label}
            value={value}
            isGreen={isGreen}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-[#fbfbfb]">
        <div className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4ade80]"></span>
        </div>
        Análisis completado · Hace 2 minutos
      </div>
    </motion.div>
  )
}

// ── MAIN HERO SECTION ────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen bg-[#1D1D1B] text-white overflow-hidden flex items-center pt-40 pb-16 lg:pt-32 lg:pb-16 select-text"
    >
      {/* Animated Canvas Background */}
      <AnimatedBackground />

      {/* Radial Glow Effect (kept for additional depth) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(249,115,3,0.08)_0%,rgba(249,115,3,0.02)_40%,transparent_75%)] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
        >
          {/* Left Column (Hero Content) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <HeroBadge />
            
            <motion.h1
              variants={itemVariants}
              className="font-heading font-bold text-[clamp(44px,5.5vw,72px)] leading-none tracking-[-2.5px] text-white mb-6"
            >
              ¿Tu publicidad<br />
              realmente<br />
              <span className="relative inline-block text-[#F97303] not-italic">
                impacta?
                <motion.span
                  variants={lineVariants}
                  className="absolute bottom-1 left-0 right-0 h-[3px] bg-[#F97303] rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base text-[#FBFBFB] max-w-[480px] leading-relaxed mb-9"
            >
              Sube tu pieza publicitaria, selecciona el medio y objetivo, y obtén un análisis detallado basado en 10 dimensiones de creatividad. Decisiones más inteligentes. Campañas que conectan.
            </motion.p>

            {/* Cambié el orden: ahora los beneficios van primero */}
            <HeroTrust />
            <HeroActions />
          </div>

          {/* Right Column (Hero Card) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <ScoreCard />
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator />
    </section>
  )
}