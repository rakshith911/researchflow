// frontend/src/components/layout/dashboard-sidebar.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDocumentStore } from '@/stores/document-store'
import { useAuthStore } from '@/stores/auth-store'
import { DocumentTemplateSelector } from '@/components/editor/document-template-selector'
import { formatRelativeDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { 
  FileText,
  Brain,
  Network,
  Settings,
  Plus,
  Folder,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User,
  Star,
  File
} from 'lucide-react'

interface DashboardSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const DOC_TYPE_CONFIG = {
  research: { icon: FileText, label: 'Research', color: 'text-blue-600' },
  engineering: { icon: FileText, label: 'Engineering', color: 'text-green-600' },
  healthcare: { icon: FileText, label: 'Healthcare', color: 'text-red-600' },
  meeting: { icon: Users, label: 'Meeting', color: 'text-purple-600' },
  general: { icon: File, label: 'General', color: 'text-gray-600' },
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
  const { user, logout } = useAuthStore()
  const [expandedSections, setExpandedSections] = useState<string[]>(['recent', 'favorites'])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  const MIN_WIDTH = 200
  const MAX_WIDTH = 500
  const COLLAPSED_WIDTH = 64

  // Load favorites and recent documents on mount
  useEffect(() => {
    loadFavorites()
    loadRecentDocuments()
  }, [])

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
    } catch (error) {
      console.error('Error creating document:', error)
      alert('Error creating document. Please try again.')
    }
  }

  const handleSelectDocument = async (docId: string) => {
    const document = documents.find(doc => doc.id === docId)
    if (document) {
      setCurrentDocument(document)
      router.push('/editor')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
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
  
  const navigationItems = [
    {
      title: 'Documents',
      icon: FileText,
      href: '/documents',
      badge: documents.length.toString(),
    },
    {
      title: 'Editor',
      icon: FileText,
      href: '/editor',
    },
    {
      title: 'AI Insights',
      icon: Brain,
      href: '/ai-insights',
      badge: 'New',
    },
    {
      title: 'Knowledge Graph',
      icon: Network,
      href: '/knowledge-graph',
    },
    {
      title: 'Collaboration',
      icon: Users,
      href: '/collaboration',
    },
  ]
  
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = []
    acc[doc.type].push(doc)
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
        style={{ width: `${currentWidth}px` }}
        className={cn(
          "relative border-r bg-background flex flex-col transition-all duration-300",
          isResizing && "transition-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b min-h-[64px]">
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">R</span>
                </div>
                <span className="font-semibold text-lg">ResearchFlow</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                title="Collapse Sidebar"
                className="h-8 w-8"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">R</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(false)}
                title="Expand Sidebar"
                className="h-8 w-8"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* User Info */}
        {user && (
          <div className="border-b px-4 py-3">
            {!isCollapsed ? (
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          <Button 
            className="w-full" 
            size="sm" 
            onClick={handleCreateDocument}
            title={isCollapsed ? "New Document" : undefined}
          >
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">New Document</span>}
          </Button>
          
          {!isCollapsed && (
            <Link href="/documents" className="w-full block">
              <Button variant="outline" className="w-full" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search Documents
              </Button>
            </Link>
          )}
        </div>
        
        {/* Navigation */}
        <div className="px-2 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center w-full p-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className="text-xs ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>
        
        {/* Document Sections - Only show when expanded */}
        {!isCollapsed && (
          <div className="flex-1 overflow-auto mt-4">
            {/* Favorites */}
            {favoriteDocuments.length > 0 && (
              <div className="px-4 py-2">
                <button
                  onClick={() => toggleSection('favorites')}
                  className="flex items-center justify-between w-full p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Favorites
                    <Badge variant="outline" className="ml-2 text-xs">
                      {favoriteDocuments.length}
                    </Badge>
                  </div>
                  {expandedSections.includes('favorites') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                
                {expandedSections.includes('favorites') && (
                  <div className="ml-6 space-y-1 mt-2">
                    {favoriteDocuments.slice(0, 5).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleSelectDocument(doc.id)}
                        className="flex items-center justify-between w-full p-2 text-sm hover:bg-muted rounded-md transition-colors group"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          {getDocTypeIcon(doc.type)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground truncate group-hover:text-primary">
                              {doc.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatRelativeDate(doc.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {favoriteDocuments.length > 5 && (
                      <Link href="/documents?filter=favorites" className="block ml-2">
                        <Button variant="ghost" size="sm" className="text-xs">
                          View all {favoriteDocuments.length} favorites
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recent Documents */}
            {recentDocuments.length > 0 && (
              <div className="px-4 py-2">
                <button
                  onClick={() => toggleSection('recent')}
                  className="flex items-center justify-between w-full p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent
                    <Badge variant="outline" className="ml-2 text-xs">
                      {recentDocuments.length}
                    </Badge>
                  </div>
                  {expandedSections.includes('recent') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                
                {expandedSections.includes('recent') && (
                  <div className="ml-6 space-y-1 mt-2">
                    {recentDocuments.slice(0, 5).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleSelectDocument(doc.id)}
                        className="flex items-center justify-between w-full p-2 text-sm hover:bg-muted rounded-md transition-colors group"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          {getDocTypeIcon(doc.type)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground truncate group-hover:text-primary">
                              {doc.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatRelativeDate(doc.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {recentDocuments.length === 0 && (
                      <p className="text-xs text-muted-foreground ml-2">No recent documents</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Documents by Type */}
            {Object.entries(documentsByType).map(([type, docs]) => (
              <div key={type} className="px-4 py-2">
                <button
                  onClick={() => toggleSection(type)}
                  className="flex items-center justify-between w-full p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center">
                    <Folder className="h-4 w-4 mr-2" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {docs.length}
                    </Badge>
                  </div>
                  {expandedSections.includes(type) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                
                {expandedSections.includes(type) && (
                  <div className="ml-6 space-y-1 mt-2">
                    {docs.slice(0, 3).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleSelectDocument(doc.id)}
                        className="flex items-center justify-between w-full p-2 text-sm hover:bg-muted rounded-md transition-colors group"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground truncate group-hover:text-primary">
                              {doc.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {doc.wordCount} words
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {docs.length > 3 && (
                      <Link href={`/documents?type=${type}`} className="block ml-2">
                        <Button variant="ghost" size="sm" className="text-xs">
                          View all {docs.length} documents
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Settings and Logout at Bottom */}
        <div className="border-t p-2 space-y-1">
          <Link href="/settings">
            <Button
              variant="ghost"
              className={cn(
                "w-full",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              size="sm"
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Settings</span>}
            </Button>
          </Link>
          
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "w-full",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            size="sm"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>

        {/* Resize Handle - Only show when not collapsed */}
        {!isCollapsed && (
          <div
            className={cn(
              "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary transition-colors group",
              isResizing && "bg-primary"
            )}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="w-1 h-12 bg-primary rounded-full shadow-lg" />
            </div>
          </div>
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