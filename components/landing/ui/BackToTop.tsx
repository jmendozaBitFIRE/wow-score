'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', toggleVisibility)
        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    onClick={scrollToTop}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="
                        p-3.5
                        bg-ink
                        border border-flame/30
                        text-flame
                        /* PC: hover al pasar el cursor */
                        hover:bg-flame hover:text-ink
                        /* Móvil/Tablet: al tocar (active) y al enfocar (focus) */
                        active:bg-flame active:text-ink
                        focus:bg-flame focus:text-ink
                        focus:outline-none
                        flex items-center justify-center
                        rounded-2xl
                        shadow-[0_8px_24px_rgba(246,101,2,0.15)]
                        transition-all duration-300
                        touch-manipulation
                    "
                    aria-label="Volver arriba"
                >
                    <ArrowUp size={22} strokeWidth={2.5} />
                </motion.button>
            )}
        </AnimatePresence>
    )
}
