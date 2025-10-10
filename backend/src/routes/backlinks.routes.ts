import { Router } from 'express'
import {
  getBacklinks,
  searchForLinking,
  updateDocumentLinks,
  validateWikiLink
} from '../controllers/backlinks.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/documents/:id/backlinks', authMiddleware, getBacklinks)
router.get('/search-for-linking', authMiddleware, searchForLinking)
router.post('/documents/:id/update-links', authMiddleware, updateDocumentLinks)
router.get('/validate-link', authMiddleware, validateWikiLink)

export default router