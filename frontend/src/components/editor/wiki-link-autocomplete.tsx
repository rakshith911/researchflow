'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WikiLinkSuggestion {
  id: string
  title: string
  type: string
}

interface WikiLinkAutocompleteProps {
  query: string
  position: { top: number; left: number }
  onSelect: (title: string) => void
  onClose: () => void
}

export function WikiLinkAutocomplete({
  query,
  position,
  onSelect,
  onClose
}: WikiLinkAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<WikiLinkSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `http://localhost:5000/api/search-for-linking?q=${encodeURIComponent(query)}`
        )
        const result = await response.json()
        
        if (result.success) {
          setSuggestions(result.data)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex].title)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [suggestions, selectedIndex, onSelect, onClose])

  useEffect(() => {
    const selectedElement = containerRef.current?.children[selectedIndex] as HTMLElement
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

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

  if (suggestions.length === 0 && !isLoading) {
    return (
      <Card
        ref={containerRef}
        className="absolute z-50 w-80 max-h-64 overflow-auto shadow-lg border"
        style={{ top: position.top, left: position.left }}
      >
        <div className="p-3 text-sm text-muted-foreground text-center">
          <Search className="h-4 w-4 mx-auto mb-2 opacity-50" />
          No documents found
          <p className="text-xs mt-1">
            {query ? `No matches for "${query}"` : 'Start typing to search'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      ref={containerRef}
      className="absolute z-50 w-80 max-h-64 overflow-auto shadow-lg border"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2">
        <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
          Link to document:
        </div>
        {isLoading ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "flex items-center space-x-3",
                index === selectedIndex && "bg-accent text-accent-foreground"
              )}
              onClick={() => onSelect(suggestion.title)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{suggestion.title}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {suggestion.type}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/30">
        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs mr-1">↑↓</kbd>
        Navigate
        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs mx-1">Enter</kbd>
        Select
        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs ml-1">Esc</kbd>
        Close
      </div>
    </Card>
  )
}