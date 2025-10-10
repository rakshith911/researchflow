'use client'

import { useEffect, useState } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Network, ExternalLink, RefreshCw } from 'lucide-react'

interface DocumentRecommendationsProps {
  currentDocumentId: string
  className?: string
}

export function DocumentRecommendations({ currentDocumentId, className }: DocumentRecommendationsProps) {
  const { documents, setCurrentDocument } = useDocumentStore()
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    if (currentDocumentId) {
      loadRecommendations()
    }
  }, [currentDocumentId])
  
  const loadRecommendations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/knowledge-graph/recommendations/${currentDocumentId}`)
      const result = await response.json()
      
      if (result.success) {
        setRecommendations(result.data)
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleOpenDocument = (doc: any) => {
    setCurrentDocument(doc)
  }
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Network className="h-4 w-4 mr-2" />
            Related Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Finding connections...</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Network className="h-4 w-4 mr-2" />
            Related Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4">
            No related documents found. Create more documents to see connections.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <Network className="h-4 w-4 mr-2" />
            Related Documents
          </div>
          <Badge variant="secondary" className="text-xs">
            {recommendations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {recommendations.slice(0, 5).map((doc, index) => (
            <div
              key={doc.id}
              className="p-3 border rounded hover:bg-muted cursor-pointer transition-colors group"
              onClick={() => handleOpenDocument(doc)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate group-hover:text-primary">
                      {doc.title}
                    </p>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {doc.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {doc.wordCount} words
                    </span>
                  </div>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recommendations.length > 5 && (
          <Button variant="outline" size="sm" className="w-full mt-3">
            View All {recommendations.length} Related Documents
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
