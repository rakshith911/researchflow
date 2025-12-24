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
  bulkUpdateTags,
  compileDocument,
  getDocumentTemplate
} from '../controllers/documents.controller'
import {
  addComment,
  getComments,
  getCommentCount
} from '../controllers/comments.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validation.middleware'
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  SearchDocumentSchema,
  BulkOperationSchema,
  DocumentIdSchema,
  RenameDocumentSchema
} from '../schemas/document.schemas'

const router = Router()

// All document routes require authentication
router.use(authMiddleware)

// Specific routes (MUST be first)
router.get('/search', validateRequest(SearchDocumentSchema), searchDocuments)
router.get('/favorites', getFavorites) // Limit/offset validation is generic, can add schema if needed
router.get('/recent', getRecentDocuments)

// Batch operations
router.post('/bulk-delete', validateRequest(BulkOperationSchema), bulkDeleteDocuments)
router.post('/bulk-tags', validateRequest(BulkOperationSchema), bulkUpdateTags)

// Collection routes
router.post('/', validateRequest(CreateDocumentSchema), createDocument)
router.get('/', validateRequest(SearchDocumentSchema), getDocuments) // Reusing SearchSchema for basic list params
router.get('/templates', getDocumentTemplate) // ✅ New: Get template content

// Single document routes (MUST be last)
router.get('/:id', validateRequest(DocumentIdSchema), getDocument)
router.put('/:id', validateRequest(UpdateDocumentSchema), updateDocument)
router.delete('/:id', validateRequest(DocumentIdSchema), deleteDocument)
router.patch('/:id/rename', validateRequest(RenameDocumentSchema), renameDocument)
router.post('/:id/duplicate', validateRequest(DocumentIdSchema), duplicateDocument)
router.patch('/:id/favorite', validateRequest(DocumentIdSchema), toggleFavorite)
router.post('/:id/compile', validateRequest(DocumentIdSchema), compileDocument)

// Comment routes for documents
router.post('/:documentId/comments', addComment)
router.get('/:documentId/comments', getComments)
router.get('/:documentId/comments/count', getCommentCount)

export default router