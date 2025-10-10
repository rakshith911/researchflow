import nlp from 'compromise'
import { WorkflowDetectorService } from './workflow-detector.service'

interface ContentAnalysis {
  qualityScore: number
  completenessScore: number
  professionalTerms: string[]
  keyTopics: string[]
  sentimentAnalysis: 'positive' | 'neutral' | 'negative'
  readabilityScore: number
  structureAnalysis: {
    hasHeadings: boolean
    hasList: boolean
    hasConclusion: boolean
    paragraphCount: number
  }
  domainSpecificAnalysis: any
}

interface DocumentGap {
  type: 'missing_section' | 'incomplete_content' | 'low_quality' | 'outdated'
  description: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  documentId: string
}

export class ContentAnalyzerService {
  private workflowDetector: WorkflowDetectorService

  constructor() {
    this.workflowDetector = new WorkflowDetectorService()
  }

  analyzeContent(content: string, documentType?: string): ContentAnalysis {
    const doc = nlp(content)
    const detectedType = documentType || this.workflowDetector.detectDocumentType(content)
    
    return {
      qualityScore: this.calculateQualityScore(content, doc),
      completenessScore: this.calculateCompletenessScore(content, detectedType),
      professionalTerms: this.extractProfessionalTerms(content, detectedType),
      keyTopics: this.extractKeyTopics(doc),
      sentimentAnalysis: this.analyzeSentiment(doc),
      readabilityScore: this.calculateReadabilityScore(content),
      structureAnalysis: this.analyzeStructure(content),
      domainSpecificAnalysis: this.analyzeDomainSpecific(content, detectedType)
    }
  }

  private calculateQualityScore(content: string, doc: any): number {
    let score = 50 // Base score
    
    // Length quality (sweet spot around 500-2000 words)
    const wordCount = content.split(/\s+/).length
    if (wordCount > 100) score += 10
    if (wordCount > 500) score += 15
    if (wordCount > 1000) score += 10
    if (wordCount > 2000) score -= 5 // Too long can be verbose
    
    // Structure indicators
    if (content.includes('#')) score += 10 // Has headings
    if (content.match(/\d+\./g)) score += 5 // Has numbered lists
    if (content.includes('- ')) score += 5 // Has bullet points
    
    // Professional language
    const professionalIndicators = [
      'however', 'therefore', 'furthermore', 'consequently', 'nevertheless',
      'analysis', 'methodology', 'implementation', 'evaluation', 'assessment'
    ]
    const professionalCount = professionalIndicators.filter(term => 
      content.toLowerCase().includes(term)
    ).length
    score += Math.min(professionalCount * 3, 15)
    
    return Math.min(100, Math.max(0, score))
  }

  private calculateCompletenessScore(content: string, documentType: string): number {
    const requiredSections = this.getRequiredSections(documentType)
    const lowerContent = content.toLowerCase()
    
    let foundSections = 0
    requiredSections.forEach(section => {
      const sectionKeywords = this.getSectionKeywords(section)
      const hasSection = sectionKeywords.some(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      )
      if (hasSection) foundSections++
    })
    
    return Math.round((foundSections / requiredSections.length) * 100)
  }

  private getRequiredSections(documentType: string): string[] {
    const sections = {
      research: ['introduction', 'methodology', 'results', 'conclusion', 'references'],
      engineering: ['overview', 'requirements', 'architecture', 'implementation', 'testing'],
      healthcare: ['assessment', 'diagnosis', 'treatment', 'follow-up', 'documentation'],
      meeting: ['agenda', 'discussion', 'action items', 'next steps'],
      general: ['introduction', 'main content', 'conclusion']
    }
    return sections[documentType as keyof typeof sections] || sections.general
  }

  private getSectionKeywords(section: string): string[] {
    const keywords = {
      introduction: ['introduction', 'overview', 'background', 'context'],
      methodology: ['methodology', 'method', 'approach', 'procedure'],
      results: ['results', 'findings', 'outcomes', 'data'],
      conclusion: ['conclusion', 'summary', 'final', 'closing'],
      references: ['references', 'bibliography', 'sources', 'citations'],
      overview: ['overview', 'summary', 'introduction', 'scope'],
      requirements: ['requirements', 'specifications', 'needs', 'criteria'],
      architecture: ['architecture', 'design', 'structure', 'framework'],
      implementation: ['implementation', 'development', 'coding', 'build'],
      testing: ['testing', 'verification', 'validation', 'qa'],
      assessment: ['assessment', 'evaluation', 'examination', 'review'],
      diagnosis: ['diagnosis', 'findings', 'condition', 'analysis'],
      treatment: ['treatment', 'therapy', 'intervention', 'care'],
      'follow-up': ['follow-up', 'monitoring', 'tracking', 'progress'],
      documentation: ['documentation', 'records', 'notes', 'reporting'],
      agenda: ['agenda', 'topics', 'schedule', 'items'],
      discussion: ['discussion', 'talked', 'covered', 'reviewed'],
      'action items': ['action', 'todo', 'tasks', 'assignments'],
      'next steps': ['next', 'following', 'upcoming', 'future'],
      'main content': ['content', 'main', 'body', 'details']
    }
    return keywords[section as keyof typeof keywords] || [section]
  }

