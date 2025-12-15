'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDocumentStore } from '@/stores/document-store'
import { useAuthStore } from '@/stores/auth-store'
import { DocumentTemplateSelector } from '@/components/editor/document-template-selector'
import { cn } from '@/lib/utils'
import {
  FileText, Brain, Network, Settings, Plus, Clock, Users,
  ChevronDown, ChevronRight, LogOut, User, Star, File, Lock,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'

interface DashboardSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const DOC_TYPE_CONFIG = {
  research: { icon: FileText, label: 'Research', color: 'text-blue-500' },
  engineering: { icon: FileText, label: 'Engineering', color: 'text-green-500' },
  healthcare: { icon: FileText, label: 'Healthcare', color: 'text-red-500' },
  meeting: { icon: Users, label: 'Meeting', color: 'text-purple-500' },
  general: { icon: File, label: 'General', color: 'text-muted-foreground' },
}

export function DashboardSidebar({ isOpen, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const {
    documents, favoriteDocuments, recentDocuments,
    setCurrentDocument, createDocument, loadFavorites, loadRecentDocuments
  } = useDocumentStore()
  const { user, logout, isGuestMode } = useAuthStore()

  const [collapsed, setCollapsed] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['recent'])

  // Ensure data is loaded
  useEffect(() => {
    if (loadFavorites) loadFavorites()
    if (loadRecentDocuments) loadRecentDocuments()
  }, [loadFavorites, loadRecentDocuments])

  const safeDocuments = documents || []
  const safeRecent = recentDocuments || []
  const safeFavorites = favoriteDocuments || []

  // Navigation Items
  const navigationItems = [
    { title: 'Documents', icon: FileText, href: '/documents', guestAllowed: true },
    { title: 'Editor', icon: FileText, href: '/editor', guestAllowed: true },
    { title: 'AI Insights', icon: Brain, href: '/ai-insights', badge: 'Pro', guestAllowed: false },
    { title: 'Knowledge Graph', icon: Network, href: '/knowledge-graph', guestAllowed: false },
    { title: 'Collaboration', icon: Users, href: '/collaboration', guestAllowed: false },
  ]

  const handleCreateDocument = () => setShowTemplateSelector(true)

  const handleSelectTemplate = async (type: string, template?: string, format: 'markdown' | 'latex' = 'markdown') => {
    try {
      await createDocument(type as any, template, format)
      setShowTemplateSelector(false)
      router.push('/editor')
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    )
  }

  return (
    <>
      <motion.div
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "relative h-[calc(100vh-2rem)] my-4 ml-4 z-50",
          !isOpen && "hidden"
        )}
      >
        {/* Inner Container - Handles Background, Border, Overflow */}
        <div className="w-full h-full rounded-3xl border border-white/20 bg-background/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300">

          {/* Header */}
          <div className={cn(
            "h-16 flex items-center justify-center border-b border-white/10 shrink-0 transition-all duration-300",
            collapsed ? "px-0" : "px-6"
          )}>
            <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
              <Logo className="scale-75" showText={true} />
            </div>

            {/* Logo for collapsed state */}
            {collapsed && <Logo className="scale-75" showText={false} />}
          </div>

          {/* Toggle Row (Below Header) */}
          <div className={cn(
            "flex items-center w-full py-2 transition-all duration-300",
            collapsed ? "justify-center" : "justify-end px-4"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/10"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-border">

            {/* New Document Action */}
            <Button
              onClick={handleCreateDocument}
              className={cn(
                "w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300",
                collapsed ? "aspect-square p-0 justify-center rounded-xl" : "h-10 rounded-xl justify-start px-4"
              )}
            >
              <Plus className={cn("h-5 w-5", !collapsed && "mr-2")} />
              {!collapsed && "New Document"}
            </Button>

            {/* Main Nav */}
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                const isLocked = isGuestMode && !item.guestAllowed

                // Strictly hide locked items in Guest Mode
                if (isLocked && isGuestMode) return null

                return (
                  <TooltipProvider key={item.href}>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link href={isLocked ? '#' : item.href} onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                            if (confirm("Requires Pro Account. Sign up?")) router.push('/register');
                          }
                        }}>
                          <div className={cn(
                            "flex items-center rounded-xl px-3 py-2 transition-all duration-200 group cursor-pointer hover:bg-muted/50",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground",
                            collapsed && "justify-center px-0 h-10 w-10 mx-auto"
                          )}>
                            <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                            {!collapsed && (
                              <span className="ml-3 flex-1 text-sm">{item.title}</span>
                            )}
                            {!collapsed && item.badge && !isLocked && (
                              <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">{item.badge}</Badge>
                            )}
                          </div>
                        </Link>
                      </TooltipTrigger>
                      {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </nav>

            {/* Recent Documents */}
            {!collapsed && safeRecent.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <button
                  onClick={() => toggleSection('recent')}
                  className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 hover:text-foreground"
                >
                  <span>Recent</span>
                  {expandedSections.includes('recent') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>

                <AnimatePresence>
                  {expandedSections.includes('recent') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {safeRecent.slice(0, 5).map(doc => {
                        const config = DOC_TYPE_CONFIG[doc.type as keyof typeof DOC_TYPE_CONFIG] || DOC_TYPE_CONFIG.general
                        return (
                          <div
                            key={doc.id}
                            onClick={() => {
                              setCurrentDocument(doc)
                              router.push('/editor')
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/50 text-sm text-foreground/80 cursor-pointer transition-colors group"
                          >
                            <config.icon className={cn("h-3.5 w-3.5 shrink-0 opacity-70 group-hover:opacity-100", config.color)} />
                            <span className="truncate text-xs">{doc.title || "Untitled"}</span>
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>

          {/* Footer / User Profile */}
          <div className="p-3 border-t border-border/40 bg-card/30 shrink-0">
            <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                {user?.name?.[0] || 'G'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium truncate">{isGuestMode ? 'Guest' : user?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <button onClick={() => router.push('/settings')} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">Settings</button>
                    <span className="text-muted-foreground/50 text-[10px]">•</span>
                    <button onClick={() => { logout(); router.push('/'); }} className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">Log out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Template Modal */}
      {showTemplateSelector && (
        <DocumentTemplateSelector
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </>
  )
}