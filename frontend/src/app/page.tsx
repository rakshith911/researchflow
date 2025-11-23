'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  FileText, 
  Network, 
  Zap, 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  Link2,
  Clock,
  Shield
} from 'lucide-react'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { enterGuestMode, isAuthenticated } = useAuthStore()

  const handleTryNow = () => {
    setIsLoading(true)
    
    // Enter guest mode
    enterGuestMode()
    
    // Small delay for smooth transition
    setTimeout(() => {
      setIsLoading(false)
      router.push('/editor')
    }, 500)
  }

  const handleSignIn = () => {
    router.push('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">ResearchFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button onClick={() => router.push('/documents')}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={handleSignIn}>
                  Sign In
                </Button>
                <Button onClick={handleTryNow} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Try It Free'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            No Credit Card Required
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Your AI-Powered
            <span className="text-primary block mt-2">Knowledge Workspace</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Connect ideas, discover insights, and build your personal knowledge graph. 
            Perfect for researchers, engineers, and professionals who think in networks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleTryNow} 
              disabled={isLoading}
              className="text-lg px-8 py-6 h-auto"
            >
              {isLoading ? 'Starting...' : '🚀 Try It Now - No Sign Up'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push('/register')}
              className="text-lg px-8 py-6 h-auto"
            >
              Create Free Account
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            ✨ Start using immediately • 💾 No installation required • 🔒 Your data stays private
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Think Better
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for professionals who need more than just a note-taking app
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader className="pb-4">
                <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="text-lg text-card-foreground">AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Get intelligent suggestions, auto-tagging, and context-aware recommendations as you work
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
                  Visualize connections between your documents and discover hidden relationships
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader className="pb-4">
                <Link2 className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-2" />
                <CardTitle className="text-lg text-card-foreground">Wiki-Style Links</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Create bidirectional links between notes with simple [[wiki syntax]]
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader className="pb-4">
                <Zap className="h-10 w-10 text-orange-600 dark:text-orange-400 mb-2" />
                <CardTitle className="text-lg text-card-foreground">Smart Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Start fast with templates for research, engineering, healthcare, and more
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Why Professionals Choose ResearchFlow
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-6 rounded-lg bg-background border">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  All Your Work in One Place
                </h3>
                <p className="text-muted-foreground">
                  Stop juggling between apps. ResearchFlow consolidates research notes, technical docs, 
                  meeting minutes, and project plans in a unified workspace.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-lg bg-background border">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  Save Hours Every Week
                </h3>
                <p className="text-muted-foreground">
                  AI-powered automation handles tagging, categorization, and connecting related content. 
                  Focus on thinking, not organizing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-lg bg-background border">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  Your Data, Your Control
                </h3>
                <p className="text-muted-foreground">
                  End-to-end encryption, local-first architecture, and full data export. 
                  Your intellectual property stays yours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join professionals who are thinking better with ResearchFlow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={handleTryNow}
              disabled={isLoading}
              className="text-lg px-8 py-6 h-auto"
            >
              {isLoading ? 'Starting...' : 'Start Free - No Sign Up Required'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t text-foreground py-8 px-4 mt-auto">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ResearchFlow</span>
          </div>
          <p className="text-muted-foreground">
            AI-powered knowledge workspace for professionals
          </p>
        </div>
      </footer>
    </div>
  )
}