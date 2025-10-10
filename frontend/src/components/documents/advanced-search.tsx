// frontend/src/components/documents/advanced-search.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Search,
  X,
  Filter,
  FileText,
  Users,
  Calendar,
  Tag as TagIcon,
  Clock,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface AdvancedSearchProps {
  onSearch: (results: any[]) => void
  onClear: () => void
  className?: string
}

export function AdvancedSearch({ onSearch, onClear, className }: AdvancedSearchProps) {
  const { documents, searchDocuments } = useDocumentStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  
  // Search history
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Get unique types and tags from documents
  const documentTypes = Array.from(new Set(documents.map(d => d.type)))
  const allTags = Array.from(new Set(documents.flatMap(d => d.tags))).slice(0, 20)

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (e) {
        console.error('Failed to load search history:', e)
      }
    }
  }, [])

  // Debounced search
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() && selectedTypes.length === 0 && selectedTags.length === 0 && !favoritesOnly) {
        onClear()
        return
      }

      setIsSearching(true)

      try {
        // First, filter locally
        let results = documents.filter(doc => {
          const matchesQuery = !query.trim() || 
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            doc.content.toLowerCase().includes(query.toLowerCase()) ||
            doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
          
          const matchesType = selectedTypes.length === 0 || selectedTypes.includes(doc.type)
          const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => doc.tags.includes(tag))
          const matchesFavorite = !favoritesOnly || doc.isFavorite

          return matchesQuery && matchesType && matchesTags && matchesFavorite
        })

        // If there's a query, also try backend search for better results
        if (query.trim()) {
          const backendResults = await searchDocuments(query, {
            type: selectedTypes.length === 1 ? selectedTypes[0] : undefined
          })
          
          // Merge results (backend might have better ranking)
          if (backendResults.length > 0) {
            results = backendResults
          }
        }

        onSearch(results)

        // Add to search history if it's a query search
        if (query.trim()) {
          const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10)
          setSearchHistory(newHistory)
          localStorage.setItem('searchHistory', JSON.stringify(newHistory))
        }
      } catch (error) {
        console.error('Search failed:', error)
        onClear()
      } finally {
        setIsSearching(false)
      }
    },
    [documents, searchDocuments, selectedTypes, selectedTags, favoritesOnly, onSearch, onClear, searchHistory]
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || selectedTypes.length > 0 || selectedTags.length > 0 || favoritesOnly) {
        performSearch(searchQuery)
      } else {
        onClear()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedTypes, selectedTags, favoritesOnly, performSearch, onClear])

  const handleClearAll = () => {
    setSearchQuery('')
    setSelectedTypes([])
    setSelectedTags([])
    setFavoritesOnly(false)
    onClear()
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const selectHistoryItem = (query: string) => {
    setSearchQuery(query)
    setShowHistory(false)
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
    setShowHistory(false)
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedTags.length > 0 || favoritesOnly

  const getTypeIcon = (type: string) => {
    const icons = {
      research: FileText,
      engineering: FileText,
      healthcare: FileText,
      meeting: Users,
      general: FileText,
    }
    const Icon = icons[type as keyof typeof icons] || FileText
    return Icon
  }

  const getTypeColor = (type: string) => {
    const colors = {
      research: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      engineering: 'bg-green-100 text-green-800 hover:bg-green-200',
      healthcare: 'bg-red-100 text-red-800 hover:bg-red-200',
      meeting: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      general: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents by title, content, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
          className="pl-10 pr-24"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          )}
          {(searchQuery || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleClearAll}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2", showFilters && "bg-muted")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3 w-3 mr-1" />
            Filters
            {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={clearHistory}
              >
                Clear
              </Button>
            </div>
            {searchHistory.map((item, index) => (
              <button
                key={index}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                onClick={() => selectHistoryItem(item)}
              >
                <Clock className="h-3 w-3 text-muted-foreground" />
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {selectedTypes.map(type => {
            const Icon = getTypeIcon(type)
            return (
              <Badge
                key={type}
                variant="secondary"
                className={cn("text-xs cursor-pointer", getTypeColor(type))}
                onClick={() => toggleType(type)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {type}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )
          })}
          {selectedTags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs cursor-pointer bg-orange-100 text-orange-800 hover:bg-orange-200"
              onClick={() => toggleTag(tag)}
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {favoritesOnly && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              onClick={() => setFavoritesOnly(false)}
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              Favorites
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          {/* Document Types */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Type
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {documentTypes.map(type => {
                const Icon = getTypeIcon(type)
                const isSelected = selectedTypes.includes(type)
                return (
                  <Button
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs h-8",
                      !isSelected && getTypeColor(type)
                    )}
                    onClick={() => toggleType(type)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allTags.map(tag => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <Button
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => toggleTag(tag)}
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Other Filters */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Other Filters
            </label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={favoritesOnly ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFavoritesOnly(!favoritesOnly)}
              >
                <Star className={cn("h-3 w-3 mr-1", favoritesOnly && "fill-current")} />
                Favorites Only
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}