'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { apiClient, type SharedDocument } from '@/lib/api-client'
import { SharePermission } from '@/types/collaboration'
import {
  Copy,
  Check,
  Trash2,
  Users,
  Eye,
  MessageSquare,
  Edit3,
  Loader2,
  ExternalLink
} from 'lucide-react'

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
  const [shares, setShares] = useState<SharedDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingShare, setIsCreatingShare] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<SharePermission>('view')
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadShares()
    }
  }, [open, documentId])

  const loadShares = async () => {
    setIsLoading(true)
    try {
      const result = await apiClient.getDocumentShares(documentId)
      if (result.success && result.data) {
        setShares(result.data)
      }
    } catch (error) {
      console.error('Failed to load shares:', error)
      toast({
        title: 'Error',
        description: 'Failed to load shares',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateShare = async () => {
    setIsCreatingShare(true)
    try {
      const result = await apiClient.shareDocument(documentId, selectedPermission)
      if (result.success && result.data) {
        setShares([result.data, ...shares])
        toast({
          title: 'Share link created',
          description: 'Your document has been shared successfully.',
        })
      } else {
        throw new Error(result.error || 'Failed to create share')
      }
    } catch (error) {
      console.error('Failed to create share:', error)
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingShare(false)
    }
  }

  const handleCopyLink = async (shareUrl: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShareId(shareId)
      setTimeout(() => setCopiedShareId(null), 2000)
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  const handleRevokeShare = async (shareId: string) => {
    try {
      const result = await apiClient.revokeShare(shareId)
      if (result.success) {
        setShares(shares.filter(s => s.id !== shareId))
        toast({
          title: 'Share revoked',
          description: 'Access has been revoked',
        })
      } else {
        throw new Error(result.error || 'Failed to revoke share')
      }
    } catch (error) {
      console.error('Failed to revoke share:', error)
      toast({
        title: 'Error',
        description: 'Failed to revoke share',
        variant: 'destructive',
      })
    }
  }

  const handleUpdatePermission = async (shareId: string, permission: SharePermission) => {
    try {
      const result = await apiClient.updateShare(shareId, { permission })
      if (result.success && result.data) {
        setShares(shares.map(s => s.id === shareId ? result.data! : s))
        toast({
          title: 'Permission updated',
          description: 'Share permission has been updated',
        })
      } else {
        throw new Error(result.error || 'Failed to update permission')
      }
    } catch (error) {
      console.error('Failed to update permission:', error)
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive',
      })
    }
  }

  const getPermissionIcon = (permission: SharePermission) => {
    switch (permission) {
      case 'view':
        return <Eye className="w-4 h-4" />
      case 'comment':
        return <MessageSquare className="w-4 h-4" />
      case 'edit':
        return <Edit3 className="w-4 h-4" />
    }
  }

  const getPermissionColor = (permission: SharePermission) => {
    switch (permission) {
      case 'view':
        return 'bg-blue-100 text-blue-800'
      case 'comment':
        return 'bg-yellow-100 text-yellow-800'
      case 'edit':
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share "{documentTitle}"
          </DialogTitle>
          <DialogDescription>
            Create share links with different permission levels
          </DialogDescription>
        </DialogHeader>

        {/* Create New Share */}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Create new share link</Label>
            <div className="flex gap-2">
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value as SharePermission)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="view">View Only</option>
                <option value="comment">Can Comment</option>
                <option value="edit">Can Edit</option>
              </select>
              <Button
                onClick={handleCreateShare}
                disabled={isCreatingShare}
              >
                {isCreatingShare ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Link'
                )}
              </Button>
            </div>
          </div>

          {/* Permission Descriptions */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 border rounded bg-blue-50">
              <div className="flex items-center gap-1 font-medium mb-1">
                <Eye className="w-3 h-3" />
                View Only
              </div>
              <div className="text-muted-foreground">Can read document</div>
            </div>
            <div className="p-2 border rounded bg-yellow-50">
              <div className="flex items-center gap-1 font-medium mb-1">
                <MessageSquare className="w-3 h-3" />
                Can Comment
              </div>
              <div className="text-muted-foreground">Can read & comment</div>
            </div>
            <div className="p-2 border rounded bg-green-50">
              <div className="flex items-center gap-1 font-medium mb-1">
                <Edit3 className="w-3 h-3" />
                Can Edit
              </div>
              <div className="text-muted-foreground">Can read, comment & edit</div>
            </div>
          </div>
        </div>

        {/* Existing Shares */}
        <div className="space-y-2">
          <Label>Active share links ({shares.length})</Label>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No share links yet. Create one above to get started.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={getPermissionColor(share.permission)}>
                      {getPermissionIcon(share.permission)}
                      <span className="ml-1 capitalize">{share.permission}</span>
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(share.shareUrl || '', share.id)}
                      >
                        {copiedShareId === share.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeShare(share.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      value={share.shareUrl || ''}
                      readOnly
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Created {new Date(share.created_at).toLocaleDateString()}
                    </span>
                    
                    <select
                      value={share.permission}
                      onChange={(e) => handleUpdatePermission(share.id, e.target.value as SharePermission)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="view">View</option>
                      <option value="comment">Comment</option>
                      <option value="edit">Edit</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}