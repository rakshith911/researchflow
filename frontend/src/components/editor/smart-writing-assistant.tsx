'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Lightbulb,
  Link2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react'

interface SmartWritingAssistantProps {
  analysis: any
  isAnalyzing: boolean
  onDocumentClick: (documentId: string) => void
  className?: string
}

export function SmartWritingAssistant({
  analysis,
  isAnalyzing,
  onDocumentClick,
  className
}: SmartWritingAssistantProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  if (isAnalyzing) {
    return (
      <Card className={cn("w-80", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
            Analyzing...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className={cn("w-80", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Sparkles className="h-4 w-4 mr-2" />
            Writing Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start writing to get intelligent suggestions and insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("w-80 space-y-4", className)}>
      {/* Quality Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Content Quality
            </div>
            <Badge variant="outline" className={getQualityColor(analysis.qualityScore)}>
              {analysis.qualityScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Overall Score</span>
              <span className={cn("font-medium", getQualityColor(analysis.qualityScore))}>
                {getQualityLabel(analysis.qualityScore)}
              </span>
            </div>
            <Progress value={analysis.qualityScore} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Readability</span>
              <span className="font-medium">{analysis.readabilityScore.toFixed(0)}/100</span>
            </div>
            <Progress value={analysis.readabilityScore} className="h-2" />
          </div>

          {analysis.professionalTerms.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Professional Terms Used</p>
              <div className="flex flex-wrap gap-1">
                {analysis.professionalTerms.slice(0, 4).map((term: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {term}
                  </Badge>
                ))}
                {analysis.professionalTerms.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{analysis.professionalTerms.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions Card */}
      {analysis.suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Suggestions
              </div>
              <Badge variant="secondary" className="text-xs">
                {analysis.suggestions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.suggestions.slice(0, 5).map((suggestion: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="mt-0.5">
                    {getPriorityIcon(suggestion.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{suggestion.message}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {suggestion.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Documents Card */}
      {analysis.relatedDocuments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center">
                <Link2 className="h-4 w-4 mr-2" />
                Related Documents
              </div>
              <Badge variant="secondary" className="text-xs">
                {analysis.relatedDocuments.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.relatedDocuments.map((doc: any, index: number) => (
                <div
                  key={doc.documentId}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors group"
                  onClick={() => onDocumentClick(doc.documentId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate group-hover:text-primary">
                          {doc.title}
                        </p>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {doc.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {(doc.relevanceScore * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                      {doc.matchedConcepts.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Shared concepts:</p>
                          <div className="flex flex-wrap gap-1">
                            {doc.matchedConcepts.slice(0, 3).map((concept: string, i: number) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {doc.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Topics Card */}
      {analysis.keyTopics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Key Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.keyTopics.slice(0, 8).map((topic: string, index: number) => (
                <Badge key={index} variant="outline">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}