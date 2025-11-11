// frontend/src/app/shared/[token]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Lock, 
  Eye, 
  MessageSquare, 
  Edit3, 
  AlertCircle, 
  FileText,
  User,
  Clock
} from 'lucide-react'

interface ShareInfo {
  permission: 'view' | 'comment' | 'edit'
  isOwner: boolean
  expiresAt: string | null
}

interface DocumentData {
  id: string
  title: string
  content: string
  type: string
  created_at: string
  updated_at: string
  user_id: string
}

export default function SharedDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null)
  
  const token = params.token as string

  useEffect(() => {
    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated) {
      const returnUrl = `/shared/${token}`
      const message = 'Please login to access this shared document'
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}&message=${encodeURIComponent(message)}`)
      return
    }

    // If authenticated, try to access the document
    loadSharedDocument()
  }, [isAuthenticated, token])

  const loadSharedDocument = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.accessSharedDocument(token)

      if (result.success && result.data) {
        setDocument(result.data.document)
        setShareInfo(result.data.shareInfo)
      } else {
        setError(result.error || 'Failed to load shared document')
      }
    } catch (error: any) {
      console.error('Failed to load shared document:', error)
      setError(error?.message || 'Failed to load shared document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenInEditor = () => {
    if (document) {
      // Navigate to editor with the document
      router.push(`/editor?documentId=${document.id}&shared=true`)
    }
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view': return <Eye className="w-4 h-4" />
      case 'comment': return <MessageSquare className="w-4 h-4" />
      case 'edit': return <Edit3 className="w-4 h-4" />
      default: return <Eye className="w-4 h-4" />
    }
  }

  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'view': return 'View Only'
      case 'comment': return 'Can Comment'
      case 'edit': return 'Can Edit'
      default: return 'View Only'
    }
  }

  const getPermissionDescription = (permission: string) => {
    switch (permission) {
      case 'view': return 'You can read this document'
      case 'comment': return 'You can read and add comments'
      case 'edit': return 'You can read, comment, and edit'
      default: return 'You can read this document'
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading shared document...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              Unable to access this shared document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>This could be because:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The link has expired</li>
                <li>The document was shared with a different account</li>
                <li>Access has been revoked</li>
                <li>The document no longer exists</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push('/documents')}
              >
                My Documents
              </Button>
              <Button 
                className="flex-1"
                onClick={() => router.push('/login')}
              >
                Try Another Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - Show document preview
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Access Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle>{document?.title || 'Untitled Document'}</CardTitle>
                </div>
                <CardDescription>
                  Shared document • {document?.type && (
                    <span className="capitalize">{document.type}</span>
                  )}
                </CardDescription>
              </div>
              
              {shareInfo && (
                <Badge 
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {getPermissionIcon(shareInfo.permission)}
                  {getPermissionText(shareInfo.permission)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Permission Info */}
            {shareInfo && (
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  {getPermissionDescription(shareInfo.permission)}
                  {shareInfo.expiresAt && (
                    <span className="block mt-1 text-xs">
                      Access expires: {new Date(shareInfo.expiresAt).toLocaleString()}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Document Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  Last updated: {document && new Date(document.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleOpenInEditor}
              className="w-full"
              size="lg"
            >
              {shareInfo?.permission === 'edit' ? 'Open & Edit' : 'Open Document'}
            </Button>
          </CardContent>
        </Card>

        {/* Document Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Preview</CardTitle>
            <CardDescription>
              Click "Open Document" above to view the full document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-6 min-h-[200px] max-h-[400px] overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                {document?.content ? (
                  <div className="whitespace-pre-wrap break-words">
                    {document.content.slice(0, 500)}
                    {document.content.length > 500 && '...'}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No content yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            You're viewing this as <strong>{user?.email}</strong>
            {' • '}
            <button
              onClick={() => router.push('/documents')}
              className="text-primary hover:underline"
            >
              Go to my documents
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}