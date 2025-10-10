import { ContentAnalyzerService } from './content-analyzer.service'
import { WorkflowDetectorService } from './workflow-detector.service'

interface SmartRecommendation {
  type: 'productivity' | 'quality' | 'workflow' | 'collaboration' | 'organization'
  title: string
  description: string
  actionItems: string[]
  priority: 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  category: string
}

interface WorkflowInsight {
  pattern: string
  description: string
  suggestion: string
  documentsAffected: string[]
}

export class InsightGeneratorService {
  private contentAnalyzer: ContentAnalyzerService
  private workflowDetector: WorkflowDetectorService

  constructor() {
    this.contentAnalyzer = new ContentAnalyzerService()
    this.workflowDetector = new WorkflowDetectorService()
  }

  generateSmartRecommendations(documents: any[]): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []
    
    // Analyze overall patterns
    const productivity = this.analyzeProductivityPatterns(documents)
    const quality = this.analyzeQualityPatterns(documents)
    const workflow = this.analyzeWorkflowPatterns(documents)
    const organization = this.analyzeOrganizationPatterns(documents)

    recommendations.push(...productivity)
    recommendations.push(...quality)
    recommendations.push(...workflow)
    recommendations.push(...organization)

    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 8) // Top 8 recommendations
  }

  private analyzeProductivityPatterns(documents: any[]): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []
    const now = new Date()
    
    // Recent activity analysis
    const recentDocs = documents.filter(doc => {
      const daysSince = (now.getTime() - new Date(doc.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    })

    if (recentDocs.length < 2) {
      recommendations.push({
        type: 'productivity',
        title: 'Low Activity This Week',
        description: 'Your document creation has slowed down. Maintaining consistent output helps build momentum.',
        actionItems: [
          'Set a daily writing goal (even 15 minutes)',
          'Create a simple daily template',
          'Schedule dedicated writing time'
        ],
        priority: 'high',
        impact: 'high',
        category: 'Productivity'
      })
    }

    // Document length analysis
    const avgWordCount = documents.reduce((sum, doc) => sum + doc.wordCount, 0) / documents.length
    if (avgWordCount < 200) {
      recommendations.push({
        type: 'quality',
        title: 'Expand Your Ideas',
        description: 'Your documents are quite brief. Developing ideas more thoroughly can improve their impact.',
        actionItems: [
          'Add examples to support main points',
          'Include background context',
          'Expand on implications and next steps'
        ],
        priority: 'medium',
        impact: 'high',
        category: 'Content Quality'
      })
    }

    return recommendations
  }

  private analyzeQualityPatterns(documents: any[]): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []
    
    // Analyze content quality across all documents
    const qualityScores = documents.map(doc => 
      this.contentAnalyzer.analyzeContent(doc.content, doc.type).qualityScore
    )
    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length

    if (avgQuality < 65) {
      recommendations.push({
        type: 'quality',
        title: 'Improve Document Structure',
        description: 'Your documents could benefit from better organization and professional formatting.',
        actionItems: [
          'Add clear headings and subheadings',
          'Use bullet points for lists',
          'Include introductions and conclusions',
          'Add professional terminology where appropriate'
        ],
        priority: 'high',
        impact: 'high',
        category: 'Document Quality'
      })
    }

    // Check for documents without proper structure
    const poorlyStructured = documents.filter(doc => {
      const analysis = this.contentAnalyzer.analyzeContent(doc.content, doc.type)
      return !analysis.structureAnalysis.hasHeadings && doc.wordCount > 300
    })

    if (poorlyStructured.length > documents.length * 0.3) {
      recommendations.push({
        type: 'quality',
        title: 'Add Document Structure',
        description: 'Many of your longer documents lack clear headings and organization.',
        actionItems: [
          'Add section headings to break up long text',
          'Use consistent formatting patterns',
          'Create document templates for common types'
        ],
        priority: 'medium',
        impact: 'medium',
        category: 'Formatting'
      })
    }

    return recommendations
  }

  private analyzeWorkflowPatterns(documents: any[]): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []
    
    // Document type diversity
    const typeCount = new Set(documents.map(doc => doc.type)).size
    if (typeCount === 1) {
      recommendations.push({
        type: 'workflow',
        title: 'Diversify Your Document Types',
        description: 'You\'re only using one type of document. Exploring other types could enhance your workflow.',
        actionItems: [
          'Try creating meeting notes for discussions',
          'Document technical specifications for projects',
          'Create research documents for analysis work'
        ],
        priority: 'low',
        impact: 'medium',
        category: 'Workflow Diversity'
      })
    }

    // Check for professional workflow gaps
    const hasResearch = documents.some(doc => doc.type === 'research')
    const hasMeetings = documents.some(doc => doc.type === 'meeting')
    
    if (!hasMeetings && documents.length > 5) {
      recommendations.push({
        type: 'workflow',
        title: 'Document Your Meetings',
        description: 'Consider creating meeting notes to track decisions and action items.',
        actionItems: [
          'Use meeting templates for consistent formatting',
          'Track action items and follow-ups',
          'Document key decisions and reasoning'
        ],
        priority: 'medium',
        impact: 'medium',
        category: 'Meeting Management'
      })
    }

    return recommendations
  }

  private analyzeOrganizationPatterns(documents: any[]): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = []
    
    // Tag usage analysis
    const taggedDocs = documents.filter(doc => doc.tags && doc.tags.length > 0)
    if (taggedDocs.length < documents.length * 0.5) {
      recommendations.push({
        type: 'organization',
        title: 'Improve Document Tagging',
        description: 'Many of your documents lack tags, making them harder to organize and find.',
        actionItems: [
          'Add relevant tags to existing documents',
          'Create a consistent tagging strategy',
          'Use tags to group related documents'
        ],
        priority: 'medium',
        impact: 'medium',
        category: 'Organization'
      })
    }

    // Document linking analysis
    const linkedDocs = documents.filter(doc => doc.linkedDocuments && doc.linkedDocuments.length > 0)
    if (linkedDocs.length < documents.length * 0.2 && documents.length > 10) {
      recommendations.push({
        type: 'organization',
        title: 'Connect Related Documents',
        description: 'Your documents exist in isolation. Linking related documents can reveal insights.',
        actionItems: [
          'Identify documents that reference each other',
          'Create explicit links between related work',
          'Build document series for complex topics'
        ],
        priority: 'low',
        impact: 'high',
        category: 'Knowledge Connection'
      })
    }

    return recommendations
  }

  identifyWorkflowInsights(documents: any[]): WorkflowInsight[] {
    const insights: WorkflowInsight[] = []
    
    // Time-based patterns
    const timeInsights = this.analyzeTemporalPatterns(documents)
    insights.push(...timeInsights)
    
    // Content patterns
    const contentInsights = this.analyzeContentPatterns(documents)
    insights.push(...contentInsights)
    
    // Professional patterns
    const professionalInsights = this.analyzeProfessionalPatterns(documents)
    insights.push(...professionalInsights)
    
    return insights
  }

  private analyzeTemporalPatterns(documents: any[]): WorkflowInsight[] {
    const insights: WorkflowInsight[] = []
    
    // Find documents created in bursts
    const docsByDate = documents.reduce((acc, doc) => {
      const date = new Date(doc.createdAt).toDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(doc)
      return acc
    }, {} as Record<string, any[]>)
    
    const burstDays = (Object.entries(docsByDate) as [string, any[]][])
      .filter(([_, docs]) => docs.length > 3)
    
    if (burstDays.length > 0) {
      insights.push({
        pattern: 'Burst Creation Pattern',
        description: `You tend to create multiple documents on the same day (${burstDays.length} such days found)`,
        suggestion: 'Consider spreading document creation more evenly to maintain consistent workflow',
        documentsAffected: burstDays.flatMap(([_, docs]) => docs.map((d: any) => d.id))
      })
    }
    
    return insights
  }

  private analyzeContentPatterns(documents: any[]): WorkflowInsight[] {
    const insights: WorkflowInsight[] = []
    
    // Find common themes across documents
    const allTags = documents.flatMap(doc => doc.tags || [])
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const commonTags = (Object.entries(tagCounts) as [string, number][])
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    
    if (commonTags.length > 0) {
      insights.push({
        pattern: 'Recurring Themes',
        description: `You frequently work with themes: ${commonTags.map(([tag, count]) => `${tag} (${count} docs)`).join(', ')}`,
        suggestion: 'Consider creating dedicated workspaces or templates for these recurring themes',
        documentsAffected: documents
          .filter(doc => doc.tags?.some((tag: string) => commonTags.some(([commonTag]) => commonTag === tag)))
          .map(doc => doc.id)
      })
    }
    
    return insights
  }

  private analyzeProfessionalPatterns(documents: any[]): WorkflowInsight[] {
    const insights: WorkflowInsight[] = []
    
    // Analyze domain expertise development
    const researchDocs = documents.filter(doc => doc.type === 'research')
    const engineeringDocs = documents.filter(doc => doc.type === 'engineering')
    const healthcareDocs = documents.filter(doc => doc.type === 'healthcare')
    
    if (researchDocs.length > 5) {
      const avgQuality = researchDocs.reduce((sum, doc) => {
        return sum + this.contentAnalyzer.analyzeContent(doc.content, 'research').qualityScore
      }, 0) / researchDocs.length
      
      insights.push({
        pattern: 'Research Expertise Development',
        description: `You have ${researchDocs.length} research documents with average quality score of ${Math.round(avgQuality)}`,
        suggestion: avgQuality > 75 ? 
          'Your research skills are strong. Consider mentoring others or publishing work.' :
          'Focus on improving research methodology and citation practices.',
        documentsAffected: researchDocs.map(doc => doc.id)
      })
    }
    
    return insights
  }
}