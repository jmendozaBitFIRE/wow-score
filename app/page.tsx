import { LandingHeader }       from '@/components/landing/LandingHeader'
import { LandingFooter }       from '@/components/landing/LandingFooter'
import { HeroSection }         from '@/components/landing/HeroSection'
import { ComoFuncionaSection } from '@/components/landing/ComoFuncionaSection'
import { VentajasSection }     from '@/components/landing/VentajasSection'
import { MediosSection }       from '@/components/landing/MediosSection'
import { PreciosSection }      from '@/components/landing/PreciosSection'
import { CTAFinalSection }     from '@/components/landing/CTAFinalSection'

export const metadata = {
  title: '¿Tu publicidad realmente impacta? — WOW Score',
  description:
    'Sube tu pieza publicitaria y obtén un análisis en 10 dimensiones basado en la Fórmula WOW Score. Decisiones más inteligentes. Campañas que conectan.',
}

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroSection />
        <ComoFuncionaSection />
        <VentajasSection />
        <MediosSection />
        <PreciosSection />
        <CTAFinalSection />
      </main>
      <LandingFooter />
    </>
  )
}
