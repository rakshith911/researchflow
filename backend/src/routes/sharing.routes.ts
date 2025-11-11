// backend/src/routes/sharing.routes.ts
import { Router } from 'express'
import {
  shareDocument,
  getDocumentShares,
  getSharedByMe,
  getSharedWithMe,
  updateShare,
  revokeShare,
  accessSharedDocument,
  getShareAccessLogs
} from '../controllers/sharing.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// All sharing routes require authentication (including accessing shared documents)
router.use(authMiddleware)

// ⚠️ IMPORTANT: Specific routes MUST come before parameterized routes

// Collection routes (specific endpoints first)
router.get('/shared-by-me', getSharedByMe)       // ✅ Get documents I've shared
router.get('/shared-with-me', getSharedWithMe)   // ✅ Get documents shared with me

// Access shared document via token (requires login)
router.get('/shared/:token', accessSharedDocument) // ✅ Access document by share token

// Share management for specific document
router.post('/:documentId', shareDocument)        // ✅ Create share for document
router.get('/:documentId', getDocumentShares)     // ✅ Get all shares for document

// Individual share operations (by shareId)
router.patch('/:shareId', updateShare)            // ✅ Update share permission/expiry
router.delete('/:shareId', revokeShare)           // ✅ Revoke share access
router.get('/:shareId/logs', getShareAccessLogs)  // ✅ Get access logs for share

export default router