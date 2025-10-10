// backend/src/routes/comments.routes.ts
import { Router } from 'express'
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  toggleResolveComment,
  replyToComment,
  getCommentCount
} from '../controllers/comments.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// All comment routes require authentication
router.use(authMiddleware)

// ⚠️ IMPORTANT: Route ordering matters!
// Specific routes must come before parameterized routes

// Document-level comment operations
// These are mounted on /api/comments, but document routes will be nested

// Individual comment operations (by commentId)
router.patch('/:commentId', updateComment)              // ✅ Update comment content or resolve
router.delete('/:commentId', deleteComment)             // ✅ Delete comment
router.patch('/:commentId/resolve', toggleResolveComment) // ✅ Toggle resolve status
router.post('/:commentId/reply', replyToComment)        // ✅ Reply to comment

export default router

// Note: Document-specific comment routes are handled in documents.routes.ts
// This keeps the structure clean:
// - /api/documents/:documentId/comments - Add/get comments for a document
// - /api/comments/:commentId - Operate on individual comments