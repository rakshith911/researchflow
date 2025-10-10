// frontend/src/components/documents/document-list-skeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DocumentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="border-l-4 border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {/* Checkbox skeleton */}
                <Skeleton className="h-4 w-4 rounded" />
                
                {/* Icon skeleton */}
                <Skeleton className="h-6 w-6 rounded" />
                
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Title skeleton */}
                  <Skeleton className="h-5 w-3/4" />
                  
                  {/* Badge skeleton */}
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              
              {/* Menu button skeleton */}
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-2">
              {/* Content preview skeleton */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              
              {/* Tags skeleton */}
              <div className="flex gap-1 pt-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              
              {/* Metadata skeleton */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}