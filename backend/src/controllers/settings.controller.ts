// backend/src/controllers/settings.controller.ts
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { SettingsService } from '../services/settings/settings.service'
import { logger } from '../utils/logger'

const settingsService = new SettingsService()

/**
 * GET /api/settings/profile
 * Get user profile information
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const profile = await settingsService.getUserProfile(req.userId)

    res.json({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    })
  } catch (error) {
    logger.error('Error fetching profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    })
  }
}

/**
 * PUT /api/settings/profile
 * Update user profile (name, email)
 */
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { name, email } = req.body

    const updatedProfile = await settingsService.updateUserProfile(req.userId, {
      name,
      email
    })

    logger.info(`Profile updated for user: ${req.userId}`)
    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    logger.error('Error updating profile:', error)
    
    if (error instanceof Error && error.message === 'Email already in use') {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    })
  }
}

/**
 * POST /api/settings/password
 * Change user password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      })
    }

    const result = await settingsService.changePassword(req.userId, {
      currentPassword,
      newPassword
    })

    logger.info(`Password changed for user: ${req.userId}`)
    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error('Error changing password:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        })
      }
      
      if (error.message.includes('at least 6 characters')) {
        return res.status(400).json({
          success: false,
          error: error.message
        })
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    })
  }
}

/**
 * GET /api/settings/preferences
 * Get user settings (editor preferences, notifications, etc.)
 */
export const getUserSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const settings = await settingsService.getUserSettings(req.userId)

    res.json({
      success: true,
      data: {
        theme: settings.theme,
        editor: {
          fontSize: settings.editor_font_size,
          lineHeight: settings.editor_line_height,
          wordWrap: settings.editor_word_wrap,
          showLineNumbers: settings.editor_show_line_numbers,
          fontFamily: settings.editor_font_family
        },
        autoSaveInterval: settings.auto_save_interval,
        showPreview: settings.show_preview,
        splitView: settings.split_view,
        notifications: {
          email: settings.email_notifications,
          desktop: settings.desktop_notifications
        }
      },
      message: 'Settings retrieved successfully'
    })
  } catch (error) {
    logger.error('Error fetching settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    })
  }
}

/**
 * PUT /api/settings/preferences
 * Update user settings
 */
export const updateUserSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const updates = req.body

    // Transform frontend format to database format
    const dbUpdates: any = {}

    if (updates.theme) dbUpdates.theme = updates.theme
    if (updates.editor) {
      if (updates.editor.fontSize) dbUpdates.editor_font_size = updates.editor.fontSize
      if (updates.editor.lineHeight) dbUpdates.editor_line_height = updates.editor.lineHeight
      if (updates.editor.wordWrap !== undefined) dbUpdates.editor_word_wrap = updates.editor.wordWrap
      if (updates.editor.showLineNumbers !== undefined) dbUpdates.editor_show_line_numbers = updates.editor.showLineNumbers
      if (updates.editor.fontFamily) dbUpdates.editor_font_family = updates.editor.fontFamily
    }
    if (updates.autoSaveInterval) dbUpdates.auto_save_interval = updates.autoSaveInterval
    if (updates.showPreview !== undefined) dbUpdates.show_preview = updates.showPreview
    if (updates.splitView !== undefined) dbUpdates.split_view = updates.splitView
    if (updates.notifications) {
      if (updates.notifications.email !== undefined) dbUpdates.email_notifications = updates.notifications.email
      if (updates.notifications.desktop !== undefined) dbUpdates.desktop_notifications = updates.notifications.desktop
    }

    const updatedSettings = await settingsService.updateUserSettings(req.userId, dbUpdates)

    logger.info(`Settings updated for user: ${req.userId}`)
    res.json({
      success: true,
      data: {
        theme: updatedSettings.theme,
        editor: {
          fontSize: updatedSettings.editor_font_size,
          lineHeight: updatedSettings.editor_line_height,
          wordWrap: updatedSettings.editor_word_wrap,
          showLineNumbers: updatedSettings.editor_show_line_numbers,
          fontFamily: updatedSettings.editor_font_family
        },
        autoSaveInterval: updatedSettings.auto_save_interval,
        showPreview: updatedSettings.show_preview,
        splitView: updatedSettings.split_view,
        notifications: {
          email: updatedSettings.email_notifications,
          desktop: updatedSettings.desktop_notifications
        }
      },
      message: 'Settings updated successfully'
    })
  } catch (error) {
    logger.error('Error updating settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    })
  }
}

/**
 * GET /api/settings/statistics
 * Get user statistics
 */
export const getUserStatistics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const statistics = await settingsService.getUserStatistics(req.userId)

    res.json({
      success: true,
      data: statistics,
      message: 'Statistics retrieved successfully'
    })
  } catch (error) {
    logger.error('Error fetching statistics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    })
  }
}

/**
 * GET /api/settings/export
 * Export all user data
 */
export const exportUserData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const exportData = await settingsService.exportUserData(req.userId)

    logger.info(`Data exported for user: ${req.userId}`)
    res.json({
      success: true,
      data: exportData,
      message: 'Data exported successfully'
    })
  } catch (error) {
    logger.error('Error exporting data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    })
  }
}

/**
 * DELETE /api/settings/account
 * Delete user account
 */
export const deleteUserAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { password } = req.body

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to delete account'
      })
    }

    const result = await settingsService.deleteUserAccount(req.userId, password)

    logger.info(`Account deleted for user: ${req.userId}`)
    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error('Error deleting account:', error)
    
    if (error instanceof Error && error.message === 'Password is incorrect') {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    })
  }
}