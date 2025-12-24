// backend/src/controllers/documents.controller.ts
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { DocumentService } from '../services/document/document.service'
import { SharingService } from '../services/document/sharing.service'
import { WorkflowDetectorService } from '../services/ai/workflow-detector.service'
import { latexService } from '../services/latex/latex.service'
import { logger } from '../utils/logger'
import { formatDocumentDates } from '../utils/formatters'
import { getDefaultTemplate } from '../utils/templates'

const documentService = new DocumentService()
const sharingService = new SharingService()
const workflowDetector = new WorkflowDetectorService()

export const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    // Input already validated by middleware
    const { title, content, type, format } = req.body

    const detectedType = type || workflowDetector.detectDocumentType(content || '')

    const document = await documentService.createDocument(req.userId, {
      title: title || 'Untitled Document',
      content: content || getDefaultTemplate(detectedType, format || 'markdown'),
      type: detectedType,
      format: format || 'markdown',
      tags: workflowDetector.extractTags(content || ''),
      linkedDocuments: [],
      collaborators: [],
    })

    logger.info(`Document created: ${document.id} by user: ${req.userId}`)
    res.status(201).json({
      success: true,
      data: formatDocumentDates(document),
      message: 'Document created successfully'
    })
  } catch (error) {
    logger.error('Error creating document:', error)
    res.status(500).json({ success: false, error: 'Failed to create document' })
  }
}

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const {
      type,
      tags,
      limit = 50,
      offset = 0,
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = req.query as any

    const filters = {
      type: type as string,
      tags: tags ? (tags as string).split(',').filter((t: string) => t.trim()) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    }

    const result = await documentService.getDocuments(req.userId, filters)

    res.json({
      success: true,
      data: result.documents.map(formatDocumentDates),
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.total > filters.offset + filters.limit
      }
    })
  } catch (error) {
    logger.error('Error fetching documents:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch documents' })
  }
}

export const getDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { id } = req.params
    const { token } = req.query

    // First check if user is owner
    let document = await documentService.getDocument(req.userId, id)

    if (!document && token) {
      // User is not owner, check if they have access via share token
      const accessInfo = await sharingService.checkAccess(req.userId, token as string)

      if (accessInfo.hasAccess && accessInfo.documentId === id) {
        // Get share to find owner
        const share = await sharingService.getShareByToken(token as string)
        if (share && share.document_id === id) {
          document = await documentService.getDocument(share.owner_id, id)

          // Add share info to response
          if (document) {
            return res.json({
              success: true,
              data: {
                ...formatDocumentDates(document),
                shareInfo: {
                  permission: accessInfo.permission,
                  isOwner: false
                }
              }
            })
          }
        }
      }
    }

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found or access denied' })
    }

    res.json({
      success: true,
      data: {
        ...formatDocumentDates(document),
        shareInfo: {
          permission: 'edit',
          isOwner: true
        }
      }
    })
  } catch (error) {
    logger.error('Error fetching document:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch document' })
  }
}

export const updateDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { id } = req.params
    const { token } = req.query
    const updates = req.body

    // Check if user has edit permission (owner or via share with edit permission)
    if (token) {
      const accessInfo = await sharingService.checkAccess(req.userId, token as string)

      if (!accessInfo.hasAccess || accessInfo.permission !== 'edit' || accessInfo.documentId !== id) {
        return res.status(403).json({ success: false, error: 'You do not have edit permission for this document' })
      }

      // Log the edit action
      if (accessInfo.shareId) {
        const ipAddress = req.ip || req.socket.remoteAddress
        await sharingService.logAccess(accessInfo.shareId, req.userId, 'edit', ipAddress)
      }

      // Get share to find owner
      const share = await sharingService.getShareByToken(token as string)
      if (!share || share.document_id !== id) {
        return res.status(404).json({ success: false, error: 'Share not found' })
      }

      // Update document as owner
      if (updates.content) {
        const detectedType = workflowDetector.detectDocumentType(updates.content)
        const extractedTags = workflowDetector.extractTags(updates.content)

        if (detectedType !== 'general') {
          updates.type = detectedType
        }
        updates.tags = [...new Set([...(updates.tags || []), ...extractedTags])]
      }

      const document = await documentService.updateDocument(share.owner_id, id, updates)

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' })
      }

      logger.info(`Document updated via share: ${id} by user: ${req.userId}`)
      return res.json({
        success: true,
        data: {
          ...formatDocumentDates(document),
          shareInfo: {
            permission: 'edit',
            isOwner: false
          }
        },
        message: 'Document updated successfully'
      })
    }

    // Normal update (user is owner)
    if (updates.content) {
      const detectedType = workflowDetector.detectDocumentType(updates.content)
      const extractedTags = workflowDetector.extractTags(updates.content)

      if (detectedType !== 'general') {
        updates.type = detectedType
      }
      updates.tags = [...new Set([...(updates.tags || []), ...extractedTags])]
    }

    const document = await documentService.updateDocument(req.userId, id, updates)

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }

    logger.info(`Document updated: ${id} by user: ${req.userId}`)
    res.json({
      success: true,
      data: formatDocumentDates(document),
      message: 'Document updated successfully'
    })
  } catch (error) {
    logger.error('Error updating document:', error)
    res.status(500).json({ success: false, error: 'Failed to update document' })
  }
}

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { id } = req.params
    const deleted = await documentService.deleteDocument(req.userId, id)

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }

    logger.info(`Document deleted: ${id} by user: ${req.userId}`)
    res.json({ success: true, message: 'Document deleted successfully' })
  } catch (error) {
    logger.error('Error deleting document:', error)
    res.status(500).json({ success: false, error: 'Failed to delete document' })
  }
}

