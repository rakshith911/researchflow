'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Backlink {
  documentId: string
  documentTitle: string
  documentType: string
  excerpt: string
  linkCount: number
}

interface BacklinksPanelProps {
  documentId: string
  onNavigate: (documentId: string) => void
  className?: string
}

export function BacklinksPanel({ documentId, onNavigate, className }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBacklinks = async () => {
      if (!documentId) {
        setBacklinks([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(
          `http://localhost:5000/api/documents/${documentId}/backlinks`
        )
        const result = await response.json()
        
        if (result.success) {
          setBacklinks(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch backlinks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBacklinks()
  }, [documentId])

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      research: '🔬',
      engineering: '⚙️',
      healthcare: '🏥',
      meeting: '👥',
      general: '📄',
    }
    return icons[type] || '📄'
  }

  if (!documentId) {
    return null
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Backlinks</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {backlinks.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Documents linking to this page
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Loading backlinks...
          </div>
        ) : backlinks.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">No backlinks yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Other documents can link here using [[Document Name]]
            </p>
          </div>
        ) : (
          backlinks.map((backlink) => (
            <button
              key={backlink.documentId}
              onClick={() => onNavigate(backlink.documentId)}
              className={cn(
                "w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors",
                "group"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-sm">{getTypeIcon(backlink.documentType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate group-hover:text-primary">
                      {backlink.documentTitle}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {backlink.documentType}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {backlink.linkCount > 1 && (
                    <Badge variant="outline" className="text-xs">
                      {backlink.linkCount}×
                    </Badge>
                  )}
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {backlink.excerpt && (
                <div className="text-xs text-muted-foreground line-clamp-2 bg-muted/50 p-2 rounded">
                  {backlink.excerpt}
                </div>
              )}
            </button>
          ))
        )}

        {backlinks.length > 0 && (
          <div className="pt-2 mt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Tip: Use <code className="px-1 py-0.5 bg-muted rounded text-xs">[[Link]]</code> to create connections
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}