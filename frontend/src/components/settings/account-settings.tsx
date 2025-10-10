// frontend/src/components/settings/account-settings.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSettingsStore } from '@/stores/settings-store'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Download, Trash2, AlertTriangle } from 'lucide-react'

export function AccountSettings() {
  const router = useRouter()
  const { exportData, deleteAccount } = useSettingsStore()
  const { logout } = useAuthStore()
  
  const [password, setPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleExportData = async () => {
    setIsExporting(true)
    setError('')
    
    try {
      const data = await exportData()
      
      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `researchflow-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setSuccessMessage('Data exported successfully!')
    } catch (err) {
      setError('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setError('')
    
    // Validation
    if (!password) {
      setError('Password is required to delete your account')
      return
    }

    if (confirmDelete !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    if (!window.confirm('Are you absolutely sure? This action cannot be undone. All your documents and data will be permanently deleted.')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteAccount(password)
      
      // Logout and redirect to homepage
      logout()
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Download all your data in JSON format (GDPR compliant)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            This will export your profile, settings, all documents, and statistics in a JSON file that you can save or import elsewhere.
          </p>

          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export All Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account - Danger Zone */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action is irreversible. All your documents, settings, and data will be permanently deleted and cannot be recovered.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password">Confirm Your Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmDelete">
              Type <span className="font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirmDelete"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <Button 
            onClick={handleDeleteAccount} 
            disabled={isDeleting || !password || confirmDelete !== 'DELETE'}
            variant="destructive"
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Account...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account Permanently
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}