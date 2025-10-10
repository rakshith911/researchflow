'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Code, Search } from 'lucide-react'

interface CodeBlockSelectorProps {
  open: boolean
  onClose: () => void
  onInsert: (language: string, code?: string) => void
}

const POPULAR_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'go', label: 'Go', icon: '🔵' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'cpp', label: 'C++', icon: '⚙️' },
  { value: 'csharp', label: 'C#', icon: '🎯' },
]

const ALL_LANGUAGES = [
  ...POPULAR_LANGUAGES,
  { value: 'html', label: 'HTML', icon: '🌐' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'scss', label: 'SCSS', icon: '💅' },
  { value: 'json', label: 'JSON', icon: '📦' },
  { value: 'yaml', label: 'YAML', icon: '📋' },
  { value: 'markdown', label: 'Markdown', icon: '📝' },
  { value: 'bash', label: 'Bash', icon: '💻' },
  { value: 'shell', label: 'Shell', icon: '🐚' },
  { value: 'sql', label: 'SQL', icon: '🗄️' },
  { value: 'php', label: 'PHP', icon: '🐘' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
  { value: 'swift', label: 'Swift', icon: '🦅' },
  { value: 'kotlin', label: 'Kotlin', icon: '🎯' },
  { value: 'r', label: 'R', icon: '📊' },
  { value: 'matlab', label: 'MATLAB', icon: '📐' },
  { value: 'dart', label: 'Dart', icon: '🎯' },
  { value: 'elixir', label: 'Elixir', icon: '💧' },
  { value: 'haskell', label: 'Haskell', icon: '🎓' },
  { value: 'scala', label: 'Scala', icon: '🔴' },
  { value: 'perl', label: 'Perl', icon: '🐪' },
  { value: 'lua', label: 'Lua', icon: '🌙' },
  { value: 'graphql', label: 'GraphQL', icon: '🔷' },
  { value: 'dockerfile', label: 'Dockerfile', icon: '🐳' },
  { value: 'plaintext', label: 'Plain Text', icon: '📄' },
]

export function CodeBlockSelector({ open, onClose, onInsert }: CodeBlockSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [code, setCode] = useState('')

  const filteredLanguages = ALL_LANGUAGES.filter(lang =>
    lang.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInsert = () => {
    onInsert(selectedLanguage, code)
    handleClose()
  }

  const handleClose = () => {
    setSearchTerm('')
    setSelectedLanguage('javascript')
    setCode('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault()
      handleInsert()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Insert Code Block</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label>Select Language</Label>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search languages..."
                className="pl-10"
              />
            </div>

            {/* Popular Languages (if no search) */}
            {!searchTerm && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Popular:</p>
                <div className="grid grid-cols-4 gap-2">
                  {POPULAR_LANGUAGES.map(lang => (
                    <Button
                      key={lang.value}
                      variant={selectedLanguage === lang.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedLanguage(lang.value)}
                      className="justify-start"
                    >
                      <span className="mr-2">{lang.icon}</span>
                      {lang.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* All Languages */}
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {filteredLanguages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No languages found
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {filteredLanguages.map(lang => (
                    <Button
                      key={lang.value}
                      variant={selectedLanguage === lang.value ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedLanguage(lang.value)}
                      className="justify-start text-xs"
                    >
                      <span className="mr-1">{lang.icon}</span>
                      {lang.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Code Input (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="code">Code (optional)</Label>
            <textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="// Enter your code here (or leave empty)"
              className="w-full h-40 px-3 py-2 text-sm font-mono border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-gray-500">
              Tip: Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">⌘+Enter</kbd> to insert
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="rounded-md bg-gray-900 p-3 overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{selectedLanguage}</span>
              </div>
              <pre className="text-sm text-gray-100 font-mono">
                {code || '// Your code will appear here'}
              </pre>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>
            <Code className="h-4 w-4 mr-2" />
            Insert Code Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}