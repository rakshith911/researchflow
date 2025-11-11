import { Router } from 'express'
import {
  getKnowledgeGraph,
  getDocumentRecommendations,
  getDocumentDetails,
  getNodeTooltipData,
  getGraphAnalytics
} from '../controllers/knowledge-graph.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authMiddleware, getKnowledgeGraph)
router.get('/recommendations/:id', authMiddleware, getDocumentRecommendations)
// ✅ FIXED: Match frontend expectations
router.get('/document/:documentId/details', authMiddleware, getDocumentDetails)
router.get('/document/:documentId/tooltip', authMiddleware, getNodeTooltipData)
router.get('/analytics', authMiddleware, getGraphAnalytics)

export default router