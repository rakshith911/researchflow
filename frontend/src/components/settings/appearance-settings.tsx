// frontend/src/components/settings/appearance-settings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Sun, Moon, Monitor, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppearanceSettings() {
  const { settings, isLoading, error, updateSettings, clearError } = useSettingsStore()
  
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>('light')
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (settings) {
      setSelectedTheme(settings.theme)
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

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    setSelectedTheme(theme)
    setIsSaving(true)
    
    try {
      await updateSettings({ theme })
      setSuccessMessage('Theme updated successfully!')
      
      // Apply theme to document
      applyTheme(theme)
    } catch (err) {
      // Error handled by store
    } finally {
      setIsSaving(false)
    }
  }

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  const themes = [
    {
      value: 'light',
      label: 'Light',
      description: 'Clean and bright interface',
      icon: Sun
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: Moon
    },
    {
      value: 'auto',
      label: 'System',
      description: 'Follows your system preference',
      icon: Monitor
    }
  ]

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
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose how ResearchFlow looks to you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((theme) => {
              const Icon = theme.icon
              const isSelected = selectedTheme === theme.value
              
              return (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value as any)}
                  disabled={isSaving}
                  className={cn(
                    "relative flex flex-col items-start p-4 border-2 rounded-lg transition-all",
                    "hover:border-primary hover:bg-accent",
                    isSelected ? "border-primary bg-accent" : "border-border",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                  
                  <Icon className={cn(
                    "h-6 w-6 mb-3",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                  
                  <div className="text-left">
                    <p className="font-semibold mb-1">{theme.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {theme.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {isSaving && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying theme...
            </div>
          )}
        </CardContent>
      </Card>

      {/* UI Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Customize how content is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Preview</Label>
              <p className="text-sm text-muted-foreground">
                Display markdown preview alongside editor
              </p>
            </div>
            <Button
              variant={settings?.showPreview ? "default" : "outline"}
              size="sm"
              onClick={async () => {
                setIsSaving(true)
                try {
                  await updateSettings({ 
                    showPreview: !settings?.showPreview 
                  })
                  setSuccessMessage('Display preferences updated!')
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving}
            >
              {settings?.showPreview ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Split View</Label>
              <p className="text-sm text-muted-foreground">
                Show editor and preview side by side
              </p>
            </div>
            <Button
              variant={settings?.splitView ? "default" : "outline"}
              size="sm"
              onClick={async () => {
                setIsSaving(true)
                try {
                  await updateSettings({ 
                    splitView: !settings?.splitView 
                  })
                  setSuccessMessage('Display preferences updated!')
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving}
            >
              {settings?.splitView ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}