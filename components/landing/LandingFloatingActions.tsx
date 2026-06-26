import { BackToTop } from './ui/BackToTop'
import { FloatingWhatsApp } from './ui/FloatingWhatsApp'

export function LandingFloatingActions() {
    return (
        <div className="fixed bottom-10 right-6 z-[200] flex flex-col gap-5 items-center pointer-events-none *:pointer-events-auto">
            <BackToTop />
            <FloatingWhatsApp />
        </div>
    )
}
