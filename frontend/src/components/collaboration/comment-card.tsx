'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type Comment } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import {
  Reply,
  Edit2,
  Trash2,
  Check,
  X,
  CheckCircle,
  Circle,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentCardProps {
  comment: Comment
  onReply: (parentId: string, content: string) => Promise<void>
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  onResolve: (commentId: string) => Promise<void>
  depth?: number
}

export function CommentCard({
  comment,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  depth = 0
}: CommentCardProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [editContent, setEditContent] = useState(comment.content)
  const [showActions, setShowActions] = useState(false)
  
  const currentUser = useAuthStore((state) => state.user)
  const isAuthor = currentUser?.email === comment.user_email

  const handleReply = async () => {
    if (!replyContent.trim()) return
    await onReply(comment.id, replyContent.trim())
    setReplyContent('')
    setIsReplying(false)
  }

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false)
      return
    }
    await onEdit(comment.id, editContent.trim())
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm('Delete this comment?')) {
      await onDelete(comment.id)
    }
  }

  const handleResolve = async () => {
    await onResolve(comment.id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const maxDepth = 3
  const canReply = depth < maxDepth

  return (
    <div
      className={cn(
        "space-y-2",
        depth > 0 && "ml-6 pl-3 border-l-2",
        comment.is_resolved && "opacity-60"
      )}
    >
      <div
        className={cn(
          "p-3 rounded-lg border transition-colors",
          comment.is_resolved ? "bg-green-50 border-green-200" : "bg-white hover:bg-accent/50"
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {getInitials(comment.user_name, comment.user_email)}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {comment.user_name || comment.user_email}
                </span>
                {comment.is_resolved && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.created_at)}
                {comment.updated_at !== comment.created_at && ' (edited)'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            showActions ? "opacity-100" : "opacity-0"
          )}>
            {!comment.is_resolved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResolve}
                title="Mark as resolved"
                className="h-7 w-7 p-0"
              >
                <Circle className="w-4 h-4" />
              </Button>
            )}
            
            {comment.is_resolved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResolve}
                title="Mark as unresolved"
                className="h-7 w-7 p-0"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
              </Button>
            )}

            {isAuthor && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  title="Edit"
                  className="h-7 w-7 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  title="Delete"
                  className="h-7 w-7 p-0 text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[60px] p-2 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit}>
                <Check className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(comment.content)
                }}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>

            {/* Reply Button */}
            {canReply && !comment.is_resolved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="mt-2 h-7 text-xs"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
          </>
        )}

        {/* Reply Input */}
        {isReplying && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full min-h-[60px] p-2 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleReply}>
                <Check className="w-3 h-3 mr-1" />
                Reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsReplying(false)
                  setReplyContent('')
                }}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onResolve={onResolve}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}