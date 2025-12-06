'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { DomainSelectionDialog } from '@/components/onboarding/domain-selection-dialog'
import { UserDomain } from '@/config/templates'
import { useSettingsStore } from '@/stores/settings-store'
import { Hero3D } from '@/components/landing/hero-3d'
import { BentoFeatures } from '@/components/landing/bento-features'
import { Logo } from '@/components/ui/logo'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, ChevronRight, Check, X as XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { enterGuestMode, isAuthenticated } = useAuthStore()
  const { setUserDomain } = useSettingsStore()
  const [showDomainDialog, setShowDomainDialog] = useState(false)

  const handleTryNow = () => {
    setShowDomainDialog(true)
  }

  const handleDomainSelect = async (domain: UserDomain) => {
    setIsLoading(true)
    setShowDomainDialog(false)
    await setUserDomain(domain)
    enterGuestMode()
    setTimeout(() => {
      setIsLoading(false)
      router.push('/editor')
    }, 500)
  }

  const handleSignIn = () => {
    router.push('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo animated />
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button onClick={() => router.push('/documents')} variant="default" className="rounded-full px-6">
                Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={handleSignIn} className="rounded-full">
                  Sign In
                </Button>
                <Button onClick={handleTryNow} disabled={isLoading} className="rounded-full px-6 shadow-lg shadow-primary/20">
                  {isLoading ? 'Loading...' : 'Try It Free'}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen pt-24 flex flex-col items-center overflow-hidden">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: [0, 50, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1/2 -left-1/2 w-[100vw] h-[100vw] bg-primary/20 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
                x: [0, -30, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-blue-500/10 rounded-full blur-[100px]"
            />
          </div>

          {/* Text Content */}
          <div className="container mx-auto px-6 z-20 text-center mt-12 md:mt-24 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="pointer-events-auto"
            >
            >
              <div className="relative inline-block mb-10">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter drop-shadow-xl z-20 relative">
                  Think that <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 animate-gradient-x pb-4 inline-block">
                    Flows.
                  </span>
                </h1>
              </div>

              <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
                The first knowledge workspace built for the age of AI. <br className="hidden md:block" />
                Visualize connections, generate insights, and write at the speed of thought.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={handleTryNow}
                  className="rounded-full h-14 px-8 text-lg bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-xl shadow-primary/20"
                >
                  Start Thinking <ChevronRight className="ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleSignIn}
                  className="rounded-full h-14 px-8 text-lg bg-background/50 hover:bg-muted/50 backdrop-blur-sm border-2"
                >
                  Log In
                </Button>
              </div>
            </motion.div>
          </div>

          {/* 3D Spline Scene Background */}
          <div className="absolute inset-0 z-10 opacity-70 pointer-events-none dark:opacity-80">
            <div className="w-full h-[120vh] -mt-20">
              <Hero3D />
            </div>
          </div>

          {/* Gradient Fade at bottom of hero */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
        </section>

        {/* Features Section */}
        <section className="py-32 bg-secondary/30 relative">
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for critical thinkers</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Tools that adapt to your mind, not the other way around.
              </p>
            </div>

            <BentoFeatures />
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section className="py-24 bg-background border-t border-border">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Unlock Full Potential</h2>
              <p className="text-muted-foreground">Start partially for free, login to go further.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Guest Card */}
              <div className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-2">Guest Access</h3>
                <p className="text-muted-foreground mb-6">Perfect for trying it out instantly.</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5" /> <span>Basic Document Editor</span></li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5" /> <span>Use Standard Templates</span></li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5" /> <span>Local Browser Storage</span></li>
                  <li className="flex items-center gap-3 opacity-50"><XIcon className="text-red-400 w-5 h-5" /> <span>AI Insights & Links</span></li>
                  <li className="flex items-center gap-3 opacity-50"><XIcon className="text-red-400 w-5 h-5" /> <span>Knowledge Graph Visualization</span></li>
                  <li className="flex items-center gap-3 opacity-50"><XIcon className="text-red-400 w-5 h-5" /> <span>PDF Import</span></li>
                </ul>
                <Button variant="outline" className="w-full rounded-full" onClick={handleTryNow}>Try Now</Button>
              </div>

              {/* Pro Card */}
              <div className="p-8 rounded-3xl border-2 border-primary/20 bg-primary/5 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-xl font-bold">RECOMMENDED</div>
                <h3 className="text-2xl font-bold mb-2 text-primary">Logged In</h3>
                <p className="text-muted-foreground mb-6">Your permanent knowledge base.</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5" /> <span>Everything in Guest</span></li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5" /> <span>AI Knowledge Graph</span></li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5" /> <span>Generate Templates from PDFs</span></li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5" /> <span>Smart Contextual Links</span></li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 w-5 h-5" /> <span>Cloud Sync & Backup</span></li>
                </ul>
                <Button className="w-full rounded-full" onClick={() => router.push('/register')}>Create Free Account</Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-bottom-right" />
          <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to evolve?</h2>
            <Button
              size="lg"
              onClick={handleTryNow}
              className="rounded-full h-16 px-10 text-xl shadow-2xl hover:scale-105 transition-all"
            >
              Get Started Now
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border bg-card text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Logo className="scale-75" />
        </div>
        <p>© 2025 ResearchFlow. Crafted for the future.</p>
      </footer>

      <DomainSelectionDialog
        open={showDomainDialog}
        onSelect={handleDomainSelect}
        onCancel={() => setShowDomainDialog(false)}
      />
    </div >
  )
}