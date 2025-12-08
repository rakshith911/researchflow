import nlp from 'compromise'
import { DocumentService } from '../document/document.service'
import { ContentAnalyzerService } from './content-analyzer.service'
import { InsightGeneratorService } from './insight-generator.service'

interface LinkSuggestion {
  documentId: string
  title: string
  type: string
  matchedConcepts: string[]
  relevanceScore: number
  context: string
  reason: string
}

interface WritingAnalysis {
  qualityScore: number
  suggestions: WritingSuggestion[]
  relatedDocuments: LinkSuggestion[]
  professionalTerms: string[]
  keyTopics: string[]
  readabilityScore: number
}

interface WritingSuggestion {
  type: 'structure' | 'content' | 'quality' | 'link'
  message: string
  priority: 'high' | 'medium' | 'low'
  position?: number
}

export class SmartLinkingService {
  private documentService: DocumentService
  private contentAnalyzer: ContentAnalyzerService
  private insightGenerator: InsightGeneratorService

  constructor() {
    this.documentService = new DocumentService()
    this.contentAnalyzer = new ContentAnalyzerService()
    this.insightGenerator = new InsightGeneratorService()
  }

  async analyzeWritingContext(
    userId: string,
    currentContent: string,
    currentDocumentId: string,
    documentType: string
  ): Promise<WritingAnalysis> {
    const { documents } = await this.documentService.getDocuments(userId, {
      limit: 1000,
      offset: 0,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    })

    const otherDocuments = documents.filter(doc => doc.id !== currentDocumentId)

    const currentConcepts = this.extractConcepts(currentContent)
    const currentTerms = this.extractProfessionalTerms(currentContent, documentType)

    const relatedDocuments = this.findRelatedDocuments(
      currentConcepts,
      currentTerms,
      otherDocuments,
      currentContent
    )

    // Use AI for deeper analysis if available
    let aiAnalysis = null
    try {
      aiAnalysis = await this.insightGenerator.analyzeDocumentWithAI(currentContent, documentType)
    } catch (e) {
      console.warn('AI Analysis failed, falling back to heuristics', e)
      aiAnalysis = this.contentAnalyzer.analyzeContent(currentContent, documentType) // Fallback
    }

    // Fallback to local analysis if AI didn't return suggestions (e.g. OpenAI key missing)
    const analysis = aiAnalysis || this.contentAnalyzer.analyzeContent(currentContent, documentType)

    // Merge AI suggestions with heuristic linking suggestions
    const heuristicSuggestions = this.generateWritingSuggestions(
      currentContent,
      analysis, // Use the analysis we have (AI or Heuristic)
      documentType,
      relatedDocuments
    )

    // Combine suggestions: AI's + Heuristic Links + Heuristic Structure (if AI missed it)
    const combinedSuggestions = [
      ...(analysis.suggestions || []),
      ...heuristicSuggestions.filter(s => s.type === 'link') // Keep link suggestions
    ].slice(0, 10) // Limit total suggestions

    return {
      qualityScore: analysis.qualityScore,
      suggestions: combinedSuggestions,
      relatedDocuments: relatedDocuments.slice(0, 5),
      professionalTerms: analysis.professionalTerms || this.contentAnalyzer.analyzeContent(currentContent, documentType).professionalTerms, // Ensure terms exist
      keyTopics: analysis.keyTopics || [],
      readabilityScore: analysis.readabilityScore
    }
  }

