'use client'

import { MotionConfig } from 'framer-motion'

// Respeta prefers-reduced-motion en toda la landing: framer-motion desactiva
// las animaciones de transform (desplazamientos, escalas) y conserva los
// cambios de opacidad que comunican estado.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
