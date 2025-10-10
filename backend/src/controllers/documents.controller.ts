// backend/src/controllers/documents.controller.ts
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { DocumentService } from '../services/document/document.service'
import { SharingService } from '../services/document/sharing.service'
import { WorkflowDetectorService } from '../services/ai/workflow-detector.service'
import { logger } from '../utils/logger'

const documentService = new DocumentService()
const sharingService = new SharingService()
const workflowDetector = new WorkflowDetectorService()

// ✅ Helper function to format dates consistently
function formatDocumentDates(doc: any) {
  return {
    ...doc,
    created_at: doc.created_at ? new Date(doc.created_at).toISOString() : null,
    updated_at: doc.updated_at ? new Date(doc.updated_at).toISOString() : null,
    last_accessed_at: doc.last_accessed_at ? new Date(doc.last_accessed_at).toISOString() : null,
    // Transform snake_case to camelCase for frontend
    createdAt: doc.created_at ? new Date(doc.created_at).toISOString() : null,
    updatedAt: doc.updated_at ? new Date(doc.updated_at).toISOString() : null,
    lastAccessedAt: doc.last_accessed_at ? new Date(doc.last_accessed_at).toISOString() : null,
    wordCount: doc.word_count,
    readingTime: doc.reading_time,
    linkedDocuments: doc.linked_documents,
    isFavorite: doc.is_favorite || false,
  }
}

// ✅ Input validation helper
function validateDocumentInput(title?: string, content?: string): string | null {
  if (title !== undefined) {
    if (typeof title !== 'string') return 'Title must be a string'
    if (title.length > 500) return 'Title must be less than 500 characters'
  }
  if (content !== undefined) {
    if (typeof content !== 'string') return 'Content must be a string'
    if (content.length > 10000000) return 'Content must be less than 10MB'
  }
  return null
}

export const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { title, content, type } = req.body

    // ✅ Validate input
    const validationError = validateDocumentInput(title, content)
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      })
    }

    const detectedType = type || workflowDetector.detectDocumentType(content || '')
    
    const document = await documentService.createDocument(req.userId, {
      title: title || 'Untitled Document',
      content: content || getDefaultTemplate(detectedType),
      type: detectedType,
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
    res.status(500).json({
      success: false,
      error: 'Failed to create document'
    })
  }
}

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { 
      type, 
      tags, 
      limit = 50, 
      offset = 0, 
      sortBy = 'updated_at', 
      sortOrder = 'desc' 
    } = req.query

    // ✅ Validate pagination parameters
    const parsedLimit = Math.min(parseInt(limit as string) || 50, 100) // Max 100
    const parsedOffset = Math.max(parseInt(offset as string) || 0, 0)

    const filters = {
      type: type as string,
      tags: tags ? (tags as string).split(',').filter(t => t.trim()) : undefined,
      limit: parsedLimit,
      offset: parsedOffset,
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    })
  }
}

export const getDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const { token } = req.query // Optional share token
    
    // First check if user is owner
    let document = await documentService.getDocument(req.userId, id, true)
    
    if (!document && token) {
      // User is not owner, check if they have access via share token
      const accessInfo = await sharingService.checkAccess(req.userId, id, token as string)
      
      if (accessInfo.hasAccess) {
        // Get document as owner to bypass ownership check
        const share = await sharingService.getShareByToken(token as string)
        if (share) {
          document = await documentService.getDocument(share.owner_id, id, false)
          
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
      return res.status(404).json({
        success: false,
        error: 'Document not found or access denied'
      })
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    })
  }
}

export const updateDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const { token } = req.query // Optional share token
    const updates = req.body

    // ✅ Validate input
    const validationError = validateDocumentInput(updates.title, updates.content)
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      })
    }

    // Check if user has edit permission (owner or via share with edit permission)
    if (token) {
      const accessInfo = await sharingService.checkAccess(req.userId, id, token as string)
      
      if (!accessInfo.hasAccess || accessInfo.permission !== 'edit') {
        return res.status(403).json({
          success: false,
          error: 'You do not have edit permission for this document'
        })
      }

      // Log the edit action
      if (accessInfo.shareId) {
        const ipAddress = req.ip || req.socket.remoteAddress
        await sharingService.logAccess(accessInfo.shareId, req.userId, 'edit', ipAddress)
      }

      // Get share to find owner
      const share = await sharingService.getShareByToken(token as string)
      if (!share) {
        return res.status(404).json({
          success: false,
          error: 'Share not found'
        })
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
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        })
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
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    logger.info(`Document updated: ${id} by user: ${req.userId}`)
    res.json({
      success: true,
      data: formatDocumentDates(document),
      message: 'Document updated successfully'
    })
  } catch (error) {
    logger.error('Error updating document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    })
  }
}

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const deleted = await documentService.deleteDocument(req.userId, id)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    logger.info(`Document deleted: ${id} by user: ${req.userId}`)
    res.json({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    })
  }
}

