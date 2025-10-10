// frontend/src/app/(dashboard)/documents/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { DocumentList } from '@/components/documents/document-list'
import { AdvancedSearch } from '@/components/documents/advanced-search'
import { DocumentTemplateSelector } from '@/components/documents/document-template-selector'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Brain, Star, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DocumentsPage() {
  const { 
    documents,
    favoriteDocuments,
    recentDocuments,
    setCurrentDocument, 
    createDocument, 
    loadFavorites,
    loadRecentDocuments,
    isLoading 
  } = useDocumentStore()
  
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  useEffect(() => {
    loadFavorites()
    loadRecentDocuments()
  }, [loadFavorites, loadRecentDocuments])

  const handleSelectDocument = (document: any) => {
    setCurrentDocument(document)
    router.push('/editor')
  }

  const handleCreateFromTemplate = async (type: any, template?: string) => {
    setIsCreating(true)
    try {
      const newDoc = await createDocument(type, template)
      setCurrentDocument(newDoc)
      setShowTemplateSelector(false)
      router.push('/editor')
    } catch (error) {
      console.error('Failed to create document:', error)
      setIsCreating(false)
    }
  }

  const handleQuickNote = async () => {
    setIsCreating(true)
    try {
      const newDoc = await createDocument('general', '')
      setCurrentDocument(newDoc)
      router.push('/editor')
    } catch (error) {
      console.error('Failed to create document:', error)
      setIsCreating(false)
    }
  }

  const handleSearch = (results: any[]) => {
    setSearchResults(results)
    setIsSearching(true)
  }

  const handleClearSearch = () => {
    setSearchResults(null)
    setIsSearching(false)
  }

  const totalDocuments = documents.length
  const favoriteCount = favoriteDocuments.length
  const recentCount = recentDocuments.length
  const totalWords = documents.reduce((sum, doc) => sum + doc.wordCount, 0)
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with Stats */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">All Documents</h1>
              <p className="text-sm text-muted-foreground">
                Organize, search, and manage your knowledge base
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/ai-insights')}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowTemplateSelector(true)}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              From Template
            </Button>
            <Button 
              onClick={handleQuickNote} 
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Quick Note
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 pb-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{totalDocuments}</span>
            <span className="text-sm text-muted-foreground">Documents</span>
          </div>
          
          {favoriteCount > 0 && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">{favoriteCount}</span>
              <span className="text-sm text-muted-foreground">Favorites</span>
            </div>
          )}
          
          {recentCount > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{recentCount}</span>
              <span className="text-sm text-muted-foreground">Recent</span>
            </div>
          )}
          
          {totalWords > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{totalWords.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">Total Words</span>
            </div>
          )}
        </div>

        {/* Advanced Search */}
        <div className="px-6 pb-4">
          <AdvancedSearch 
            onSearch={handleSearch}
            onClear={handleClearSearch}
          />
        </div>

        {/* Search Status */}
        {isSearching && searchResults !== null && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </Badge>
                {searchResults.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    Try adjusting your search filters
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
              >
                Clear search
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Document List */}
      <div className="flex-1 overflow-hidden">
        <DocumentList 
          onSelectDocument={handleSelectDocument}
          searchResults={searchResults}
          className="h-full"
        />
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <DocumentTemplateSelector
          onSelectTemplate={handleCreateFromTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  )
}