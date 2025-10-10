// frontend/src/components/settings/editor-settings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save } from 'lucide-react'

export function EditorSettings() {
  const { settings, isLoading, error, updateSettings, clearError } = useSettingsStore()
  
  const [fontSize, setFontSize] = useState(14)
  const [lineHeight, setLineHeight] = useState(1.6)
  const [fontFamily, setFontFamily] = useState('monospace')
  const [wordWrap, setWordWrap] = useState(true)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState(3000)
  
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (settings?.editor) {
      setFontSize(settings.editor.fontSize)
      setLineHeight(settings.editor.lineHeight)
      setFontFamily(settings.editor.fontFamily)
      setWordWrap(settings.editor.wordWrap)
      setShowLineNumbers(settings.editor.showLineNumbers)
      setAutoSaveInterval(settings.autoSaveInterval)
    }
  }, [settings])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings({
        editor: {
          fontSize,
          lineHeight,
          fontFamily,
          wordWrap,
          showLineNumbers
        },
        autoSaveInterval
      })
      setSuccessMessage('Editor settings updated successfully!')
    } catch (err) {
      // Error handled by store
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !settings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editor Preferences</CardTitle>
          <CardDescription>
            Customize your writing experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size: {fontSize}px</Label>
            <Input
              id="fontSize"
              type="range"
              min="10"
              max="24"
              step="1"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Adjust the editor font size (10-24px)
            </p>
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <Label htmlFor="lineHeight">Line Height: {lineHeight}</Label>
            <Input
              id="lineHeight"
              type="range"
              min="1.0"
              max="2.5"
              step="0.1"
              value={lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Adjust spacing between lines (1.0-2.5)
            </p>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font Family</Label>
            <select
              id="fontFamily"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="monospace">Monospace</option>
              <option value="Monaco">Monaco</option>
              <option value="'Courier New'">Courier New</option>
              <option value="'Fira Code'">Fira Code</option>
              <option value="'JetBrains Mono'">JetBrains Mono</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred editor font
            </p>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Word Wrap</Label>
              <p className="text-sm text-muted-foreground">
                Wrap long lines to fit the editor width
              </p>
            </div>
            <Button
              variant={wordWrap ? "default" : "outline"}
              size="sm"
              onClick={() => setWordWrap(!wordWrap)}
            >
              {wordWrap ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {/* Show Line Numbers */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Line Numbers</Label>
              <p className="text-sm text-muted-foreground">
                Display line numbers in the editor
              </p>
            </div>
            <Button
              variant={showLineNumbers ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
            >
              {showLineNumbers ? 'Show' : 'Hide'}
            </Button>
          </div>

          {/* Auto-save Interval */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="autoSave">Auto-save Interval: {autoSaveInterval / 1000}s</Label>
            <Input
              id="autoSave"
              type="range"
              min="1000"
              max="10000"
              step="1000"
              value={autoSaveInterval}
              onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Automatically save your work every {autoSaveInterval / 1000} seconds
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}