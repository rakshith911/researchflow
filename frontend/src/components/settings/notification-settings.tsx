// frontend/src/components/settings/notification-settings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Monitor } from 'lucide-react'

export function NotificationSettings() {
  const { settings, isLoading, error, updateSettings, clearError } = useSettingsStore()
  
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [desktopNotifications, setDesktopNotifications] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (settings?.notifications) {
      setEmailNotifications(settings.notifications.email)
      setDesktopNotifications(settings.notifications.desktop)
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

  const handleToggle = async (type: 'email' | 'desktop', value: boolean) => {
    setIsSaving(true)
    try {
      await updateSettings({
        notifications: {
          email: type === 'email' ? value : emailNotifications,
          desktop: type === 'desktop' ? value : desktopNotifications
        }
      })
      
      if (type === 'email') setEmailNotifications(value)
      if (type === 'desktop') setDesktopNotifications(value)
      
      setSuccessMessage('Notification preferences updated!')
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
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified
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

          {/* Email Notifications */}
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label>Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive updates and alerts via email
              </p>
            </div>
            <Button
              variant={emailNotifications ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('email', !emailNotifications)}
              disabled={isSaving}
            >
              {emailNotifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {/* Desktop Notifications */}
          <div className="flex items-start justify-between pt-6 border-t">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <Label>Desktop Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Show notifications on your desktop
              </p>
            </div>
            <Button
              variant={desktopNotifications ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('desktop', !desktopNotifications)}
              disabled={isSaving}
            >
              {desktopNotifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}