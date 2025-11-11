'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, FileText, Network, Zap, ArrowRight, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGetStarted = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      router.push('/editor')
    }, 1000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">ResearchFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-500/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              Prototype Ready
            </Badge>
            <Button onClick={handleGetStarted} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Get Started'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            AI-Powered Productivity for
            <span className="text-primary block">Professionals</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            ResearchFlow automatically adapts to your professional domain—whether you're conducting 
            literature research, documenting technical specifications, or managing clinical protocols.
          </p>
          <Button size="lg" onClick={handleGetStarted} disabled={isLoading} className="text-lg px-8 py-3">
            {isLoading ? 'Starting...' : 'Start Your Research Journey'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Intelligent Features That Adapt to Your Work
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader className="pb-4">
                <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="text-lg text-card-foreground">Context-Aware AI</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Automatically detects your workflow context and adapts the interface 
                  for research, engineering, or healthcare tasks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader className="pb-4">
                <Network className="h-10 w-10 text-green-600 dark:text-green-400 mb-2" />
                <CardTitle className="text-lg text-card-foreground">Knowledge Graph</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Automatically creates and maintains connections between related concepts, 
                  papers, and projects across your work.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader className="pb-4">
                <FileText className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-2" />
                <CardTitle className="text-lg text-card-foreground">Unified Workspace</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Consolidate research, documentation, and collaboration into a single, 
                  integrated workspace.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader className="pb-4">
                <Zap className="h-10 w-10 text-orange-600 dark:text-orange-400 mb-2" />
                <CardTitle className="text-lg text-card-foreground">Smart Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Reduce manual tasks with intelligent auto-tagging, smart search, 
                  and predictive content suggestions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-muted/30 border-t text-foreground py-8 px-4 mt-auto">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ResearchFlow</span>
          </div>
          <p className="text-muted-foreground">
            AI-powered productivity platform for professionals • Built with Next.js, TypeScript, and OpenAI
          </p>
        </div>
      </footer>
    </div>
  )
}