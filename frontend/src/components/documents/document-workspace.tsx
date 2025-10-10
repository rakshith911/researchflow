// File: frontend/src/components/documents/document-workspace.tsx
'use client'

import { useEffect, useState } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { DocumentList } from '@/components/documents/document-list'
import { DocumentStats } from '@/components/documents/document-stats'
import { DocumentFilters } from '@/components/documents/document-filters'
import { DocumentTemplateSelector } from '@/components/documents/document-template-selector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  LayoutGrid, 
  List, 
  Filter,
  SortDesc,
  Search,
  FileText,
  TrendingUp,
  Brain,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface DocumentWorkspaceProps {
  className?: string
}

type ViewMode = 'grid' | 'list'

export function DocumentWorkspace({ className }: DocumentWorkspaceProps) {
  const { 
    documents, 
    loadAllDocuments, 
    createDocument, 
    setCurrentDocument 
  } = useDocumentStore()
  
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDocs = async () => {
      try {
        await loadAllDocuments()
      } finally {
        setIsLoading(false)
      }
    }
    loadDocs()
  }, [loadAllDocuments])

  const handleSelectDocument = (document: any) => {
    setCurrentDocument(document)
    router.push('/dashboard/editor')
  }

  const handleCreateDocument = async (type?: any, template?: string) => {
    try {
      const newDoc = await createDocument(type || 'general', template)
      setCurrentDocument(newDoc)
      router.push('/dashboard/editor')
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const getWorkflowInsights = () => {
    const typeStats = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalWords = documents.reduce((sum, doc) => sum + doc.wordCount, 0)
    const avgWordsPerDoc = documents.length > 0 ? Math.round(totalWords / documents.length) : 0
    
    const recentDocs = documents.filter(doc => {
      const daysSince = (new Date().getTime() - new Date(doc.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    }).length

    return {
      typeStats,
      totalWords,
      avgWordsPerDoc,
      recentActivity: recentDocs,
      mostProductiveType: Object.entries(typeStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general'
    }
  }

  const insights = getWorkflowInsights()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col bg-background overflow-hidden", className)}>
      {/* Enhanced Header */}
      <div className="flex-shrink-0 border-b bg-gradient-to-r from-background to-muted/30">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Document Workspace</h1>
                  <p className="text-muted-foreground">
                    AI-powered document management for professionals
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => setShowTemplateSelector(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Smart Create
              </Button>
              <Button onClick={() => handleCreateDocument()}>
                <FileText className="h-4 w-4 mr-2" />
                Quick Note
              </Button>
            </div>
          </div>

          {/* Workflow Insights Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-700">{documents.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600">This Week</p>
                  <p className="text-2xl font-bold text-green-700">{insights.recentActivity}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600">Total Words</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {(insights.totalWords / 1000).toFixed(1)}K
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-600">Most Active</p>
                  <p className="text-lg font-bold text-orange-700 capitalize">
                    {insights.mostProductiveType}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Smart Filters
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{documents.length}</span> documents • 
                <span className="font-medium"> {insights.avgWordsPerDoc}</span> avg words/doc
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="flex-shrink-0">
          <DocumentFilters onFilterChange={() => {}} />
        </div>
      )}

      {/* Document Stats Row */}
      <div className="flex-shrink-0">
        <DocumentStats documents={documents} />
      </div>

      {/* Enhanced Document List - Fixed scrolling */}
      <div className="flex-1 overflow-auto">
        <div className="h-full">
          <DocumentList 
            onSelectDocument={handleSelectDocument}
            viewMode={viewMode}
            className="h-full"
          />
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <DocumentTemplateSelector
          onSelectTemplate={(type, template) => {
            handleCreateDocument(type, template)
            setShowTemplateSelector(false)
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  )
}