  private extractConcepts(content: string): string[] {
    const doc = nlp(content)
    const concepts: string[] = []

    try {
      const nouns = doc.nouns().out('array') as string[]
      concepts.push(...nouns.filter(noun => noun && noun.length > 3))

      const capitalizedTerms = content.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g) || []
      concepts.push(...capitalizedTerms)

      const quotedTerms = content.match(/"([^"]+)"|'([^']+)'/g) || []
      concepts.push(...quotedTerms.map(t => t.replace(/['"]/g, '')))
    } catch (error) {
      console.warn('Error extracting concepts:', error)
    }

    return [...new Set(concepts.map(c => c.toLowerCase()))]
  }

  private extractProfessionalTerms(content: string, documentType: string): string[] {
    const domainTerms = {
      research: [
        'hypothesis', 'methodology', 'analysis', 'results', 'conclusion',
        'literature', 'study', 'findings', 'data', 'experiment', 'theory',
        'research', 'investigation', 'empirical', 'quantitative', 'qualitative'
      ],
      engineering: [
        'architecture', 'system', 'implementation', 'design', 'algorithm',
        'performance', 'optimization', 'scalability', 'api', 'database',
        'deployment', 'infrastructure', 'testing', 'integration'
      ],
      healthcare: [
        'patient', 'diagnosis', 'treatment', 'clinical', 'medical',
        'therapy', 'symptoms', 'assessment', 'protocol', 'medication',
        'prognosis', 'care', 'intervention', 'outcome'
      ],
      meeting: [
        'agenda', 'action', 'decision', 'discussion', 'follow-up',
        'attendees', 'minutes', 'consensus', 'objectives', 'deliverable'
      ]
    }

    const relevantTerms = domainTerms[documentType as keyof typeof domainTerms] || []
    const lowerContent = content.toLowerCase()

    return relevantTerms.filter(term => lowerContent.includes(term.toLowerCase()))
  }

  private findRelatedDocuments(
    currentConcepts: string[],
    currentTerms: string[],
    documents: any[],
    currentContent: string
  ): LinkSuggestion[] {
    const suggestions: LinkSuggestion[] = []

    documents.forEach(doc => {
      const docConcepts = this.extractConcepts(doc.content)
      const docTerms = this.extractProfessionalTerms(doc.content, doc.type)

      const sharedConcepts = currentConcepts.filter(concept =>
        docConcepts.includes(concept)
      )

      const sharedTerms = currentTerms.filter(term =>
        docTerms.includes(term)
      )

      const sharedTags = doc.tags?.filter((tag: string) =>
        currentContent.toLowerCase().includes(tag.toLowerCase())
      ) || []

      const conceptScore = sharedConcepts.length * 0.4
      const termScore = sharedTerms.length * 0.3
      const tagScore = sharedTags.length * 0.2
      const recentScore = this.calculateRecencyScore(doc.updated_at) * 0.1

      const relevanceScore = conceptScore + termScore + tagScore + recentScore

      if (relevanceScore > 0.3) {
        const context = this.extractContext(doc.content, sharedConcepts[0] || sharedTerms[0])

        suggestions.push({
          documentId: doc.id,
          title: doc.title,
          type: doc.type,
          matchedConcepts: [...new Set([...sharedConcepts, ...sharedTerms])].slice(0, 5),
          relevanceScore: Math.min(relevanceScore, 1.0),
          context,
          reason: this.generateReason(sharedConcepts, sharedTerms, sharedTags)
        })
      }
    })

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private calculateRecencyScore(updatedAt: string): number {
    const now = new Date()
    const docDate = new Date(updatedAt)
    const daysDiff = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff < 7) return 1.0
    if (daysDiff < 30) return 0.5
    if (daysDiff < 90) return 0.2
    return 0.1
  }

  private extractContext(content: string, keyword: string): string {
    if (!keyword) return content.substring(0, 150) + '...'

    const lowerContent = content.toLowerCase()
    const lowerKeyword = keyword.toLowerCase()
    const index = lowerContent.indexOf(lowerKeyword)

    if (index === -1) {
      return content.substring(0, 150) + '...'
    }

    const start = Math.max(0, index - 50)
    const end = Math.min(content.length, index + keyword.length + 100)
    let snippet = content.substring(start, end)

    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'

    return snippet
  }

  private generateReason(
    sharedConcepts: string[],
    sharedTerms: string[],
    sharedTags: string[]
  ): string {
    const reasons = []

    if (sharedConcepts.length > 0) {
      reasons.push(`Shares concepts: ${sharedConcepts.slice(0, 3).join(', ')}`)
    }
    if (sharedTerms.length > 0) {
      reasons.push(`Related terms: ${sharedTerms.slice(0, 2).join(', ')}`)
    }
    if (sharedTags.length > 0) {
      reasons.push(`Common tags: ${sharedTags.slice(0, 2).join(', ')}`)
    }

    return reasons.join(' • ') || 'Related content'
  }

  private generateWritingSuggestions(
    content: string,
    analysis: any,
    documentType: string,
    relatedDocuments: LinkSuggestion[]
  ): WritingSuggestion[] {
    const suggestions: WritingSuggestion[] = []

    if (analysis.qualityScore < 60) {
      suggestions.push({
        type: 'quality',
        message: 'Consider adding more structure with headings and sections',
        priority: 'high'
      })
    }

    if (analysis.readabilityScore < 40) {
      suggestions.push({
        type: 'content',
        message: 'Try using shorter sentences and simpler language for better readability',
        priority: 'medium'
      })
    }

    if (!analysis.structureAnalysis.hasHeadings && content.split(/\s+/).length > 200) {
      suggestions.push({
        type: 'structure',
        message: 'Add headings to break up your content into logical sections',
        priority: 'high'
      })
    }

    if (analysis.completenessScore < 70) {
      const missingSections = this.identifyMissingSections(content, documentType)
      if (missingSections.length > 0) {
        suggestions.push({
          type: 'content',
          message: `Consider adding: ${missingSections.join(', ')}`,
          priority: 'medium'
        })
      }
    }

    if (relatedDocuments.length > 0) {
      suggestions.push({
        type: 'link',
        message: `Found ${relatedDocuments.length} related documents you could reference`,
        priority: 'low'
      })
    }

    if (analysis.professionalTerms.length < 3 && content.split(/\s+/).length > 100) {
      suggestions.push({
        type: 'quality',
        message: 'Consider using more domain-specific terminology',
        priority: 'low'
      })
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  private identifyMissingSections(content: string, documentType: string): string[] {
    const requiredSections = {
      research: ['methodology', 'results', 'conclusion', 'references'],
      engineering: ['requirements', 'architecture', 'implementation'],
      healthcare: ['assessment', 'diagnosis', 'treatment plan'],
      meeting: ['action items', 'next steps']
    }

    const sections = requiredSections[documentType as keyof typeof requiredSections] || []
    const lowerContent = content.toLowerCase()

    return sections.filter(section =>
      !lowerContent.includes(section.toLowerCase())
    )
  }

  async suggestLinksForSelection(
    userId: string,
    selectedText: string,
    currentDocumentId: string
  ): Promise<LinkSuggestion[]> {
    const concepts = this.extractConcepts(selectedText)

    const { documents } = await this.documentService.getDocuments(userId, {
      limit: 1000,
      offset: 0,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    })

    const otherDocuments = documents.filter(doc => doc.id !== currentDocumentId)

    return this.findRelatedDocuments(concepts, [], otherDocuments, selectedText)
      .slice(0, 3)
  }
}