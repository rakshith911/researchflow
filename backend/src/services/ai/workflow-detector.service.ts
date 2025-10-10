import nlp from 'compromise'

export class WorkflowDetectorService {
  
  detectDocumentType(content: string): 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general' {
    const lowerContent = content.toLowerCase()
    
    // Research indicators
    const researchKeywords = [
      'research', 'study', 'hypothesis', 'methodology', 'analysis', 'results',
      'abstract', 'introduction', 'literature', 'conclusion', 'references',
      'experiment', 'data', 'findings', 'survey', 'participants', 'statistical'
    ]
    
    // Engineering indicators  
    const engineeringKeywords = [
      'code', 'function', 'class', 'api', 'database', 'server', 'client',
      'architecture', 'implementation', 'technical', 'specification', 'requirements',
      'bug', 'feature', 'deployment', 'testing', 'framework', 'library'
    ]
    
    // Healthcare indicators
    const healthcareKeywords = [
      'patient', 'clinical', 'medical', 'diagnosis', 'treatment', 'protocol',
      'symptoms', 'medication', 'therapy', 'hospital', 'doctor', 'nurse',
      'health', 'care', 'procedure', 'examination', 'assessment'
    ]
    
    // Meeting indicators
    const meetingKeywords = [
      'meeting', 'agenda', 'attendees', 'action items', 'discussion', 'notes',
      'decisions', 'follow-up', 'next steps', 'participants', 'minutes'
    ]
    
    // Score each category
    const scores = {
      research: this.countKeywords(lowerContent, researchKeywords),
      engineering: this.countKeywords(lowerContent, engineeringKeywords),
      healthcare: this.countKeywords(lowerContent, healthcareKeywords),
      meeting: this.countKeywords(lowerContent, meetingKeywords)
    }
    
    // Find highest scoring category
    const maxScore = Math.max(...Object.values(scores))
    if (maxScore === 0) return 'general'
    
    const topCategory = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0]
    return (topCategory as 'research' | 'engineering' | 'healthcare' | 'meeting') || 'general'
  }
  
  extractTags(content: string): string[] {
    const doc = nlp(content)
    const tags: string[] = []
    
    try {
      // Extract nouns as potential tags
      const nouns = doc.nouns().out('array') as string[]
      const filteredNouns = nouns
        .filter((noun: string) => noun && noun.length > 2 && noun.length < 20)
        .slice(0, 10) // Limit to 10 tags
      
      tags.push(...filteredNouns)
    } catch (error) {
      console.warn('Error extracting nouns:', error)
    }
    
    // Add domain-specific tags
    const domainTags = this.extractDomainTags(content.toLowerCase())
    tags.push(...domainTags)
    
    // Remove duplicates and return
    return [...new Set(tags)].slice(0, 8)
  }
  
  private countKeywords(content: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = content.match(regex)
      return count + (matches ? matches.length : 0)
    }, 0)
  }
  
  private extractDomainTags(content: string): string[] {
    const tags: string[] = []
    
    // Research tags
    if (content.includes('research')) tags.push('research')
    if (content.includes('study')) tags.push('study')
    if (content.includes('analysis')) tags.push('analysis')
    
    // Engineering tags
    if (content.includes('code')) tags.push('code')
    if (content.includes('api')) tags.push('api')
    if (content.includes('database')) tags.push('database')
    
    // Healthcare tags
    if (content.includes('patient')) tags.push('patient')
    if (content.includes('clinical')) tags.push('clinical')
    if (content.includes('medical')) tags.push('medical')
    
    return tags
  }
}
