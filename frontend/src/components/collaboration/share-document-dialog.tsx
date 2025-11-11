// frontend/src/components/collaboration/share-document-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { apiClient, type SharedDocument } from '@/lib/api-client'
import {
  Copy,
  Check,
  Trash2,
  Users,
  Eye,
  MessageSquare,
  Edit3,
  Loader2,
  Mail,
  AlertCircle,
  UserPlus,
  CheckCircle
} from 'lucide-react'

type SharePermission = 'view' | 'comment' | 'edit'

interface ShareDocumentDialogProps {
  open: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
}

export function ShareDocumentDialog({
  open,
  onClose,
  documentId,
  documentTitle,
}: ShareDocumentDialogProps) {
  const [shares, setShares] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  
  // Form state
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<SharePermission>('view')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadShares()
    }
  }, [open, documentId])

  const loadShares = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiClient.getDocumentShares(documentId)
      if (result.success && result.data) {
        setShares(result.data)
      } else {
        setError(result.error || 'Failed to load shares')
      }
    } catch (error) {
      console.error('Failed to load shares:', error)
      setError('Failed to load shares')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSharing(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await apiClient.shareDocument(documentId, email.trim(), permission)
      
      if (result.success && result.data) {
        setShares([result.data, ...shares])
        setEmail('')
        setPermission('view')
        setSuccess(`Document shared successfully with ${email}`)
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to share document')
      }
    } catch (error: any) {
      console.error('Failed to share document:', error)
      setError(error?.message || 'Failed to share document')
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async (shareUrl: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShareId(shareId)
      setTimeout(() => setCopiedShareId(null), 2000)
    } catch (error) {
      setError('Failed to copy link')
    }
  }

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke this share? The user will lose access immediately.')) {
      return
    }

    try {
      const result = await apiClient.revokeShare(shareId)
      if (result.success) {
        setShares(shares.filter(s => s.id !== shareId))
        setSuccess('Share revoked successfully')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to revoke share')
      }
    } catch (error) {
      console.error('Failed to revoke share:', error)
      setError('Failed to revoke share')
    }
  }

  const handleUpdatePermission = async (shareId: string, newPermission: SharePermission) => {
    try {
      const result = await apiClient.updateShare(shareId, { permission: newPermission })
      if (result.success && result.data) {
        setShares(shares.map(s => s.id === shareId ? { ...s, permission: newPermission } : s))
        setSuccess('Permission updated successfully')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to update permission')
      }
    } catch (error) {
      console.error('Failed to update permission:', error)
      setError('Failed to update permission')
    }
  }

  const getPermissionIcon = (perm: SharePermission) => {
    switch (perm) {
      case 'view': return <Eye className="w-3 h-3" />
      case 'comment': return <MessageSquare className="w-3 h-3" />
      case 'edit': return <Edit3 className="w-3 h-3" />
    }
  }

  const getPermissionColor = (perm: SharePermission) => {
    switch (perm) {
      case 'view': return 'bg-blue-100 text-blue-800'
      case 'comment': return 'bg-yellow-100 text-yellow-800'
      case 'edit': return 'bg-green-100 text-green-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share "{documentTitle}"
          </DialogTitle>
          <DialogDescription>
            Invite users by email to collaborate on this document
          </DialogDescription>
        </DialogHeader>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Share Form */}
        <form onSubmit={handleShareDocument} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              User Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              disabled={isSharing}
              required
            />
            <p className="text-xs text-muted-foreground">
              User must have an account to receive access
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission Level</Label>
            <select
              id="permission"
              value={permission}
              onChange={(e) => setPermission(e.target.value as SharePermission)}
              disabled={isSharing}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="view">View Only - Can read document</option>
              <option value="comment">Can Comment - Can read and add comments</option>
              <option value="edit">Can Edit - Full editing access</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSharing || !email.trim()}
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Share Document
              </>
            )}
          </Button>
        </form>

        {/* Permission Info Cards */}
        <div className="grid grid-cols-3 gap-2 text-xs py-2">
          <div className="p-2 border rounded bg-blue-50">
            <div className="flex items-center gap-1 font-medium mb-1">
              <Eye className="w-3 h-3" />
              View Only
            </div>
            <div className="text-muted-foreground">Read access only</div>
          </div>
          <div className="p-2 border rounded bg-yellow-50">
            <div className="flex items-center gap-1 font-medium mb-1">
              <MessageSquare className="w-3 h-3" />
              Comment
            </div>
            <div className="text-muted-foreground">Read & comment</div>
          </div>
          <div className="p-2 border rounded bg-green-50">
            <div className="flex items-center gap-1 font-medium mb-1">
              <Edit3 className="w-3 h-3" />
              Edit
            </div>
            <div className="text-muted-foreground">Full access</div>
          </div>
        </div>

        {/* Existing Shares List */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Shared with ({shares.length})</Label>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-muted/30 rounded-lg">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No collaborators yet</p>
              <p className="text-xs mt-1">Share with someone to get started</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {share.shared_with_email?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {share.shared_with_name || share.shared_with_email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {share.shared_with_email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Shared {new Date(share.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getPermissionColor(share.permission)}>
                        {getPermissionIcon(share.permission)}
                        <span className="ml-1 capitalize">{share.permission}</span>
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pl-11">
                    <select
                      value={share.permission}
                      onChange={(e) => handleUpdatePermission(share.id, e.target.value as SharePermission)}
                      className="text-xs border rounded px-2 py-1 bg-background"
                    >
                      <option value="view">View</option>
                      <option value="comment">Comment</option>
                      <option value="edit">Edit</option>
                    </select>

                    <div className="flex items-center gap-1">
                      {share.shareUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(share.shareUrl, share.id)}
                          title="Copy share link"
                        >
                          {copiedShareId === share.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeShare(share.id)}
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}