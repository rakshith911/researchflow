'use client'

import { useEffect, useRef, useState } from 'react'
import { Editor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { WikiLinkAutocomplete } from './wiki-link-autocomplete'

interface MonacoEditorWithLinksProps {
  value: string
  onChange: (value: string) => void
  onLinksChange?: (content: string) => void
  onMount?: (editor: editor.IStandaloneCodeEditor) => void  // ✅ ADDED
  theme?: 'light' | 'dark'
  className?: string
}

export function MonacoEditorWithLinks({
  value,
  onChange,
  onLinksChange,
  onMount,  // ✅ ADDED
  theme = 'light',
  className
}: MonacoEditorWithLinksProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })
  const [linkStartPosition, setLinkStartPosition] = useState<any>(null)

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor

    editor.updateOptions({
      wordWrap: 'on',
      minimap: { enabled: false },
      lineNumbers: 'on',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
      padding: { top: 20, bottom: 20 },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      renderWhitespace: 'selection',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
    })

    // ✅ ADDED: Call the onMount prop to pass editor to parent
    if (onMount) {
      onMount(editor)
    }

    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      if (!model) return

      const position = editor.getPosition()
      if (!position) return

      const lineContent = model.getLineContent(position.lineNumber)
      const textBeforeCursor = lineContent.substring(0, position.column - 1)

      if (textBeforeCursor.endsWith('[[')) {
        const cursorCoords = editor.getScrolledVisiblePosition(position)
        if (cursorCoords) {
          setLinkStartPosition(position)
          setAutocompletePosition({
            top: cursorCoords.top + cursorCoords.height,
            left: cursorCoords.left
          })
          setAutocompleteQuery('')
          setShowAutocomplete(true)
        }
      } else if (showAutocomplete && linkStartPosition) {
        const linkStart = linkStartPosition.column + 1
        const currentText = lineContent.substring(linkStart, position.column - 1)
        
        if (currentText.includes(']]') || currentText.includes('\n')) {
          setShowAutocomplete(false)
        } else {
          setAutocompleteQuery(currentText)
        }
      }
    })

    editor.focus()
  }

  const handleAutocompleteSelect = (title: string) => {
    if (!editorRef.current || !linkStartPosition) return

    const model = editorRef.current.getModel()
    if (!model) return

    const position = editorRef.current.getPosition()
    if (!position) return

    const range = {
      startLineNumber: linkStartPosition.lineNumber,
      startColumn: linkStartPosition.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    }

    editorRef.current.executeEdits('', [{
      range,
      text: `[[${title}]]`,
      forceMoveMarkers: true
    }])

    editorRef.current.setPosition({
      lineNumber: position.lineNumber,
      column: linkStartPosition.column + title.length + 4
    })

    setShowAutocomplete(false)
    editorRef.current.focus()

    if (onLinksChange) {
      const newContent = model.getValue()
      onLinksChange(newContent)
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      <Editor
        height="100%"
        language="markdown"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          selectOnLineNumbers: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          lineHeight: 24,
          padding: { top: 20, bottom: 20 },
          minimap: { enabled: false },
          wordWrap: 'on',
          wrappingIndent: 'indent',
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          links: true,
          colorDecorators: true,
          // lightbulb: { enabled: 'on' },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
        }}
      />

      {showAutocomplete && (
        <WikiLinkAutocomplete
          query={autocompleteQuery}
          position={autocompletePosition}
          onSelect={handleAutocompleteSelect}
          onClose={() => setShowAutocomplete(false)}
        />
      )}
    </div>
  )
}