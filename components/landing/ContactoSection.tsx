'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Mail, Phone, Send } from 'lucide-react'

const LinkedinIcon = ({ size = 18 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

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

function SectionBadge() {
  return (
    <motion.div
     id="contacto"
      variants={headerItemVariants}
      className="inline-flex items-center gap-2.5 bg-[#F97303]/10 border border-[#F97303]/25 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#F97303] mb-5 select-none"
    >
      <div className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97303] opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F97303]" />
      </div>
      ¿Hablamos?
    </motion.div>
  )
}

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
  Estamos listos para <br />
  <span className="text-[#F97303] relative inline-block">
    ayudarte
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
        Escríbenos y nuestro equipo se pondrá en contacto contigo lo antes posible para resolver tus dudas.
      </motion.p>
    </motion.div>
  )
}

export function ContactoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica de envío del formulario (ej. fetch a una API)
    alert("Formulario enviado con éxito.")
  }

  return (
    <section
      id="contacto"
      ref={sectionRef}
      className="relative bg-[#1D1D1D] text-[#FBFBFB] py-20 md:py-28 overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,3,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(249,115,3,0.04),transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader isInView={isInView} />

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ staggerChildren: 0.15, delayChildren: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12"
        >
          {/* Formulario */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-3 bg-white/[0.02] border border-white/10 rounded-[24px] p-8 md:p-10 transition-colors duration-300 hover:bg-white/[0.04] hover:border-white/20"
          >
            <h3 className="text-2xl font-heading font-bold mb-6">Envíanos un mensaje</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-white">Nombre y Apellido</label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="bg-[#1D1D1D] border border-white/10 focus:border-[#F97303] text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors w-full"
                    placeholder="Tu nombre y apellido"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-[#fbfbfb]">Correo electrónico</label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="bg-[#1D1D1D] border border-white/10 focus:border-[#F97303] text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors w-full"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="text-sm font-medium text-[#fbfbfb]">Teléfono</label>
                <input
                  type="tel"
                  id="phone"
                  required
                  className="bg-[#1D1D1D] border border-white/10 focus:border-[#F97303] text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors w-full"
                  placeholder="+1 (234) 567-890"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium text-[#fbfbfb]">Mensaje</label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  className="bg-[#1D1D1D] border border-white/10 focus:border-[#F97303] text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors w-full resize-none"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              <div className="flex items-start gap-3 mt-2">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-transparent text-[#F97303] focus:ring-[#F97303]"
                />
                <label htmlFor="privacy" className="text-sm text-[#fbfbfb] leading-relaxed">
                  He leído y acepto la{' '}
                  <Link href="/privacidad" className="text-[#F97303] hover:underline underline-offset-2">
                    política de privacidad
                  </Link>
                  .
                </label>
              </div>

              <button
                type="submit"
                disabled={!agreed}
                className="mt-4 w-full bg-[#F97303] hover:bg-[#ff8c20] disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed  text-white font-bold text-sm px-6 py-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(249,115,3,0.15)] hover:shadow-[0_8px_24px_rgba(249,115,3,0.25)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Enviar mensaje
                <Send size={16} />
              </button>
            </form>
          </motion.div>

          {/* Información de contacto */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-2 flex flex-col justify-between bg-gradient-to-b from-[#F97303]/10 to-transparent border border-[#F97303]/20 rounded-[24px] p-8 md:p-10 shadow-[0_0_30px_rgba(249,115,3,0.05)]"
          >
            <div>
              <p className="text-xs font-semibold text-[#F97303] tracking-wider uppercase mb-6">
                Información directa
              </p>
              <h3 className="text-3xl font-heading font-bold mb-8 text-white">Contacta con soporte</h3>
              
              <div className="flex flex-col gap-6 mb-12">
                <a href="mailto:hola@wowscore.com" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#F97303]/20 group-hover:border-[#F97303]/50 transition-colors">
                    <Mail size={20} className="text-[#F97303]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#fbfbfb] mb-1">Correo electrónico</p>
                    <p className="text-sm font-medium text-[#fbfbfb] group-hover:text-[#F97303] transition-colors">
                      hola@wowscore.com
                    </p>
                  </div>
                </a>

                <a href="tel:+1234567890" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#F97303]/20 group-hover:border-[#F97303]/50 transition-colors">
                    <Phone size={20} className="text-[#F97303]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#fbfbfb] mb-1">Teléfono</p>
                    <p className="text-sm font-medium text-[#fbfbfb] group-hover:text-[#F97303] transition-colors">
                      +1 (234) 567-890
                    </p>
                  </div>
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[#fbfbfb] mb-4">Síguenos en redes</p>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#F97303] hover:border-[#F97303] hover:text-[#1D1D1B] transition-all text-white/80"
                >
                  <InstagramIcon size={18} />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#F97303] hover:border-[#F97303] hover:text-[#1D1D1B] transition-all text-white/80"
                >
                  <LinkedinIcon size={18} />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
