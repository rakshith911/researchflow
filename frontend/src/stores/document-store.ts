// frontend/src/stores/document-store.ts
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/components/ui/use-toast'

interface Document {
  id: string
  title: string
  content: string
  type: 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general'
  tags: string[]
  linkedDocuments: string[]
  collaborators: string[]
  createdAt: Date | string  // Allow both Date and string
  updatedAt: Date | string  // Allow both Date and string
  lastAccessedAt?: Date | string  // Allow both Date and string
  version: number
  wordCount: number
  readingTime: number
  isFavorite?: boolean
}

interface DocumentSettings {
  showPreview: boolean
  splitView: boolean
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  lineHeight: number
  wordWrap: boolean
  showLineNumbers: boolean
}

interface AutoSaveState {
  lastSaved: Date
  hasUnsavedChanges: boolean
  isAutoSaving: boolean
}

interface DocumentStore {
  currentDocument: Document | null
  documents: Document[]
  favoriteDocuments: Document[]
  recentDocuments: Document[]
  settings: DocumentSettings
  autoSaveState: AutoSaveState
  isPreviewVisible: boolean
  isSplitView: boolean
  isFullscreen: boolean
  isLoading: boolean
  selectedDocumentIds: string[]
  
  setCurrentDocument: (document: Document | null) => void
  updateDocumentContent: (content: string) => void
  updateDocumentTitle: (title: string) => void
  saveDocument: () => Promise<void>
  createDocument: (type: Document['type'], template?: string) => Promise<Document>
  loadDocument: (id: string) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  loadAllDocuments: () => Promise<void>
  renameDocument: (id: string, title: string) => Promise<void>
  duplicateDocument: (id: string) => Promise<Document>
  toggleFavorite: (id: string) => Promise<void>
  loadFavorites: () => Promise<void>
  loadRecentDocuments: () => Promise<void>
  searchDocuments: (query: string, options?: { type?: string }) => Promise<Document[]>
  bulkDelete: (ids: string[]) => Promise<void>
  bulkAddTags: (ids: string[], tags: string[]) => Promise<void>
  bulkRemoveTags: (ids: string[], tags: string[]) => Promise<void>
  toggleDocumentSelection: (id: string) => void
  selectAllDocuments: () => void
  clearSelection: () => void
  togglePreview: () => void
  toggleSplitView: () => void
  toggleFullscreen: () => void
  updateSettings: (settings: Partial<DocumentSettings>) => void
  setAutoSaveState: (state: Partial<AutoSaveState>) => void
}

