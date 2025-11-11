// backend/src/types/sharing.types.ts

export type SharePermission = 'view' | 'comment' | 'edit'

// ==================== SHARING TYPES ====================

export interface SharedDocument {
  id: string
  document_id: string
  owner_id: string
  shared_with_user_id: string  // User who has access
  share_token: string
  permission: SharePermission
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface SharedDocumentWithDetails extends SharedDocument {
  document_title?: string
  document_type?: string
  owner_email?: string
  owner_name?: string
  shared_with_email?: string  // Email of user it's shared with
  shared_with_name?: string   // Name of user it's shared with
  shareUrl?: string
}

export interface CreateShareInput {
  documentId: string
  sharedWithEmail: string  // Email of user to share with (required)
  permission: SharePermission
  expiresAt?: string
}

export interface UpdateShareInput {
  permission?: SharePermission
  expiresAt?: string
}

export interface ShareAccessInfo {
  hasAccess: boolean
  permission: SharePermission | null
  isOwner: boolean
  documentId: string
  shareId?: string
}

export interface ShareAccessLog {
  id: string
  share_id: string
  user_id: string | null
  action: 'view' | 'edit'
  ip_address: string | null
  accessed_at: string
  user_email?: string
  user_name?: string
}

// ==================== COMMENT TYPES ====================

export interface DocumentComment {
  id: string
  document_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  is_resolved: boolean
  created_at: string
  updated_at: string
}

export interface CommentWithUser extends DocumentComment {
  user_email: string
  user_name: string | null
  replies?: CommentWithUser[]
}

export interface CreateCommentInput {
  documentId: string
  content: string
  parentCommentId?: string
}

export interface UpdateCommentInput {
  content?: string
  isResolved?: boolean
}