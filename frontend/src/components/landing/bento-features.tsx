'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Network, Share2, FileText, Search, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
    {
        title: "AI Analysis",
        description: "Connects the dots.",
        details: "Our advanced AI engine runs in the background, analyzing your notes as you write. It automatically identifies key concepts, suggests relevant connections, and helps you synthesize disparate ideas into coherent insights. It's like having a research assistant who never sleeps.",
        icon: Brain,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        gradient: "from-purple-500/20 to-transparent"
    },
    {
        title: "Knowledge Graph",
        description: "See in 3D.",
        details: "Visualize your entire second brain in an interactive 3D space. Nodes grow as they gain more connections, and clusters form naturally based on semantic similarity. Navigate through your ideas spatially to discover hidden relationships you missed.",
        icon: Network,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        gradient: "from-blue-500/20 to-transparent"
    },
    {
        title: "Real-time Sync",
        description: "Collaborate.",
        details: "Seamlessly work together with your team. Changes are synced instantly across all devices. Whether you're co-authoring a paper or brainstorming on a shared whiteboard, everyone stays on the same page with sub-millisecond latency.",
        icon: Share2,
        color: "text-green-500",
        bg: "bg-green-500/10",
        gradient: "from-green-500/20 to-transparent"
    },
    {
        title: "Smart Templates",
        description: "Standard formats.",
        details: "Stop wasting time on formatting. Access a library of industry-standard templates for Research (NeuralIPS, ICML), Engineering (ADRs, API Specs), and Medical contexts. Or import a PDF and let our AI generate a custom template for you instantly.",
        icon: FileText,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        gradient: "from-orange-500/20 to-transparent"
    },
    {
        title: "Deep Search",
        description: "Find anything.",
        details: "Forget exact keyword matching. Our semantic search understands the *meaning* of your query. Ask natural questions like 'What was that paper about transformer efficiency?' and get instant, accurate results pointing to the exact paragraph you need.",
        icon: Search,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        gradient: "from-pink-500/20 to-transparent"
    }
]

export function BentoFeatures() {
    const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null)

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {features.map((feature, i) => (
                    <motion.div
                        key={i}
                        layoutId={`card-${feature.title}`}
                        onClick={() => setSelectedFeature(feature)}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="group relative h-full min-h-[220px] rounded-3xl border border-border/50 bg-background/50 hover:bg-background/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden flex flex-col justify-between p-6 cursor-pointer"
                    >
                        {/* Gradient Background */}
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b mouse-events-none", feature.gradient)} />

                        <div className="relative z-10">
                            <motion.div
                                layoutId={`icon-${feature.title}`}
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                                    feature.bg
                                )}
                            >
                                <feature.icon className={cn("w-6 h-6", feature.color)} />
                            </motion.div>

                            <motion.h3 layoutId={`title-${feature.title}`} className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{feature.title}</motion.h3>
                            <motion.p layoutId={`desc-${feature.title}`} className="text-sm text-muted-foreground font-medium leading-relaxed">{feature.description}</motion.p>
                        </div>

                        <div className="relative z-10 pt-4 flex items-center text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                            <span>Learn more</span>
                            <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedFeature && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedFeature(null)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                layoutId={`card-${selectedFeature.title}`}
                                className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-8 relative overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setSelectedFeature(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>

                                <div className={cn("absolute top-0 left-0 w-full h-32 bg-gradient-to-b opacity-20 pointer-events-none", selectedFeature.gradient)} />

                                <div className="relative z-10">
                                    <motion.div
                                        layoutId={`icon-${selectedFeature.title}`}
                                        className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
                                            selectedFeature.bg
                                        )}
                                    >
                                        <selectedFeature.icon className={cn("w-8 h-8", selectedFeature.color)} />
                                    </motion.div>

                                    <motion.h3 layoutId={`title-${selectedFeature.title}`} className="text-3xl font-bold mb-4">{selectedFeature.title}</motion.h3>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="prose dark:prose-invert"
                                    >
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            {selectedFeature.details}
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
