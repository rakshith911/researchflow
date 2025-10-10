'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Keyboard, Command } from 'lucide-react'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  {
    category: 'Document Actions',
    shortcuts: [
      { keys: ['⌘', 'S'], action: 'Save document' },
      { keys: ['⌘', 'P'], action: 'Toggle preview' },
      { keys: ['F11'], action: 'Toggle fullscreen' },
      { keys: ['⌘', 'K'], action: 'Open command palette' },
    ]
  },
  {
    category: 'Text Formatting',
    shortcuts: [
      { keys: ['⌘', 'B'], action: 'Bold' },
      { keys: ['⌘', 'I'], action: 'Italic' },
      { keys: ['⌘', 'U'], action: 'Underline' },
      { keys: ['⌘', 'K'], action: 'Insert link' },
      { keys: ['⌘', '⇧', 'K'], action: 'Insert code block' },
    ]
  },
  {
    category: 'Lists & Structure',
    shortcuts: [
      { keys: ['⌘', '⇧', '7'], action: 'Ordered list' },
      { keys: ['⌘', '⇧', '8'], action: 'Bullet list' },
      { keys: ['⌘', '⇧', '9'], action: 'Toggle blockquote' },
      { keys: ['⌘', ']'], action: 'Indent' },
      { keys: ['⌘', '['], action: 'Outdent' },
    ]
  },
  {
    category: 'Headings',
    shortcuts: [
      { keys: ['⌘', '⌥', '1'], action: 'Heading 1' },
      { keys: ['⌘', '⌥', '2'], action: 'Heading 2' },
      { keys: ['⌘', '⌥', '3'], action: 'Heading 3' },
      { keys: ['⌘', '⌥', '0'], action: 'Normal text' },
    ]
  },
  {
    category: 'Editor Navigation',
    shortcuts: [
      { keys: ['⌘', 'F'], action: 'Find in document' },
      { keys: ['⌘', 'G'], action: 'Find next' },
      { keys: ['⌘', '⇧', 'G'], action: 'Find previous' },
      { keys: ['⌘', 'H'], action: 'Find and replace' },
      { keys: ['⌘', 'L'], action: 'Go to line' },
    ]
  },
  {
    category: 'Selection',
    shortcuts: [
      { keys: ['⌘', 'A'], action: 'Select all' },
      { keys: ['⌘', 'D'], action: 'Select word' },
      { keys: ['⌘', '⇧', 'L'], action: 'Select all occurrences' },
      { keys: ['⌥', '↑'], action: 'Move line up' },
      { keys: ['⌥', '↓'], action: 'Move line down' },
    ]
  },
  {
    category: 'Insertion',
    shortcuts: [
      { keys: ['⌘', '⇧', 'I'], action: 'Insert image' },
      { keys: ['⌘', '⇧', 'T'], action: 'Insert table' },
      { keys: ['⌘', '⇧', 'L'], action: 'Insert link' },
      { keys: ['⌘', 'Enter'], action: 'Insert line below' },
      { keys: ['⌘', '⇧', 'Enter'], action: 'Insert line above' },
    ]
  }
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <Command className="h-4 w-4" />
            <span>
              <strong>Tip:</strong> On Windows/Linux, use <Kbd>Ctrl</Kbd> instead of <Kbd>⌘</Kbd>
            </span>
          </div>

          {SHORTCUTS.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {section.category}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {section.shortcuts.length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, shortcutIdx) => (
                  <div
                    key={shortcutIdx}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{shortcut.action}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center">
                          <Kbd>{key}</Kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-gray-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Custom Shortcuts Section */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Markdown Shortcuts
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-50">
                <span>Type <code className="px-1 bg-gray-200 rounded">#</code> + space for headings</span>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-50">
                <span>Type <code className="px-1 bg-gray-200 rounded">-</code> + space for bullet list</span>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-50">
                <span>Type <code className="px-1 bg-gray-200 rounded">1.</code> + space for numbered list</span>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-50">
                <span>Type <code className="px-1 bg-gray-200 rounded">[]</code> for checkbox</span>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-50">
                <span>Type <code className="px-1 bg-gray-200 rounded">```</code> for code block</span>
                <Badge variant="outline">Live</Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}