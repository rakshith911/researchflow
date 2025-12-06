'use client'

import { Logo } from '@/components/ui/logo'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center relative overflow-hidden bg-background">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px]" />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[100px]"
                />
            </div>

            {/* Close Button */}
            <div className="absolute top-6 right-6 z-20">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-foreground/10">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </Link>
            </div>

            {/* Card Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md relative z-10 p-6 sm:p-8"
            >
                <div className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-8 lg:p-10">
                    <div className="flex flex-col items-center text-center mb-8">
                        <Link href="/" className="mb-6 hover:opacity-80 transition-opacity">
                            <Logo className="scale-110" />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                        <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
                    </div>

                    {children}
                </div>

                {/* Footer info */}
                <div className="text-center mt-6 text-xs text-muted-foreground">
                    © 2025 ResearchFlow Inc.
                </div>
            </motion.div>
        </div>
    )
}
