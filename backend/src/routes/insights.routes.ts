import { Router } from 'express'
import {
  getAIInsights,
  getDocumentAnalysis,
  getProductivityInsights
} from '../controllers/insights.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/ai', authMiddleware, getAIInsights)
router.get('/document/:documentId', authMiddleware, getDocumentAnalysis)
router.get('/productivity', authMiddleware, getProductivityInsights)

export default router