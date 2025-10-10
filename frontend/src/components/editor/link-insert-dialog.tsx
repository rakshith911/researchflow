'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Link as LinkIcon, ExternalLink } from 'lucide-react'

interface LinkInsertDialogProps {
  open: boolean
  onClose: () => void
  onInsert: (url: string, text: string) => void
  selectedText?: string
}

export function LinkInsertDialog({ open, onClose, onInsert, selectedText = '' }: LinkInsertDialogProps) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState(selectedText)
  const [error, setError] = useState<string | null>(null)

  const validateUrl = (urlString: string): boolean => {
    if (!urlString) return false
    
    // Allow relative URLs
    if (urlString.startsWith('/') || urlString.startsWith('#')) {
      return true
    }

    // Validate absolute URLs
    try {
      new URL(urlString)
      return true
    } catch {
      // Try adding https://
      try {
        new URL(`https://${urlString}`)
        return true
      } catch {
        return false
      }
    }
  }

  const normalizeUrl = (urlString: string): string => {
    // If it's a relative URL, return as-is
    if (urlString.startsWith('/') || urlString.startsWith('#')) {
      return urlString
    }

    // If it already has a protocol, return as-is
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      return urlString
    }

    // Otherwise, add https://
    return `https://${urlString}`
  }

  const handleInsert = () => {
    if (!url.trim()) {
      setError('URL is required')
      return
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL')
      return
    }

    const normalizedUrl = normalizeUrl(url)
    const linkText = text.trim() || normalizedUrl

    onInsert(normalizedUrl, linkText)
    handleClose()
  }

  const handleClose = () => {
    setUrl('')
    setText(selectedText)
    setError(null)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleInsert()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkUrl">URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="linkUrl"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError(null)
                }}
                onKeyPress={handleKeyPress}
                placeholder="https://example.com or /page"
                className="pl-10"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter a full URL or relative path
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkText">Link Text</Label>
            <Input
              id="linkText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Click here"
            />
            <p className="text-xs text-gray-500">
              Text to display for the link (optional)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {url && (
            <div className="rounded-md bg-gray-50 p-3 border">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <a
                href={normalizeUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                {text || normalizeUrl(url)}
                {!url.startsWith('/') && !url.startsWith('#') && (
                  <ExternalLink className="h-3 w-3 ml-1" />
                )}
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!url}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Insert Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}