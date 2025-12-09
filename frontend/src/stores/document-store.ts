// frontend/src/stores/document-store.ts
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'

const GUEST_STORAGE_KEY = 'researchflow_guest_documents'

export interface Document {
  id: string
  title: string
  content: string
  type: 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general' | 'resume'
  tags: string[]
  createdAt: string
  updatedAt: string
  userId?: string
  isFavorite?: boolean
  version?: number
  wordCount?: number
  readingTime?: number
}

interface AutoSaveState {
  isAutoSaving: boolean
  hasUnsavedChanges: boolean
  lastSaved: string
}

interface DocumentStore {
  documents: Document[]
  favoriteDocuments: Document[]
  recentDocuments: Document[]
  currentDocument: Document | null
  isLoading: boolean
  error: string | null
  autoSaveState: AutoSaveState

  // Actions
  loadDocuments: () => Promise<void>
  loadDocument: (id: string) => Promise<void>
  loadFavorites: () => Promise<void>
  loadRecentDocuments: () => Promise<void>
  createDocument: (type: Document['type'], template?: string) => Promise<void>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  updateDocumentContent: (content: string) => void
  updateDocumentTitle: (title: string) => void
  saveDocument: () => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  setCurrentDocument: (doc: Document | null) => void
  toggleFavorite: (id: string) => Promise<void>

  // Guest mode helpers
  getGuestDocuments: () => Document[]
  saveGuestDocument: (doc: Document) => void
  deleteGuestDocument: (id: string) => void
  clearGuestDocuments: () => void
}

// LocalStorage helpers
const loadFromLocalStorage = (): Document[] => {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(GUEST_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return []
  }
}

