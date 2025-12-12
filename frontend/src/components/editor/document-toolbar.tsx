'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDocumentStore } from "@/stores/document-store"
import { ExportDialog } from "./export-dialog"
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Table,
  Keyboard,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Share2,
  MessageSquare,
  Download
} from 'lucide-react'
import { ImageUploadDialog } from './image-upload-dialog'
import { LinkInsertDialog } from './link-insert-dialog'
import { TableInsertDialog } from './table-insert-dialog'
import { CodeBlockSelector } from './code-block-selector'
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'
import { ShareDocumentDialog } from '@/components/collaboration/share-document-dialog'
import { CommentsPanel } from '@/components/collaboration/comments-panel'

interface DocumentToolbarProps {
  onInsertMarkdown?: (markdown: string) => void
  onFormat?: (before: string, after?: string) => void
  documentId?: string
  documentTitle?: string
  commentCount?: number
}

export function DocumentToolbar({
  onInsertMarkdown,
  onFormat,
  documentId,
  documentTitle = 'Untitled Document',
  commentCount = 0
}: DocumentToolbarProps) {
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showCommentsPanel, setShowCommentsPanel] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const { currentDocument } = useDocumentStore()

  const handleInsert = (markdown: string) => {
    if (onInsertMarkdown) {
      onInsertMarkdown(markdown)
    }
  }

  const handleImageInsert = (imageUrl: string, altText: string) => {
    handleInsert(`![${altText}](${imageUrl})`)
  }

  const handleLinkInsert = (url: string, text: string) => {
    handleInsert(`[${text}](${url})`)
  }

  const handleTableInsert = (tableMarkdown: string) => {
    handleInsert(tableMarkdown)
  }

  const handleCodeInsert = (language: string, code?: string) => {
    const codeBlock = `\`\`\`${language}\n${code || '// Your code here'}\n\`\`\``
    handleInsert(codeBlock)
  }

  return (
    <>
      <div className="flex items-center flex-wrap gap-1 p-2 border-b bg-background sticky top-0 z-10 w-full overflow-x-auto">
        {/* Headings */}
        <div className="flex items-center space-x-1 border-r border-border pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleInsert('# ')}
            title="Heading 1 (⌘⌥1)"
          >
            <Heading1 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleInsert('## ')}
            title="Heading 2 (⌘⌥2)"
          >
            <Heading2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleInsert('### ')}
            title="Heading 3 (⌘⌥3)"
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center space-x-1 border-r border-border pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormat ? onFormat('**') : handleInsert('**text**')}
            title="Bold (⌘B)"
          >
            <Bold className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormat ? onFormat('*') : handleInsert('*text*')}
            title="Italic (⌘I)"
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormat ? onFormat('~~') : handleInsert('~~text~~')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormat ? onFormat('`') : handleInsert('`code`')}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists and Blocks */}
        <div className="flex items-center space-x-1 border-r border-border pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleInsert('- ')}
            title="Bullet List (⌘⇧8)"
          >
            <List className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleInsert('1. ')}
            title="Numbered List (⌘⇧7)"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleInsert('> ')}
            title="Quote (⌘⇧9)"
          >
            <Quote className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleInsert('---\n')}
            title="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        {/* Links and Media */}
        <div className="flex items-center space-x-1 border-r border-border pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkDialog(true)}
            title="Insert Link (⌘K)"
          >
            <Link className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImageDialog(true)}
            title="Upload Image (⌘⇧I)"
          >
            <Image className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTableDialog(true)}
            title="Insert Table (⌘⇧T)"
          >
            <Table className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCodeDialog(true)}
            title="Code Block (⌘⇧K)"
          >
            <Code2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Collaboration */}
        {documentId && (
          <div className="flex items-center space-x-1 border-r border-border pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              title="Share Document"
              className="gap-1"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Share</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentsPanel(true)}
              title="Comments"
              className="gap-1 relative"
            >
              <MessageSquare className="w-4 h-4" />
              {commentCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {commentCount > 99 ? '99+' : commentCount}
                </Badge>
              )}
              <span className="text-xs hidden sm:inline">Comments</span>
            </Button>
          </div>
        )}

        {/* Export Support */}
        <div className="flex items-center space-x-1 border-r border-border pr-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            title="Export Document"
            className="text-primary hover:bg-primary/10 gap-1"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">Export</span>
          </Button>
        </div>

        {/* Utilities */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcutsDialog(true)}
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <ImageUploadDialog
        open={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={handleImageInsert}
        documentId={documentId}
      />

      <LinkInsertDialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        onInsert={handleLinkInsert}
      />

      <TableInsertDialog
        open={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={handleTableInsert}
      />

      <CodeBlockSelector
        open={showCodeDialog}
        onClose={() => setShowCodeDialog(false)}
        onInsert={handleCodeInsert}
      />

      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
      />

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        documentId={documentId || ''}
        title={currentDocument?.title || documentTitle}
        content={currentDocument?.content || ''}
      />

      {/* Collaboration Dialogs */}
      {documentId && (
        <>
          <ShareDocumentDialog
            open={showShareDialog}
            onClose={() => setShowShareDialog(false)}
            documentId={documentId}
            documentTitle={documentTitle}
          />

          <CommentsPanel
            documentId={documentId}
            isOpen={showCommentsPanel}
            onClose={() => setShowCommentsPanel(false)}
          />
        </>
      )}
    </>
  )
}