export const searchDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { q, type, limit = 20, offset = 0 } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      })
    }

    // ✅ Validate query length
    if (q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      })
    }

    if (q.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be less than 200 characters'
      })
    }

    const parsedLimit = Math.min(parseInt(limit as string) || 20, 100)
    const parsedOffset = Math.max(parseInt(offset as string) || 0, 0)

    const results = await documentService.searchDocuments(
      req.userId,
      q as string, 
      { 
        type: type as string, 
        limit: parsedLimit,
        offset: parsedOffset
      }
    )

    res.json({
      success: true,
      data: results.documents.map(formatDocumentDates),
      pagination: {
        total: results.total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: results.total > parsedOffset + parsedLimit
      },
      query: q
    })
  } catch (error) {
    logger.error('Error searching documents:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search documents'
    })
  }
}

// ✅ NEW: Rename document
export const renameDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const { title } = req.body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      })
    }

    if (title.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Title must be less than 500 characters'
      })
    }

    const document = await documentService.updateDocument(req.userId, id, { title: title.trim() })
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    logger.info(`Document renamed: ${id} to "${title}" by user: ${req.userId}`)
    res.json({
      success: true,
      data: formatDocumentDates(document),
      message: 'Document renamed successfully'
    })
  } catch (error) {
    logger.error('Error renaming document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to rename document'
    })
  }
}

// ✅ NEW: Duplicate document
export const duplicateDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const originalDoc = await documentService.getDocument(req.userId, id)
    
    if (!originalDoc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
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
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate document'
    })
  }
}

// ✅ NEW: Toggle favorite status
export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const document = await documentService.toggleFavorite(req.userId, id)
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    logger.info(`Document favorite toggled: ${id} by user: ${req.userId}`)
    res.json({
      success: true,
      data: formatDocumentDates(document),
      message: document.is_favorite ? 'Document added to favorites' : 'Document removed from favorites'
    })
  } catch (error) {
    logger.error('Error toggling favorite:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to toggle favorite'
    })
  }
}

// ✅ NEW: Get favorite documents
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { limit = 50, offset = 0 } = req.query
    const parsedLimit = Math.min(parseInt(limit as string) || 50, 100)
    const parsedOffset = Math.max(parseInt(offset as string) || 0, 0)

    const result = await documentService.getFavorites(req.userId, {
      limit: parsedLimit,
      offset: parsedOffset
    })

    res.json({
      success: true,
      data: result.documents.map(formatDocumentDates),
      pagination: {
        total: result.total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: result.total > parsedOffset + parsedLimit
      }
    })
  } catch (error) {
    logger.error('Error fetching favorites:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites'
    })
  }
}

// ✅ NEW: Get recently accessed documents
export const getRecentDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { limit = 10 } = req.query
    const parsedLimit = Math.min(parseInt(limit as string) || 10, 50)

    const documents = await documentService.getRecentDocuments(req.userId, parsedLimit)

    res.json({
      success: true,
      data: documents.map(formatDocumentDates)
    })
  } catch (error) {
    logger.error('Error fetching recent documents:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent documents'
    })
  }
}

// ✅ NEW: Bulk delete documents
export const bulkDeleteDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentIds } = req.body

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Document IDs array is required'
      })
    }

    if (documentIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete more than 100 documents at once'
      })
    }

    const deletedCount = await documentService.bulkDeleteDocuments(req.userId, documentIds)

    logger.info(`Bulk deleted ${deletedCount} documents by user: ${req.userId}`)
    res.json({
      success: true,
      data: { deletedCount },
      message: `${deletedCount} document(s) deleted successfully`
    })
  } catch (error) {
    logger.error('Error bulk deleting documents:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete documents'
    })
  }
}

// ✅ NEW: Bulk update tags
export const bulkUpdateTags = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentIds, tags, operation } = req.body

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Document IDs array is required'
      })
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tags array is required'
      })
    }

    if (!['add', 'remove', 'replace'].includes(operation)) {
      return res.status(400).json({
        success: false,
        error: 'Operation must be "add", "remove", or "replace"'
      })
    }

    if (documentIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update more than 100 documents at once'
      })
    }

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
    res.status(500).json({
      success: false,
      error: 'Failed to update tags'
    })
  }
}

function getDefaultTemplate(type: string): string {
  const templates = {
    research: `# Research Document

## Abstract
Brief summary of your research...

## Introduction
Background and motivation...

## Methodology
How you conducted the research...

## Results
Key findings...

## Conclusion
Summary and implications...

## References
- Reference 1
- Reference 2`,

    engineering: `# Technical Specification

## Overview
Brief description of the project...

## Requirements
### Functional Requirements
- Feature 1
- Feature 2

### Non-Functional Requirements
- Performance requirements
- Security requirements

## Architecture
High-level system design...

## Implementation
\`\`\`typescript
// Code examples
\`\`\`

## Testing
Test strategy and cases...`,

    healthcare: `# Clinical Protocol

## Patient Information
- Patient ID: 
- Date: 
- Provider: 

## Chief Complaint
Primary reason for visit...

## Assessment
Clinical findings...

## Plan
Treatment plan and next steps...

## Follow-up
Scheduled appointments and monitoring...`,

    meeting: `# Meeting Notes
**Date:** ${new Date().toLocaleDateString()}
**Attendees:** 
**Duration:** 

## Agenda
1. Item 1
2. Item 2
3. Item 3

## Discussion

## Action Items
- [ ] Task 1 - @person - Due: date
- [ ] Task 2 - @person - Due: date

## Next Steps`,

    general: `# Document Title

Start writing your content here...

## Section 1

## Section 2`
  }
  
  return templates[type as keyof typeof templates] || templates.general
}