const saveToLocalStorage = (docs: Document[]) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(docs))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// Helper to calculate word count and reading time
const calculateStats = (content: string) => {
  const words = content.trim().split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const readingTime = Math.ceil(wordCount / 200) // 200 words per minute
  return { wordCount, readingTime }
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  favoriteDocuments: [],
  recentDocuments: [],
  currentDocument: null,
  isLoading: false,
  error: null,
  autoSaveState: {
    isAutoSaving: false,
    hasUnsavedChanges: false,
    lastSaved: new Date().toISOString()
  },

  // Load all documents
  // Load all documents
  loadDocuments: async () => {
    // ✅ FIXED: Use auth store state instead of fragile localStorage check
    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    if (isGuest) {
      const guestDocs = loadFromLocalStorage()
      set({
        documents: guestDocs,
        recentDocuments: guestDocs.slice(0, 5),
        favoriteDocuments: guestDocs.filter(doc => doc.isFavorite),
        isLoading: false
      })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const result = await apiClient.get<Document[]>('/api/documents')

      if (result.success && result.data) {
        set({
          documents: result.data,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to load documents',
        isLoading: false
      })
    }
  },

  // Load single document
  loadDocument: async (id: string) => {
    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    if (isGuest) {
      const guestDocs = loadFromLocalStorage()
      const doc = guestDocs.find(d => d.id === id)
      if (doc) {
        set({ currentDocument: doc })
      }
      return
    }

    set({ isLoading: true, error: null })
    try {
      const result = await apiClient.get<Document>(`/api/documents/${id}`)

      if (result.success && result.data) {
        set({
          currentDocument: result.data,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Failed to load document:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to load document',
        isLoading: false
      })
    }
  },

  // Load favorite documents
  loadFavorites: async () => {
    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    if (isGuest) {
      const guestDocs = loadFromLocalStorage()
      set({ favoriteDocuments: guestDocs.filter(doc => doc.isFavorite) })
      return
    }

    try {
      const result = await apiClient.get<Document[]>('/api/documents/favorites')
      if (result.success && result.data) {
        set({ favoriteDocuments: result.data })
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
    }
  },

  // Load recent documents
  loadRecentDocuments: async () => {
    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    if (isGuest) {
      const guestDocs = loadFromLocalStorage()
      const sorted = [...guestDocs].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      set({ recentDocuments: sorted.slice(0, 5) })
      return
    }

    try {
      const result = await apiClient.get<Document[]>('/api/documents/recent')
      if (result.success && result.data) {
        set({ recentDocuments: result.data })
      }
    } catch (error) {
      console.error('Failed to load recent documents:', error)
    }
  },

  // Update document content (immediate, local only)
  updateDocumentContent: (content: string) => {
    const current = get().currentDocument
    if (!current) return

    const stats = calculateStats(content)
    const updatedDoc = {
      ...current,
      content,
      ...stats,
      updatedAt: new Date().toISOString()
    }

    set({
      currentDocument: updatedDoc,
      autoSaveState: {
        ...get().autoSaveState,
        hasUnsavedChanges: true
      }
    })
  },

  // Update document title (immediate, local only)
  updateDocumentTitle: (title: string) => {
    const current = get().currentDocument
    if (!current) return

    const updatedDoc = {
      ...current,
      title,
      updatedAt: new Date().toISOString()
    }

    set({
      currentDocument: updatedDoc,
      autoSaveState: {
        ...get().autoSaveState,
        hasUnsavedChanges: true
      }
    })
  },

  // Save current document
  saveDocument: async () => {
    const current = get().currentDocument
    if (!current) return

    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    set({
      autoSaveState: {
        ...get().autoSaveState,
        isAutoSaving: true
      }
    })

    if (isGuest) {
      // Save to localStorage
      const guestDocs = loadFromLocalStorage()
      const index = guestDocs.findIndex(d => d.id === current.id)

      if (index >= 0) {
        guestDocs[index] = current
      } else {
        guestDocs.push(current)
      }

      saveToLocalStorage(guestDocs)

      set({
        documents: guestDocs,
        autoSaveState: {
          isAutoSaving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date().toISOString()
        }
      })
      return
    }

    // Save to API
    try {
      const result = await apiClient.put<Document>(`/api/documents/${current.id}`, {
        title: current.title,
        content: current.content,
        tags: current.tags
      })

      if (result.success && result.data) {
        set({
          currentDocument: result.data,
          documents: get().documents.map(d => d.id === current.id ? result.data! : d),
          autoSaveState: {
            isAutoSaving: false,
            hasUnsavedChanges: false,
            lastSaved: new Date().toISOString()
          }
        })
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      set({
        autoSaveState: {
          ...get().autoSaveState,
          isAutoSaving: false
        }
      })
    }
  },

  // Toggle favorite status
  toggleFavorite: async (id: string) => {
    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    if (isGuest) {
      const guestDocs = loadFromLocalStorage()
      const docIndex = guestDocs.findIndex(d => d.id === id)
      if (docIndex >= 0) {
        guestDocs[docIndex].isFavorite = !guestDocs[docIndex].isFavorite
        saveToLocalStorage(guestDocs)
        set({
          documents: guestDocs,
          favoriteDocuments: guestDocs.filter(doc => doc.isFavorite)
        })
      }
      return
    }

    try {
      const result = await apiClient.post<Document>(`/api/documents/${id}/favorite`, {})
      if (result.success && result.data) {
        const updatedDoc = result.data
        set({
          documents: get().documents.map(d => d.id === id ? updatedDoc : d),
          favoriteDocuments: updatedDoc.isFavorite
            ? [...get().favoriteDocuments, updatedDoc]
            : get().favoriteDocuments.filter(d => d.id !== id)
        })
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  },

  // Create a new document
  createDocument: async (type: Document['type'], template?: string) => {
    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    const newDoc: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Untitled Document',
      content: template || '',
      type,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
      version: 1,
      wordCount: 0,
      readingTime: 0
    }

    if (isGuest) {
      const guestDocs = loadFromLocalStorage()
      guestDocs.unshift(newDoc)
      saveToLocalStorage(guestDocs)
      set({
        documents: guestDocs,
        currentDocument: newDoc,
        recentDocuments: guestDocs.slice(0, 5)
      })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const result = await apiClient.post<Document>('/api/documents', { type, content: template })

      if (result.success && result.data) {
        set({
          documents: [result.data, ...get().documents],
          currentDocument: result.data,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Failed to create document:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to create document',
        isLoading: false
      })
    }
  },

  // Update a document
  updateDocument: async (id: string, updates: Partial<Document>) => {
    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    if (isGuest) {
      const guestDocs = loadFromLocalStorage()
      const docIndex = guestDocs.findIndex(d => d.id === id)

      if (docIndex >= 0) {
        guestDocs[docIndex] = {
          ...guestDocs[docIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        saveToLocalStorage(guestDocs)
        set({
          documents: guestDocs,
          currentDocument: get().currentDocument?.id === id
            ? guestDocs[docIndex]
            : get().currentDocument,
          recentDocuments: [...guestDocs].sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ).slice(0, 5)
        })
      }
      return
    }

    set({ isLoading: true, error: null })
    try {
      const result = await apiClient.put<Document>(`/api/documents/${id}`, updates)

      if (result.success && result.data) {
        set({
          documents: get().documents.map(d => d.id === id ? result.data! : d),
          currentDocument: get().currentDocument?.id === id ? result.data : get().currentDocument,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Failed to update document:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to update document',
        isLoading: false
      })
    }
  },

  // Delete a document
  deleteDocument: async (id: string) => {
    const { isGuestMode, token } = await import('./auth-store').then(m => m.useAuthStore.getState())
    const isGuest = isGuestMode || !token

    if (isGuest) {
      const guestDocs = loadFromLocalStorage().filter(d => d.id !== id)
      saveToLocalStorage(guestDocs)
      set({
        documents: guestDocs,
        currentDocument: get().currentDocument?.id === id ? null : get().currentDocument,
        recentDocuments: guestDocs.slice(0, 5),
        favoriteDocuments: guestDocs.filter(doc => doc.isFavorite)
      })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const result = await apiClient.delete<any>(`/api/documents/${id}`)

      if (result.success) {
        set({
          documents: get().documents.filter(d => d.id !== id),
          currentDocument: get().currentDocument?.id === id ? null : get().currentDocument,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to delete document',
        isLoading: false
      })
    }
  },

  // Set current document
  setCurrentDocument: (doc: Document | null) => {
    set({ currentDocument: doc })
  },

  // Guest mode helpers
  getGuestDocuments: () => {
    return loadFromLocalStorage()
  },

  saveGuestDocument: (doc: Document) => {
    const guestDocs = loadFromLocalStorage()
    const index = guestDocs.findIndex(d => d.id === doc.id)

    if (index >= 0) {
      guestDocs[index] = doc
    } else {
      guestDocs.push(doc)
    }

    saveToLocalStorage(guestDocs)
    set({
      documents: guestDocs,
      recentDocuments: [...guestDocs].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ).slice(0, 5)
    })
  },

  deleteGuestDocument: (id: string) => {
    const guestDocs = loadFromLocalStorage().filter(d => d.id !== id)
    saveToLocalStorage(guestDocs)
    set({
      documents: guestDocs,
      recentDocuments: guestDocs.slice(0, 5),
      favoriteDocuments: guestDocs.filter(doc => doc.isFavorite)
    })
  },

  clearGuestDocuments: () => {
    localStorage.removeItem(GUEST_STORAGE_KEY)
    set({
      documents: [],
      currentDocument: null,
      recentDocuments: [],
      favoriteDocuments: []
    })
  }
}))