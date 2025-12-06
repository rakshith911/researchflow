'use client'

import Spline from '@splinetool/react-spline'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function Hero3D() {
    const [isLoading, setIsLoading] = useState(true)

    return (
        <div className="w-full h-full relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            <Spline
                scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
                onLoad={() => setIsLoading(false)}
                className="w-full h-full"
            />

            {/* Overlay Gradient for seamless integration */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent pointer-events-none" />
        </div>
    )
}
