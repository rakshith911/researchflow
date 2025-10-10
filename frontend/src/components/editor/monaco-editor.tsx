'use client'

import { useEffect, useRef } from 'react'
import { Editor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  theme?: 'light' | 'dark'
  className?: string
}

export function MonacoEditor({ value, onChange, theme = 'light', className }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    
    // Configure editor for markdown
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
      renderControlCharacters: true,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
    })
    
    // Add custom keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save will be handled by parent component
    })
    
    // Focus the editor
    editor.focus()
  }
  
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }
  
  return (
    <div className={className}>
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
          lightbulb: { enabled: true },
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'never',
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
        }}
      />
    </div>
  )
}
