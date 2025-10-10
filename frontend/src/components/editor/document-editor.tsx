'use client'

import { useState, useEffect, useRef } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { useSmartWriting } from '@/hooks/use-smart-writing'
import { MonacoEditorWithLinks } from './monaco-editor-with-links'
import { MarkdownPreview } from './markdown-preview'
import { DocumentToolbar } from './document-toolbar'
import { DocumentTemplateSelector } from './document-template-selector'
import { SmartWritingAssistant } from './smart-writing-assistant'
import { BacklinksPanel } from './backlinks-panel'
import { ResizableEditorLayout } from './resizable-editor-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Plus,
  FileText,
  Save,
  Clock,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react'

export function DocumentEditor() {
  const {
    currentDocument,
    documents,
    updateDocumentContent,
    updateDocumentTitle,
    saveDocument,
    createDocument,
    autoSaveState,
    setCurrentDocument,
    loadDocument
  } = useDocumentStore()
  
  const [showPreview, setShowPreview] = useState(true)
  const [showAssistant, setShowAssistant] = useState(true)
  const [showBacklinks, setShowBacklinks] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('light')
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  
  const editorRef = useRef<any>(null)
  
  const {
    analysis,
    isAnalyzing,
    analyzeContent,
  } = useSmartWriting({
    documentId: currentDocument?.id || '',
    documentType: currentDocument?.type || 'general',
    debounceMs: 2000,
    minContentLength: 100
  })

  useEffect(() => {
    if (currentDocument?.content) {
      analyzeContent(currentDocument.content)
    }
  }, [currentDocument?.content, analyzeContent])

  const handleLinksChange = async (content: string) => {
    if (!currentDocument) return
    
    try {
      await fetch(`http://localhost:5000/api/documents/${currentDocument.id}/update-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
    } catch (error) {
      console.error('Failed to update links:', error)
    }
  }

  const handleNavigateToDocumentByTitle = async (title: string) => {
    const doc = documents.find(d => d.title.toLowerCase() === title.toLowerCase())
    if (doc) {
      await loadDocument(doc.id)
      setCurrentDocument(doc)
    } else {
      console.warn(`Document "${title}" not found`)
    }
  }

  const handleRelatedDocClick = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId)
    if (doc) {
      setCurrentDocument(doc)
    }
  }
  
  const handleCreateDocument = async (type: any = 'general', template?: string) => {
    try {
      await createDocument(type, template)
      setShowTemplateSelector(false)
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  const handleInsertMarkdown = (markdown: string) => {
    if (!editorRef.current || !currentDocument) return

    const editor = editorRef.current
    const selection = editor.getSelection()
    const currentContent = currentDocument.content

    if (selection) {
      const range = selection
      const id = { major: 1, minor: 1 }
      const op = { identifier: id, range, text: markdown, forceMoveMarkers: true }
      editor.executeEdits('toolbar', [op])
      
      const newContent = editor.getValue()
      updateDocumentContent(newContent)
    } else {
      updateDocumentContent(currentContent + '\n' + markdown)
    }

    editor.focus()
  }

  // ✅ NEW: Wrap selected text with markdown syntax
  const wrapSelection = (before: string, after: string = before) => {
    if (!editorRef.current || !currentDocument) return

    const editor = editorRef.current
    const selection = editor.getSelection()
    const model = editor.getModel()
    
    if (!selection || !model) return

    const selectedText = model.getValueInRange(selection)
    
    if (selectedText) {
      // Wrap selected text
      const wrappedText = `${before}${selectedText}${after}`
      const id = { major: 1, minor: 1 }
      const op = { identifier: id, range: selection, text: wrappedText, forceMoveMarkers: true }
      editor.executeEdits('keyboard', [op])
    } else {
      // Insert template with placeholder
      const placeholder = 'text'
      const wrappedText = `${before}${placeholder}${after}`
      const id = { major: 1, minor: 1 }
      const op = { identifier: id, range: selection, text: wrappedText, forceMoveMarkers: true }
      editor.executeEdits('keyboard', [op])
      
      // Select the placeholder
      const newPosition = selection.getStartPosition()
      editor.setSelection({
        startLineNumber: newPosition.lineNumber,
        startColumn: newPosition.column + before.length,
        endLineNumber: newPosition.lineNumber,
        endColumn: newPosition.column + before.length + placeholder.length
      })
    }
    
    const newContent = editor.getValue()
    updateDocumentContent(newContent)
    editor.focus()
  }
  
  useEffect(() => {
    if (currentDocument && autoSaveState.hasUnsavedChanges) {
      const timer = setTimeout(() => {
        saveDocument()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [currentDocument?.content, autoSaveState.hasUnsavedChanges])
  
  // ✅ UPDATED: Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey
      
      // Cmd/Ctrl + S: Save
      if (cmdKey && e.key === 's') {
        e.preventDefault()
        saveDocument()
        return
      }
      
      // Cmd/Ctrl + P: Toggle Preview
      if (cmdKey && e.key === 'p') {
        e.preventDefault()
        setShowPreview(!showPreview)
        return
      }
      
      // F11: Toggle Fullscreen
      if (e.key === 'F11') {
        e.preventDefault()
        setIsFullscreen(!isFullscreen)
        return
      }

      // ✅ TEXT FORMATTING SHORTCUTS
      // Cmd/Ctrl + B: Bold
      if (cmdKey && e.key === 'b' && !e.shiftKey) {
        e.preventDefault()
        wrapSelection('**')
        return
      }

      // Cmd/Ctrl + I: Italic
      if (cmdKey && e.key === 'i' && !e.shiftKey) {
        e.preventDefault()
        wrapSelection('*')
        return
      }

      // Cmd/Ctrl + U: Underline (using HTML)
      if (cmdKey && e.key === 'u') {
        e.preventDefault()
        wrapSelection('<u>', '</u>')
        return
      }

      // Cmd/Ctrl + `: Inline Code
      if (cmdKey && e.key === '`') {
        e.preventDefault()
        wrapSelection('`')
        return
      }

      // ✅ HEADING SHORTCUTS
      // Cmd/Ctrl + Alt + 1: Heading 1
      if (cmdKey && e.altKey && e.key === '1') {
        e.preventDefault()
        handleInsertMarkdown('# ')
        return
      }

      // Cmd/Ctrl + Alt + 2: Heading 2
      if (cmdKey && e.altKey && e.key === '2') {
        e.preventDefault()
        handleInsertMarkdown('## ')
        return
      }

      // Cmd/Ctrl + Alt + 3: Heading 3
      if (cmdKey && e.altKey && e.key === '3') {
        e.preventDefault()
        handleInsertMarkdown('### ')
        return
      }

      // ✅ LIST SHORTCUTS
      // Cmd/Ctrl + Shift + 8: Bullet List
      if (cmdKey && e.shiftKey && e.key === '8') {
        e.preventDefault()
        handleInsertMarkdown('- ')
        return
      }

      // Cmd/Ctrl + Shift + 7: Numbered List
      if (cmdKey && e.shiftKey && e.key === '7') {
        e.preventDefault()
        handleInsertMarkdown('1. ')
        return
      }

      // Cmd/Ctrl + Shift + 9: Quote
      if (cmdKey && e.shiftKey && e.key === '9') {
        e.preventDefault()
        handleInsertMarkdown('> ')
        return
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPreview, isFullscreen, currentDocument, saveDocument])
  
  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-96 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">Welcome to ResearchFlow</CardTitle>
            <p className="text-gray-600 mt-2">
              Create your first document to experience intelligent productivity
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setShowTemplateSelector(true)} 
              size="lg" 
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Document
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleCreateDocument('research')}>
                Research
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCreateDocument('engineering')}>
                Engineering
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCreateDocument('healthcare')}>
                Healthcare
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCreateDocument('meeting')}>
                Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {showTemplateSelector && (
          <DocumentTemplateSelector
            onSelect={handleCreateDocument}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("flex flex-col h-full", isFullscreen && "fixed inset-0 z-50 bg-background")}>
      <DocumentToolbar 
        onInsertMarkdown={handleInsertMarkdown}
        documentId={currentDocument.id}
      />
      
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4 flex-1">
          <input
            value={currentDocument.title}
            onChange={(e) => updateDocumentTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none outline-none flex-1 focus:bg-gray-50 px-2 py-1 rounded"
            placeholder="Untitled Document"
          />
          <Badge variant="outline" className="capitalize">{currentDocument.type}</Badge>
          <Badge variant="secondary" className="text-xs">v{currentDocument.version}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBacklinks(!showBacklinks)}
            title="Toggle Backlinks"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            {showBacklinks ? 'Hide Links' : 'Show Links'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            title="Toggle Preview (Cmd+P)"
          >
            {showPreview ? <><EyeOff className="h-4 w-4 mr-2" />Hide Preview</> : <><Eye className="h-4 w-4 mr-2" />Show Preview</>}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAssistant(!showAssistant)}
            title="Toggle Smart Assistant"
          >
            {showAssistant ? <><PanelRightClose className="h-4 w-4 mr-2" />Hide Assistant</> : <><PanelRightOpen className="h-4 w-4 mr-2" />Show Assistant</>}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen (F11)">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={saveDocument}
            disabled={autoSaveState.isAutoSaving || !autoSaveState.hasUnsavedChanges}
            title="Save Document (Cmd+S)"
          >
            <Save className="h-4 w-4 mr-2" />Save
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="font-medium">{currentDocument.wordCount} words</span>
          <span>{currentDocument.readingTime} min read</span>
          <span>Type: {currentDocument.type}</span>
          {currentDocument.tags.length > 0 && (
            <span>Tags: {currentDocument.tags.slice(0, 3).join(', ')}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {autoSaveState.isAutoSaving && (
            <div className="flex items-center text-blue-600">
              <Clock className="w-3 h-3 mr-1 animate-spin" />Saving...
            </div>
          )}
          {!autoSaveState.hasUnsavedChanges && !autoSaveState.isAutoSaving && (
            <div className="flex items-center text-green-600">
              <Save className="w-3 h-3 mr-1" />Saved {new Date(autoSaveState.lastSaved).toLocaleTimeString()}
            </div>
          )}
          {autoSaveState.hasUnsavedChanges && !autoSaveState.isAutoSaving && (
            <div className="flex items-center text-orange-600">
              <Clock className="w-3 h-3 mr-1" />Unsaved changes
            </div>
          )}
        </div>
      </div>
      
      <ResizableEditorLayout
        showPreview={showPreview}
        showAssistant={showAssistant}
        editor={
          <div className="flex flex-col h-full">
            {showBacklinks && (
              <div className="border-b p-2 bg-muted/30">
                <BacklinksPanel
                  documentId={currentDocument.id}
                  onNavigate={handleRelatedDocClick}
                />
              </div>
            )}
            <MonacoEditorWithLinks 
              value={currentDocument.content}
              onChange={updateDocumentContent}
              onLinksChange={handleLinksChange}
              onMount={(editor) => { editorRef.current = editor }}
              theme={editorTheme}
              className="flex-1"
            />
          </div>
        }
        preview={
          <div className="border-l flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Preview</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                <PanelRightClose className="h-3 w-3" />
              </Button>
            </div>
            <MarkdownPreview 
              content={currentDocument.content}
              onNavigateToDocument={handleNavigateToDocumentByTitle}
              className="flex-1 overflow-auto"
            />
          </div>
        }
        assistant={
          <div className="border-l overflow-y-auto bg-gray-50 h-full">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b bg-white">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Smart Assistant</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAssistant(false)}>
                <PanelRightClose className="h-3 w-3" />
              </Button>
            </div>
            <div className="p-4">
              <SmartWritingAssistant
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                onDocumentClick={handleRelatedDocClick}
              />
            </div>
          </div>
        }
      />
    </div>
  )
}