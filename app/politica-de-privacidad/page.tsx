import Link from 'next/link'
import { ArrowLeft, Lock, Calendar } from 'lucide-react'
import { LandingPageShell } from '@/components/landing/LandingPageShell'

// ── DATA ─────────────────────────────────────────────────────────────────────
const PRIVACY_SECTIONS = [
  {
    number: '01',
    title: 'Identidad del responsable',
    content:
      'Clan Publicidad, S.A. de C.V. (WOW Innovation), responsable del tratamiento de datos personales conforme a la legislación aplicable en México.',
  },
  {
    number: '02',
    title: 'Datos personales que recabamos',
    content: 'Recopilamos la siguiente información del usuario:',
    list: [
      'Nombre y correo electrónico',
      'Empresa y cargo',
      'Datos de uso de la plataforma',
      'Dirección IP, dispositivo y navegador',
      'Cookies y datos de navegación',
    ],
  },
  {
    number: '03',
    title: 'Finalidades del tratamiento',
    content:
      'Los datos personales se utilizan para proveer acceso a WOW Score, generar evaluaciones y reportes, brindar soporte técnico y realizar mejoras continuas del servicio.',
  },
  {
    number: '04',
    title: 'Uso de inteligencia artificial',
    content:
      'Se utilizan modelos de IA para analizar el contenido subido por los usuarios.',
    note: 'No se usan datos del usuario para entrenamiento externo sin su autorización expresa.',
  },
  {
    number: '05',
    title: 'Transferencia de datos',
    content:
      'No vendemos datos personales. Solo se comparten con proveedores tecnológicos necesarios para la operación del servicio o por requerimiento de autoridad legal competente.',
  },
  {
    number: '06',
    title: 'Seguridad de la información',
    content:
      'Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger los datos personales contra pérdida, misuse o acceso no autorizado.',
  },
  {
    number: '07',
    title: 'Derechos ARCO',
    content: 'El usuario puede ejercer en cualquier momento sus derechos de:',
    list: [
      'Acceso — conocer qué datos tenemos sobre usted',
      'Rectificación — corregir datos inexactos o incompletos',
      'Cancelación — solicitar la eliminación de sus datos',
      'Oposición — negarse al tratamiento de sus datos',
    ],
    note: 'Para ejercer estos derechos, envía un correo a correo@wow-score.com con el asunto "Derechos ARCO".',
  },
  {
    number: '08',
    title: 'Conservación de datos',
    content:
      'Los datos personales se conservarán mientras la cuenta del usuario permanezca activa, o por el tiempo necesario para cumplir con obligaciones legales aplicables.',
  },
  {
    number: '09',
    title: 'Uso de cookies',
    content:
      'Utilizamos cookies y tecnologías similares para mejorar la experiencia del usuario, recordar preferencias y analizar el uso de la plataforma.',
  },
  {
    number: '10',
    title: 'Confidencialidad del contenido',
    content:
      'Todo el contenido subido por el usuario a la plataforma es de su propiedad y se mantiene estrictamente confidencial. WOW Score no comparte ni divulga dicho contenido a terceros.',
  },
  {
    number: '11',
    title: 'Cambios a la política',
    content:
      'WOW Score se reserva el derecho de realizar modificaciones a esta Política de Privacidad en cualquier momento. Los cambios serán notificados a través de la plataforma.',
  },
  {
    number: '12',
    title: 'Contacto',
    content:
      'Para cualquier duda, solicitud o aclaración relacionada con esta Política de Privacidad, puedes contactarnos directamente a:',
    note: 'correo@wow-score.com',
  },
  {
    number: '13',
    title: 'Plataformas de pago de terceros',
    content:
      'Los pagos son procesados por plataformas externas especializadas.',
    note: 'WOW Score no es responsable por fallas, cargos incorrectos o problemas de seguridad derivados de dichas plataformas.',
  },
]

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function PrivacidadPage() {
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
            <Lock size={12} strokeWidth={2.5} />
            Documento legal
          </div>

          {/* Title */}
          <h1 className="font-heading font-bold text-[clamp(32px,5vw,52px)] leading-[1.05] tracking-[-2px] text-[#FBFBFB] mb-5">
            Política de{' '}
            <span className="text-[#F97303]">Privacidad</span>
          </h1>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-[#FBFBFB]/70 font-medium">
            <Calendar size={15} className="text-[#F97303]" />
            <span>Última actualización: 16 de abril de 2026</span>
          </div>
        </header>

        {/* Intro */}
        <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <p className="text-[15px] text-[#FBFBFB]/80 leading-relaxed mb-3">
            Bienvenido a <span className="text-[#F97303] font-semibold">WOW Score</span>, una plataforma desarrollada por WOW (Clan Publicidad, S.A. de C.V.). Nos comprometemos a proteger la privacidad de nuestros usuarios y a garantizar el uso responsable de su información.
          </p>
          <p className="text-[15px] text-[#FBFBFB]/80 leading-relaxed">
            Al utilizar nuestra plataforma, el usuario acepta los términos de esta Política de Privacidad.
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5">
          {PRIVACY_SECTIONS.map(({ number, title, content, list, note }) => (
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
            Si tienes dudas sobre nuestra política de privacidad, puedes contactarnos a{' '}
            <a
              href="mailto:correo@wow-score.com"
              className="text-[#F97303] hover:underline underline-offset-2 font-medium"
            >
              correo@wow-score.com
            </a>
          </p>
        </div>
      </div>
    </LandingPageShell>
  )
}
