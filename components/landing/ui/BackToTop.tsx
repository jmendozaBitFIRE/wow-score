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
                        bg-[#1D1D1B]
                        border border-[#F97303]/30
                        text-[#F97303]
                        /* PC: hover al pasar el cursor */
                        hover:bg-[#F97303] hover:text-[#1D1D1B]
                        /* Móvil/Tablet: al tocar (active) y al enfocar (focus) */
                        active:bg-[#F97303] active:text-[#1D1D1B]
                        focus:bg-[#F97303] focus:text-[#1D1D1B]
                        focus:outline-none
                        flex items-center justify-center
                        rounded-2xl
                        shadow-[0_8px_24px_rgba(249,115,3,0.15)]
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
