'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  Network,
  Users,
  Clock,
  Settings,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: string | number
}

interface CollapsibleSidebarProps {
  className?: string
}

export function CollapsibleSidebar({ className }: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const sidebarItems: SidebarItem[] = [
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Documents',
      href: '/dashboard/documents',
      badge: 16
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Editor',
      href: '/dashboard/editor'
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      label: 'AI Insights',
      href: '/dashboard/ai-insights',
      badge: 'New'
    },
    {
      icon: <Network className="h-5 w-5" />,
      label: 'Knowledge Graph',
      href: '/dashboard/knowledge-graph'
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Collaboration',
      href: '/dashboard/collaboration'
    }
  ]

  const recentItems = [
    { label: 'Untitled Document', date: '9/25/2025', icon: '📄' },
    { label: 'Untitled Document', date: '9/25/2025', icon: '📄' },
    { label: 'Untitled Document', date: '9/24/2025', icon: '📄' }
  ]

  return (
    <div
      className={cn(
        "relative h-full bg-white border-r flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-lg">ResearchFlow</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">R</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-white shadow-md hover:bg-gray-100"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* New Document Button */}
      <div className="p-4">
        <Button className="w-full" size={isCollapsed ? "sm" : "default"}>
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">New Document</span>}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <input
            type="text"
            placeholder="Search All Documents"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {sidebarItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          typeof item.badge === 'number'
                            ? "bg-gray-200 text-gray-700"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>

        {/* Recent Section */}
        {!isCollapsed && (
          <div className="mt-6">
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Recent</span>
              </div>
              <span className="text-xs text-gray-400">5</span>
            </div>
            <div className="space-y-1 mt-2">
              {recentItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <span className="text-sm">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Settings at Bottom */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full",
            isCollapsed ? "justify-center" : "justify-start"
          )}
          size="sm"
        >
          <Settings className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Settings</span>}
        </Button>
      </div>
    </div>
  )
}