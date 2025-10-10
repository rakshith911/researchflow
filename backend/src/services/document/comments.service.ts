// backend/src/services/document/comments.service.ts
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../config/database'
import { logger } from '../../utils/logger'
import {
  DocumentComment,
  CommentWithUser,
  CreateCommentInput,
  UpdateCommentInput
} from '../../types/sharing.types'

export class CommentsService {
  /**
   * Create a new comment
   */
  async createComment(
    userId: string,
    input: CreateCommentInput
  ): Promise<CommentWithUser> {
    const db = await getDatabase()

    // Verify user has access to the document (must be owner or have share access)
    const hasAccess = await this.verifyDocumentAccess(userId, input.documentId)
    
    if (!hasAccess) {
      throw new Error('Document not found or access denied')
    }

    // If replying to a comment, verify parent exists
    if (input.parentCommentId) {
      const parentComment = await db.get(
        'SELECT * FROM document_comments WHERE id = ? AND document_id = ?',
        [input.parentCommentId, input.documentId]
      )

      if (!parentComment) {
        throw new Error('Parent comment not found')
      }
    }

    const commentId = uuidv4()
    const now = new Date().toISOString()

    await db.run(
      `INSERT INTO document_comments (
        id, document_id, user_id, parent_comment_id, content, is_resolved, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        commentId,
        input.documentId,
        userId,
        input.parentCommentId || null,
        input.content,
        0,
        now,
        now
      ]
    )

    const comment = await this.getCommentById(commentId)

    if (!comment) {
      throw new Error('Failed to create comment')
    }

    logger.info(`Comment created: ${commentId} on document: ${input.documentId}`)
    return comment
  }

  /**
   * Get comment by ID with user info
   */
  async getCommentById(commentId: string): Promise<CommentWithUser | null> {
    const db = await getDatabase()

    const comment = await db.get<any>(
      `SELECT 
        c.*,
        u.email as user_email,
        u.name as user_name
       FROM document_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    )

    if (!comment) {
      return null
    }

    return {
      ...comment,
      is_resolved: Boolean(comment.is_resolved)
    }
  }

  /**
   * Get all comments for a document (threaded)
   */
  async getDocumentComments(
    userId: string,
    documentId: string,
    includeResolved: boolean = true
  ): Promise<CommentWithUser[]> {
    const db = await getDatabase()

    // Verify user has access
    const hasAccess = await this.verifyDocumentAccess(userId, documentId)
    
    if (!hasAccess) {
      throw new Error('Document not found or access denied')
    }

    // Get all comments
    let query = `
      SELECT 
        c.*,
        u.email as user_email,
        u.name as user_name
      FROM document_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.document_id = ?
    `

    if (!includeResolved) {
      query += ' AND c.is_resolved = 0'
    }

    query += ' ORDER BY c.created_at ASC'

    const comments = await db.all<any[]>(query, [documentId])

    // Convert to proper format
    const formattedComments = comments.map(c => ({
      ...c,
      is_resolved: Boolean(c.is_resolved)
    }))

    // Build threaded structure
    return this.buildCommentTree(formattedComments)
  }

