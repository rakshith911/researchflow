import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { DocumentService } from '../services/document/document.service'
import { ContentAnalyzerService } from '../services/ai/content-analyzer.service'
import { InsightGeneratorService } from '../services/ai/insight-generator.service'
import { logger } from '../utils/logger'

const documentService = new DocumentService()
const contentAnalyzer = new ContentAnalyzerService()
const insightGenerator = new InsightGeneratorService()

interface GrowthPoint {
  documentCount: number
  totalWords: number
  date: string
  averageQuality: number
}

interface Milestone {
  documentCount: number
  totalWords: number
  date: string
  averageQuality: number
}

interface ExpertiseData {
  count: number
  quality: number[]
}

export const getAIInsights = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documents } = await documentService.getDocuments(req.userId, {
      limit: 1000,
      offset: 0,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    })

    const smartRecommendations = insightGenerator.generateSmartRecommendations(documents)
    const workflowInsights = insightGenerator.identifyWorkflowInsights(documents)
    const contentGaps = contentAnalyzer.identifyContentGaps(documents)

    const analytics = calculateEnhancedAnalytics(documents)
    
    res.json({
      success: true,
      data: {
        analytics,
        smartRecommendations,
        workflowInsights,
        contentGaps,
        generatedAt: new Date()
      },
      message: 'AI insights generated successfully'
    })
  } catch (error) {
    logger.error('Error generating AI insights:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI insights'
    })
  }
}

export const getDocumentAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentId } = req.params
    const document = await documentService.getDocument(req.userId, documentId)
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    const analysis = contentAnalyzer.analyzeContent(document.content, document.type)
    
    res.json({
      success: true,
      data: {
        documentId,
        analysis,
        suggestions: generateDocumentSuggestions(analysis, document.type)
      },
      message: 'Document analysis completed'
    })
  } catch (error) {
    logger.error('Error analyzing document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze document'
    })
  }
}

export const getProductivityInsights = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documents } = await documentService.getDocuments(req.userId, {
      limit: 1000,
      offset: 0,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    })

    const productivityMetrics = calculateProductivityMetrics(documents)
    const trendAnalysis = calculateTrendAnalysis(documents)
    const professionalGrowth = assessProfessionalGrowth(documents)

    res.json({
      success: true,
      data: {
        productivityMetrics,
        trendAnalysis,
        professionalGrowth
      },
      message: 'Productivity insights generated'
    })
  } catch (error) {
    logger.error('Error generating productivity insights:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate productivity insights'
    })
  }
}

