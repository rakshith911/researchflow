'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResizableEditorLayoutProps {
  editor: React.ReactNode
  preview?: React.ReactNode
  assistant?: React.ReactNode
  showPreview: boolean
  showAssistant: boolean
}

export function ResizableEditorLayout({
  editor,
  preview,
  assistant,
  showPreview,
  showAssistant
}: ResizableEditorLayoutProps) {
  const [editorWidth, setEditorWidth] = useState(40)
  const [previewWidth, setPreviewWidth] = useState(30)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'editor-preview' | 'preview-assistant' | 'editor-assistant' | null>(null)

  const handleMouseDown = useCallback((type: 'editor-preview' | 'preview-assistant' | 'editor-assistant') => {
    return (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setDragType(type)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragType || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100

    const MIN_WIDTH = 20
    const MAX_WIDTH = 70

    if (dragType === 'editor-preview') {
      const newEditorWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, percentage))
      setEditorWidth(newEditorWidth)
      
      if (showAssistant) {
        const remaining = 100 - newEditorWidth
        const assistantWidth = Math.max(MIN_WIDTH, remaining * 0.4)
        setPreviewWidth(remaining - assistantWidth)
      } else {
        setPreviewWidth(100 - newEditorWidth)
      }
    } else if (dragType === 'preview-assistant') {
      const newPreviewWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH - editorWidth, percentage - editorWidth))
      setPreviewWidth(newPreviewWidth)
    } else if (dragType === 'editor-assistant') {
      const newEditorWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, percentage))
      setEditorWidth(newEditorWidth)
    }
  }, [isDragging, dragType, editorWidth, showAssistant])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const getWidths = () => {
    if (!showPreview && !showAssistant) {
      return { editor: 100, preview: 0, assistant: 0 }
    }
    if (showPreview && !showAssistant) {
      return { editor: editorWidth, preview: 100 - editorWidth, assistant: 0 }
    }
    if (!showPreview && showAssistant) {
      return { editor: editorWidth, preview: 0, assistant: 100 - editorWidth }
    }
    const assistantWidth = 100 - editorWidth - previewWidth
    return { editor: editorWidth, preview: previewWidth, assistant: assistantWidth }
  }

  const widths = getWidths()

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      <div
        style={{ width: `${widths.editor}%` }}
        className="flex-shrink-0 h-full overflow-hidden"
      >
        {editor}
      </div>

      {(showPreview || showAssistant) && (
        <div
          className={cn(
            "w-1 flex-shrink-0 bg-border hover:bg-primary cursor-col-resize transition-colors relative group",
            isDragging && "bg-primary"
          )}
          onMouseDown={handleMouseDown(showPreview ? 'editor-preview' : 'editor-assistant')}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-1 h-12 bg-primary rounded-full shadow-lg" />
          </div>
        </div>
      )}

      {showPreview && (
        <>
          <div
            style={{ width: `${widths.preview}%` }}
            className="flex-shrink-0 h-full overflow-hidden"
          >
            {preview}
          </div>

          {showAssistant && (
            <div
              className={cn(
                "w-1 flex-shrink-0 bg-border hover:bg-primary cursor-col-resize transition-colors relative group",
                isDragging && "bg-primary"
              )}
              onMouseDown={handleMouseDown('preview-assistant')}
            >
              <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="w-1 h-12 bg-primary rounded-full shadow-lg" />
              </div>
            </div>
          )}
        </>
      )}

      {showAssistant && (
        <div
          style={{ width: `${widths.assistant}%` }}
          className="flex-shrink-0 h-full overflow-hidden"
        >
          {assistant}
        </div>
      )}
    </div>
  )
}