  /**
   * Build threaded comment structure
   */
  private buildCommentTree(comments: CommentWithUser[]): CommentWithUser[] {
    const commentMap = new Map<string, CommentWithUser>()
    const rootComments: CommentWithUser[] = []

    // First pass: create map and initialize replies array
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: build tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!

      if (comment.parent_comment_id) {
        // This is a reply
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          if (!parent.replies) {
            parent.replies = []
          }
          parent.replies.push(commentWithReplies)
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  }

  /**
   * Update comment content or resolved status
   */
  async updateComment(
    userId: string,
    commentId: string,
    updates: UpdateCommentInput
  ): Promise<CommentWithUser | null> {
    const db = await getDatabase()

    // Verify user owns the comment or is document owner
    const comment = await db.get<DocumentComment>(
      'SELECT * FROM document_comments WHERE id = ?',
      [commentId]
    )

    if (!comment) {
      return null
    }

    // Check if user is comment author or document owner
    const isAuthor = comment.user_id === userId
    const isOwner = await this.isDocumentOwner(userId, comment.document_id)

    if (!isAuthor && !isOwner) {
      throw new Error('Permission denied: You can only edit your own comments')
    }

    // Content can only be edited by author
    if (updates.content !== undefined && !isAuthor) {
      throw new Error('Only comment author can edit content')
    }

    const updateFields: string[] = []
    const params: any[] = []

    if (updates.content !== undefined) {
      updateFields.push('content = ?')
      params.push(updates.content)
    }

    if (updates.isResolved !== undefined) {
      updateFields.push('is_resolved = ?')
      params.push(updates.isResolved ? 1 : 0)
    }

    updateFields.push('updated_at = ?')
    params.push(new Date().toISOString())

    params.push(commentId)

    await db.run(
      `UPDATE document_comments SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    )

    const updatedComment = await this.getCommentById(commentId)

    logger.info(`Comment updated: ${commentId}`)
    return updatedComment
  }

  /**
   * Delete comment (soft delete for now, or hard delete)
   */
  async deleteComment(userId: string, commentId: string): Promise<boolean> {
    const db = await getDatabase()

    // Get comment
    const comment = await db.get<DocumentComment>(
      'SELECT * FROM document_comments WHERE id = ?',
      [commentId]
    )

    if (!comment) {
      return false
    }

    // Check if user is comment author or document owner
    const isAuthor = comment.user_id === userId
    const isOwner = await this.isDocumentOwner(userId, comment.document_id)

    if (!isAuthor && !isOwner) {
      throw new Error('Permission denied: You can only delete your own comments')
    }

    // Check if comment has replies
    const hasReplies = await db.get(
      'SELECT COUNT(*) as count FROM document_comments WHERE parent_comment_id = ?',
      [commentId]
    )

    if (hasReplies && hasReplies.count > 0) {
      // If has replies, replace content with "[deleted]" instead of hard delete
      await db.run(
        'UPDATE document_comments SET content = ?, updated_at = ? WHERE id = ?',
        ['[Comment deleted]', new Date().toISOString(), commentId]
      )
      logger.info(`Comment soft-deleted (has replies): ${commentId}`)
    } else {
      // No replies, safe to hard delete
      const result = await db.run(
        'DELETE FROM document_comments WHERE id = ?',
        [commentId]
      )
      logger.info(`Comment deleted: ${commentId}`)
      return (result.changes || 0) > 0
    }

    return true
  }

  /**
   * Resolve/unresolve a comment
   */
  async toggleResolve(userId: string, commentId: string): Promise<CommentWithUser | null> {
    const db = await getDatabase()

    const comment = await db.get<DocumentComment>(
      'SELECT * FROM document_comments WHERE id = ?',
      [commentId]
    )

    if (!comment) {
      return null
    }

    // Verify user has access to the document
    const hasAccess = await this.verifyDocumentAccess(userId, comment.document_id)
    
    if (!hasAccess) {
      throw new Error('Access denied')
    }

    const newResolvedStatus = !comment.is_resolved

    await db.run(
      'UPDATE document_comments SET is_resolved = ?, updated_at = ? WHERE id = ?',
      [newResolvedStatus ? 1 : 0, new Date().toISOString(), commentId]
    )

    const updatedComment = await this.getCommentById(commentId)

    logger.info(`Comment resolve toggled: ${commentId} -> ${newResolvedStatus}`)
    return updatedComment
  }

  /**
   * Get comment count for a document
   */
  async getCommentCount(documentId: string): Promise<number> {
    const db = await getDatabase()

    const result = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM document_comments WHERE document_id = ? AND is_resolved = 0',
      [documentId]
    )

    return result?.count || 0
  }

  /**
   * Verify user has access to document (owner or via share)
   */
  private async verifyDocumentAccess(userId: string, documentId: string): Promise<boolean> {
    const db = await getDatabase()

    // Check if user is owner
    const document = await db.get(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    )

    if (document) {
      return true
    }

    // Check if user has accessed via share (has access log entry)
    const shareAccess = await db.get(
      `SELECT sal.* 
       FROM share_access_logs sal
       JOIN shared_documents sd ON sal.share_id = sd.id
       WHERE sd.document_id = ? AND sal.user_id = ?
       AND (sd.expires_at IS NULL OR sd.expires_at > datetime('now'))
       LIMIT 1`,
      [documentId, userId]
    )

    return !!shareAccess
  }

  /**
   * Check if user is document owner
   */
  private async isDocumentOwner(userId: string, documentId: string): Promise<boolean> {
    const db = await getDatabase()

    const document = await db.get(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    )

    return !!document
  }
}