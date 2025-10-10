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
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ResearchFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
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

      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Productivity for
            <span className="text-blue-600 block">Professionals</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            ResearchFlow automatically adapts to your professional domain—whether you're conducting 
            literature research, documenting technical specifications, or managing clinical protocols.
          </p>
          <Button size="lg" onClick={handleGetStarted} disabled={isLoading} className="text-lg px-8 py-3">
            {isLoading ? 'Starting...' : 'Start Your Research Journey'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Intelligent Features That Adapt to Your Work
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="pb-4">
                <Brain className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Context-Aware AI</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically detects your workflow context and adapts the interface 
                  for research, engineering, or healthcare tasks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader className="pb-4">
                <Network className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle className="text-lg">Knowledge Graph</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically creates and maintains connections between related concepts, 
                  papers, and projects across your work.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader className="pb-4">
                <FileText className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Unified Workspace</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Consolidate research, documentation, and collaboration into a single, 
                  integrated workspace.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 transition-colors">
              <CardHeader className="pb-4">
                <Zap className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle className="text-lg">Smart Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Reduce manual tasks with intelligent auto-tagging, smart search, 
                  and predictive content suggestions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8 px-4 mt-auto">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-6 w-6" />
            <span className="text-xl font-bold">ResearchFlow</span>
          </div>
          <p className="text-gray-400">
            AI-powered productivity platform for professionals • Built with Next.js, TypeScript, and OpenAI
          </p>
        </div>
      </footer>
    </div>
  )
}
