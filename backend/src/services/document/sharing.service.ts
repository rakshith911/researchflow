// backend/src/services/document/sharing.service.ts
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../config/database'
import { logger } from '../../utils/logger'
import {
  SharedDocument,
  SharedDocumentWithDetails,
  CreateShareInput,
  UpdateShareInput,
  ShareAccessInfo,
  SharePermission
} from '../../types/sharing.types'

export class SharingService {
  /**
   * Generate a cryptographically secure share token
   */
  private generateShareToken(): string {
    return uuidv4() + '-' + uuidv4() // Extra long for security
  }

  /**
   * Create a new share for a document (email-based invitation)
   */
  async createShare(
    userId: string,
    input: CreateShareInput
  ): Promise<SharedDocument> {
    const db = await getDatabase()

    // Verify user owns the document
    const document = await db.get(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [input.documentId, userId]
    )

    if (!document) {
      throw new Error('Document not found or you do not have permission to share it')
    }

    // Find user by email
    const sharedWithUser = await db.get(
      'SELECT id, email, name FROM users WHERE email = ?',
      [input.sharedWithEmail.toLowerCase()]
    )

    if (!sharedWithUser) {
      throw new Error(`User with email "${input.sharedWithEmail}" not found. They need to create an account first.`)
    }

    // Check if user is trying to share with themselves
    if (sharedWithUser.id === userId) {
      throw new Error('You cannot share a document with yourself')
    }

    // Check if document is already shared with this user
    const existingShare = await db.get(
      'SELECT * FROM shared_documents WHERE document_id = ? AND shared_with_user_id = ?',
      [input.documentId, sharedWithUser.id]
    )

    if (existingShare) {
      throw new Error('Document is already shared with this user')
    }

    const shareId = uuidv4()
    const shareToken = this.generateShareToken()
    const now = new Date().toISOString()

    await db.run(
      `INSERT INTO shared_documents (
        id, document_id, owner_id, shared_with_user_id, share_token, permission, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shareId,
        input.documentId,
        userId,
        sharedWithUser.id,
        shareToken,
        input.permission,
        input.expiresAt || null,
        now,
        now
      ]
    )

    const share = await db.get<SharedDocument>(
      'SELECT * FROM shared_documents WHERE id = ?',
      [shareId]
    )

    if (!share) {
      throw new Error('Failed to create share')
    }

    logger.info(`Document shared: ${input.documentId} by user: ${userId} with user: ${sharedWithUser.id}`)
    return share
  }

  /**
   * Get share by token (for accessing shared document)
   */
  async getShareByToken(token: string): Promise<SharedDocument | null> {
    const db = await getDatabase()

    const share = await db.get<SharedDocument>(
      'SELECT * FROM shared_documents WHERE share_token = ?',
      [token]
    )

    if (!share) {
      return null
    }

    // Check if share has expired
    if (share.expires_at) {
      const expiresAt = new Date(share.expires_at)
      if (expiresAt < new Date()) {
        logger.warn(`Attempted to access expired share: ${share.id}`)
        return null
      }
    }

    return share
  }

  /**
   * Get all shares for a document (owner only)
   */
  async getDocumentShares(
    userId: string,
    documentId: string
  ): Promise<SharedDocumentWithDetails[]> {
    const db = await getDatabase()

    // Verify user owns the document
    const document = await db.get(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    )

    if (!document) {
      throw new Error('Document not found or access denied')
    }

    const shares = await db.all<SharedDocumentWithDetails[]>(
      `SELECT 
        sd.*,
        d.title as document_title,
        d.type as document_type,
        owner.email as owner_email,
        owner.name as owner_name,
        shared_user.email as shared_with_email,
        shared_user.name as shared_with_name
       FROM shared_documents sd
       JOIN documents d ON sd.document_id = d.id
       JOIN users owner ON sd.owner_id = owner.id
       JOIN users shared_user ON sd.shared_with_user_id = shared_user.id
       WHERE sd.document_id = ?
       ORDER BY sd.created_at DESC`,
      [documentId]
    )

    return shares
  }

  /**
   * Get all documents shared by user
   */
  async getSharedByMe(userId: string): Promise<SharedDocumentWithDetails[]> {
    const db = await getDatabase()

    const shares = await db.all<SharedDocumentWithDetails[]>(
      `SELECT 
        sd.*,
        d.title as document_title,
        d.type as document_type,
        owner.email as owner_email,
        owner.name as owner_name,
        shared_user.email as shared_with_email,
        shared_user.name as shared_with_name
       FROM shared_documents sd
       JOIN documents d ON sd.document_id = d.id
       JOIN users owner ON sd.owner_id = owner.id
       JOIN users shared_user ON sd.shared_with_user_id = shared_user.id
       WHERE sd.owner_id = ?
       ORDER BY sd.created_at DESC`,
      [userId]
    )

    return shares
  }

  /**
   * Get all documents shared with user
   */
  async getSharedWithMe(userId: string): Promise<SharedDocumentWithDetails[]> {
    const db = await getDatabase()

    const shares = await db.all<SharedDocumentWithDetails[]>(
      `SELECT 
        sd.*,
        d.title as document_title,
        d.type as document_type,
        owner.email as owner_email,
        owner.name as owner_name,
        shared_user.email as shared_with_email,
        shared_user.name as shared_with_name
       FROM shared_documents sd
       JOIN documents d ON sd.document_id = d.id
       JOIN users owner ON sd.owner_id = owner.id
       JOIN users shared_user ON sd.shared_with_user_id = shared_user.id
       WHERE sd.shared_with_user_id = ?
       AND (sd.expires_at IS NULL OR sd.expires_at > datetime('now'))
       ORDER BY sd.created_at DESC`,
      [userId]
    )

    return shares
  }

  /**
   * Update share permissions
   */
  async updateShare(
    userId: string,
    shareId: string,
    updates: UpdateShareInput
  ): Promise<SharedDocument | null> {
    const db = await getDatabase()

    // Verify user owns the share
    const share = await db.get(
      'SELECT * FROM shared_documents WHERE id = ? AND owner_id = ?',
      [shareId, userId]
    )

    if (!share) {
      return null
    }

    const updateFields: string[] = []
    const params: any[] = []

    if (updates.permission !== undefined) {
      updateFields.push('permission = ?')
      params.push(updates.permission)
    }

    if (updates.expiresAt !== undefined) {
      updateFields.push('expires_at = ?')
      params.push(updates.expiresAt)
    }

    updateFields.push('updated_at = ?')
    params.push(new Date().toISOString())

    params.push(shareId, userId)

    await db.run(
      `UPDATE shared_documents SET ${updateFields.join(', ')} WHERE id = ? AND owner_id = ?`,
      params
    )

    const updatedShare = await db.get<SharedDocument>(
      'SELECT * FROM shared_documents WHERE id = ?',
      [shareId]
    )

    logger.info(`Share updated: ${shareId}`)
    return updatedShare || null
  }

  /**
   * Revoke share (delete)
   */
  async revokeShare(userId: string, shareId: string): Promise<boolean> {
    const db = await getDatabase()

    const result = await db.run(
      'DELETE FROM shared_documents WHERE id = ? AND owner_id = ?',
      [shareId, userId]
    )

    const deleted = (result.changes || 0) > 0

    if (deleted) {
      logger.info(`Share revoked: ${shareId}`)
    }

    return deleted
  }

  /**
   * Check if user has access to a document via share token
   */
  async checkAccess(
    userId: string,
    token: string
  ): Promise<ShareAccessInfo> {
    const db = await getDatabase()

    // Get share by token
    const share = await this.getShareByToken(token)

    if (!share) {
      return {
        hasAccess: false,
        permission: null,
        isOwner: false,
        documentId: ''
      }
    }

    // Check if the logged-in user is the one the document was shared with
    if (share.shared_with_user_id !== userId) {
      return {
        hasAccess: false,
        permission: null,
        isOwner: false,
        documentId: share.document_id
      }
    }

    return {
      hasAccess: true,
      permission: share.permission as SharePermission,
      isOwner: share.owner_id === userId,
      documentId: share.document_id,
      shareId: share.id
    }
  }

  /**
   * Check if user has access to a document by ID (either owner or shared)
   */
  async checkDocumentAccess(
    userId: string,
    documentId: string
  ): Promise<ShareAccessInfo> {
    const db = await getDatabase()

    // Check if user is the owner
    const document = await db.get(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    )

    if (document) {
      return {
        hasAccess: true,
        permission: 'edit',
        isOwner: true,
        documentId
      }
    }

    // Check if document is shared with user
    const share = await db.get<SharedDocument>(
      `SELECT * FROM shared_documents 
       WHERE document_id = ? 
       AND shared_with_user_id = ?
       AND (expires_at IS NULL OR expires_at > datetime('now'))`,
      [documentId, userId]
    )

    if (share) {
      return {
        hasAccess: true,
        permission: share.permission as SharePermission,
        isOwner: false,
        documentId,
        shareId: share.id
      }
    }

    // No access
    return {
      hasAccess: false,
      permission: null,
      isOwner: false,
      documentId
    }
  }

  /**
   * Log access to a shared document
   */
  async logAccess(
    shareId: string,
    userId: string,
    action: 'view' | 'edit',
    ipAddress?: string
  ): Promise<void> {
    const db = await getDatabase()

    const logId = uuidv4()

    await db.run(
      `INSERT INTO share_access_logs (id, share_id, user_id, action, ip_address, accessed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, shareId, userId, action, ipAddress || null, new Date().toISOString()]
    )

    logger.info(`Access logged: ${action} on share ${shareId} by user ${userId}`)
  }

  /**
   * Get access logs for a share (owner only)
   */
  async getAccessLogs(userId: string, shareId: string): Promise<any[]> {
    const db = await getDatabase()

    // Verify user owns the share
    const share = await db.get(
      'SELECT * FROM shared_documents WHERE id = ? AND owner_id = ?',
      [shareId, userId]
    )

    if (!share) {
      throw new Error('Share not found or access denied')
    }

    const logs = await db.all(
      `SELECT 
        sal.*,
        u.email as user_email,
        u.name as user_name
       FROM share_access_logs sal
       LEFT JOIN users u ON sal.user_id = u.id
       WHERE sal.share_id = ?
       ORDER BY sal.accessed_at DESC
       LIMIT 100`,
      [shareId]
    )

    return logs
  }

  /**
   * Clean up expired shares (run periodically)
   */
  async cleanupExpiredShares(): Promise<number> {
    const db = await getDatabase()

    const result = await db.run(
      'DELETE FROM shared_documents WHERE expires_at IS NOT NULL AND expires_at < datetime("now")'
    )

    const deletedCount = result.changes || 0

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired shares`)
    }

    return deletedCount
  }
}