'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { apiClient, type Comment } from '@/lib/api-client'
import { CommentCard } from './comment-card'
import {
  MessageSquare,
  Send,
  Loader2,
  Filter,
  X,
  CheckCircle2
} from 'lucide-react'

interface CommentsPanelProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

export function CommentsPanel({ documentId, isOpen, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const [unresolvedCount, setUnresolvedCount] = useState(0)

  useEffect(() => {
    if (isOpen && documentId) {
      loadComments()
      loadCommentCount()
    }
  }, [isOpen, documentId, showResolved])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const result = await apiClient.getComments(documentId, showResolved)
      if (result.success && result.data) {
        setComments(result.data)
        if (result.meta?.unresolvedCount !== undefined) {
          setUnresolvedCount(result.meta.unresolvedCount)
        }
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCommentCount = async () => {
    try {
      const result = await apiClient.getCommentCount(documentId)
      if (result.success && result.data) {
        setUnresolvedCount(result.data.count)
      }
    } catch (error) {
      console.error('Failed to load comment count:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const result = await apiClient.addComment(documentId, newComment.trim())
      if (result.success && result.data) {
        setComments([result.data, ...comments])
        setNewComment('')
        setUnresolvedCount(prev => prev + 1)
        toast({
          title: 'Comment added',
          description: 'Your comment has been posted',
        })
      } else {
        throw new Error(result.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    try {
      const result = await apiClient.replyToComment(parentId, content)
      if (result.success) {
        await loadComments()
        toast({
          title: 'Reply added',
          description: 'Your reply has been posted',
        })
      } else {
        throw new Error(result.error || 'Failed to add reply')
      }
    } catch (error) {
      console.error('Failed to add reply:', error)
      toast({
        title: 'Error',
        description: 'Failed to add reply',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = async (commentId: string, content: string) => {
    try {
      const result = await apiClient.updateComment(commentId, { content })
      if (result.success) {
        await loadComments()
        toast({
          title: 'Comment updated',
          description: 'Your comment has been updated',
        })
      } else {
        throw new Error(result.error || 'Failed to update comment')
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const result = await apiClient.deleteComment(commentId)
      if (result.success) {
        await loadComments()
        toast({
          title: 'Comment deleted',
          description: 'Comment has been removed',
        })
      } else {
        throw new Error(result.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      })
    }
  }

  const handleResolve = async (commentId: string) => {
    try {
      const result = await apiClient.toggleResolveComment(commentId)
      if (result.success) {
        await loadComments()
        await loadCommentCount()
        toast({
          title: result.data?.is_resolved ? 'Comment resolved' : 'Comment reopened',
          description: result.data?.is_resolved 
            ? 'Comment marked as resolved'
            : 'Comment marked as unresolved',
        })
      } else {
        throw new Error(result.error || 'Failed to toggle resolve')
      }
    } catch (error) {
      console.error('Failed to toggle resolve:', error)
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddComment()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h2 className="font-semibold">Comments</h2>
          {unresolvedCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unresolvedCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
            title={showResolved ? 'Hide resolved' : 'Show resolved'}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* New Comment Input */}
      <div className="p-4 border-b space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Add a comment... (⌘+Enter to post)"
          className="w-full min-h-[80px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {newComment.length}/10000
          </span>
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Be the first to comment!</p>
          </div>
        ) : (
          <>
            {!showResolved && unresolvedCount === 0 && comments.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground bg-green-50 rounded-md border border-green-200">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-green-800">All comments resolved!</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowResolved(true)}
                  className="mt-2"
                >
                  Show resolved comments
                </Button>
              </div>
            )}
            
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResolve={handleResolve}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer Info */}
      {comments.length > 0 && (
        <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground">
          {showResolved 
            ? `Showing all ${comments.length} comment(s)`
            : `${unresolvedCount} unresolved • ${comments.length} total`
          }
        </div>
      )}
    </div>
  )
}