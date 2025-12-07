'use client'

import { useState, useEffect, useRef } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { useSettingsStore } from '@/stores/settings-store'
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
  Link as LinkIcon,
  Microscope,
  Cpu,
  Stethoscope,
  Users
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

  const { settings } = useSettingsStore()

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

  // Sync editor theme with global theme
  useEffect(() => {
    if (!settings) return

    const isDark = settings.theme === 'dark' ||
      (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    setEditorTheme(isDark ? 'dark' : 'light')
  }, [settings])

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

      // Cmd/Ctrl + K: Link
      if (cmdKey && e.key === 'k' && !e.shiftKey) {
        e.preventDefault()
        wrapSelection('[', '](url)')
        return
      }

      // Cmd/Ctrl + `: Code
      if (cmdKey && e.key === '`') {
        e.preventDefault()
        wrapSelection('`')
        return
      }

      // Cmd/Ctrl + Alt + 1: H1
      if (cmdKey && e.altKey && e.key === '1') {
        e.preventDefault()
        handleInsertMarkdown('# ')
        return
      }

      // Cmd/Ctrl + Alt + 2: H2
      if (cmdKey && e.altKey && e.key === '2') {
        e.preventDefault()
        handleInsertMarkdown('## ')
        return
      }

      // Cmd/Ctrl + Alt + 3: H3
      if (cmdKey && e.altKey && e.key === '3') {
        e.preventDefault()
        handleInsertMarkdown('### ')
        return
      }

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

  // ✅ FIXED: Premium Empty State
  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 p-8 max-w-lg w-full">
          <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center space-y-8">

            {/* Hero Icon */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl blur-lg opacity-40 animate-pulse" />
              <div className="relative w-full h-full bg-background border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                <FileText className="h-10 w-10 text-foreground" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                Welcome to ResearchFlow
              </h1>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Your intelligent workspace for research, engineering, and discovery.
              </p>
            </div>

            {/* Key Actions */}
            <div className="space-y-4">
              <Button
                onClick={() => setShowTemplateSelector(true)}
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 rounded-xl font-medium transition-all hover:scale-[1.02]"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Document
              </Button>

              {/* Quick Starters */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCreateDocument('research')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                    <Microscope className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Research</span>
                </button>

                <button
                  onClick={() => handleCreateDocument('engineering')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500/20 transition-colors">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Engineering</span>
                </button>
                <button
                  onClick={() => handleCreateDocument('healthcare')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Healthcare</span>
                </button>
                <button
                  onClick={() => handleCreateDocument('meeting')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Meeting</span>
                </button>
              </div>
            </div>
          </div>
        </div>

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

      {/* ✅ FIXED: Document header bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-4 flex-1">
          <input
            value={currentDocument.title}
            onChange={(e) => updateDocumentTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none outline-none flex-1 focus:bg-accent px-2 py-1 rounded text-foreground"
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

      {/* ✅ FIXED: Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span className="font-medium text-foreground">{currentDocument.wordCount} words</span>
          <span>{currentDocument.readingTime} min read</span>
          <span>Type: {currentDocument.type}</span>
          {currentDocument.tags.length > 0 && (
            <span>Tags: {currentDocument.tags.slice(0, 3).join(', ')}</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {autoSaveState.isAutoSaving && (
            <div className="flex items-center text-primary">
              <Clock className="w-3 h-3 mr-1 animate-spin" />Saving...
            </div>
          )}
          {!autoSaveState.hasUnsavedChanges && !autoSaveState.isAutoSaving && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <Save className="w-3 h-3 mr-1" />Saved {new Date(autoSaveState.lastSaved).toLocaleTimeString()}
            </div>
          )}
          {autoSaveState.hasUnsavedChanges && !autoSaveState.isAutoSaving && (
            <div className="flex items-center text-orange-600 dark:text-orange-400">
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
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted">
              <span className="text-sm font-medium">Preview</span>
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
          <div className="border-l overflow-y-auto bg-muted/30 h-full">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b bg-background">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-primary" />
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