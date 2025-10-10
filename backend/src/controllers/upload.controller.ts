// backend/src/controllers/upload.controller.ts
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { UploadService } from '../services/upload/upload.service'
import { logger } from '../utils/logger'
import path from 'path'

const uploadService = new UploadService()

/**
 * Upload a file (image or attachment)
 */
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      })
    }

    const documentId = req.body.documentId || undefined
    const uploadedFile = await uploadService.saveFile(req.userId, req.file, documentId)

    logger.info(`File uploaded: ${uploadedFile.filename}`)
    res.status(201).json({
      success: true,
      data: uploadedFile,
      message: 'File uploaded successfully'
    })
  } catch (error) {
    logger.error('Error uploading file:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Get all files for the authenticated user
 */
export const getUserFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentId } = req.query
    const files = await uploadService.getUserFiles(req.userId, documentId as string)

    res.json({
      success: true,
      data: files,
      message: 'Files retrieved successfully'
    })
  } catch (error) {
    logger.error('Error getting user files:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve files'
    })
  }
}

/**
 * Get a specific file by ID
 */
export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const file = await uploadService.getFile(id, req.userId)

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    res.json({
      success: true,
      data: file,
      message: 'File retrieved successfully'
    })
  } catch (error) {
    logger.error('Error getting file:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve file'
    })
  }
}

/**
 * Serve uploaded file (images/attachments)
 */
export const serveFile = async (req: AuthRequest, res: Response) => {
  try {
    const { subfolder, filename } = req.params
    
    if (subfolder !== 'images' && subfolder !== 'attachments') {
      return res.status(400).json({
        success: false,
        error: 'Invalid subfolder'
      })
    }

    const filePath = await uploadService.getFilePath(filename, subfolder)

    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    // Set appropriate content type
    const ext = path.extname(filename).toLowerCase()
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    }

    const contentType = contentTypes[ext] || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    
    res.sendFile(filePath)
  } catch (error) {
    logger.error('Error serving file:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to serve file'
    })
  }
}

/**
 * Delete a file
 */
export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const deleted = await uploadService.deleteFile(id, req.userId)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    logger.info(`File deleted: ${id}`)
    res.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting file:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    })
  }
}

/**
 * Link file to document
 */
export const linkFileToDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { fileId, documentId } = req.body

    if (!fileId || !documentId) {
      return res.status(400).json({
        success: false,
        error: 'File ID and document ID are required'
      })
    }

    const linked = await uploadService.linkFileToDocument(fileId, documentId, req.userId)

    if (!linked) {
      return res.status(404).json({
        success: false,
        error: 'File not found or already linked'
      })
    }

    res.json({
      success: true,
      message: 'File linked to document successfully'
    })
  } catch (error) {
    logger.error('Error linking file to document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to link file to document'
    })
  }
}

/**
 * Get storage statistics
 */
export const getStorageStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const stats = await uploadService.getUserStorageStats(req.userId)

    res.json({
      success: true,
      data: stats,
      message: 'Storage statistics retrieved successfully'
    })
  } catch (error) {
    logger.error('Error getting storage stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve storage statistics'
    })
  }
}