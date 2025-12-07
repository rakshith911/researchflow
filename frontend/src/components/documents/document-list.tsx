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
  // ✅ FIXED: Only get functions that exist in the store
  const {
    documents,
    deleteDocument,
    updateDocument,  // ✅ Use this for renaming
    createDocument,  // ✅ Use this for duplicating
    toggleFavorite,
    currentDocument,
    isLoading: storeIsLoading
  } = useDocumentStore()

  // ✅ FIXED: Manage selection locally
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])

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

  // ✅ FIXED: Local selection management functions
  const toggleDocumentSelection = (id: string) => {
    setSelectedDocumentIds(prev =>
      prev.includes(id)
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    )
  }

  const selectAllDocuments = () => {
    setSelectedDocumentIds(filteredDocuments.map(d => d.id))
  }

  const clearSelection = () => {
    setSelectedDocumentIds([])
  }

  // ✅ FIXED: Rename document function
  const renameDocument = async (id: string, newTitle: string) => {
    try {
      await updateDocument(id, { title: newTitle })
    } catch (error) {
      console.error('Failed to rename document:', error)
      throw error
    }
  }

  // ✅ FIXED: Duplicate document function
  const duplicateDocument = async (id: string) => {
    const doc = (documents || []).find(d => d.id === id)
    if (!doc) return

    try {
      await createDocument(doc.type, doc.content)
    } catch (error) {
      console.error('Failed to duplicate document:', error)
      throw error
    }
  }

  // ✅ FIXED: Bulk delete function
  const bulkDelete = async (ids: string[]) => {
    setIsBulkOperating(true)
    try {
      for (const id of ids) {
        await deleteDocument(id)
      }
      clearSelection()
    } catch (error) {
      console.error('Failed to bulk delete:', error)
      throw error
    } finally {
      setIsBulkOperating(false)
    }
  }

  // ✅ FIXED: Bulk add tags function
  const bulkAddTags = async (ids: string[], tags: string[]) => {
    setIsBulkOperating(true)
    try {
      const safeDocuments = documents || []
      for (const id of ids) {
        const doc = safeDocuments.find(d => d.id === id)
        if (doc) {
          const existingTags = Array.isArray(doc.tags) ? doc.tags : []
          const newTags = Array.from(new Set([...existingTags, ...tags]))
          await updateDocument(id, { tags: newTags })
        }
      }
      clearSelection()
    } catch (error) {
      console.error('Failed to bulk add tags:', error)
      throw error
    } finally {
      setIsBulkOperating(false)
    }
  }

  const isLoading = storeIsLoading
  const safeDocuments = documents || [] // ✅ Safe access
  const displayDocuments = searchResults !== null ? searchResults : safeDocuments
  const documentTypes = Array.from(new Set(displayDocuments.map(d => d.type)))
  const allTags = Array.from(new Set(displayDocuments.flatMap(d => d.tags || [])))

  const filteredDocuments = useMemo(() => {
    let docs = displayDocuments

    if (searchResults === null) {
      docs = docs.filter(doc => {
        const matchesSearch = localSearchQuery === '' ||
          doc.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
          (doc.tags || []).some((tag: string) => tag.toLowerCase().includes(localSearchQuery.toLowerCase()))

        const matchesType = selectedType === 'all' || doc.type === selectedType
        const matchesTag = selectedTag === 'all' || (doc.tags || []).includes(selectedTag)

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
      research: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      engineering: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      healthcare: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      meeting: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      general: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700',
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
      try {
        await bulkDelete(selectedDocumentIds)
      } catch (error) {
        console.error('Failed to bulk delete:', error)
      }
    }
  }

  const handleBulkAddTags = async () => {
    if (selectedDocumentIds.length === 0 || !bulkTagsInput.trim()) return

    const tags = bulkTagsInput.split(',').map(t => t.trim()).filter(t => t)
    if (tags.length === 0) return

    try {
      await bulkAddTags(selectedDocumentIds, tags)
      setBulkTagsDialogOpen(false)
      setBulkTagsInput('')
    } catch (error) {
      console.error('Failed to add tags:', error)
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

  // Empty state
  if (filteredDocuments.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center p-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
          <p className="text-muted-foreground">
            {localSearchQuery || selectedType !== 'all' || selectedTag !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first document to get started'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Local Filters (Search removed) */}
      {showLocalSearch && (
        <div className="p-4 border-b space-y-4">
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

            {allTags.length > 0 && (
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
            )}

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

            {filteredDocuments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllDocuments}
                className="ml-auto"
              >
                Select All
              </Button>
            )}
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
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredDocuments.map(doc => (
              <Card
                key={doc.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border",
                  isSelected(doc.id) && "ring-2 ring-primary",
                  currentDocument?.id === doc.id && "border-primary",
                  isOperating(doc.id) && "opacity-50"
                )}
                onClick={() => !isOperating(doc.id) && onSelectDocument(doc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isSelected(doc.id)}
                      onCheckedChange={() => toggleSelection(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isOperating(doc.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate flex items-center gap-2">
                            <span>{getTypeIcon(doc.type)}</span>
                            {doc.title || 'Untitled Document'}
                            {doc.isFavorite && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {doc.content.substring(0, 150) || 'No content yet...'}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" disabled={isOperating(doc.id)}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectDocument(doc); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRenameDocument(doc.id); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDuplicateDocument(doc.id, e)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleToggleFavorite(doc.id, e)}>
                              <Star className="h-4 w-4 mr-2" />
                              {doc.isFavorite ? 'Unfavorite' : 'Favorite'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteDocument(doc.id, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <Badge variant="outline" className={cn("text-xs", getTypeColor(doc.type))}>
                          {doc.type}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {doc.wordCount || 0} words
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(doc.updatedAt)}
                        </span>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <Tag className="h-3 w-3" />
                            {(doc.tags as string[]).slice(0, 3).map((tag: string, index: number) => (
                              <span key={`${doc.id}-tag-${index}`} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="text-xs">+{doc.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => (
              <Card
                key={doc.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected(doc.id) && "ring-2 ring-primary",
                  currentDocument?.id === doc.id && "border-primary",
                  isOperating(doc.id) && "opacity-50"
                )}
                onClick={() => !isOperating(doc.id) && onSelectDocument(doc)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Checkbox
                      checked={isSelected(doc.id)}
                      onCheckedChange={() => toggleSelection(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isOperating(doc.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" disabled={isOperating(doc.id)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectDocument(doc); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRenameDocument(doc.id); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDuplicateDocument(doc.id, e)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleToggleFavorite(doc.id, e)}>
                          <Star className="h-4 w-4 mr-2" />
                          {doc.isFavorite ? 'Unfavorite' : 'Favorite'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-foreground truncate flex items-center gap-2 mb-1">
                        <span>{getTypeIcon(doc.type)}</span>
                        {doc.title || 'Untitled Document'}
                        {doc.isFavorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 ml-auto" />
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {doc.content.substring(0, 100) || 'No content yet...'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={cn("text-xs", getTypeColor(doc.type))}>
                          {doc.type}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {doc.wordCount || 0} words
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeDate(doc.updatedAt)}
                      </span>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {(doc.tags as string[]).slice(0, 2).map((tag: string, index: number) => (
                            <span key={`${doc.id}-grid-tag-${index}`} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 2 && (
                            <span className="text-xs">+{doc.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              if (e.key === 'Enter') {
                submitRename()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={isRenaming || !newTitle.trim()}>
              {isRenaming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
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
              Enter tags separated by commas
            </DialogDescription>
          </DialogHeader>
          <Input
            value={bulkTagsInput}
            onChange={(e) => setBulkTagsInput(e.target.value)}
            placeholder="tag1, tag2, tag3"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBulkAddTags()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddTags} disabled={isBulkOperating || !bulkTagsInput.trim()}>
              {isBulkOperating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}