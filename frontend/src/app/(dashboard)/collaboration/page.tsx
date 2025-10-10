'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { apiClient, type SharedDocument } from '@/lib/api-client'
import {
  Users,
  Eye,
  MessageSquare,
  Edit3,
  ExternalLink,
  Copy,
  Trash2,
  Loader2,
  FileText,
  Clock,
  User,
  Share2,
  Inbox,
  Send
} from 'lucide-react'

export default function CollaborationsPage() {
  const router = useRouter()
  const [sharedByMe, setSharedByMe] = useState<SharedDocument[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<SharedDocument[]>([])
  const [isLoadingByMe, setIsLoadingByMe] = useState(true)
  const [isLoadingWithMe, setIsLoadingWithMe] = useState(true)
  const [activeTab, setActiveTab] = useState('shared-by-me')

  useEffect(() => {
    loadSharedByMe()
    loadSharedWithMe()
  }, [])

  const loadSharedByMe = async () => {
    setIsLoadingByMe(true)
    try {
      const result = await apiClient.getSharedByMe()
      if (result.success && result.data) {
        setSharedByMe(result.data)
      }
    } catch (error) {
      console.error('Failed to load shared by me:', error)
      toast({
        title: 'Error',
        description: 'Failed to load shared documents',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingByMe(false)
    }
  }

  const loadSharedWithMe = async () => {
    setIsLoadingWithMe(true)
    try {
      const result = await apiClient.getSharedWithMe()
      if (result.success && result.data) {
        setSharedWithMe(result.data)
      }
    } catch (error) {
      console.error('Failed to load shared with me:', error)
      toast({
        title: 'Error',
        description: 'Failed to load shared documents',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingWithMe(false)
    }
  }

  const handleCopyLink = async (shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl)
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
    if (!confirm('Revoke access to this document?')) return

    try {
      const result = await apiClient.revokeShare(shareId)
      if (result.success) {
        setSharedByMe(sharedByMe.filter(s => s.id !== shareId))
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

  const handleOpenDocument = (documentId: string, token?: string) => {
    if (token) {
      router.push(`/editor?id=${documentId}&token=${token}`)
    } else {
      router.push(`/editor?id=${documentId}`)
    }
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view':
        return <Eye className="w-4 h-4" />
      case 'comment':
        return <MessageSquare className="w-4 h-4" />
      case 'edit':
        return <Edit3 className="w-4 h-4" />
    }
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'view':
        return 'bg-blue-100 text-blue-800'
      case 'comment':
        return 'bg-yellow-100 text-yellow-800'
      case 'edit':
        return 'bg-green-100 text-green-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderSharedByMeCard = (share: SharedDocument) => (
    <Card key={share.id} className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h3 
                className="font-medium truncate cursor-pointer hover:text-primary"
                onClick={() => handleOpenDocument(share.document_id)}
              >
                {share.document_title || 'Untitled Document'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Shared {formatDate(share.created_at)}</span>
            </div>
          </div>

          <Badge className={getPermissionColor(share.permission)}>
            {getPermissionIcon(share.permission)}
            <span className="ml-1 capitalize">{share.permission}</span>
          </Badge>
        </div>

        {/* Document Type */}
        {share.document_type && (
          <Badge variant="outline" className="text-xs">
            {share.document_type}
          </Badge>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDocument(share.document_id)}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyLink(share.shareUrl || '')}
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRevokeShare(share.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )

  const renderSharedWithMeCard = (share: SharedDocument) => (
    <Card key={share.id} className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h3 
                className="font-medium truncate cursor-pointer hover:text-primary"
                onClick={() => handleOpenDocument(share.document_id, share.share_token)}
              >
                {share.document_title || 'Untitled Document'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>Shared by {share.owner_name || share.owner_email}</span>
            </div>
          </div>

          <Badge className={getPermissionColor(share.permission)}>
            {getPermissionIcon(share.permission)}
            <span className="ml-1 capitalize">{share.permission}</span>
          </Badge>
        </div>

        {/* Document Type */}
        {share.document_type && (
          <Badge variant="outline" className="text-xs">
            {share.document_type}
          </Badge>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDocument(share.document_id, share.share_token)}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open
          </Button>
        </div>
      </div>
    </Card>
  )

  const renderEmptyState = (type: 'by-me' | 'with-me') => (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        {type === 'by-me' ? (
          <Send className="w-8 h-8 text-muted-foreground" />
        ) : (
          <Inbox className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-medium mb-2">
        {type === 'by-me' ? 'No shared documents' : 'No documents shared with you'}
      </h3>
      <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
        {type === 'by-me' 
          ? 'Share documents with others by clicking the Share button in any document.'
          : 'When someone shares a document with you, it will appear here.'
        }
      </p>
    </div>
  )

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Collaborations</h1>
        </div>
        <p className="text-muted-foreground">
          Manage documents you've shared and documents shared with you
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="shared-by-me" className="gap-2">
            <Send className="w-4 h-4" />
            Shared by Me
            {sharedByMe.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {sharedByMe.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shared-with-me" className="gap-2">
            <Inbox className="w-4 h-4" />
            Shared with Me
            {sharedWithMe.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {sharedWithMe.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Shared by Me Tab */}
        <TabsContent value="shared-by-me" className="space-y-4">
          {isLoadingByMe ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : sharedByMe.length === 0 ? (
            renderEmptyState('by-me')
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sharedByMe.map(renderSharedByMeCard)}
            </div>
          )}
        </TabsContent>

        {/* Shared with Me Tab */}
        <TabsContent value="shared-with-me" className="space-y-4">
          {isLoadingWithMe ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : sharedWithMe.length === 0 ? (
            renderEmptyState('with-me')
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sharedWithMe.map(renderSharedWithMeCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}