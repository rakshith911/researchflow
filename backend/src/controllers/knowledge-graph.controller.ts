import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { KnowledgeGraphService } from '../services/knowledge-graph/knowledge-graph.service'
import { DocumentService } from '../services/document/document.service'
import { logger } from '../utils/logger'

const knowledgeGraphService = new KnowledgeGraphService()
const documentService = new DocumentService()

export const getKnowledgeGraph = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const graph = await knowledgeGraphService.buildKnowledgeGraph(req.userId)
    
    res.json({
      success: true,
      data: graph,
      message: 'Knowledge graph generated successfully'
    })
  } catch (error) {
    logger.error('Error generating knowledge graph:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate knowledge graph'
    })
  }
}

export const getDocumentRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 5
    
    const recommendations = await knowledgeGraphService.getDocumentRecommendations(req.userId, id, limit)
    
    res.json({
      success: true,
      data: recommendations,
      message: 'Recommendations retrieved successfully'
    })
  } catch (error) {
    logger.error('Error getting recommendations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    })
  }
}

export const getDocumentDetails = async (req: AuthRequest, res: Response) => {
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

    const recommendations = await knowledgeGraphService.getDocumentRecommendations(req.userId, documentId, 5)
    const connectionCount = await getConnectionCount(req.userId, documentId)
    
    res.json({
      success: true,
      data: {
        document,
        recommendations,
        connectionCount
      },
      message: 'Document details retrieved successfully'
    })
  } catch (error) {
    logger.error('Error getting document details:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get document details'
    })
  }
}

export const getNodeTooltipData = async (req: AuthRequest, res: Response) => {
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

    const connectionCount = await getConnectionCount(req.userId, documentId)

    res.json({
      success: true,
      data: {
        id: document.id,
        title: document.title,
        type: document.type,
        wordCount: document.word_count,
        tags: document.tags?.slice(0, 3) || [],
        lastModified: document.updated_at,
        readingTime: document.reading_time,
        connectionCount
      },
      message: 'Tooltip data retrieved successfully'
    })
  } catch (error) {
    logger.error('Error getting tooltip data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get tooltip data'
    })
  }
}

export const getGraphAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const graph = await knowledgeGraphService.buildKnowledgeGraph(req.userId)
    
    const analytics = {
      totalDocuments: graph.nodes.length,
      totalConnections: graph.edges.length,
      clusters: graph.clusters.length,
      averageConnections: graph.edges.length / Math.max(graph.nodes.length, 1),
      strongConnections: graph.edges.filter(e => e.weight > 0.7).length,
      documentsByType: graph.nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      topConcepts: getTopConcepts(graph.nodes)
    }
    
    res.json({
      success: true,
      data: analytics,
      message: 'Graph analytics retrieved successfully'
    })
  } catch (error) {
    logger.error('Error getting graph analytics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get graph analytics'
    })
  }
}

async function getConnectionCount(userId: string, documentId: string): Promise<number> {
  try {
    const graph = await knowledgeGraphService.buildKnowledgeGraph(userId)
    return graph.edges.filter(edge => 
      edge.source === documentId || edge.target === documentId
    ).length
  } catch (error) {
    return 0
  }
}

function getTopConcepts(nodes: any[], limit = 10): Array<{concept: string, count: number}> {
  const conceptCounts: Record<string, number> = {}
  
  nodes.forEach(node => {
    if (node.concepts && Array.isArray(node.concepts)) {
      node.concepts.forEach((concept: string) => {
        conceptCounts[concept] = (conceptCounts[concept] || 0) + 1
      })
    }
  })
  
  return Object.entries(conceptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([concept, count]) => ({ concept, count }))
}