function getDefaultTemplate(type: Document['type']): string {
  const templates = {
    research: `# Research Document\n\n## Abstract\nBrief summary...\n\n## Introduction\nBackground...\n\n## Methodology\nMethods...\n\n## Results\nFindings...\n\n## Conclusion\nSummary...`,
    engineering: `# Technical Specification\n\n## Overview\nProject description...\n\n## Requirements\n- Requirement 1\n- Requirement 2\n\n## Architecture\nSystem design...\n\n## Implementation\n\`\`\`typescript\n// Code\n\`\`\``,
    healthcare: `# Clinical Protocol\n\n## Patient Information\n- Patient ID:\n- Date:\n\n## Assessment\nFindings...\n\n## Plan\nTreatment...\n\n## Follow-up\nNext steps...`,
    meeting: `# Meeting Notes\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:**\n\n## Agenda\n1. Topic 1\n2. Topic 2\n\n## Action Items\n- [ ] Task 1\n- [ ] Task 2`,
    general: `# Document Title\n\nStart writing...\n\n## Section 1\n\n## Section 2`
  }
  return templates[type] || templates.general
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  currentDocument: null,
  documents: [],
  favoriteDocuments: [],
  recentDocuments: [],
  selectedDocumentIds: [],
  settings: {
    showPreview: true,
    splitView: true,
    theme: 'light',
    fontSize: 14,
    lineHeight: 1.6,
    wordWrap: true,
    showLineNumbers: true,
  },
  autoSaveState: {
    lastSaved: new Date(),
    hasUnsavedChanges: false,
    isAutoSaving: false,
  },
  isPreviewVisible: true,
  isSplitView: true,
  isFullscreen: false,
  isLoading: false,

  setCurrentDocument: (document) => set({ currentDocument: document }),
  
  updateDocumentContent: (content) => {
    const { currentDocument } = get()
    if (!currentDocument) return
    
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length
    const readingTime = Math.ceil(wordCount / 200)
    
    set({
      currentDocument: {
        ...currentDocument,
        content,
        wordCount,
        readingTime,
        updatedAt: new Date(),
      },
      autoSaveState: {
        ...get().autoSaveState,
        hasUnsavedChanges: true,
      }
    })
  },
  
  updateDocumentTitle: (title) => {
    const { currentDocument } = get()
    if (!currentDocument) return
    
    set({
      currentDocument: {
        ...currentDocument,
        title,
        updatedAt: new Date(),
      },
      autoSaveState: {
        ...get().autoSaveState,
        hasUnsavedChanges: true,
      }
    })
  },
  
  saveDocument: async () => {
    const { currentDocument } = get()
    if (!currentDocument) return
    
    set({ autoSaveState: { ...get().autoSaveState, isAutoSaving: true } })
    
    try {
      const result = await apiClient.put<any>(
        `/api/documents/${currentDocument.id}`,
        currentDocument
      )
      
      if (result.success) {
        set((state) => ({
          currentDocument: result.data,
          documents: state.documents.map(doc => 
            doc.id === result.data.id ? result.data : doc
          ),
          autoSaveState: {
            lastSaved: new Date(),
            hasUnsavedChanges: false,
            isAutoSaving: false,
          }
        }))

        toast({
          title: "Document saved",
          description: "Your changes have been saved successfully.",
          variant: "success",
        })

        const { useKnowledgeGraphStore } = await import('./knowledge-graph-store')
        const knowledgeGraphStore = useKnowledgeGraphStore.getState()
        knowledgeGraphStore.refreshGraph()
      } else {
        throw new Error(result.error || 'Failed to save document')
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      set({ autoSaveState: { ...get().autoSaveState, isAutoSaving: false } })
      
      toast({
        title: "Save failed",
        description: "Failed to save document. Please try again.",
        variant: "destructive",
      })
    }
  },
  
  createDocument: async (type, template) => {
    set({ isLoading: true })
    
    try {
      const result = await apiClient.post<any>('/api/documents', {
        title: 'Untitled Document',
        content: template || getDefaultTemplate(type),
        type: type,
      })
      
      if (result.success) {
        const newDocument = result.data
        set({
          currentDocument: newDocument,
          documents: [...get().documents, newDocument],
          isLoading: false,
          autoSaveState: {
            lastSaved: new Date(),
            hasUnsavedChanges: false,
            isAutoSaving: false,
          }
        })

        toast({
          title: "Document created",
          description: `New ${type} document created successfully.`,
          variant: "success",
        })

        const { useKnowledgeGraphStore } = await import('./knowledge-graph-store')
        const knowledgeGraphStore = useKnowledgeGraphStore.getState()
        knowledgeGraphStore.refreshGraph()

        return newDocument
      } else {
        throw new Error(result.error || 'Failed to create document')
      }
    } catch (error) {
      console.error('Failed to create document:', error)
      set({ isLoading: false })
      
      toast({
        title: "Creation failed",
        description: "Failed to create document. Please try again.",
        variant: "destructive",
      })
      
      throw error
    }
  },
  
  loadDocument: async (id: string) => {
    set({ isLoading: true })
    
    try {
      const result = await apiClient.get<any>(`/api/documents/${id}`)
      
      if (result.success) {
        set({
          currentDocument: result.data,
          isLoading: false,
          autoSaveState: {
            lastSaved: new Date(result.data.updatedAt),
            hasUnsavedChanges: false,
            isAutoSaving: false,
          }
        })
      } else {
        throw new Error(result.error || 'Failed to load document')
      }
    } catch (error) {
      console.error('Failed to load document:', error)
      set({ isLoading: false })
      
      toast({
        title: "Load failed",
        description: "Failed to load document. Please try again.",
        variant: "destructive",
      })
      
      throw error
    }
  },
  
  deleteDocument: async (id: string) => {
    try {
      const result = await apiClient.delete<any>(`/api/documents/${id}`)
      
      if (result.success) {
        set({
          documents: get().documents.filter(doc => doc.id !== id),
          favoriteDocuments: get().favoriteDocuments.filter(doc => doc.id !== id),
          recentDocuments: get().recentDocuments.filter(doc => doc.id !== id),
          currentDocument: get().currentDocument?.id === id ? null : get().currentDocument,
          selectedDocumentIds: get().selectedDocumentIds.filter(docId => docId !== id),
        })

        toast({
          title: "Document deleted",
          description: "Document has been permanently deleted.",
        })

        const { useKnowledgeGraphStore } = await import('./knowledge-graph-store')
        const knowledgeGraphStore = useKnowledgeGraphStore.getState()
        knowledgeGraphStore.refreshGraph()
      } else {
        throw new Error(result.error || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      })
      
      throw error
    }
  },
  
  loadAllDocuments: async () => {
    const state = get()
    if (state.isLoading) return
    
    set({ isLoading: true })
    
    try {
      const result = await apiClient.get<any>('/api/documents')
      
      if (result.success) {
        set({ documents: result.data, isLoading: false })
      } else {
        console.error('Failed to load documents:', result.error)
        set({ documents: [], isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      set({ documents: [], isLoading: false })
    }
  },

  renameDocument: async (id: string, title: string) => {
    try {
      const result = await apiClient.renameDocument(id, title)
      
      if (result.success) {
        set((state) => ({
          documents: state.documents.map(doc => 
            doc.id === id ? { ...doc, title, updatedAt: new Date() } : doc
          ),
          currentDocument: state.currentDocument?.id === id 
            ? { ...state.currentDocument, title, updatedAt: new Date() }
            : state.currentDocument
        }))

        toast({
          title: "Document renamed",
          description: `Document renamed to "${title}".`,
          variant: "success",
        })
      } else {
        throw new Error(result.error || 'Failed to rename document')
      }
    } catch (error) {
      console.error('Failed to rename document:', error)
      
      toast({
        title: "Rename failed",
        description: "Failed to rename document. Please try again.",
        variant: "destructive",
      })
      
      throw error
    }
  },

  duplicateDocument: async (id: string) => {
    try {
      const result = await apiClient.duplicateDocument(id)
      
      if (result.success) {
        const duplicated = result.data
        set((state) => ({
          documents: [...state.documents, duplicated]
        }))

        toast({
          title: "Document duplicated",
          description: `"${duplicated.title}" has been created.`,
          variant: "success",
        })

        return duplicated
      } else {
        throw new Error(result.error || 'Failed to duplicate document')
      }
    } catch (error) {
      console.error('Failed to duplicate document:', error)
      
      toast({
        title: "Duplicate failed",
        description: "Failed to duplicate document. Please try again.",
        variant: "destructive",
      })
      
      throw error
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      const result = await apiClient.toggleFavorite(id)
      
      if (result.success) {
        const updated = result.data
        const isFavorited = updated.isFavorite
        
        set((state) => ({
          documents: state.documents.map(doc => 
            doc.id === id ? updated : doc
          ),
          currentDocument: state.currentDocument?.id === id 
            ? updated
            : state.currentDocument
        }))

        toast({
          title: isFavorited ? "Added to favorites" : "Removed from favorites",
          description: isFavorited 
            ? "Document has been starred."
            : "Document has been unstarred.",
          variant: "success",
        })
        
        get().loadFavorites()
      } else {
        throw new Error(result.error || 'Failed to toggle favorite')
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      
      toast({
        title: "Operation failed",
        description: "Failed to update favorite status.",
        variant: "destructive",
      })
      
      throw error
    }
  },

  loadFavorites: async () => {
    try {
      const result = await apiClient.getFavorites()
      if (result.success) {
        set({ favoriteDocuments: result.data })
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
    }
  },

  loadRecentDocuments: async () => {
    try {
      const result = await apiClient.getRecentDocuments(10)
      if (result.success) {
        set({ recentDocuments: result.data })
      }
    } catch (error) {
      console.error('Failed to load recent documents:', error)
    }
  },

  searchDocuments: async (query: string, options?: { type?: string }): Promise<Document[]> => {
    try {
      const result = await apiClient.searchDocuments(query, options)
      if (result.success && result.data) {
        return result.data as Document[]
      }
      return []
    } catch (error) {
      console.error('Failed to search documents:', error)
      return []
    }
  },

  bulkDelete: async (ids: string[]) => {
    try {
      const result = await apiClient.bulkDeleteDocuments(ids)
      
      if (result.success) {
        set((state) => ({
          documents: state.documents.filter(doc => !ids.includes(doc.id)),
          favoriteDocuments: state.favoriteDocuments.filter(doc => !ids.includes(doc.id)),
          recentDocuments: state.recentDocuments.filter(doc => !ids.includes(doc.id)),
          selectedDocumentIds: [],
          currentDocument: ids.includes(state.currentDocument?.id || '') 
            ? null 
            : state.currentDocument
        }))

        toast({
          title: "Documents deleted",
          description: `${ids.length} document(s) have been deleted.`,
        })
      } else {
        throw new Error(result.error || 'Failed to delete documents')
      }
    } catch (error) {
      console.error('Failed to bulk delete:', error)
      
      toast({
        title: "Delete failed",
        description: "Failed to delete documents. Please try again.",
        variant: "destructive",
      })
      
      throw error
    }
  },

  bulkAddTags: async (ids: string[], tags: string[]) => {
    try {
      const result = await apiClient.bulkUpdateTags(ids, tags, 'add')
      
      if (result.success) {
        get().loadAllDocuments()

        toast({
          title: "Tags added",
          description: `Tags added to ${ids.length} document(s).`,
          variant: "success",
        })
      } else {
        throw new Error(result.error || 'Failed to add tags')
      }
    } catch (error) {
      console.error('Failed to bulk add tags:', error)
      
      toast({
        title: "Operation failed",
        description: "Failed to add tags. Please try again.",
        variant: "destructive",
      })
      
      throw error
    }
  },

  bulkRemoveTags: async (ids: string[], tags: string[]) => {
    try {
      const result = await apiClient.bulkUpdateTags(ids, tags, 'remove')
      
      if (result.success) {
        get().loadAllDocuments()

        toast({
          title: "Tags removed",
          description: `Tags removed from ${ids.length} document(s).`,
          variant: "success",
        })
      } else {
        throw new Error(result.error || 'Failed to remove tags')
      }
    } catch (error) {
      console.error('Failed to bulk remove tags:', error)
      
      toast({
        title: "Operation failed",
        description: "Failed to remove tags. Please try again.",
        variant: "destructive",
      })
      
      throw error
    }
  },

  toggleDocumentSelection: (id: string) => {
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.includes(id)
        ? state.selectedDocumentIds.filter(docId => docId !== id)
        : [...state.selectedDocumentIds, id]
    }))
  },

  selectAllDocuments: () => {
    set((state) => ({
      selectedDocumentIds: state.documents.map(doc => doc.id)
    }))
  },

  clearSelection: () => {
    set({ selectedDocumentIds: [] })
  },
  
  togglePreview: () => set({ isPreviewVisible: !get().isPreviewVisible }),
  toggleSplitView: () => set({ isSplitView: !get().isSplitView }),
  toggleFullscreen: () => set({ isFullscreen: !get().isFullscreen }),
  
  updateSettings: (newSettings) => set({
    settings: { ...get().settings, ...newSettings }
  }),
  
  setAutoSaveState: (state) => set({
    autoSaveState: { ...get().autoSaveState, ...state }
  }),
}))