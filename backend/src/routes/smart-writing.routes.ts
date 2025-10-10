import { Router } from 'express'
import { analyzeWritingContext, suggestLinks } from '../controllers/smart-writing.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.post('/analyze', authMiddleware, analyzeWritingContext)
router.post('/suggest-links', authMiddleware, suggestLinks)

export default router