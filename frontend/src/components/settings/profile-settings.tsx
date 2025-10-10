// frontend/src/components/settings/profile-settings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, User, Mail, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

export function ProfileSettings() {
  const { profile, statistics, isLoading, error, updateProfile, clearError } = useSettingsStore()
  const { user, setUser } = useAuthStore()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setEmail(profile.email || '')
    }
  }, [profile])

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
    if (!name.trim()) {
      alert('Name is required')
      return
    }

    if (!email.trim()) {
      alert('Email is required')
      return
    }

    setIsSaving(true)
    try {
      await updateProfile({ name, email })
      
      // ✅ FIX: Update auth store so sidebar reflects changes immediately
      if (user) {
        setUser({
          ...user,
          name,
          email
        })
      }
      
      setSuccessMessage('Profile updated successfully!')
    } catch (err) {
      // Error is handled by store
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !profile) {
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
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and email address
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

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This email is used for login and notifications
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
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account Information */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details and statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">User ID</Label>
                <p className="text-sm font-mono bg-muted px-3 py-2 rounded">
                  {profile.id}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Member Since</Label>
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatDate(profile.createdAt)}
                </div>
              </div>

              {statistics && (
                <>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Total Documents</Label>
                    <p className="text-2xl font-bold">{statistics.totalDocuments}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Total Words</Label>
                    <p className="text-2xl font-bold">{statistics.totalWords.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Reading Time</Label>
                    <p className="text-2xl font-bold">{statistics.totalReadingTime} min</p>
                  </div>

                  {statistics.documentsByType.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Most Used Type</Label>
                      <p className="text-2xl font-bold capitalize">
                        {statistics.documentsByType[0].type}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}