export const searchDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { q, type, limit = 20, offset = 0 } = req.query as any

    const results = await documentService.searchDocuments(
      req.userId,
      q as string,
      {
        type: type as string,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    )

    res.json({
      success: true,
      data: results.documents.map(formatDocumentDates),
      pagination: {
        total: results.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: results.total > parseInt(offset) + parseInt(limit)
      },
      query: q
    })
  } catch (error) {
    logger.error('Error searching documents:', error)
    res.status(500).json({ success: false, error: 'Failed to search documents' })
  }
}

export const renameDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { id } = req.params
    const { title } = req.body

    const document = await documentService.updateDocument(req.userId, id, { title: title.trim() })

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }

    logger.info(`Document renamed: ${id} to "${title}" by user: ${req.userId}`)
    res.json({
      success: true,
      data: formatDocumentDates(document),
      message: 'Document renamed successfully'
    })
  } catch (error) {
    logger.error('Error renaming document:', error)
    res.status(500).json({ success: false, error: 'Failed to rename document' })
  }
}

export const duplicateDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { id } = req.params
    const originalDoc = await documentService.getDocument(req.userId, id)

    if (!originalDoc) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }

    const duplicatedDoc = await documentService.duplicateDocument(req.userId, id)

    logger.info(`Document duplicated: ${id} -> ${duplicatedDoc.id} by user: ${req.userId}`)
    res.status(201).json({
      success: true,
      data: formatDocumentDates(duplicatedDoc),
      message: 'Document duplicated successfully'
    })
  } catch (error) {
    logger.error('Error duplicating document:', error)
    res.status(500).json({ success: false, error: 'Failed to duplicate document' })
  }
}

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { id } = req.params
    const document = await documentService.toggleFavorite(req.userId, id)

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }

    logger.info(`Document favorite toggled: ${id} by user: ${req.userId}`)
    res.json({
      success: true,
      data: formatDocumentDates(document),
      message: document.is_favorite ? 'Document added to favorites' : 'Document removed from favorites'
    })
  } catch (error) {
    logger.error('Error toggling favorite:', error)
    res.status(500).json({ success: false, error: 'Failed to toggle favorite' })
  }
}

export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { limit = 50, offset = 0 } = req.query as any

    const result = await documentService.getFavorites(req.userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      success: true,
      data: result.documents.map(formatDocumentDates),
      pagination: {
        total: result.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.total > parseInt(offset) + parseInt(limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching favorites:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch favorites' })
  }
}

export const getRecentDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { limit = 10 } = req.query as any
    const parsedLimit = Math.min(parseInt(limit) || 10, 50)

    const documents = await documentService.getRecentDocuments(req.userId, parsedLimit)

    res.json({
      success: true,
      data: documents.map(formatDocumentDates)
    })
  } catch (error) {
    logger.error('Error fetching recent documents:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch recent documents' })
  }
}

export const bulkDeleteDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { documentIds } = req.body
    const deletedCount = await documentService.bulkDeleteDocuments(req.userId, documentIds)

    logger.info(`Bulk deleted ${deletedCount} documents by user: ${req.userId}`)
    res.json({
      success: true,
      data: { deletedCount },
      message: `${deletedCount} document(s) deleted successfully`
    })
  } catch (error) {
    logger.error('Error bulk deleting documents:', error)
    res.status(500).json({ success: false, error: 'Failed to delete documents' })
  }
}

export const bulkUpdateTags = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { documentIds, tags, operation } = req.body

    const updatedCount = await documentService.bulkUpdateTags(
      req.userId,
      documentIds,
      tags,
      operation as 'add' | 'remove' | 'replace'
    )

    logger.info(`Bulk updated tags for ${updatedCount} documents by user: ${req.userId}`)
    res.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount} document(s) updated successfully`
    })
  } catch (error) {
    logger.error('Error bulk updating tags:', error)
    res.status(500).json({ success: false, error: 'Failed to update tags' })
  }
}

export const compileDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }

    const { id } = req.params
    const document = await documentService.getDocument(req.userId, id)

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }

    if (document.format !== 'latex') {
      return res.status(400).json({ success: false, error: 'Document is not a LaTeX document' })
    }

    const pdfBuffer = await latexService.compileToPdf(document.content)

    res.contentType('application/pdf')
    res.send(pdfBuffer)
  } catch (error) {
    logger.error('Error compiling document:', error)
    res.status(500).json({ success: false, error: 'Failed to compile document' })
  }
}

// ✅ NEW: Get document template
export const getDocumentTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { type, format } = req.query
    const template = getDefaultTemplate((type as string) || 'general', (format as string) || 'markdown')

    res.json({
      success: true,
      data: template
    })
  } catch (error) {
    logger.error('Error fetching template:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch template' })
  }
}