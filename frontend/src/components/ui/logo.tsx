'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LogoProps {
    className?: string
    animated?: boolean
    showText?: boolean
}

export function Logo({ className, animated = false, showText = true }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
            >
                <motion.path
                    d="M16 2L2 10L16 18L30 10L16 2Z"
                    fill="currentColor"
                    fillOpacity="0.2"
                    initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
                    animate={animated ? { opacity: 1, scale: 1 } : undefined}
                    transition={{ duration: 0.5 }}
                />
                <motion.path
                    d="M2 22L16 30L30 22"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={animated ? { pathLength: 0 } : undefined}
                    animate={animated ? { pathLength: 1 } : undefined}
                    transition={{ duration: 0.8, delay: 0.2 }}
                />
                <motion.path
                    d="M16 18V30"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={animated ? { pathLength: 0 } : undefined}
                    animate={animated ? { pathLength: 1 } : undefined}
                    transition={{ duration: 0.8, delay: 0.4 }}
                />
                <motion.circle
                    cx="16"
                    cy="10"
                    r="3"
                    fill="currentColor"
                    initial={animated ? { scale: 0 } : undefined}
                    animate={animated ? { scale: 1 } : undefined}
                    transition={{ duration: 0.5, delay: 0.6 }}
                />
            </svg>
            {showText && <span className="font-bold text-xl tracking-tight">ResearchFlow</span>}
        </div>
    )
}
