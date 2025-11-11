// backend/src/controllers/sharing.controller.ts
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { SharingService } from '../services/document/sharing.service'
import { DocumentService } from '../services/document/document.service'
import { logger } from '../utils/logger'

const sharingService = new SharingService()
const documentService = new DocumentService()

/**
 * Create a new share for a document (requires email of user to share with)
 * POST /api/sharing/:documentId
 */
export const shareDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentId } = req.params
    const { email, permission, expiresAt } = req.body

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      })
    }

    // Validate permission
    if (!permission || !['view', 'comment', 'edit'].includes(permission)) {
      return res.status(400).json({
        success: false,
        error: 'Valid permission is required (view, comment, or edit)'
      })
    }

    // Validate expiresAt if provided
    if (expiresAt) {
      const expiryDate = new Date(expiresAt)
      if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Expiration date must be valid and in the future'
        })
      }
    }

    const share = await sharingService.createShare(req.userId, {
      documentId,
      sharedWithEmail: email,
      permission,
      expiresAt
    })

    // Build share URL
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${share.share_token}`

    logger.info(`Document shared: ${documentId} by user: ${req.userId} with: ${email}`)
    res.status(201).json({
      success: true,
      data: {
        ...share,
        shareUrl
      },
      message: `Document shared successfully with ${email}`
    })
  } catch (error) {
    logger.error('Error sharing document:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to share document'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

/**
 * Get all shares for a document
 * GET /api/sharing/:documentId
 */
export const getDocumentShares = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentId } = req.params

    const shares = await sharingService.getDocumentShares(req.userId, documentId)

    // Add share URLs to each share
    const sharesWithUrls = shares.map(share => ({
      ...share,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${share.share_token}`
    }))

    res.json({
      success: true,
      data: sharesWithUrls
    })
  } catch (error) {
    logger.error('Error getting document shares:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get shares'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

/**
 * Get documents shared by current user
 * GET /api/sharing/shared-by-me
 */
export const getSharedByMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const shares = await sharingService.getSharedByMe(req.userId)

    const sharesWithUrls = shares.map(share => ({
      ...share,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${share.share_token}`
    }))

    res.json({
      success: true,
      data: sharesWithUrls
    })
  } catch (error) {
    logger.error('Error getting shared by me:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get shared documents'
    })
  }
}

/**
 * Get documents shared with current user
 * GET /api/sharing/shared-with-me
 */
export const getSharedWithMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const shares = await sharingService.getSharedWithMe(req.userId)

    res.json({
      success: true,
      data: shares
    })
  } catch (error) {
    logger.error('Error getting shared with me:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get shared documents'
    })
  }
}

/**
 * Update share permission or expiration
 * PATCH /api/sharing/:shareId
 */
export const updateShare = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { shareId } = req.params
    const { permission, expiresAt } = req.body

    // Validate permission if provided
    if (permission && !['view', 'comment', 'edit'].includes(permission)) {
      return res.status(400).json({
        success: false,
        error: 'Valid permission is required (view, comment, or edit)'
      })
    }

    // Validate expiresAt if provided
    if (expiresAt) {
      const expiryDate = new Date(expiresAt)
      if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Expiration date must be valid'
        })
      }
    }

    const share = await sharingService.updateShare(req.userId, shareId, {
      permission,
      expiresAt
    })

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share not found or access denied'
      })
    }

    logger.info(`Share updated: ${shareId} by user: ${req.userId}`)
    res.json({
      success: true,
      data: share,
      message: 'Share updated successfully'
    })
  } catch (error) {
    logger.error('Error updating share:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update share'
    })
  }
}

/**
 * Revoke a share
 * DELETE /api/sharing/:shareId
 */
export const revokeShare = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { shareId } = req.params

    const revoked = await sharingService.revokeShare(req.userId, shareId)

    if (!revoked) {
      return res.status(404).json({
        success: false,
        error: 'Share not found or access denied'
      })
    }

    logger.info(`Share revoked: ${shareId} by user: ${req.userId}`)
    res.json({
      success: true,
      message: 'Share revoked successfully'
    })
  } catch (error) {
    logger.error('Error revoking share:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to revoke share'
    })
  }
}

/**
 * Access a shared document via token (requires authentication)
 * GET /api/sharing/shared/:token
 */
export const accessSharedDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Please login to access this shared document',
        requiresAuth: true
      })
    }

    const { token } = req.params

    // Check if user has access via this token
    const accessInfo = await sharingService.checkAccess(req.userId, token)

    if (!accessInfo.hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this document. It may have been shared with a different account.'
      })
    }

    // Get share details for logging
    const share = await sharingService.getShareByToken(token)
    
    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Shared document not found or link has expired'
      })
    }

    // Log access
    const ipAddress = req.ip || req.socket.remoteAddress
    await sharingService.logAccess(share.id, req.userId, 'view', ipAddress)

    // Get the document (use owner's ID since they own it)
    const document = await documentService.getDocument(share.owner_id, share.document_id)

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    // Return document with access info
    res.json({
      success: true,
      data: {
        document: {
          ...document,
          createdAt: document.created_at,
          updatedAt: document.updated_at,
          lastAccessedAt: document.last_accessed_at,
          wordCount: document.word_count,
          readingTime: document.reading_time,
          linkedDocuments: document.linked_documents,
          isFavorite: document.is_favorite
        },
        shareInfo: {
          permission: accessInfo.permission,
          isOwner: accessInfo.isOwner,
          expiresAt: share.expires_at
        }
      }
    })
  } catch (error) {
    logger.error('Error accessing shared document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to access shared document'
    })
  }
}

/**
 * Get access logs for a share
 * GET /api/sharing/:shareId/logs
 */
export const getShareAccessLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { shareId } = req.params

    const logs = await sharingService.getAccessLogs(req.userId, shareId)

    res.json({
      success: true,
      data: logs
    })
  } catch (error) {
    logger.error('Error getting access logs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get access logs'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}