  private extractProfessionalTerms(content: string, documentType: string): string[] {
    const domainTerms = {
      research: [
        'hypothesis', 'methodology', 'statistical significance', 'peer review',
        'literature review', 'meta-analysis', 'empirical', 'quantitative', 'qualitative'
      ],
      engineering: [
        'architecture', 'scalability', 'performance', 'optimization', 'refactoring',
        'deployment', 'continuous integration', 'microservices', 'api gateway'
      ],
      healthcare: [
        'diagnosis', 'prognosis', 'differential diagnosis', 'contraindication',
        'therapeutic', 'pharmacology', 'pathophysiology', 'clinical trial'
      ],
      meeting: [
        'action item', 'deliverable', 'milestone', 'stakeholder', 'consensus',
        'follow-up', 'agenda', 'minutes', 'decision point'
      ]
    }

    const relevantTerms = domainTerms[documentType as keyof typeof domainTerms] || []
    const lowerContent = content.toLowerCase()
    
    return relevantTerms.filter(term => 
      lowerContent.includes(term.toLowerCase())
    )
  }

  private extractKeyTopics(doc: any): string[] {
    try {
      // Get important nouns and noun phrases
      const nouns = doc.nouns().out('array') as string[]
      const topics = nouns
        .filter((noun: string) => noun && noun.length > 3 && noun.length < 25)
        .slice(0, 8)
      
      return [...new Set(topics)]
    } catch (error) {
      console.warn('Error extracting key topics:', error)
      return []
    }
  }

  private analyzeSentiment(doc: any): 'positive' | 'neutral' | 'negative' {
    try {
      // Simple rule-based sentiment analysis
      const text = doc.text()
      const positiveWords = ['good', 'excellent', 'successful', 'effective', 'positive', 'improved', 'better']
      const negativeWords = ['bad', 'failed', 'unsuccessful', 'negative', 'worse', 'declined', 'problem']
      
      const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length
      const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length
      
      if (positiveCount > negativeCount) return 'positive'
      if (negativeCount > positiveCount) return 'negative'
      return 'neutral'
    } catch (error) {
      return 'neutral'
    }
  }

