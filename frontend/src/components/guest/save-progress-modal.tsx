'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useDocumentStore } from '@/stores/document-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Cloud } from 'lucide-react'

const DOCUMENT_THRESHOLD = 3
const DISMISSAL_KEY = 'guest-modal-dismissed'

export function SaveProgressModal() {
  const router = useRouter()
  const { isGuestMode } = useAuthStore()
  const { documents } = useDocumentStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissedForSession, setIsDismissedForSession] = useState(false)

  useEffect(() => {
    if (!isGuestMode || isDismissedForSession) return

    const dismissed = sessionStorage.getItem(DISMISSAL_KEY)
    if (dismissed) {
      setIsDismissedForSession(true)
      return
    }

    const docCount = documents?.length || 0
    if (docCount >= DOCUMENT_THRESHOLD) {
      setIsOpen(true)
    }
  }, [isGuestMode, documents?.length, isDismissedForSession])

  const handleDismiss = () => {
    setIsOpen(false)
    setIsDismissedForSession(true)
    sessionStorage.setItem(DISMISSAL_KEY, 'true')
  }

  const handleSignUp = () => {
    setIsOpen(false)
    router.push('/register')
  }

  const handleLogin = () => {
    setIsOpen(false)
    router.push('/login')
  }

  if (!isGuestMode) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[520px] bg-background border-border p-0 h-[540px]">

        {/* HEADER + FEATURES */}
        <div className="p-6 pb-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Cloud className="h-6 w-6 text-primary" />
              Save Your Progress
            </DialogTitle>

            <DialogDescription className="text-muted-foreground pt-2">
              You've created {documents?.length || 0} documents! Create a free account to:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Sync Across Devices</p>
                <p className="text-xs text-muted-foreground">Access your documents anywhere</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Never Lose Your Work</p>
                <p className="text-xs text-muted-foreground">Automatic cloud backup</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Collaborate & Share</p>
                <p className="text-xs text-muted-foreground">Work with your team easily</p>
              </div>
            </div>
          </div>
        </div>

        {/* FIXED FOOTER */}
        <DialogFooter className="p-4 flex flex-wrap justify-between gap-3">

          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-[160px]"
          >
            Maybe Later
          </Button>

          <Button
            variant="outline"
            onClick={handleLogin}
            className="w-[180px]"
          >
            I Have an Account
          </Button>

          <Button
            onClick={handleSignUp}
            className="w-[200px] gap-2"
          >
            <Cloud className="h-4 w-4" />
            Sign Up for Free
          </Button>

        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
