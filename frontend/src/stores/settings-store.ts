// ./frontend/src/stores/settings-store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from './auth-store'

interface UserProfile {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

interface EditorSettings {
  fontSize: number
  lineHeight: number
  wordWrap: boolean
  showLineNumbers: boolean
  fontFamily: string
}

interface NotificationSettings {
  email: boolean
  desktop: boolean
}

interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  editor: EditorSettings
  autoSaveInterval: number
  showPreview: boolean
  splitView: boolean
  notifications: NotificationSettings
}

interface UserStatistics {
  totalDocuments: number
  totalWords: number
  totalReadingTime: number
  documentsByType: Array<{ type: string; count: number }>
}

interface SettingsStore {
  // State
  profile: UserProfile | null
  settings: UserSettings | null
  statistics: UserStatistics | null
  isLoading: boolean
  error: string | null
  
  // Actions
  loadProfile: () => Promise<void>
  updateProfile: (updates: { name?: string; email?: string }) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  
  loadStatistics: () => Promise<void>
  
  exportData: () => Promise<any>
  deleteAccount: (password: string) => Promise<void>
  
  clearError: () => void
}

// ✅ Default settings for guest users
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'auto',
  editor: {
    fontSize: 14,
    lineHeight: 1.6,
    wordWrap: true,
    showLineNumbers: true,
    fontFamily: 'monospace'
  },
  autoSaveInterval: 30000,
  showPreview: true,
  splitView: false,
  notifications: {
    email: false,
    desktop: false
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      settings: DEFAULT_SETTINGS, // ✅ Initialize with defaults
      statistics: null,
      isLoading: false,
      error: null,

      // Load user profile
      loadProfile: async () => {
        const { isAuthenticated, isGuestMode } = useAuthStore.getState()
        
        // ✅ FIX: Don't load if not authenticated or in guest mode
        if (!isAuthenticated || isGuestMode) {
          set({ profile: null, isLoading: false })
          return
        }

        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.get<any>('/api/settings/profile')
          
          if (result.success) {
            set({ profile: result.data, isLoading: false })
          } else {
            throw new Error(result.error || 'Failed to load profile')
          }
        } catch (error) {
          console.error('Failed to load profile:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load profile',
            isLoading: false 
          })
        }
      },

      // Update user profile
      updateProfile: async (updates) => {
        const { isAuthenticated, isGuestMode } = useAuthStore.getState()
        
        if (!isAuthenticated || isGuestMode) {
          throw new Error('Must be logged in to update profile')
        }

        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.put<any>('/api/settings/profile', updates)
          
          if (result.success) {
            set({ profile: result.data, isLoading: false })
          } else {
            throw new Error(result.error || 'Failed to update profile')
          }
        } catch (error) {
          console.error('Failed to update profile:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update profile',
            isLoading: false 
          })
          throw error
        }
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        const { isAuthenticated, isGuestMode } = useAuthStore.getState()
        
        if (!isAuthenticated || isGuestMode) {
          throw new Error('Must be logged in to change password')
        }

        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.post<any>('/api/settings/password', {
            currentPassword,
            newPassword
          })
          
          if (result.success) {
            set({ isLoading: false })
          } else {
            throw new Error(result.error || 'Failed to change password')
          }
        } catch (error) {
          console.error('Failed to change password:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to change password',
            isLoading: false 
          })
          throw error
        }
      },

      // Load user settings
      loadSettings: async () => {
        const { isAuthenticated, isGuestMode } = useAuthStore.getState()
        
        // ✅ FIX: Don't call API if not authenticated or in guest mode
        if (!isAuthenticated || isGuestMode) {
          // Use persisted settings or defaults for guest users
          const current = get().settings
          set({ settings: current || DEFAULT_SETTINGS, isLoading: false })
          return
        }

        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.get<any>('/api/settings/preferences')
          
          if (result.success) {
            set({ settings: result.data, isLoading: false })
          } else {
            throw new Error(result.error || 'Failed to load settings')
          }
        } catch (error) {
          console.error('Failed to load settings:', error)
          // ✅ FIX: Don't throw, just use defaults
          set({ 
            settings: DEFAULT_SETTINGS,
            isLoading: false 
          })
        }
      },

      // Update user settings
      updateSettings: async (updates) => {
        const { isAuthenticated, isGuestMode } = useAuthStore.getState()
        const currentSettings = get().settings || DEFAULT_SETTINGS
        const newSettings = { ...currentSettings, ...updates }
        
        // ✅ FIX: Update locally first for immediate UI update
        set({ settings: newSettings })
        
        // If authenticated and not guest, also update on server
        if (!isAuthenticated || isGuestMode) {
          return // Just save locally for guest users
        }

        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.put<any>('/api/settings/preferences', newSettings)
          
          if (result.success) {
            set({ settings: result.data, isLoading: false })
          } else {
            throw new Error(result.error || 'Failed to update settings')
          }
        } catch (error) {
          console.error('Failed to update settings:', error)
          // Keep local changes even if API fails
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update settings',
            isLoading: false 
          })
        }
      },

      // Load user statistics
      loadStatistics: async () => {
        const { isAuthenticated, isGuestMode } = useAuthStore.getState()
        
        if (!isAuthenticated || isGuestMode) {
          set({ statistics: null, isLoading: false })
          return
        }

        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.get<any>('/api/settings/statistics')
          
          if (result.success) {
            set({ statistics: result.data, isLoading: false })
          } else {
            throw new Error(result.error || 'Failed to load statistics')
          }
        } catch (error) {
          console.error('Failed to load statistics:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load statistics',
            isLoading: false 
          })
        }
      },

      // Export all user data
      exportData: async () => {
        const { isAuthenticated, isGuestMode } = useAuthStore.getState()
        
        if (!isAuthenticated || isGuestMode) {
          throw new Error('Must be logged in to export data')
        }

        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.get<any>('/api/settings/export')
          
          if (result.success) {
            set({ isLoading: false })
            return result.data
          } else {
            throw new Error(result.error || 'Failed to export data')
          }
        } catch (error) {
          console.error('Failed to export data:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to export data',
            isLoading: false 
          })
          throw error
        }
      },

      // Delete user account
      deleteAccount: async (password) => {
        const { isAuthenticated, isGuestMode } = useAuthStore.getState()
        
        if (!isAuthenticated || isGuestMode) {
          throw new Error('Must be logged in to delete account')
        }

        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.delete<any>('/api/settings/account', {
            password
          })
          
          if (result.success) {
            set({ isLoading: false, profile: null, settings: null, statistics: null })
          } else {
            throw new Error(result.error || 'Failed to delete account')
          }
        } catch (error) {
          console.error('Failed to delete account:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete account',
            isLoading: false 
          })
          throw error
        }
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        settings: state.settings, // Only persist settings
      })
    }
  )
)