'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useDocumentStore } from '@/stores/document-store'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { X, Sparkles, Cloud, Lock } from 'lucide-react'

export function GuestBanner() {
  const router = useRouter()
  const { isGuestMode } = useAuthStore()
  const { documents } = useDocumentStore()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!isGuestMode || isDismissed) return null

  const docCount = documents?.length || 0

  return (
    <Alert className="border-primary/50 bg-primary/5 relative">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground">You're in Guest Mode</span>
              <Badge variant="secondary" className="text-xs">
                {docCount} {docCount === 1 ? 'document' : 'documents'}
              </Badge>
            </div>
            <AlertDescription className="text-sm text-muted-foreground">
              Your work is saved in your browser. Sign up to sync across devices and never lose your progress.
            </AlertDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => router.push('/register')}
            className="gap-2"
          >
            <Cloud className="h-4 w-4" />
            Sign Up to Save
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push('/login')}
          >
            <Lock className="h-4 w-4 mr-1" />
            Login
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}