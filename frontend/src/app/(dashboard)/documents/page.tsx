// frontend/src/app/(dashboard)/documents/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { DocumentList } from '@/components/documents/document-list'
import { AdvancedSearch } from '@/components/documents/advanced-search'
import { DocumentTemplateSelector } from '@/components/documents/document-template-selector'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { Plus, FileText, Brain, Star, Clock, TrendingUp, Loader2, Users, Eye, MessageSquare, Edit3 } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('all')

  // Shared documents state
  const [sharedWithMe, setSharedWithMe] = useState<any[]>([])
  const [isLoadingShared, setIsLoadingShared] = useState(false)

  useEffect(() => {
    loadFavorites()
    loadRecentDocuments()
    loadSharedWithMe()
  }, [loadFavorites, loadRecentDocuments])

  const loadSharedWithMe = async () => {
    setIsLoadingShared(true)
    try {
      const result = await apiClient.getSharedWithMe()
      if (result.success && result.data) {
        setSharedWithMe(result.data)
      }
    } catch (error) {
      console.error('Failed to load shared documents:', error)
    } finally {
      setIsLoadingShared(false)
    }
  }

  const handleSelectDocument = (document: any) => {
    setCurrentDocument(document)
    router.push('/editor')
  }

  const handleSelectSharedDocument = (share: any) => {
    // Navigate using the share token
    router.push(`/shared/${share.share_token}`)
  }

  const handleCreateFromTemplate = async (type: any, template?: string, format?: 'markdown' | 'latex') => {
    setIsCreating(true)
    try {
      const newDoc = await createDocument(type, template, format)
      if (newDoc) {
        setCurrentDocument(newDoc)
        setShowTemplateSelector(false)
        router.push('/editor')
      }
    } catch (error) {
      console.error('Failed to create document:', error)
      setIsCreating(false)
    }
  }

  const handleQuickNote = async () => {
    setIsCreating(true)
    try {
      const newDoc = await createDocument('general', '')
      if (newDoc) {
        setCurrentDocument(newDoc)
        router.push('/editor')
      }
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

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view': return <Eye className="w-3 h-3" />
      case 'comment': return <MessageSquare className="w-3 h-3" />
      case 'edit': return <Edit3 className="w-3 h-3" />
    }
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'view': return 'bg-blue-100 text-blue-800'
      case 'comment': return 'bg-yellow-100 text-yellow-800'
      case 'edit': return 'bg-green-100 text-green-800'
    }
  }

  const totalDocuments = documents.length
  const favoriteCount = favoriteDocuments.length
  const recentCount = recentDocuments.length
  const totalWords = documents.reduce((sum, doc) => sum + (doc.wordCount || 0), 0)
  const sharedCount = sharedWithMe.length

  return (
    <div className="h-full flex flex-col">
      {/* Header with Stats */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Documents</h1>
              <p className="text-sm text-muted-foreground">
                Manage your documents and collaborations
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
              onClick={() => setShowTemplateSelector(true)}
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Document
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

          {sharedCount > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">{sharedCount}</span>
              <span className="text-sm text-muted-foreground">Shared</span>
            </div>
          )}

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

      {/* Tabs for My Documents vs Shared With Me */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="all">
                My Documents
                {totalDocuments > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalDocuments}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shared">
                <Users className="w-4 h-4 mr-2" />
                Shared With Me
                {sharedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {sharedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="flex-1 overflow-hidden m-0">
            <DocumentList
              onSelectDocument={handleSelectDocument}
              searchResults={searchResults}
              className="h-full"
            />
          </TabsContent>

          <TabsContent value="shared" className="flex-1 overflow-auto m-0 p-6">
            {isLoadingShared ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sharedWithMe.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                  <CardTitle className="mb-2">No shared documents yet</CardTitle>
                  <CardDescription className="text-center max-w-sm">
                    Documents that others share with you will appear here. You'll be able to view, comment, or edit based on the permissions they grant.
                  </CardDescription>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sharedWithMe.map((share) => (
                  <Card
                    key={share.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSelectSharedDocument(share)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2">
                          {share.document_title || 'Untitled Document'}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`${getPermissionColor(share.permission)} flex-shrink-0`}
                        >
                          {getPermissionIcon(share.permission)}
                          <span className="ml-1 text-xs capitalize">{share.permission}</span>
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-1">
                        {share.document_type && (
                          <span className="capitalize">{share.document_type}</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span className="truncate">
                            Shared by {share.owner_name || share.owner_email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(share.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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

// Missing User icon import
import { User } from 'lucide-react'