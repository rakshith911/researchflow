// frontend/src/components/providers/theme-provider.tsx
'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, loadSettings } = useSettingsStore()

  // Apply theme immediately from store on mount (restored from localStorage by persist middleware)
  useEffect(() => {
    // Try to get theme from Zustand persist storage first
    try {
      const stored = localStorage.getItem('settings-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.state?.settings?.theme) {
          applyTheme(parsed.state.settings.theme)
        }
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error)
    }

    // Also load fresh settings from backend
    loadSettings()
  }, [loadSettings])

  // Apply theme whenever settings change
  useEffect(() => {
    if (!settings) return

    applyTheme(settings.theme)

    // Listen for system theme changes if auto mode is enabled
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches)
      }

      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [settings])

  return <>{children}</>
}
