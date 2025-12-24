// backend/src/routes/upload.routes.ts
import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { uploadImageMiddleware, handleMulterError } from '../middleware/upload.middleware'
import { validateRequest } from '../middleware/validation.middleware'
import { LinkFileSchema, FileIdSchema, UploadFileSchema } from '../schemas/upload.schemas'
import {
  uploadFile,
  getUserFiles,
  getFile,
  serveFile,
  deleteFile,
  linkFileToDocument,
  getStorageStats
} from '../controllers/upload.controller'

const router = Router()

/**
 * @route   GET /api/upload/images/:filename
 * @route   GET /api/upload/attachments/:filename
 * @desc    Serve uploaded files (NO AUTH REQUIRED - must be first!)
 * @access  Public
 */
router.get('/images/:filename', (req: Request, res: Response) => {
  // Create extended params with subfolder
  const extendedReq = req as any
  extendedReq.params = { ...req.params, subfolder: 'images' }
  serveFile(extendedReq, res)
})

router.get('/attachments/:filename', (req: Request, res: Response) => {
  // Create extended params with subfolder
  const extendedReq = req as any
  extendedReq.params = { ...req.params, subfolder: 'attachments' }
  serveFile(extendedReq, res)
})

// ✅ NOW apply auth middleware to all other routes
router.use(authMiddleware)

/**
 * @route   POST /api/upload
 * @desc    Upload a file (image or attachment)
 * @access  Private
 */
router.post(
  '/',
  uploadImageMiddleware.single('file'),
  handleMulterError,
  validateRequest(UploadFileSchema), // Validate optional documentId
  uploadFile
)

/**
 * @route   GET /api/upload/files
 * @desc    Get all files for authenticated user
 * @access  Private
 * @query   documentId (optional) - Filter by document
 */
router.get('/files', getUserFiles)

/**
 * @route   GET /api/upload/files/:id
 * @desc    Get specific file by ID
 * @access  Private
 */
router.get('/files/:id', validateRequest(FileIdSchema), getFile)

/**
 * @route   DELETE /api/upload/files/:id
 * @desc    Delete a file
 * @access  Private
 */
router.delete('/files/:id', validateRequest(FileIdSchema), deleteFile)

/**
 * @route   POST /api/upload/link
 * @desc    Link file to document
 * @access  Private
 * @body    { fileId: string, documentId: string }
 */
router.post('/link', validateRequest(LinkFileSchema), linkFileToDocument)

/**
 * @route   GET /api/upload/stats
 * @desc    Get storage statistics
 * @access  Private
 */
router.get('/stats', getStorageStats)

export default router