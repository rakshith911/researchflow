'use client'

import { Card } from '@/components/ui/card'
import { Brain, Stethoscope, Lightbulb, Check, X } from 'lucide-react'
import { UserDomain } from '@/config/templates'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface DomainSelectionDialogProps {
    open: boolean
    onSelect: (domain: UserDomain) => void
    onCancel: () => void
}

const DOMAINS = [
    {
        id: 'research',
        name: 'Research & Engineering',
        description: 'For academics, engineers, and technical writers. Includes LaTeX-style support and code blocks.',
        icon: Brain,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        border: 'hover:border-purple-500/50'
    },
    {
        id: 'medical',
        name: 'Medical & Clinical',
        description: 'HIPAA-compliant templates for clinical notes, SOAP, and patient history.',
        icon: Stethoscope,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'hover:border-blue-500/50'
    },
    {
        id: 'general',
        name: 'General Productivity',
        description: 'Flexible workspace for project management, meeting notes, and personal wiki.',
        icon: Lightbulb,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'hover:border-orange-500/50'
    }
] as const

export function DomainSelectionDialog({ open, onSelect, onCancel }: DomainSelectionDialogProps) {
    const [hovered, setHovered] = useState<string | null>(null)

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-4xl bg-background/95 backdrop-blur-xl border-border p-8">
                <button
                    onClick={onCancel}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>

                <DialogHeader className="mb-8 text-center">
                    <DialogTitle className="text-3xl font-bold mb-2">How do you think?</DialogTitle>
                    <DialogDescription className="text-lg">
                        Choose your primary workspace to get tailored templates and AI features.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {DOMAINS.map((domain) => (
                        <motion.div
                            key={domain.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onHoverStart={() => setHovered(domain.id)}
                            onHoverEnd={() => setHovered(null)}
                            onClick={() => onSelect(domain.id as UserDomain)}
                            className={cn(
                                "relative cursor-pointer rounded-2xl border-2 border-border p-6 flex flex-col items-center text-center transition-all duration-300",
                                domain.bg,
                                domain.border,
                                hovered === domain.id ? "shadow-xl" : ""
                            )}
                        >
                            {hovered === domain.id && (
                                <motion.div
                                    layoutId="check"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground"
                                >
                                    <Check className="w-4 h-4" />
                                </motion.div>
                            )}

                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-background shadow-sm", domain.color)}>
                                <domain.icon className="w-8 h-8" />
                            </div>

                            <h3 className="font-bold text-xl mb-3">{domain.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {domain.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
