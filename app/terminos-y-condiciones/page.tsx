import Link from 'next/link'
import { ArrowLeft, Shield, Calendar } from 'lucide-react'
import { LandingPageShell } from '@/components/landing/LandingPageShell'

// ── DATA ─────────────────────────────────────────────────────────────────────
const TERMS_SECTIONS = [
  {
    number: '01',
    title: 'Naturaleza del servicio',
    content:
      'WOW Score es una herramienta digital que utiliza metodologías propias y tecnologías de terceros (incluyendo inteligencia artificial) para evaluar, analizar y generar recomendaciones sobre creatividad, medios y estrategias.',
    note: 'WOW Score no sustituye asesoría profesional, estratégica, financiera o de negocio.',
  },
  {
    number: '02',
    title: 'Uso de la plataforma',
    content: 'El usuario se compromete a:',
    list: [
      'Usar la plataforma de forma lícita',
      'No intentar vulnerar sistemas, seguridad o funcionamiento',
      'No copiar, replicar o comercializar la metodología WOW Score sin autorización',
    ],
  },
  {
    number: '03',
    title: 'Propiedad intelectual',
    content:
      'Todo el contenido de la plataforma, incluyendo metodología, algoritmos, diseño, branding y outputs, es propiedad de WOW (Clan Publicidad, S.A. de C.V.). Queda prohibida su reproducción o uso sin autorización.',
  },
  {
    number: '04',
    title: 'Limitación de responsabilidad',
    content:
      'WOW Score es una herramienta de apoyo. No garantizamos resultados comerciales ni precisión absoluta. El usuario es responsable de sus decisiones.',
  },
  {
    number: '05',
    title: 'Disponibilidad del servicio',
    content:
      'No garantizamos disponibilidad continua, funcionamiento sin errores ni acceso ininterrumpido.',
  },
  {
    number: '06',
    title: 'Dependencia de terceros',
    content:
      'WOW Score puede depender de proveedores de IA, nube y servicios externos. No somos responsables por caídas, cambios o costos derivados de terceros.',
  },
  {
    number: '07',
    title: 'Pagos y facturación',
    content:
      'Los pagos se procesan a través de plataformas externas. WOW Score no es responsable por errores, fallas o fraudes en dichos sistemas.',
  },
  {
    number: '08',
    title: 'Suspensión del servicio',
    content: 'WOW Score podrá suspender cuentas por uso indebido o incumplimiento de términos.',
  },
  {
    number: '09',
    title: 'Modificaciones',
    content: 'WOW Score puede modificar estos términos en cualquier momento.',
  },
  {
    number: '10',
    title: 'Jurisdicción',
    content: 'Estos términos se rigen por las leyes de México.',
  },
]

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function TerminosPage() {
  return (
    <LandingPageShell mainClassName="relative min-h-screen bg-[#1D1D1B] text-[#FBFBFB] overflow-hidden pt-32 md:pt-36">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,3,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(249,115,3,0.04),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 md:px-12 pb-16 md:pb-24">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#FBFBFB]/70 hover:text-[#F97303] transition-colors duration-200 mb-10 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform duration-200"
          />
          Volver al inicio
        </Link>

        {/* Header */}
        <header className="mb-14 md:mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-[#F97303]/10 border border-[#F97303]/25 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#F97303] mb-6">
            <div className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F97303]" />
            </div>
            <Shield size={12} strokeWidth={2.5} />
            Documento legal
          </div>

          {/* Title */}
          <h1 className="font-heading font-bold text-[clamp(32px,5vw,52px)] leading-[1.05] tracking-[-2px] text-[#FBFBFB] mb-5">
            Términos y Condiciones{' '}
            <span className="text-[#F97303]">de Uso</span>
          </h1>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-[#FBFBFB]/70 font-medium">
            <Calendar size={15} className="text-[#F97303]" />
            <span>Última actualización: 16 de abril de 2026</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-5">
          {TERMS_SECTIONS.map(({ number, title, content, list, note }) => (
            <article
              key={number}
              className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300"
            >
              <div className="flex gap-5">
                {/* Number */}
                <div className="shrink-0">
                  <span className="font-heading font-extrabold text-[28px] md:text-[32px] leading-none text-[#F97303] tracking-[-1px]">
                    {number}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-bold text-xl md:text-2xl text-[#FBFBFB] mb-3 tracking-[-0.5px]">
                    {title}
                  </h2>

                  <p className="text-[15px] text-[#FBFBFB]/80 leading-relaxed mb-3">
                    {content}
                  </p>

                  {/* List */}
                  {list && (
                    <ul className="flex flex-col gap-2.5 mt-3">
                      {list.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#F97303] mt-2" />
                          <span className="text-[15px] text-[#FBFBFB]/80 leading-relaxed">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Important note */}
                  {note && (
                    <div className="mt-4 p-4 rounded-xl bg-[#F97303]/10 border border-[#F97303]/25">
                      <p className="text-[14px] text-[#FBFBFB] leading-relaxed">
                        <span className="font-bold text-[#F97303]">Importante: </span>
                        {note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-14 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-[#FBFBFB]/60 leading-relaxed max-w-xl mx-auto">
            Si tienes dudas sobre estos términos, puedes contactarnos a{' '}
            <a
              href="mailto:hola@wowscore.com"
              className="text-[#F97303] hover:underline underline-offset-2 font-medium"
            >
              hola@wowscore.com
            </a>
          </p>
        </div>
      </div>
    </LandingPageShell>
  )
}
