// backend/src/controllers/comments.controller.ts
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { CommentsService } from '../services/document/comments.service'
import { logger } from '../utils/logger'

const commentsService = new CommentsService()

/**
 * Add a comment to a document
 * POST /api/documents/:documentId/comments
 */
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentId } = req.params
    const { content, parentCommentId } = req.body

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      })
    }

    if (content.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be less than 10,000 characters'
      })
    }

    const comment = await commentsService.createComment(req.userId, {
      documentId,
      content: content.trim(),
      parentCommentId
    })

    logger.info(`Comment added: ${comment.id} on document: ${documentId}`)
    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    })
  } catch (error) {
    logger.error('Error adding comment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to add comment'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

/**
 * Get all comments for a document
 * GET /api/documents/:documentId/comments
 */
export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentId } = req.params
    const { includeResolved } = req.query

    const includeResolvedBool = includeResolved === 'true'

    const comments = await commentsService.getDocumentComments(
      req.userId,
      documentId,
      includeResolvedBool
    )

    // Get unresolved count
    const unresolvedCount = await commentsService.getCommentCount(documentId)

    res.json({
      success: true,
      data: comments,
      meta: {
        unresolvedCount
      }
    })
  } catch (error) {
    logger.error('Error getting comments:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get comments'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

/**
 * Update a comment (edit content or resolve)
 * PATCH /api/comments/:commentId
 */
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { commentId } = req.params
    const { content, isResolved } = req.body

    // Validate content if provided
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content must be a non-empty string'
        })
      }

      if (content.length > 10000) {
        return res.status(400).json({
          success: false,
          error: 'Comment must be less than 10,000 characters'
        })
      }
    }

    const updates: any = {}
    if (content !== undefined) {
      updates.content = content.trim()
    }
    if (isResolved !== undefined) {
      updates.isResolved = Boolean(isResolved)
    }

    const comment = await commentsService.updateComment(req.userId, commentId, updates)

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      })
    }

    logger.info(`Comment updated: ${commentId}`)
    res.json({
      success: true,
      data: comment,
      message: 'Comment updated successfully'
    })
  } catch (error) {
    logger.error('Error updating comment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update comment'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

/**
 * Delete a comment
 * DELETE /api/comments/:commentId
 */
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { commentId } = req.params

    const deleted = await commentsService.deleteComment(req.userId, commentId)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      })
    }

    logger.info(`Comment deleted: ${commentId}`)
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting comment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

/**
 * Toggle resolve status of a comment
 * PATCH /api/comments/:commentId/resolve
 */
export const toggleResolveComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { commentId } = req.params

    const comment = await commentsService.toggleResolve(req.userId, commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      })
    }

    logger.info(`Comment resolve toggled: ${commentId}`)
    res.json({
      success: true,
      data: comment,
      message: comment.is_resolved 
        ? 'Comment marked as resolved' 
        : 'Comment marked as unresolved'
    })
  } catch (error) {
    logger.error('Error toggling comment resolve:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle resolve'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

/**
 * Reply to a comment (convenience endpoint)
 * POST /api/comments/:commentId/reply
 */
export const replyToComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { commentId } = req.params
    const { content } = req.body

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reply content is required'
      })
    }

    if (content.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Reply must be less than 10,000 characters'
      })
    }

    // Get parent comment to find document ID
    const parentComment = await commentsService.getCommentById(commentId)

    if (!parentComment) {
      return res.status(404).json({
        success: false,
        error: 'Parent comment not found'
      })
    }

    // Create reply
    const reply = await commentsService.createComment(req.userId, {
      documentId: parentComment.document_id,
      content: content.trim(),
      parentCommentId: commentId
    })

    logger.info(`Reply added: ${reply.id} to comment: ${commentId}`)
    res.status(201).json({
      success: true,
      data: reply,
      message: 'Reply added successfully'
    })
  } catch (error) {
    logger.error('Error replying to comment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to add reply'
    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

/**
 * Get comment count for a document
 * GET /api/documents/:documentId/comments/count
 */
export const getCommentCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { documentId } = req.params

    const count = await commentsService.getCommentCount(documentId)

    res.json({
      success: true,
      data: { count }
    })
  } catch (error) {
    logger.error('Error getting comment count:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get comment count'
    })
  }
}