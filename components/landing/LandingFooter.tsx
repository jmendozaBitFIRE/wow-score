'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Mail, Phone, ArrowUpRight } from 'lucide-react'

// ── ICONS ────────────────────────────────────────────────────────────────────
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
)

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
)

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const PRODUCTO_LINKS = [
  { label: '¿Cómo funciona?', href: '/#como-funciona' },
  { label: 'Ventajas',        href: '/#ventajas'      },
  { label: 'Precios',         href: '/#precios'       },
  { label: 'Contacto',        href: '/#contacto'      },
]

const CUENTA_LINKS = [
  { label: 'Crear cuenta',   href: '/register' },
  { label: 'Iniciar sesión', href: '/login'    },
]

const LEGAL_LINKS = [
  { label: 'Política de privacidad', href: '/politica-de-privacidad' },
  { label: 'Términos y condiciones',        href: '/terminos-y-condiciones'   },
]

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: '#',
    icon: InstagramIcon,
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: LinkedinIcon,
  },
]

// ── ANIMATION VARIANTS ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 90, damping: 15 },
  },
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

/**
 * FooterLogo renders the brand mark with an extended description.
 */
function FooterLogo() {
  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-5">
      {/* Brand mark */}
      <Link href="/" className="flex items-center gap-0.5 group w-fit">
        <span className="font-heading font-extrabold text-[#F97303] text-xl tracking-[-0.02em] group-hover:opacity-80 transition-opacity">
          WOW
        </span>
        <span className="font-heading font-semibold text-[#FBFBFB] text-xl tracking-[-0.02em] group-hover:opacity-80 transition-opacity">
          Score
        </span>
      </Link>

      {/* Description */}
      <p className="text-[14px] text-[#FBFBFB] leading-relaxed max-w-[280px]">
        La fórmula impulsada por IA que mide la creatividad publicitaria en 10 dimensiones. Analiza tus piezas, descubre su verdadero potencial y toma decisiones más inteligentes.
      </p>

      {/* Social links */}
      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-bold text-[#FBFBFB] tracking-wider uppercase">
          Síguenos
        </p>
        <div className="flex items-center gap-2.5">
          {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#F97303] hover:border-[#F97303] hover:text-[#1D1D1B] transition-all duration-300 text-[#FBFBFB] hover:scale-105"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * FooterColumn renders a grouped list of navigation links.
 */
function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-4">
      <p className="text-[15px] font-extrabold text-[#FBFBFB] tracking-wider uppercase">
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {links.map(({ label, href }) => {
          const isExternal = href.startsWith('http')
          const LinkComponent = isExternal ? 'a' : Link

          return (
            <li key={href}>
              <LinkComponent
                href={href}
                {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
                className="group inline-flex items-center gap-1 text-[14px] text-[#FBFBFB] hover:text-[#F97303] transition-colors duration-200 font-medium"
              >
                <span>{label}</span>
                <ArrowUpRight
                  size={13}
                  className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                />
              </LinkComponent>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

/**
 * FooterContact renders quick contact cards for email and phone.
 */
function FooterContact() {
  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-4">
      <p className="text-[15px] font-extrabold tracking-wider uppercase">
        Contacto
      </p>
      
      <div className="flex flex-col gap-3 w-fit max-w-full">
        {/* Email */}
        <a
          href="mailto:hola@wowscore.com"
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-[#F97303]/10 hover:border-[#F97303]/30 transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-[#F97303]/10 border border-[#F97303]/20 flex items-center justify-center shrink-0 group-hover:bg-[#F97303] group-hover:border-[#F97303] transition-colors">
            <Mail size={14} className="text-[#F97303] group-hover:text-[#1D1D1B] transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#FBFBFB] font-medium leading-tight">Escríbenos</span>
            <span className="text-[12px] text-[#FBFBFB] font-semibold group-hover:text-[#F97303] transition-colors whitespace-nowrap">
              hola@wowscore.com
            </span>
          </div>
        </a>

        {/* Phone */}
        <a
          href="tel:+1234567890"
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-[#F97303]/10 hover:border-[#F97303]/30 transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-[#F97303]/10 border border-[#F97303]/20 flex items-center justify-center shrink-0 group-hover:bg-[#F97303] group-hover:border-[#F97303] transition-colors">
            <Phone size={14} className="text-[#F97303] group-hover:text-[#1D1D1B] transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#FBFBFB] font-medium leading-tight">Llámanos</span>
            <span className="text-[12px] text-[#FBFBFB] font-semibold group-hover:text-[#F97303] transition-colors whitespace-nowrap">
              +1 (234) 567-890
            </span>
          </div>
        </a>
      </div>
    </motion.div>
  )
}

// ── MAIN FOOTER ──────────────────────────────────────────────────────────────
export function LandingFooter() {
  const footerRef = useRef<HTMLElement>(null)
  const isInView = useInView(footerRef, { once: true, margin: '-50px' })

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#1D1D1B] text-[#FBFBFB] overflow-hidden border-t border-white/10"
    >
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(249,115,3,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20">
        {/* Main grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12"
        >
          {/* Column 1: Logo + description + social (spans 5 cols on desktop) */}
          <div className="md:col-span-5">
            <FooterLogo />
          </div>

          {/* Columns 2-4: Links (spans 7 cols on desktop) */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FooterColumn title="Producto" links={PRODUCTO_LINKS} />
            <FooterColumn title="Cuenta" links={CUENTA_LINKS} />
            <FooterContact />
          </div>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Bottom row: copyright + legal */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[12px] text-[#FBFBFB] font-medium order-2 sm:order-1">
            © {new Date().getFullYear()} WOW Score. Todos los derechos reservados.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 order-1 sm:order-2">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-[12px] text-[#FBFBFB] hover:text-[#F97303] transition-colors duration-200 font-medium"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
