// frontend/src/app/not-found.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileQuestion className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Page Not Found</CardTitle>
              <CardDescription>
                The page you're looking for doesn't exist or has been moved.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">Error 404</p>
            <p className="text-sm text-muted-foreground">
              We couldn't find the page you requested. This might happen if:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>The URL was typed incorrectly</li>
              <li>The page has been deleted or moved</li>
              <li>You followed an outdated link</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-3">
          <Button onClick={() => router.back()} variant="outline" className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Link href="/documents" className="flex-1">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}