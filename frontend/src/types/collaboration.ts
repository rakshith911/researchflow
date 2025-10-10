// frontend/src/types/collaboration.ts

export type SharePermission = 'view' | 'comment' | 'edit'

export interface SharedDocument {
  id: string
  document_id: string
  owner_id: string
  share_token: string
  permission: SharePermission
  expires_at: string | null
  created_at: string
  updated_at: string
  document_title?: string
  document_type?: string
  owner_email?: string
  owner_name?: string | null
  shareUrl?: string
}

export interface Comment {
  id: string
  document_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  is_resolved: boolean
  created_at: string
  updated_at: string
  user_email: string
  user_name: string | null
  replies?: Comment[]
}

export interface ShareAccessLog {
  id: string
  share_id: string
  user_id: string | null
  action: 'view' | 'edit'
  accessed_at: string
  ip_address: string | null
  user_email?: string
  user_name?: string | null
}

export interface DocumentWithShareInfo {
  id: string
  title: string
  content: string
  type: string
  shareInfo?: {
    permission: SharePermission
    isOwner: boolean
    expiresAt?: string | null
  }
}