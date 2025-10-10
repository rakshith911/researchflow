'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'

interface Document {
  id: string
  title: string
  type: 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general'
  wordCount: number
  readingTime: number
  updatedAt: string
  tags: string[]
}

interface DocumentStatsProps {
  documents: Document[]
}

export function DocumentStats({ documents }: DocumentStatsProps) {
  const getTypeDistribution = () => {
    const distribution = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: documents.length > 0 ? (count / documents.length) * 100 : 0
    })).sort((a, b) => b.count - a.count)
  }

  const getRecentActivity = () => {
    const now = new Date()
    const periods = {
      today: 0,
      week: 0,
      month: 0
    }

    documents.forEach(doc => {
      const updatedDate = new Date(doc.updatedAt)
      const daysDiff = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff < 1) periods.today++
      if (daysDiff < 7) periods.week++
      if (daysDiff < 30) periods.month++
    })

    return periods
  }

  const getTopTags = () => {
    const tagCounts = documents.flatMap(doc => doc.tags).reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }))
  }

  const typeDistribution = getTypeDistribution()
  const recentActivity = getRecentActivity()
  const topTags = getTopTags()
  const totalWords = documents.reduce((sum, doc) => sum + doc.wordCount, 0)
  const totalReadingTime = documents.reduce((sum, doc) => sum + doc.readingTime, 0)

  const getTypeColor = (type: string) => {
    const colors = {
      research: 'bg-blue-100 text-blue-800 border-blue-200',
      engineering: 'bg-green-100 text-green-800 border-green-200',
      healthcare: 'bg-red-100 text-red-800 border-red-200',
      meeting: 'bg-purple-100 text-purple-800 border-purple-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      research: '📚',
      engineering: '⚙️',
      healthcare: '🏥',
      meeting: '📅',
      general: '📄'
    }
    return icons[type as keyof typeof icons] || icons.general
  }

  if (documents.length === 0) {
    return null
  }

  return (
    <div className="border-b bg-muted/30 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Type Distribution */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Document Types
              </h3>
              <span className="text-xs text-muted-foreground">
                {documents.length} total
              </span>
            </div>
            <div className="space-y-2">
              {typeDistribution.map(({ type, count, percentage }) => (
                <div key={type} className="flex items-center space-x-2">
                  <span className="text-sm">{getTypeIcon(type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="capitalize font-medium">{type}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Recent Activity
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Today</span>
                </div>
                <Badge variant="secondary">{recentActivity.today}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">This Week</span>
                </div>
                <Badge variant="secondary">{recentActivity.week}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">This Month</span>
                </div>
                <Badge variant="secondary">{recentActivity.month}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content & Tags Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Content Overview
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Total Words</span>
                </div>
                <span className="text-sm font-medium">
                  {totalWords.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Reading Time</span>
                </div>
                <span className="text-sm font-medium">
                  {Math.round(totalReadingTime / 60)}h {totalReadingTime % 60}m
                </span>
              </div>
              {topTags.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Popular Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {topTags.map(({ tag, count }) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
