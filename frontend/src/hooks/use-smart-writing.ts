import { useState, useEffect, useCallback, useRef } from 'react'
import debounce from 'lodash/debounce'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

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

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface WritingAnalysis {
  qualityScore: number
  suggestions: WritingSuggestion[]
  relatedDocuments: LinkSuggestion[]
  professionalTerms: string[]
  keyTopics: string[]
  readabilityScore: number
  scoreBreakdown?: {
    readability: number
    structure: number
    depth: number
  }
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
  const [initialChatHistory, setInitialChatHistory] = useState<ChatMessage[]>([])

  const abortControllerRef = useRef<AbortController | null>(null)
  const { isAuthenticated } = useAuthStore()

  // Load chat history when document changes
  useEffect(() => {
    if (isAuthenticated && documentId) {
      apiClient.get<ChatMessage[]>(`/api/chat/${documentId}/history`)
        .then(result => {
          if (result.success && result.data) {
            setInitialChatHistory(result.data);
          }
        })
        .catch(err => console.error("Failed to load chat history", err));
    } else {
      setInitialChatHistory([]);
    }
  }, [documentId, isAuthenticated]);

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

  // ✅ Local Analysis Fallback (Context-Aware)
  const generateLocalAnalysis = (content: string): WritingAnalysis => {
    // 1. Detect Document Type (Heuristic)
    const lowerContent = content.toLowerCase()
    const isResume = /education|experience|skills|summary/.test(lowerContent) && (content.length < 5000)
    const isResearch = /abstract|introduction|methodology|conclusion|references/.test(lowerContent) && (content.length > 2000)
    const detectedType = isResume ? 'resume' : isResearch ? 'research' : 'general'

    // 2. Basic Stats
    const words = content.trim().split(/\s+/).length
    const sentences = content.split(/[.!?]+/).length
    const avgWordsPerSentence = words / Math.max(1, sentences)

    // Readability
    const syllables = content.length / 3
    const readabilityRaw = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * (syllables / words))
    const readability = Math.max(0, Math.min(100, readabilityRaw))

    // 3. Domain-Specific Scoring
    let qualityScore = 0
    let structureScore = 0
    let depthScore = 0
    const suggestions: WritingSuggestion[] = []

    if (detectedType === 'resume') {
      // --- RESUME SCORING ---
      const hasContact = /@|\d{3}[-.]\d{3}[-.]\d{4}|linkedin|github/i.test(content)
      const hasActionVerbs = /\b(led|developed|created|managed|designed|implemented|achieved|improved)\b/i.test(content)
      const bulletPoints = (content.match(/^[-*]\s/gm) || []).length

      // Structure (50%)
      if (hasContact) structureScore += 20
      if (/education/i.test(content)) structureScore += 20
      if (/experience/i.test(content)) structureScore += 20
      if (/skills/i.test(content)) structureScore += 20
      if (bulletPoints > 5) structureScore += 20 // Resumes need bullets

      // Depth (50%)
      if (hasActionVerbs) depthScore += 30
      if (words > 200 && words < 1000) depthScore += 30 // Ideal length
      if (/\d+%|\$\d+/.test(content)) depthScore += 40 // Quantifiable results

      qualityScore = Math.round((structureScore * 0.5) + (depthScore * 0.5))

      // Resume Suggestions
      if (!hasActionVerbs) suggestions.push({ type: 'content', message: 'Use strong action verbs (Led, Developed) to start bullets.', priority: 'high' })
      if (!/\d+%|\$\d+/.test(content)) suggestions.push({ type: 'quality', message: 'Quantify your impact with numbers (e.g., "Improved by 20%").', priority: 'medium' })
      if (words > 1000) suggestions.push({ type: 'structure', message: 'Resume might be too long. Aim for 1-2 pages.', priority: 'medium' })

    } else if (detectedType === 'research') {
      // --- RESEARCH SCORING ---
      const hasSections = (content.match(/^#{1,2}\s/gm) || []).length
      const citations = (content.match(/\[.*?\]/g) || []).length

      // Structure (50%)
      if (/abstract/i.test(content)) structureScore += 20
      if (/introduction/i.test(content)) structureScore += 20
      if (/references/i.test(content)) structureScore += 20
      if (hasSections >= 4) structureScore += 40

      // Depth (50%)
      if (citations > 5) depthScore += 50
      if (words > 1500) depthScore += 50

      qualityScore = Math.round((structureScore * 0.5) + (depthScore * 0.5))

      // Research Suggestions
      if (citations < 3) suggestions.push({ type: 'link', message: 'Add citations [1] to support your claims.', priority: 'high' })
      if (!/abstract/i.test(content)) suggestions.push({ type: 'structure', message: 'Missing Abstract section.', priority: 'medium' })

    } else {
      // --- GENERAL SCORING ---
      const sections = (content.match(/^##\s/gm) || []).length
      const links = (content.match(/\[.*?\]\(.*?\)/g) || []).length

      let generalStructure = 0
      if (sections > 0) generalStructure += 40
      if (links > 0) generalStructure += 20
      if (readability > 50) generalStructure += 40

      qualityScore = Math.round(generalStructure)
    }

    // General Suggestions if specific ones aren't triggered
    if (suggestions.length === 0) {
      if (readability < 50) suggestions.push({ type: 'quality', message: 'Simplify your sentences to improve score.', priority: 'low' })
      if (words < 100) suggestions.push({ type: 'content', message: 'Add more content to get a better analysis.', priority: 'low' })
    }

    // GUEST LIMITATION: Mask some data if needed, but for now we just return full local analysis
    // and let the UI handle the "Login for more" view.

    return {
      qualityScore: Math.max(10, qualityScore), // Min score 10
      readabilityScore: Math.max(10, Math.round(readability)), // Min score 10 to avoid 0 confusion
      scoreBreakdown: {
        readability: Math.round(readability),
        structure: structureScore,
        depth: depthScore
      },
      suggestions: suggestions.slice(0, 5),
      relatedDocuments: [],
      professionalTerms: [],
      keyTopics: [detectedType.toUpperCase()]
    }
  }

  // Create debounced version of analyzeContent with local fallback
  const debouncedAnalyze = useCallback(
    debounce(async (content: string) => {
      // 1. Immediate Local Analysis
      if (content.length >= minContentLength) {
        setAnalysis(generateLocalAnalysis(content))
      }

      // 2. Deep AI Analysis
      await analyzeContent(content)
    }, debounceMs),
    [analyzeContent, debounceMs, minContentLength]
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
    initialChatHistory, // Return history
    analyzeContent: debouncedAnalyze,
    suggestLinksForSelection,

    // Chat functionality
    sendChatMessage: async (messages: ChatMessage[], documentContext: string) => {
      try {
        const result = await apiClient.post<any>('/api/chat', {
          messages,
          documentContext,
          documentType,
          documentId // Send documentId for persistence
        });
        if (result.success) {
          return result.data.message;
        } else {
          throw new Error(result.error || 'Chat failed');
        }
      } catch (error) {
        console.error("Chat error:", error);
        throw error;
      }
    }
  }
}