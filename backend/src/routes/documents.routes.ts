// backend/src/routes/documents.routes.ts
import { Router } from 'express'
import {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  renameDocument,
  duplicateDocument,
  toggleFavorite,
  getFavorites,
  getRecentDocuments,
  bulkDeleteDocuments,
  bulkUpdateTags
} from '../controllers/documents.controller'
import {
  addComment,
  getComments,
  getCommentCount
} from '../controllers/comments.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// ⚠️ IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise /:id will capture /search, /favorites, etc.

// All document routes require authentication
router.use(authMiddleware)

// Specific routes (MUST be first)
router.get('/search', searchDocuments)           // ✅ Search documents
router.get('/favorites', getFavorites)           // ✅ Get favorited documents
router.get('/recent', getRecentDocuments)        // ✅ Get recently accessed docs

// Batch operations
router.post('/bulk-delete', bulkDeleteDocuments) // ✅ Delete multiple documents
router.post('/bulk-tags', bulkUpdateTags)        // ✅ Update tags for multiple docs

// Collection routes
router.post('/', createDocument)                 // ✅ Create new document
router.get('/', getDocuments)                    // ✅ List all documents

// Single document routes (MUST be last)
router.get('/:id', getDocument)                  // ✅ Get single document
router.put('/:id', updateDocument)               // ✅ Update document
router.delete('/:id', deleteDocument)            // ✅ Delete document
router.patch('/:id/rename', renameDocument)      // ✅ Rename document
router.post('/:id/duplicate', duplicateDocument) // ✅ Duplicate document
router.patch('/:id/favorite', toggleFavorite)    // ✅ Toggle favorite status

// ✅ NEW: Comment routes for documents
router.post('/:documentId/comments', addComment)        // ✅ Add comment to document
router.get('/:documentId/comments', getComments)        // ✅ Get all comments for document
router.get('/:documentId/comments/count', getCommentCount) // ✅ Get unresolved comment count

export default router