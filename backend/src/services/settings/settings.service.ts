// backend/src/services/settings/settings.service.ts
import { getDatabase } from '../../config/database'
import { logger } from '../../utils/logger'
import bcrypt from 'bcryptjs'

interface UserSettings {
  user_id: string
  theme: 'light' | 'dark' | 'auto'
  editor_font_size: number
  editor_line_height: number
  editor_word_wrap: boolean
  editor_show_line_numbers: boolean
  editor_font_family: string
  auto_save_interval: number
  show_preview: boolean
  split_view: boolean
  email_notifications: boolean
  desktop_notifications: boolean
  created_at: string
  updated_at: string
}

interface UpdateProfileInput {
  name?: string
  email?: string
}

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export class SettingsService {
  /**
   * Get user profile information
   */
  async getUserProfile(userId: string) {
    const db = await getDatabase()
    
    const user = await db.get(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }
  }

  /**
   * Update user profile (name, email)
   */
  async updateUserProfile(userId: string, updates: UpdateProfileInput) {
    const db = await getDatabase()
    
    const updateFields: string[] = []
    const params: any[] = []

    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      params.push(updates.name)
    }

    if (updates.email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [updates.email, userId]
      )

      if (existingUser) {
        throw new Error('Email already in use')
      }

      updateFields.push('email = ?')
      params.push(updates.email)
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update')
    }

    updateFields.push('updated_at = ?')
    params.push(new Date().toISOString())
    params.push(userId)

    await db.run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    )

    logger.info(`User profile updated: ${userId}`)
    return await this.getUserProfile(userId)
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, input: ChangePasswordInput) {
    const db = await getDatabase()
    
    // Get current password hash
    const user = await db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    )

    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      input.currentPassword,
      user.password_hash
    )

    if (!isValidPassword) {
      throw new Error('Current password is incorrect')
    }

    // Validate new password
    if (input.newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters')
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, 10)

    // Update password
    await db.run(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [newPasswordHash, new Date().toISOString(), userId]
    )

    logger.info(`Password changed for user: ${userId}`)
    return { success: true, message: 'Password changed successfully' }
  }

  /**
   * Get user settings (editor preferences, notifications, etc.)
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    const db = await getDatabase()
    
    let settings = await db.get<UserSettings>(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    )

    // If no settings exist, create default settings
    if (!settings) {
      settings = await this.createDefaultSettings(userId)
    }

    return settings
  }

  /**
   * Create default settings for a new user
   */
  private async createDefaultSettings(userId: string): Promise<UserSettings> {
    const db = await getDatabase()
    const now = new Date().toISOString()

    const defaultSettings = {
      user_id: userId,
      theme: 'light',
      editor_font_size: 14,
      editor_line_height: 1.6,
      editor_word_wrap: true,
      editor_show_line_numbers: true,
      editor_font_family: 'monospace',
      auto_save_interval: 3000,
      show_preview: true,
      split_view: true,
      email_notifications: true,
      desktop_notifications: false,
      created_at: now,
      updated_at: now
    }

    await db.run(
      `INSERT INTO user_settings (
        user_id, theme, editor_font_size, editor_line_height, 
        editor_word_wrap, editor_show_line_numbers, editor_font_family,
        auto_save_interval, show_preview, split_view,
        email_notifications, desktop_notifications,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        defaultSettings.user_id,
        defaultSettings.theme,
        defaultSettings.editor_font_size,
        defaultSettings.editor_line_height,
        defaultSettings.editor_word_wrap ? 1 : 0,
        defaultSettings.editor_show_line_numbers ? 1 : 0,
        defaultSettings.editor_font_family,
        defaultSettings.auto_save_interval,
        defaultSettings.show_preview ? 1 : 0,
        defaultSettings.split_view ? 1 : 0,
        defaultSettings.email_notifications ? 1 : 0,
        defaultSettings.desktop_notifications ? 1 : 0,
        defaultSettings.created_at,
        defaultSettings.updated_at
      ]
    )

    logger.info(`Default settings created for user: ${userId}`)
    return defaultSettings as UserSettings
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId: string, updates: Partial<UserSettings>) {
    const db = await getDatabase()
    
    // Get existing settings or create defaults
    await this.getUserSettings(userId)

    const updateFields: string[] = []
    const params: any[] = []

    // Map of allowed settings fields
    const allowedFields = [
      'theme',
      'editor_font_size',
      'editor_line_height',
      'editor_word_wrap',
      'editor_show_line_numbers',
      'editor_font_family',
      'auto_save_interval',
      'show_preview',
      'split_view',
      'email_notifications',
      'desktop_notifications'
    ]

    allowedFields.forEach(field => {
      if (updates[field as keyof UserSettings] !== undefined) {
        updateFields.push(`${field} = ?`)
        
        // Convert boolean to integer for SQLite
        const value = updates[field as keyof UserSettings]
        if (typeof value === 'boolean') {
          params.push(value ? 1 : 0)
        } else {
          params.push(value)
        }
      }
    })

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update')
    }

    updateFields.push('updated_at = ?')
    params.push(new Date().toISOString())
    params.push(userId)

    await db.run(
      `UPDATE user_settings SET ${updateFields.join(', ')} WHERE user_id = ?`,
      params
    )

    logger.info(`Settings updated for user: ${userId}`)
    return await this.getUserSettings(userId)
  }

  /**
   * Delete user account (with all associated data)
   */
  async deleteUserAccount(userId: string, password: string) {
    const db = await getDatabase()
    
    // Verify password before deletion
    const user = await db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    )

    if (!user) {
      throw new Error('User not found')
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      throw new Error('Password is incorrect')
    }

    // Delete user (CASCADE will delete documents and settings)
    await db.run('DELETE FROM users WHERE id = ?', [userId])

    logger.info(`User account deleted: ${userId}`)
    return { success: true, message: 'Account deleted successfully' }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string) {
    const db = await getDatabase()
    
    const stats = await db.get(
      `SELECT 
        COUNT(*) as total_documents,
        SUM(word_count) as total_words,
        SUM(reading_time) as total_reading_time
      FROM documents 
      WHERE user_id = ?`,
      [userId]
    )

    const documentsByType = await db.all(
      `SELECT type, COUNT(*) as count 
      FROM documents 
      WHERE user_id = ? 
      GROUP BY type`,
      [userId]
    )

    return {
      totalDocuments: stats?.total_documents || 0,
      totalWords: stats?.total_words || 0,
      totalReadingTime: stats?.total_reading_time || 0,
      documentsByType: documentsByType.map(item => ({
        type: item.type,
        count: item.count
      }))
    }
  }

  /**
   * Export all user data (for GDPR compliance)
   */
  async exportUserData(userId: string) {
    const db = await getDatabase()
    
    // Get user profile
    const profile = await this.getUserProfile(userId)
    
    // Get user settings
    const settings = await this.getUserSettings(userId)
    
    // Get all documents
    const documents = await db.all(
      'SELECT * FROM documents WHERE user_id = ?',
      [userId]
    )

    // Get statistics
    const statistics = await this.getUserStatistics(userId)

    return {
      profile,
      settings,
      documents: documents.map(doc => ({
        ...doc,
        tags: JSON.parse(doc.tags),
        linked_documents: JSON.parse(doc.linked_documents),
        collaborators: JSON.parse(doc.collaborators)
      })),
      statistics,
      exportedAt: new Date().toISOString()
    }
  }
}