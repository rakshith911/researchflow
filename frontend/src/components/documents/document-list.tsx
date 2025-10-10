// frontend/src/components/documents/document-list.tsx
'use client'

import { useState, useMemo } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DocumentListSkeleton } from '@/components/documents/document-list-skeleton'
import { formatRelativeDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { 
  Search,
  Calendar,
  Clock,
  FileText,
  Tag,
  MoreHorizontal,
  Star,
  Trash2,
  Edit,
  Eye,
  Copy,
  X,
  Trash,
  Tags,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Document {
  id: string
  title: string
  content: string
  type: 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general'
  tags: string[]
  wordCount: number
  readingTime: number
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
}

interface DocumentListProps {
  onSelectDocument: (document: Document) => void
  searchResults?: any[] | null
  viewMode?: 'grid' | 'list'
  className?: string
}

export function DocumentList({ 
  onSelectDocument, 
  searchResults = null,
  viewMode = 'list', 
  className 
}: DocumentListProps) {
  const { 
    documents, 
    deleteDocument, 
    renameDocument,
    duplicateDocument,
    toggleFavorite,
    bulkDelete,
    bulkAddTags,
    selectedDocumentIds,
    toggleDocumentSelection,
    selectAllDocuments,
    clearSelection,
    currentDocument, 
    isLoading: storeIsLoading 
  } = useDocumentStore()
  
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'type'>('updated')
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameDocId, setRenameDocId] = useState<string>('')
  const [newTitle, setNewTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [bulkTagsDialogOpen, setBulkTagsDialogOpen] = useState(false)
  const [bulkTagsInput, setBulkTagsInput] = useState('')
  const [isBulkOperating, setIsBulkOperating] = useState(false)
  const [operatingDocIds, setOperatingDocIds] = useState<Set<string>>(new Set())

  const isLoading = storeIsLoading
  const displayDocuments = searchResults !== null ? searchResults : documents
  const documentTypes = Array.from(new Set(displayDocuments.map(d => d.type)))
  const allTags = Array.from(new Set(displayDocuments.flatMap(d => d.tags)))

  const filteredDocuments = useMemo(() => {
    let docs = displayDocuments

    if (searchResults === null) {
      docs = docs.filter(doc => {
        const matchesSearch = localSearchQuery === '' || 
          doc.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
          doc.tags.some(tag => tag.toLowerCase().includes(localSearchQuery.toLowerCase()))
        
        const matchesType = selectedType === 'all' || doc.type === selectedType
        const matchesTag = selectedTag === 'all' || doc.tags.includes(selectedTag)
        
        return matchesSearch && matchesType && matchesTag
      })
    }

    return docs.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })
  }, [displayDocuments, searchResults, localSearchQuery, selectedType, selectedTag, sortBy])

  const getTypeColor = (type: string) => {
    const colors = {
      research: 'bg-blue-100 text-blue-800 border-blue-200',
      engineering: 'bg-green-100 text-green-800 border-green-200',
      healthcare: 'bg-red-100 text-red-800 border-red-200',
      meeting: 'bg-purple-100 text-purple-800 border-purple-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      research: '🔬',
      engineering: '⚙️',
      healthcare: '🏥',
      meeting: '👥',
      general: '📄',
    }
    return icons[type as keyof typeof icons] || icons.general
  }

  const handleDeleteDocument = async (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this document?')) {
      setOperatingDocIds(prev => new Set(prev).add(docId))
      try {
        await deleteDocument(docId)
      } catch (error) {
        console.error('Failed to delete document:', error)
      } finally {
        setOperatingDocIds(prev => {
          const next = new Set(prev)
          next.delete(docId)
          return next
        })
      }
    }
  }

  const handleRenameDocument = async (docId: string) => {
    const doc = displayDocuments.find(d => d.id === docId)
    if (doc) {
      setRenameDocId(docId)
      setNewTitle(doc.title)
      setRenameDialogOpen(true)
    }
  }

  const submitRename = async () => {
    if (!newTitle.trim()) return
    
    setIsRenaming(true)
    try {
      await renameDocument(renameDocId, newTitle.trim())
      setRenameDialogOpen(false)
      setRenameDocId('')
      setNewTitle('')
    } catch (error) {
      console.error('Failed to rename document:', error)
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDuplicateDocument = async (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setOperatingDocIds(prev => new Set(prev).add(docId))
    try {
      await duplicateDocument(docId)
    } catch (error) {
      console.error('Failed to duplicate document:', error)
    } finally {
      setOperatingDocIds(prev => {
        const next = new Set(prev)
        next.delete(docId)
        return next
      })
    }
  }

  const handleToggleFavorite = async (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setOperatingDocIds(prev => new Set(prev).add(docId))
    try {
      await toggleFavorite(docId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setOperatingDocIds(prev => {
        const next = new Set(prev)
        next.delete(docId)
        return next
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDocumentIds.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedDocumentIds.length} document(s)?`)) {
      setIsBulkOperating(true)
      try {
        await bulkDelete(selectedDocumentIds)
      } catch (error) {
        console.error('Failed to bulk delete:', error)
      } finally {
        setIsBulkOperating(false)
      }
    }
  }

  const handleBulkAddTags = async () => {
    if (selectedDocumentIds.length === 0 || !bulkTagsInput.trim()) return
    
    const tags = bulkTagsInput.split(',').map(t => t.trim()).filter(t => t)
    if (tags.length === 0) return
    
    setIsBulkOperating(true)
    try {
      await bulkAddTags(selectedDocumentIds, tags)
      setBulkTagsDialogOpen(false)
      setBulkTagsInput('')
      clearSelection()
    } catch (error) {
      console.error('Failed to add tags:', error)
    } finally {
      setIsBulkOperating(false)
    }
  }

  const toggleSelection = (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    toggleDocumentSelection(docId)
  }

  const isSelected = (docId: string) => selectedDocumentIds.includes(docId)
  const isOperating = (docId: string) => operatingDocIds.has(docId)
  const showLocalSearch = searchResults === null

  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <DocumentListSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Local Search and Filters */}
      {showLocalSearch && (
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Quick search in list..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-background"
            >
              <option value="all">All Types</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-background"
            >
              <option value="all">All Tags</option>
              {allTags.slice(0, 10).map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm bg-background"
            >
              <option value="updated">Last Modified</option>
              <option value="created">Date Created</option>
              <option value="title">Title</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>
      )}

      {/* Sorting - Show when using parent search */}
      {!showLocalSearch && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm bg-background"
            >
              <option value="updated">Last Modified</option>
              <option value="created">Date Created</option>
              <option value="title">Title</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Bulk Actions Bar */}
      {selectedDocumentIds.length > 0 && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary font-medium">
              {selectedDocumentIds.length} selected
            </span>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkTagsDialogOpen(true)}
                disabled={isBulkOperating}
              >
                {isBulkOperating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Tags className="h-4 w-4 mr-1" />
                )}
                Add Tags
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkOperating}
              >
                {isBulkOperating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4 mr-1" />
                )}
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isBulkOperating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Document List */}
      <div className="flex-1 overflow-auto">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              {searchResults !== null ? 'No results found' : 'No documents yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchResults !== null
                ? 'Try adjusting your search filters'
                : 'Create your first document to get started'
              }
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredDocuments.map((document) => {
              const isDocOperating = isOperating(document.id)
              
              return (
                <Card 
                  key={document.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-l-4",
                    currentDocument?.id === document.id 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:bg-muted/30",
                    getTypeColor(document.type).split(' ')[2],
                    isSelected(document.id) && "ring-2 ring-primary",
                    isDocOperating && "opacity-60 pointer-events-none"
                  )}
                  onClick={() => !isDocOperating && onSelectDocument(document)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <Checkbox
                          checked={isSelected(document.id)}
                          onCheckedChange={() => toggleSelection(document.id)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isDocOperating}
                        />
                        <span className="text-lg">{getTypeIcon(document.type)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">{document.title}</h4>
                            {isDocOperating && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                          </div>
                          <Badge variant="outline" className={cn("text-xs", getTypeColor(document.type))}>
                            {document.type}
                          </Badge>
                        </div>
                        {document.isFavorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            disabled={isDocOperating}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onSelectDocument(document)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleRenameDocument(document.id)
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateDocument(document.id, e as any)
                          }}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFavorite(document.id, e as any)
                          }}>
                            <Star className="mr-2 h-4 w-4" />
                            {document.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDocument(document.id, e as any)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {document.content.substring(0, 100)}...
                      </p>
                      
                      {document.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {document.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{document.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {document.readingTime} min read
                          </span>
                          <span>{document.wordCount} words</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatRelativeDate(document.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Enter a new name for this document
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Document title"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isRenaming) submitRename()
            }}
            disabled={isRenaming}
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitRename} 
              disabled={!newTitle.trim() || isRenaming}
            >
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Tags Dialog */}
      <Dialog open={bulkTagsDialogOpen} onOpenChange={setBulkTagsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags to Selected Documents</DialogTitle>
            <DialogDescription>
              Enter tags separated by commas (e.g., "research, important, draft")
            </DialogDescription>
          </DialogHeader>
          <Input
            value={bulkTagsInput}
            onChange={(e) => setBulkTagsInput(e.target.value)}
            placeholder="tag1, tag2, tag3"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isBulkOperating) handleBulkAddTags()
            }}
            disabled={isBulkOperating}
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBulkTagsDialogOpen(false)}
              disabled={isBulkOperating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAddTags} 
              disabled={!bulkTagsInput.trim() || isBulkOperating}
            >
              {isBulkOperating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}