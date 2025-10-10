import { useState, useEffect, useCallback, useRef } from 'react'
import { debounce } from 'lodash'
import { apiClient } from '@/lib/api-client'

interface LinkSuggestion {
  documentId: string
  title: string
  type: string
  matchedConcepts: string[]
  relevanceScore: number
  context: string
  reason: string
}

interface WritingSuggestion {
  type: 'structure' | 'content' | 'quality' | 'link'
  message: string
  priority: 'high' | 'medium' | 'low'
}

interface WritingAnalysis {
  qualityScore: number
  suggestions: WritingSuggestion[]
  relatedDocuments: LinkSuggestion[]
  professionalTerms: string[]
  keyTopics: string[]
  readabilityScore: number
}

interface UseSmartWritingOptions {
  documentId: string
  documentType: string
  debounceMs?: number
  minContentLength?: number
}

export function useSmartWriting({
  documentId,
  documentType,
  debounceMs = 2000,
  minContentLength = 100
}: UseSmartWritingOptions) {
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const analyzeContent = useCallback(async (content: string) => {
    // Don't analyze if content is too short
    if (content.length < minContentLength) {
      setAnalysis(null)
      return
    }

    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await apiClient.post<any>('/api/smart-writing/analyze', {
        content,
        documentId,
        documentType
      })

      if (result.success) {
        setAnalysis(result.data)
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error analyzing content:', err)
        setError(err.message)
      }
    } finally {
      setIsAnalyzing(false)
      abortControllerRef.current = null
    }
  }, [documentId, documentType, minContentLength])

  // Create debounced version of analyzeContent
  const debouncedAnalyze = useCallback(
    debounce((content: string) => {
      analyzeContent(content)
    }, debounceMs),
    [analyzeContent, debounceMs]
  )

  const suggestLinksForSelection = useCallback(async (selectedText: string) => {
    if (!selectedText || selectedText.length < 10) {
      return []
    }

    try {
      const result = await apiClient.post<any>('/api/smart-writing/suggest-links', {
        selectedText,
        documentId
      })

      return result.success ? result.data : []
    } catch (err) {
      console.error('Error getting link suggestions:', err)
      return []
    }
  }, [documentId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      debouncedAnalyze.cancel()
    }
  }, [debouncedAnalyze])

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeContent: debouncedAnalyze,
    suggestLinksForSelection
  }
}