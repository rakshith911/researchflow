// frontend/src/components/layout/dashboard-sidebar.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDocumentStore } from '@/stores/document-store'
import { useAuthStore } from '@/stores/auth-store'
import { DocumentTemplateSelector } from '@/components/editor/document-template-selector'
import { cn } from '@/lib/utils'
import { 
  FileText,
  Brain,
  Network,
  Settings,
  Plus,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User,
  Star,
  File,
  Lock
} from 'lucide-react'

interface DashboardSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const DOC_TYPE_CONFIG = {
  research: { icon: FileText, label: 'Research', color: 'text-blue-600 dark:text-blue-400' },
  engineering: { icon: FileText, label: 'Engineering', color: 'text-green-600 dark:text-green-400' },
  healthcare: { icon: FileText, label: 'Healthcare', color: 'text-red-600 dark:text-red-400' },
  meeting: { icon: Users, label: 'Meeting', color: 'text-purple-600 dark:text-purple-400' },
  general: { icon: File, label: 'General', color: 'text-muted-foreground' },
}

// Helper function to format relative dates
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function DashboardSidebar({ isOpen, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { 
    documents, 
    favoriteDocuments,
    recentDocuments,
    setCurrentDocument, 
    createDocument,
    loadFavorites,
    loadRecentDocuments 
  } = useDocumentStore()
  const { user, logout, isGuestMode } = useAuthStore()
  const [expandedSections, setExpandedSections] = useState<string[]>(['recent', 'favorites'])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  
  // Resizing and collapsing state
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  const MIN_WIDTH = 200
  const MAX_WIDTH = 500
  const COLLAPSED_WIDTH = 64

  // Safe array access with default empty arrays
  const safeDocuments = documents || []
  const safeFavoriteDocuments = favoriteDocuments || []
  const safeRecentDocuments = recentDocuments || []

  // Load favorites and recent documents on mount
  useEffect(() => {
    if (loadFavorites) loadFavorites()
    if (loadRecentDocuments) loadRecentDocuments()
  }, [loadFavorites, loadRecentDocuments])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }
  
  const handleCreateDocument = () => {
    setShowTemplateSelector(true)
  }

  const handleSelectTemplate = async (type: any, template?: string) => {
    try {
      await createDocument(type, template)
      setShowTemplateSelector(false)
      router.push('/editor')
    } catch (error) {
      console.error('Error creating document:', error)
      alert('Error creating document. Please try again.')
    }
  }

  const handleSelectDocument = async (docId: string) => {
    const document = safeDocuments.find(d => d.id === docId)
    if (document) {
      setCurrentDocument(document)
      router.push('/editor')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isCollapsed) return
    e.preventDefault()
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [isCollapsed])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = e.clientX
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setSidebarWidth(newWidth)
    }
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])
  
  // ✅ FIXED: Navigation items with guest mode access control
  const navigationItems = [
    {
      title: 'Documents',
      icon: FileText,
      href: '/documents',
      badge: safeDocuments.length.toString(),
      guestAllowed: true,  // ✅ Guests can access
    },
    {
      title: 'Editor',
      icon: FileText,
      href: '/editor',
      guestAllowed: true,  // ✅ Guests can access
    },
    {
      title: 'AI Insights',
      icon: Brain,
      href: '/ai-insights',
      badge: 'Pro',
      guestAllowed: false,  // ❌ Requires account
    },
    {
      title: 'Knowledge Graph',
      icon: Network,
      href: '/knowledge-graph',
      guestAllowed: false,  // ❌ Requires account
    },
    {
      title: 'Collaboration',
      icon: Users,
      href: '/collaboration',
      guestAllowed: false,  // ❌ Requires account
    },
  ]

  // ✅ Filter navigation based on guest mode
  const availableNavItems = isGuestMode 
    ? navigationItems.filter(item => item.guestAllowed)
    : navigationItems

  // ✅ Handle navigation with guest mode check
  const handleNavClick = (item: typeof navigationItems[0], e: React.MouseEvent) => {
    if (isGuestMode && !item.guestAllowed) {
      e.preventDefault()
      if (window.confirm('This feature requires a free account. Would you like to sign up?')) {
        router.push('/register')
      }
      return
    }
  }
  
  const documentsByType = safeDocuments.reduce((acc, d) => {
    if (!acc[d.type]) acc[d.type] = []
    acc[d.type].push(d)
    return acc
  }, {} as Record<string, any[]>)

  const getDocTypeIcon = (type: string) => {
    const config = DOC_TYPE_CONFIG[type as keyof typeof DOC_TYPE_CONFIG] || DOC_TYPE_CONFIG.general
    const Icon = config.icon
    return <Icon className={cn("h-4 w-4", config.color)} />
  }

  if (!isOpen) return null
  
  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth

  return (
    <>
      <div
        ref={sidebarRef}
        className={cn(
          "relative h-screen border-r border-border bg-card transition-all duration-300",
          isResizing && "select-none"
        )}
        style={{ width: `${currentWidth}px` }}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">ResearchFlow</span>
            </div>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-8 w-8"
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sidebar Content */}
        <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {/* Create Document Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCreateDocument}
                    className={cn(
                      "w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    {!isCollapsed && 'New Document'}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    Create new document
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Navigation */}
            <nav className="mt-6 space-y-1">
              {availableNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isLocked = isGuestMode && !item.guestAllowed
                
                return (
                  <TooltipProvider key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link 
                          href={isLocked ? '#' : item.href}
                          onClick={(e) => handleNavClick(item, e)}
                        >
                          <Button
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={cn(
                              "w-full justify-start gap-3",
                              isCollapsed && "justify-center px-0",
                              isLocked && "opacity-50"
                            )}
                            disabled={isLocked}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!isCollapsed && (
                              <>
                                <span className="flex-1 text-left">{item.title}</span>
                                <div className="flex items-center gap-1">
                                  {isLocked && <Lock className="h-3 w-3" />}
                                  {item.badge && !isLocked && (
                                    <Badge variant="secondary" className="ml-auto">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                              </>
                            )}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          {item.title}
                          {isLocked && ' (Requires Account)'}
                          {item.badge && !isLocked && ` (${item.badge})`}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </nav>

            {/* Recent Documents Section */}
            {!isCollapsed && safeRecentDocuments.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => toggleSection('recent')}
                  className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Recent</span>
                  </div>
                  {expandedSections.includes('recent') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.includes('recent') && (
                  <div className="mt-2 space-y-1">
                    {safeRecentDocuments.slice(0, 5).map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleSelectDocument(d.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        {getDocTypeIcon(d.type)}
                        <span className="flex-1 truncate text-left text-foreground">
                          {d.title || 'Untitled'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Section */}
            {!isCollapsed && safeFavoriteDocuments.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => toggleSection('favorites')}
                  className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>Favorites</span>
                  </div>
                  {expandedSections.includes('favorites') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.includes('favorites') && (
                  <div className="mt-2 space-y-1">
                    {safeFavoriteDocuments.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleSelectDocument(d.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        {getDocTypeIcon(d.type)}
                        <span className="flex-1 truncate text-left text-foreground">
                          {d.title || 'Untitled'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents by Type */}
            {!isCollapsed && Object.keys(documentsByType).length > 0 && (
              <div className="mt-4">
                <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                  By Type
                </div>
                {Object.entries(documentsByType).map(([type, docs]) => {
                  const config = DOC_TYPE_CONFIG[type as keyof typeof DOC_TYPE_CONFIG] || DOC_TYPE_CONFIG.general
                  return (
                    <div key={type} className="mt-2">
                      <button
                        onClick={() => toggleSection(type)}
                        className="flex w-full items-center justify-between px-2 py-1 text-sm hover:bg-accent rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {getDocTypeIcon(type)}
                          <span className="text-foreground">{config.label}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {docs.length}
                          </Badge>
                        </div>
                        {expandedSections.includes(type) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedSections.includes(type) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {docs.map((d) => (
                            <button
                              key={d.id}
                              onClick={() => handleSelectDocument(d.id)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                            >
                              <span className="flex-1 truncate text-left text-foreground">
                                {d.title || 'Untitled'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeDate(d.updatedAt)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* User Profile Section */}
          <div className="border-t border-border p-4">
            {!isCollapsed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {isGuestMode ? 'Guest User' : (user?.name || 'User')}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {isGuestMode ? 'Limited Access' : (user?.email || '')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isGuestMode ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push('/register')}
                    >
                      Sign Up Free
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push('/settings')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {!isGuestMode && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/settings')}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Settings</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Logout</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            className={cn(
              "absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors",
              isResizing && "bg-primary"
            )}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <DocumentTemplateSelector
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </>
  )
}

export default DashboardSidebar