function calculateEnhancedAnalytics(documents: any[]) {
  const now = new Date()
  const totalWords = documents.reduce((sum, doc) => sum + doc.word_count, 0)
  const avgWordsPerDoc = documents.length > 0 ? Math.round(totalWords / documents.length) : 0
  
  const periods = {
    today: 0,
    week: 0,
    month: 0,
    quarter: 0
  }

  documents.forEach(doc => {
    const daysDiff = (now.getTime() - new Date(doc.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff < 1) periods.today++
    if (daysDiff < 7) periods.week++
    if (daysDiff < 30) periods.month++
    if (daysDiff < 90) periods.quarter++
  })

  const typeStats = documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const qualityScores = documents.map(doc => 
    contentAnalyzer.analyzeContent(doc.content, doc.type).qualityScore
  )
  const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length || 0

  const professionalTermsCount = documents.reduce((acc, doc) => {
    const analysis = contentAnalyzer.analyzeContent(doc.content, doc.type)
    return acc + analysis.professionalTerms.length
  }, 0)

  return {
    overview: {
      totalDocuments: documents.length,
      totalWords,
      avgWordsPerDoc,
      avgQuality: Math.round(avgQuality),
      professionalTermsUsed: professionalTermsCount
    },
    activity: periods,
    distribution: typeStats,
    trends: calculateWeeklyTrends(documents),
    professionalGrowth: {
      vocabularyExpansion: calculateVocabularyGrowth(documents),
      domainExpertise: calculateDomainExpertise(documents),
      writingConsistency: calculateWritingConsistency(documents)
    }
  }
}

function calculateWeeklyTrends(documents: any[]): number[] {
  const weeks = Array(8).fill(0)
  const now = new Date()
  
  documents.forEach(doc => {
    const weeksDiff = Math.floor((now.getTime() - new Date(doc.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 7))
    if (weeksDiff < 8) {
      weeks[7 - weeksDiff]++
    }
  })
  
  return weeks
}

function calculateVocabularyGrowth(documents: any[]): number[] {
  const sortedDocs = documents.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  
  const uniqueWords = new Set<string>()
  const growthPoints: number[] = []
  
  sortedDocs.forEach((doc, index) => {
    const words = doc.content.toLowerCase().split(/\W+/).filter((w: string) => w.length > 4)
    words.forEach((word: string) => uniqueWords.add(word))
    
    if (index % 5 === 0) {
      growthPoints.push(uniqueWords.size)
    }
  })
  
  return growthPoints
}

function calculateDomainExpertise(documents: any[]) {
  const domainScores: Record<string, number[]> = {}
  
  documents.forEach(doc => {
    const analysis = contentAnalyzer.analyzeContent(doc.content, doc.type)
    if (!domainScores[doc.type]) domainScores[doc.type] = []
    domainScores[doc.type].push(analysis.qualityScore)
  })
  
  const expertise = Object.entries(domainScores).map(([domain, scores]) => ({
    domain,
    averageQuality: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    documentCount: scores.length,
    trend: scores.length > 1 ? 
      (scores[scores.length - 1] - scores[0]) / scores.length : 0
  }))
  
  return expertise.sort((a, b) => b.averageQuality - a.averageQuality)
}

function calculateWritingConsistency(documents: any[]): number {
  if (documents.length < 2) return 0
  
  const wordCounts = documents.map(doc => doc.word_count)
  const mean = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length
  const variance = wordCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / wordCounts.length
  const stdDev = Math.sqrt(variance)
  
  return Math.max(0, 100 - (stdDev / mean) * 100)
}

function calculateProductivityMetrics(documents: any[]) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const recentDocs = documents.filter(doc => new Date(doc.updated_at) >= thirtyDaysAgo)
  const dailyOutput = recentDocs.length / 30
  const dailyWords = recentDocs.reduce((sum, doc) => sum + doc.word_count, 0) / 30
  
  return {
    documentsPerDay: Math.round(dailyOutput * 10) / 10,
    wordsPerDay: Math.round(dailyWords),
    averageSessionLength: calculateAverageSessionLength(recentDocs),
    peakProductivityHours: identifyPeakHours(recentDocs),
    consistencyScore: calculateWritingConsistency(recentDocs)
  }
}

function calculateAverageSessionLength(documents: any[]): number {
  if (documents.length === 0) return 0
  
  const avgWordCount = documents.reduce((sum, doc) => sum + doc.word_count, 0) / documents.length
  return Math.round(avgWordCount / 200 * 60)
}

function identifyPeakHours(documents: any[]) {
  const hourCounts = Array(24).fill(0) as number[]
  
  documents.forEach(doc => {
    const hour = new Date(doc.created_at).getHours()
    hourCounts[hour]++
  })
  
  const maxCount = Math.max(...hourCounts)
  const peakHour = hourCounts.indexOf(maxCount)
  
  return {
    hour: peakHour,
    period: peakHour < 12 ? 'morning' : peakHour < 17 ? 'afternoon' : 'evening'
  }
}

function calculateTrendAnalysis(documents: any[]) {
  const now = new Date()
  const periods = [7, 14, 30, 90]
  
  const trends = periods.map(days => {
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const periodDocs = documents.filter(doc => new Date(doc.updated_at) >= cutoff)
    
    return {
      period: `${days}d`,
      documents: periodDocs.length,
      words: periodDocs.reduce((sum, doc) => sum + doc.word_count, 0),
      avgQuality: calculateAverageQuality(periodDocs)
    }
  })
  
  return trends
}

function calculateAverageQuality(documents: any[]): number {
  if (documents.length === 0) return 0
  
  const qualityScores = documents.map(doc => 
    contentAnalyzer.analyzeContent(doc.content, doc.type).qualityScore
  )
  
  return Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
}

function assessProfessionalGrowth(documents: any[]) {
  const timelineAnalysis = analyzeGrowthTimeline(documents)
  const skillDevelopment = analyzeSkillDevelopment(documents)
  const expertiseAreas = identifyExpertiseAreas(documents)
  
  return {
    timeline: timelineAnalysis,
    skills: skillDevelopment,
    expertise: expertiseAreas,
    recommendations: generateGrowthRecommendations(documents)
  }
}

function analyzeGrowthTimeline(documents: any[]): Milestone[] {
  const sortedDocs = documents.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  
  const milestones: Milestone[] = []
  let cumulativeWords = 0
  let cumulativeDocs = 0
  
  sortedDocs.forEach((doc, index) => {
    cumulativeWords += doc.word_count
    cumulativeDocs++
    
    if (cumulativeDocs % 10 === 0) {
      milestones.push({
        documentCount: cumulativeDocs,
        totalWords: cumulativeWords,
        date: doc.created_at,
        averageQuality: calculateAverageQuality(sortedDocs.slice(0, index + 1))
      })
    }
  })
  
  return milestones
}

function analyzeSkillDevelopment(documents: any[]) {
  const skills = {
    writing: calculateWritingSkillProgression(documents),
    analysis: calculateAnalysisSkillProgression(documents),
    documentation: calculateDocumentationSkillProgression(documents),
    collaboration: calculateCollaborationSkillProgression(documents)
  }
  
  return skills
}

function calculateWritingSkillProgression(documents: any[]) {
  const sortedDocs = documents.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  
  const progression = sortedDocs.map((doc, index) => {
    const analysis = contentAnalyzer.analyzeContent(doc.content, doc.type)
    return {
      document: index + 1,
      readability: analysis.readabilityScore,
      structure: analysis.structureAnalysis.hasHeadings ? 100 : 
                 analysis.structureAnalysis.hasList ? 50 : 0,
      professional: analysis.professionalTerms.length
    }
  })
  
  return progression
}

function calculateAnalysisSkillProgression(documents: any[]) {
  return documents
    .filter(doc => doc.type === 'research')
    .map((doc, index) => {
      const analysis = contentAnalyzer.analyzeContent(doc.content, 'research')
      return {
        document: index + 1,
        depth: analysis.qualityScore,
        methodology: analysis.domainSpecificAnalysis.hasMethodology ? 100 : 0,
        citations: analysis.domainSpecificAnalysis.citationCount || 0
      }
    })
}

function calculateDocumentationSkillProgression(documents: any[]) {
  return documents
    .filter(doc => doc.type === 'engineering')
    .map((doc, index) => {
      const analysis = contentAnalyzer.analyzeContent(doc.content, 'engineering')
      return {
        document: index + 1,
        structure: analysis.qualityScore,
        technical: analysis.domainSpecificAnalysis.hasCodeExamples ? 100 : 0,
        completeness: analysis.completenessScore
      }
    })
}

function calculateCollaborationSkillProgression(documents: any[]) {
  return documents
    .filter(doc => doc.type === 'meeting')
    .map((doc, index) => {
      const analysis = contentAnalyzer.analyzeContent(doc.content, 'meeting')
      return {
        document: index + 1,
        organization: analysis.structureAnalysis.hasList ? 100 : 0,
        actionItems: analysis.domainSpecificAnalysis.actionItemCount || 0,
        follow_through: analysis.domainSpecificAnalysis.hasNextSteps ? 100 : 0
      }
    })
}

function identifyExpertiseAreas(documents: any[]) {
  const areas = documents.reduce((acc, doc) => {
    const analysis = contentAnalyzer.analyzeContent(doc.content, doc.type)
    analysis.professionalTerms.forEach(term => {
      if (!acc[term]) acc[term] = { count: 0, quality: [] }
      acc[term].count++
      acc[term].quality.push(analysis.qualityScore)
    })
    return acc
  }, {} as Record<string, ExpertiseData>)
  
  return (Object.entries(areas) as [string, ExpertiseData][])
    .map(([term, expertiseData]) => ({
      term,
      frequency: expertiseData.count,
      averageQuality: expertiseData.quality.reduce((sum: number, q: number) => sum + q, 0) / expertiseData.quality.length,
      expertise_level: expertiseData.count > 5 ? 'expert' : expertiseData.count > 2 ? 'intermediate' : 'beginner'
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)
}

function generateGrowthRecommendations(documents: any[]) {
  const recommendations = []
  const avgQuality = calculateAverageQuality(documents)
  
  if (avgQuality < 70) {
    recommendations.push({
      area: 'writing_quality',
      suggestion: 'Focus on improving document structure and professional language',
      priority: 'high'
    })
  }
  
  const typeDistribution = documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  if (Object.keys(typeDistribution).length < 3) {
    recommendations.push({
      area: 'domain_diversity',
      suggestion: 'Explore different document types to develop broader professional skills',
      priority: 'medium'
    })
  }
  
  return recommendations
}

function generateDocumentSuggestions(analysis: any, documentType: string) {
  const suggestions = []
  
  if (analysis.qualityScore < 60) {
    suggestions.push({
      type: 'quality',
      message: 'Consider adding more structure with headings and bullet points',
      priority: 'high'
    })
  }
  
  if (analysis.completenessScore < 70) {
    suggestions.push({
      type: 'completeness',
      message: `Add missing sections typical for ${documentType} documents`,
      priority: 'medium'
    })
  }
  
  if (analysis.readabilityScore < 40) {
    suggestions.push({
      type: 'readability',
      message: 'Consider using shorter sentences and simpler language',
      priority: 'medium'
    })
  }
  
  return suggestions
}