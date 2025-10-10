'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Calendar,
  Tag,
  Filter,
  X
} from 'lucide-react'

interface DocumentFiltersProps {
  onFilterChange: (filters: any) => void
}

export function DocumentFilters({ onFilterChange }: DocumentFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<string>('all')

  const documentTypes = ['research', 'engineering', 'healthcare', 'meeting', 'general']
  const commonTags = ['important', 'draft', 'review', 'completed', 'urgent', 'project']

  const toggleType = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    setSelectedTypes(newTypes)
    onFilterChange({ types: newTypes })
  }

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
    onFilterChange({ tags: newTags })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTypes([])
    setSelectedTags([])
    setDateRange('all')
    onFilterChange({ clear: true })
  }

  const getTypeColor = (type: string) => {
    const colors = {
      research: 'bg-blue-100 text-blue-800 border-blue-200',
      engineering: 'bg-green-100 text-green-800 border-green-200',
      healthcare: 'bg-red-100 text-red-800 border-red-200',
      meeting: 'bg-purple-100 text-purple-800 border-purple-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  const hasActiveFilters = searchQuery || selectedTypes.length > 0 || selectedTags.length > 0 || dateRange !== 'all'

  return (
    <div className="border-b bg-muted/20 p-4">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filters */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Document Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {documentTypes.map(type => (
              <Button
                key={type}
                variant={selectedTypes.includes(type) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleType(type)}
                className={selectedTypes.includes(type) ? getTypeColor(type) : ''}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tag Filters */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {commonTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </h4>
          <div className="flex flex-wrap gap-2">
            {['all', 'today', 'week', 'month', 'quarter'].map(range => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range === 'all' ? 'All Time' : 
                 range === 'today' ? 'Today' :
                 range === 'week' ? 'This Week' :
                 range === 'month' ? 'This Month' : 'This Quarter'}
              </Button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedTypes.length + selectedTags.length} filters active
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
