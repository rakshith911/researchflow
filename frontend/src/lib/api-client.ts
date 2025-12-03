// frontend/src/lib/api-client.ts
import { useAuthStore } from '@/stores/auth-store'
import { isTokenExpired } from '@/lib/auth-utils'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  meta?: any
}

interface UploadedFile {
  id: string
  userId: string
  documentId?: string
  filename: string
  originalFilename: string
  mimeType: string
  size: number
  filePath: string
  url: string
  uploadedAt: string
}

// Collaboration Types
interface SharedDocument {
  id: string
  document_id: string
  owner_id: string
  shared_with_user_id: string
  share_token: string
  permission: 'view' | 'comment' | 'edit'
  expires_at: string | null
  created_at: string
  updated_at: string
  document_title?: string
  document_type?: string
  owner_email?: string
  owner_name?: string
  shared_with_email?: string
  shared_with_name?: string
  shareUrl?: string
}

interface Comment {
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

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const { token, isGuestMode } = useAuthStore.getState()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // ✅ Only add auth header if we have a token
    if (token) {
      // Check if token is expired before sending request
      if (isTokenExpired(token)) {
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.replace('/login')
        }
        return {
          success: false,
          error: 'Session expired. Please login again.',
        }
      }

      headers['Authorization'] = `Bearer ${token}`
    }

    // Merge with any headers from options
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: headers as HeadersInit,
      })

      const data = await response.json()

      // ✅ FIXED: Only redirect to login if NOT in guest mode
      if (response.status === 401) {
        // If user is in guest mode, just return the error without redirecting
        if (isGuestMode) {
          return {
            success: false,
            error: 'This feature requires authentication. Please sign up to continue.',
          }
        }

        // If authenticated user gets 401, their session expired
        if (token) {
          useAuthStore.getState().logout()
          // ✅ FIXED: Use window.location.replace for cleaner history
          if (typeof window !== 'undefined') {
            window.location.replace('/login')
          }
        }

        return {
          success: false,
          error: 'Session expired. Please login again.',
        }
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // ==================== DOCUMENT APIs ====================

  async searchDocuments(query: string, options?: { type?: string; limit?: number; offset?: number }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({ q: query })
    if (options?.type) params.append('type', options.type)
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())

    return this.get<any[]>(`/api/documents/search?${params.toString()}`)
  }

  async renameDocument(id: string, title: string): Promise<ApiResponse<any>> {
    return this.patch<any>(`/api/documents/${id}/rename`, { title })
  }

  async duplicateDocument(id: string): Promise<ApiResponse<any>> {
    return this.post<any>(`/api/documents/${id}/duplicate`)
  }

  async toggleFavorite(id: string): Promise<ApiResponse<any>> {
    return this.patch<any>(`/api/documents/${id}/favorite`)
  }

  async getFavorites(options?: { limit?: number; offset?: number }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())

    const query = params.toString()
    return this.get<any[]>(`/api/documents/favorites${query ? `?${query}` : ''}`)
  }

  async getRecentDocuments(limit: number = 10): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/api/documents/recent?limit=${limit}`)
  }

  async bulkDeleteDocuments(documentIds: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.post<{ deletedCount: number }>('/api/documents/bulk-delete', { documentIds })
  }

  async bulkUpdateTags(
    documentIds: string[],
    tags: string[],
    operation: 'add' | 'remove' | 'replace'
  ): Promise<ApiResponse<{ updatedCount: number }>> {
    return this.post<{ updatedCount: number }>('/api/documents/bulk-tags', {
      documentIds,
      tags,
      operation
    })
  }

  // ==================== SHARING APIs (EMAIL-BASED) ====================

  /**
   * Share a document with a user by email
   */
  async shareDocument(
    documentId: string,
    email: string,
    permission: 'view' | 'comment' | 'edit',
    expiresAt?: string
  ): Promise<ApiResponse<SharedDocument>> {
    return this.post<SharedDocument>(`/api/sharing/${documentId}`, {
      email,
      permission,
      expiresAt
    })
  }

  /**
   * Get all shares for a document (owner only)
   */
  async getDocumentShares(documentId: string): Promise<ApiResponse<SharedDocument[]>> {
    return this.get<SharedDocument[]>(`/api/sharing/${documentId}`)
  }

  /**
   * Get documents shared by me
   */
  async getSharedByMe(): Promise<ApiResponse<SharedDocument[]>> {
    return this.get<SharedDocument[]>('/api/sharing/shared-by-me')
  }

  /**
   * Get documents shared with me
   */
  async getSharedWithMe(): Promise<ApiResponse<SharedDocument[]>> {
    return this.get<SharedDocument[]>('/api/sharing/shared-with-me')
  }

  /**
   * Update share permission or expiration
   */
  async updateShare(
    shareId: string,
    updates: { permission?: 'view' | 'comment' | 'edit'; expiresAt?: string }
  ): Promise<ApiResponse<SharedDocument>> {
    return this.patch<SharedDocument>(`/api/sharing/${shareId}`, updates)
  }

  /**
   * Revoke a share
   */
  async revokeShare(shareId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/sharing/${shareId}`)
  }

  /**
   * Access a shared document via token (requires login)
   */
  async accessSharedDocument(token: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/api/sharing/shared/${token}`)
  }

  /**
   * Get access logs for a share
   */
  async getShareAccessLogs(shareId: string): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/api/sharing/${shareId}/logs`)
  }

  // ==================== COMMENTS APIs ====================

  /**
   * Add a comment to a document
   */
  async addComment(
    documentId: string,
    content: string,
    parentCommentId?: string
  ): Promise<ApiResponse<Comment>> {
    return this.post<Comment>(`/api/documents/${documentId}/comments`, {
      content,
      parentCommentId
    })
  }

  /**
   * Get all comments for a document
   */
  async getComments(
    documentId: string,
    includeResolved: boolean = true
  ): Promise<ApiResponse<Comment[]>> {
    return this.get<Comment[]>(
      `/api/documents/${documentId}/comments?includeResolved=${includeResolved}`
    )
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    updates: { content?: string; isResolved?: boolean }
  ): Promise<ApiResponse<Comment>> {
    return this.patch<Comment>(`/api/comments/${commentId}`, updates)
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/comments/${commentId}`)
  }

  /**
   * Toggle resolve status of a comment
   */
  async toggleResolveComment(commentId: string): Promise<ApiResponse<Comment>> {
    return this.patch<Comment>(`/api/comments/${commentId}/resolve`)
  }

  /**
   * Reply to a comment
   */
  async replyToComment(
    commentId: string,
    content: string
  ): Promise<ApiResponse<Comment>> {
    return this.post<Comment>(`/api/comments/${commentId}/reply`, { content })
  }

  /**
   * Get comment count for a document
   */
  async getCommentCount(documentId: string): Promise<ApiResponse<{ count: number }>> {
    return this.get<{ count: number }>(`/api/documents/${documentId}/comments/count`)
  }

  // ==================== UPLOAD APIs ====================

  async uploadFile(file: File, documentId?: string): Promise<ApiResponse<UploadedFile>> {
    const token = useAuthStore.getState().token

    const formData = new FormData()
    formData.append('file', file)
    if (documentId) {
      formData.append('documentId', documentId)
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.status === 401) {
        const { isGuestMode } = useAuthStore.getState()

        if (isGuestMode) {
          return {
            success: false,
            error: 'File uploads require authentication. Please sign up to continue.',
          }
        }

        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.replace('/login')
        }
        return {
          success: false,
          error: 'Session expired. Please login again.',
        }
      }

      return data
    } catch (error) {
      console.error('Upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async getUserFiles(documentId?: string): Promise<ApiResponse<UploadedFile[]>> {
    const query = documentId ? `?documentId=${documentId}` : ''
    return this.get<UploadedFile[]>(`/api/upload/files${query}`)
  }

  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/upload/files/${fileId}`)
  }

  async linkFileToDocument(fileId: string, documentId: string): Promise<ApiResponse<void>> {
    return this.post<void>('/api/upload/link', { fileId, documentId })
  }

  async getStorageStats(): Promise<ApiResponse<{ totalFiles: number; totalSize: number }>> {
    return this.get('/api/upload/stats')
  }

  getImageUrl(url: string): string {
    if (url.startsWith('http')) {
      return url
    }
    return `${this.baseUrl}${url}`
  }
}

export const apiClient = new ApiClient()
export type { SharedDocument, Comment }