  private calculateReadabilityScore(content: string): number {
    // Simplified Flesch Reading Ease Score
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((count, word) => {
      return count + this.countSyllables(word)
    }, 0)

    if (sentences.length === 0 || words.length === 0) return 50

    const avgSentenceLength = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length

    const flesch = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    return Math.max(0, Math.min(100, flesch))
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase()
    let count = 0
    const vowels = 'aeiouy'
    let prevWasVowel = false

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !prevWasVowel) {
        count++
      }
      prevWasVowel = isVowel
    }

    if (word.endsWith('e')) count--
    return Math.max(1, count)
  }

  private analyzeStructure(content: string) {
    const hasHeadings = /^#+\s/m.test(content)
    const hasList = /^\s*[-*+]\s/m.test(content) || /^\s*\d+\.\s/m.test(content)
    const hasConclusion = /conclusion|summary|final|closing/i.test(content)
    const paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length

    return {
      hasHeadings,
      hasList,
      hasConclusion,
      paragraphCount
    }
  }

  private analyzeDomainSpecific(content: string, documentType: string): any {
    switch (documentType) {
      case 'research':
        return this.analyzeResearchDocument(content)
      case 'engineering':
        return this.analyzeEngineeringDocument(content)
      case 'healthcare':
        return this.analyzeHealthcareDocument(content)
      case 'meeting':
        return this.analyzeMeetingDocument(content)
      default:
        return {}
    }
  }

  private analyzeResearchDocument(content: string) {
    const lowerContent = content.toLowerCase()
    return {
      hasCitations: /\[\d+\]|\(\d{4}\)/.test(content),
      hasHypothesis: lowerContent.includes('hypothesis'),
      hasMethodology: lowerContent.includes('methodology') || lowerContent.includes('method'),
      hasDataAnalysis: lowerContent.includes('analysis') && lowerContent.includes('data'),
      hasLimitations: lowerContent.includes('limitation'),
      citationCount: (content.match(/\[\d+\]|\(\d{4}\)/g) || []).length
    }
  }

  private analyzeEngineeringDocument(content: string) {
    const lowerContent = content.toLowerCase()
    return {
      hasCodeExamples: /```|`/.test(content),
      hasArchitecture: lowerContent.includes('architecture'),
      hasRequirements: lowerContent.includes('requirements'),
      hasTesting: lowerContent.includes('test'),
      hasPerformance: lowerContent.includes('performance'),
      codeBlockCount: (content.match(/```/g) || []).length / 2
    }
  }

  private analyzeHealthcareDocument(content: string) {
    const lowerContent = content.toLowerCase()
    return {
      hasPatientInfo: lowerContent.includes('patient'),
      hasDiagnosis: lowerContent.includes('diagnosis'),
      hasTreatment: lowerContent.includes('treatment'),
      hasFollowUp: lowerContent.includes('follow-up') || lowerContent.includes('followup'),
      hasMedications: lowerContent.includes('medication') || lowerContent.includes('drug'),
      hasVitals: lowerContent.includes('vital') || lowerContent.includes('blood pressure')
    }
  }

  private analyzeMeetingDocument(content: string) {
    const lowerContent = content.toLowerCase()
    return {
      hasAttendees: lowerContent.includes('attendees') || lowerContent.includes('participants'),
      hasAgenda: lowerContent.includes('agenda'),
      hasActionItems: lowerContent.includes('action') && lowerContent.includes('item'),
      hasDecisions: lowerContent.includes('decision'),
      hasNextSteps: lowerContent.includes('next step'),
      actionItemCount: (content.match(/- \[ \]/g) || []).length
    }
  }

  identifyContentGaps(documents: any[]): DocumentGap[] {
    const gaps: DocumentGap[] = []

    documents.forEach(doc => {
      const analysis = this.analyzeContent(doc.content, doc.type)
      
      // Quality gaps
      if (analysis.qualityScore < 60) {
        gaps.push({
          type: 'low_quality',
          description: `Document "${doc.title}" has low quality score (${analysis.qualityScore}/100)`,
          suggestion: 'Consider adding more structure, professional language, and detailed content',
          priority: analysis.qualityScore < 40 ? 'high' : 'medium',
          documentId: doc.id
        })
      }

      // Completeness gaps
      if (analysis.completenessScore < 70) {
        gaps.push({
          type: 'incomplete_content',
          description: `Document "${doc.title}" is missing key sections for ${doc.type} documents`,
          suggestion: this.getCompletnessSuggestion(doc.type, analysis.completenessScore),
          priority: analysis.completenessScore < 50 ? 'high' : 'medium',
          documentId: doc.id
        })
      }

      // Domain-specific gaps
      const domainGaps = this.identifyDomainGaps(doc, analysis)
      gaps.push(...domainGaps)
    })

    return gaps.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  private getCompletnessSuggestion(documentType: string, score: number): string {
    const suggestions = {
      research: 'Add missing sections: methodology, results analysis, or proper citations',
      engineering: 'Include technical specifications, architecture diagrams, or testing procedures',
      healthcare: 'Add patient assessment details, treatment plans, or follow-up protocols',
      meeting: 'Include action items, decision summaries, or next steps',
      general: 'Add introduction, main content sections, or conclusion'
    }
    return suggestions[documentType as keyof typeof suggestions] || suggestions.general
  }

  private identifyDomainGaps(doc: any, analysis: ContentAnalysis): DocumentGap[] {
    const gaps: DocumentGap[] = []
    const domainAnalysis = analysis.domainSpecificAnalysis

    switch (doc.type) {
      case 'research':
        if (!domainAnalysis.hasCitations) {
          gaps.push({
            type: 'missing_section',
            description: `Research document "${doc.title}" lacks proper citations`,
            suggestion: 'Add references and citations to support your research claims',
            priority: 'high',
            documentId: doc.id
          })
        }
        if (!domainAnalysis.hasMethodology) {
          gaps.push({
            type: 'missing_section',
            description: `Research document "${doc.title}" missing methodology section`,
            suggestion: 'Add a methodology section explaining your research approach',
            priority: 'medium',
            documentId: doc.id
          })
        }
        break

      case 'engineering':
        if (!domainAnalysis.hasRequirements) {
          gaps.push({
            type: 'missing_section',
            description: `Technical document "${doc.title}" lacks requirements specification`,
            suggestion: 'Add functional and non-functional requirements',
            priority: 'high',
            documentId: doc.id
          })
        }
        break

      case 'healthcare':
        if (!domainAnalysis.hasTreatment) {
          gaps.push({
            type: 'missing_section',
            description: `Clinical document "${doc.title}" missing treatment plan`,
            suggestion: 'Add detailed treatment protocols and procedures',
            priority: 'high',
            documentId: doc.id
          })
        }
        break
    }

    return gaps
  }
}