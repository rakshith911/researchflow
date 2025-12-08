import { Router } from 'express'
import { chatWithDocument, getChatHistory } from '../controllers/chat.controller'
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// Protected routes (optional for guests)
router.use(optionalAuthMiddleware)

router.post('/', chatWithDocument)
router.get('/:documentId/history', authMiddleware, getChatHistory) // Only for logged in users

export default router
