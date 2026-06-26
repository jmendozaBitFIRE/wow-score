'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'

const NAV_LINKS = [
  { label: '¿Cómo funciona?', href: '/#como-funciona' },
  { label: 'Ventajas',        href: '/#ventajas'      },
  { label: 'Precios',         href: '/#precios'       },
   { label: 'Contacto',         href: '/#contacto'       },
]

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Configuración de la barra de progreso de scroll
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20)
    }
    
    // Verificar posición inicial al montar
    handleScroll()
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-[#1D1D1D]/95 backdrop-blur-md border-b border-white/5 py-3'
            : 'bg-transparent border-b border-transparent py-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className={`font-heading font-bold tracking-tight text-white flex items-center gap-0.5 hover:opacity-90 transition-all duration-300 ${scrolled ? 'text-xl' : 'text-3xl'}`}>
            <span className="text-[#F97303]">WOW</span>
            <span>Score</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`font-medium text-[#FBFBFB] hover:text-[#F97303] transition-all duration-300 ${scrolled ? 'text-sm' : 'text-base'}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/login"
              className={`bg-[#F97303]/25 border border-[#F97303]/80 text-white font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all duration-300 hover:bg-[#F97303]/20 hover:border-[#F97303]/40 hover:shadow-[0_6px_20px_rgba(249,115,3,0.1)] hover:-translate-y-0.5 ${
    scrolled
      ? 'text-sm px-6 py-2.5'
      : 'text-base px-8 py-3.5'
  }`}
            >
              Iniciar sesión →
            </Link>
            <Link
              href="/register"
              className={`bg-[#F97303] text-white font-bold hover:bg-[#ff8c20] font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(249,115,3,0.15)] hover:shadow-[0_6px_20px_rgba(249,115,3,0.1)] hover:-translate-y-0.5 ${scrolled ? 'text-sm px-6 py-2.5' : 'text-base px-8 py-3.5'}`}
            >
              Crear cuenta  →
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white/80 hover:text-white p-1 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute top-full left-0 right-0 bg-[#1D1D1B] backdrop-blur-lg border-b border-white/10 px-6 py-8 flex flex-col gap-6 md:hidden shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col gap-4">
                {NAV_LINKS.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-white/70 hover:text-white py-1.5 transition-colors duration-200"
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex flex-col gap-4">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-[#F97303]/25 border border-[#F97303]/80 text-white hover:bg-[#F97303]/20 hover:border-[#F97303]/40 text-center font-bold py-3 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(249,115,3,0.15)]"
                >
                  Iniciar sesión →
                </Link>

                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-[#F97303] text-white hover:bg-[#ff8c20] text-center font-bold py-3 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(249,115,3,0.15)]"
                >
                  Crear cuenta →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Progress Bar */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[3px] bg-[#F97303] origin-left z-[51]"
          style={{ 
            scaleX,
            boxShadow: '0 0 8px rgba(249, 115, 3, 0.4)' 
          }}
        />
      </header>
    </>
  )
}
