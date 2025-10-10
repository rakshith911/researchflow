'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  TrendingUp, 
  FileText, 
  Zap, 
  BarChart3, 
  Target,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

interface AIInsightsData {
  analytics: any
  smartRecommendations: any[]
  workflowInsights: any[]
  contentGaps: any[]
  generatedAt: string
}

export default function AIInsightsPage() {
  const [insightsData, setInsightsData] = useState<AIInsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
  const loadAIInsights = async () => {
    try {
      // ✅ If apiClient is Axios, destructure the response
      const { data: result } = await apiClient.get<{
        success: boolean
        data: AIInsightsData
        error?: string
      }>('/api/insights/ai')

      if (result?.success && result?.data) {
        setInsightsData(result.data)
      } else {
        throw new Error(result?.error || 'Failed to load insights')
      }
    } catch (error) {
      console.error('Failed to load AI insights:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  loadAIInsights()
}, [])


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Analyzing your workspace with AI...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Insights</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!insightsData) return null

  const { analytics, smartRecommendations, workflowInsights, contentGaps } = insightsData

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">AI Insights</h1>
              <p className="text-muted-foreground">
                Professional workflow intelligence powered by advanced content analysis
              </p>
            </div>
          </div>
          
          <Button onClick={() => router.push('/documents')}>
            View Documents
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Documents</p>
                <p className="text-3xl font-bold text-blue-700">{analytics.overview.totalDocuments}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Quality Score: {analytics.overview.avgQuality}/100
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">This Week</p>
                <p className="text-3xl font-bold text-green-700">{analytics.activity.week}</p>
                <p className="text-xs text-green-600 mt-1">
                  {analytics.activity.today} today
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Words</p>
                <p className="text-3xl font-bold text-purple-700">
                  {(analytics.overview.totalWords / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {analytics.overview.avgWordsPerDoc} avg/doc
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Professional Terms</p>
                <p className="text-3xl font-bold text-orange-700">{analytics.overview.professionalTermsUsed}</p>
                <p className="text-xs text-orange-600 mt-1">
                  Vocabulary expansion
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Recommendations */}
        {smartRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>AI-Powered Recommendations</span>
                <Badge variant="secondary">Rule-based Analysis</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {smartRecommendations.slice(0, 5).map((rec, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      rec.priority === 'high' ? 'bg-red-100' :
                      rec.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <Lightbulb className={`h-4 w-4 ${
                        rec.priority === 'high' ? 'text-red-600' :
                        rec.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rec.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                      <div className="space-y-1">
                        {rec.actionItems.slice(0, 3).map((action: string, actionIndex: number) => (
                          <div key={actionIndex} className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflow Insights */}
        {workflowInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Workflow Pattern Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowInsights.map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{insight.pattern}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    <p className="text-sm font-medium text-primary">{insight.suggestion}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {insight.documentsAffected.length} documents affected
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Gaps Analysis */}
        {contentGaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Content Quality Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentGaps.slice(0, 6).map((gap, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted/20 rounded-lg">
                    <div className={`p-1 rounded ${
                      gap.priority === 'high' ? 'bg-red-100' :
                      gap.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`h-3 w-3 ${
                        gap.priority === 'high' ? 'text-red-600' :
                        gap.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{gap.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{gap.suggestion}</p>
                    </div>
                    <Badge 
                      variant={gap.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {gap.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Type Distribution with Quality Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Document Portfolio Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.distribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize font-medium">{type}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-2 bg-muted rounded-full">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(count as number / analytics.overview.totalDocuments) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count as number}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Professional Growth Tracking */}
        {analytics.professionalGrowth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Professional Development</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <h4 className="text-sm font-medium">Writing Consistency</h4>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(analytics.professionalGrowth.writingConsistency)}%
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium">Vocabulary Growth</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.professionalGrowth.vocabularyExpansion[analytics.professionalGrowth.vocabularyExpansion.length - 1] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">unique terms</p>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium">Domain Expertise</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.professionalGrowth.domainExpertise.length}
                  </p>
                  <p className="text-xs text-muted-foreground">areas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
