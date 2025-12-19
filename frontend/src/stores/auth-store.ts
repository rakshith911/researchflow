import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isTokenExpired } from '@/lib/auth-utils'

interface User {
  id: string
  email: string
  name?: string
  created_at: Date
  updated_at: Date
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isGuestMode: boolean // ✅ NEW: Track guest mode
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  enterGuestMode: () => void // ✅ NEW: Enter guest mode
  exitGuestMode: () => void // ✅ NEW: Exit guest mode
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuestMode: false,
      isLoading: false,
      error: null,

      // ✅ NEW: Enter guest mode
      enterGuestMode: () => {
        set({
          isGuestMode: true,
          isAuthenticated: false,
          user: null,
          token: null,
          error: null
        })
      },

      // ✅ NEW: Exit guest mode
      exitGuestMode: () => {
        set({
          isGuestMode: false
        })
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Login failed')
          }

          set({
            user: data.data.user,
            token: data.data.token,
            isAuthenticated: true,
            isGuestMode: false, // ✅ Exit guest mode on login
            isLoading: false,
            error: null
          })

          // ✅ NEW: Migrate guest documents
          const { getGuestDocuments, clearGuestDocuments } = await import('./document-store').then(m => m.useDocumentStore.getState())
          const guestDocs = getGuestDocuments()

          if (guestDocs.length > 0) {

            try {
              // Upload each document
              for (const doc of guestDocs) {
                await fetch(`${API_URL}/api/documents`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.data.token}`
                  },
                  body: JSON.stringify({
                    title: doc.title,
                    content: doc.content,
                    type: doc.type,
                    tags: doc.tags
                  })
                })
              }

              clearGuestDocuments()

              // Reload documents to show new ones
              const { loadDocuments } = await import('./document-store').then(m => m.useDocumentStore.getState())
              await loadDocuments()
            } catch (error) {
              console.error('Failed to migrate guest documents:', error)
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false
          })
          throw error
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Registration failed')
          }

          // ✅ TODO: Future feature - migrate guest documents to account
          // const guestDocs = localStorage.getItem('guest-documents')
          // if (guestDocs) {
          //   await migrateGuestDocuments(data.data.token, guestDocs)
          // }

          set({
            user: data.data.user,
            token: data.data.token,
            isAuthenticated: true,
            isGuestMode: false, // ✅ Exit guest mode on register
            isLoading: false,
            error: null
          })

          // ✅ NEW: Migrate guest documents
          const { getGuestDocuments, clearGuestDocuments } = await import('./document-store').then(m => m.useDocumentStore.getState())
          const guestDocs = getGuestDocuments()

          if (guestDocs.length > 0) {

            try {
              // Upload each document
              for (const doc of guestDocs) {
                await fetch(`${API_URL}/api/documents`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.data.token}`
                  },
                  body: JSON.stringify({
                    title: doc.title,
                    content: doc.content,
                    type: doc.type,
                    tags: doc.tags
                  })
                })
              }

              clearGuestDocuments()

              // Reload documents to show new ones
              const { loadDocuments } = await import('./document-store').then(m => m.useDocumentStore.getState())
              await loadDocuments()
            } catch (error) {
              console.error('Failed to migrate guest documents:', error)
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
            isAuthenticated: false
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isGuestMode: false, // ✅ Clear guest mode on logout
          error: null
        })

        // ✅ NEW: Clear all data on logout
        import('./knowledge-graph-store').then(m => m.useKnowledgeGraphStore.getState().clearGraph())
        import('./document-store').then(m => m.useDocumentStore.getState().documents = []) // Reset documents

        // Force reload to clear any stale state
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      },

      checkAuth: async () => {
        const { token } = get()

        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        // Check if token is expired
        if (isTokenExpired(token)) {
          set({ isAuthenticated: false, user: null, token: null })
          return
        }

        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!response.ok) {
            throw new Error('Invalid token')
          }

          const data = await response.json()

          set({
            user: data.data,
            isAuthenticated: true,
            isGuestMode: false
          })
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false
          })
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuestMode: state.isGuestMode // ✅ Persist guest mode
      })
    }
  )
)