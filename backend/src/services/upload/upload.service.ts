// backend/src/services/upload/upload.service.ts
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import { getDatabase } from '../../config/database'
import { logger } from '../../utils/logger'

export interface UploadedFile {
  id: string
  userId: string
  documentId?: string
  filename: string
  originalFilename: string
  mimeType: string
  size: number
  filePath: string
  url: string
  uploadedAt: string
}

export class UploadService {
  private uploadsDir: string

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'data', 'uploads')
    this.ensureUploadDirectories()
  }

  /**
   * Ensure upload directories exist
   */
  private async ensureUploadDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true })
      await fs.mkdir(path.join(this.uploadsDir, 'images'), { recursive: true })
      await fs.mkdir(path.join(this.uploadsDir, 'attachments'), { recursive: true })
      logger.info('Upload directories verified')
    } catch (error) {
      logger.error('Failed to create upload directories:', error)
      throw error
    }
  }

  /**
   * Save uploaded file
   */
  async saveFile(
    userId: string,
    file: Express.Multer.File,
    documentId?: string
  ): Promise<UploadedFile> {
    try {
      const db = await getDatabase()
      const fileId = uuidv4()
      
      // Generate unique filename
      const ext = path.extname(file.originalname)
      const filename = `${fileId}${ext}`
      
      // Determine subfolder based on mime type
      const subfolder = file.mimetype.startsWith('image/') ? 'images' : 'attachments'
      const filePath = path.join(this.uploadsDir, subfolder, filename)
      
      // Save file to disk
      await fs.writeFile(filePath, file.buffer)
      
      // Generate URL
      const url = `/api/upload/${subfolder}/${filename}`
      
      // Save to database
      const uploadedAt = new Date().toISOString()
      await db.run(
        `INSERT INTO uploads (id, user_id, document_id, filename, original_filename, mime_type, size, file_path, url, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fileId, userId, documentId || null, filename, file.originalname, file.mimetype, file.size, filePath, url, uploadedAt]
      )

      logger.info(`File uploaded: ${filename} by user ${userId}`)

      return {
        id: fileId,
        userId,
        documentId,
        filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath,
        url,
        uploadedAt
      }
    } catch (error) {
      logger.error('Error saving file:', error)
      throw error
    }
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string, userId: string): Promise<UploadedFile | null> {
    try {
      const db = await getDatabase()
      const file = await db.get(
        `SELECT * FROM uploads WHERE id = ? AND user_id = ?`,
        [fileId, userId]
      )

      if (!file) return null

      return {
        id: file.id,
        userId: file.user_id,
        documentId: file.document_id,
        filename: file.filename,
        originalFilename: file.original_filename,
        mimeType: file.mime_type,
        size: file.size,
        filePath: file.file_path,
        url: file.url,
        uploadedAt: file.uploaded_at
      }
    } catch (error) {
      logger.error('Error getting file:', error)
      throw error
    }
  }

  /**
   * Get all files for a user
   */
  async getUserFiles(userId: string, documentId?: string): Promise<UploadedFile[]> {
    try {
      const db = await getDatabase()
      
      let query = 'SELECT * FROM uploads WHERE user_id = ?'
      const params: any[] = [userId]
      
      if (documentId) {
        query += ' AND document_id = ?'
        params.push(documentId)
      }
      
      query += ' ORDER BY uploaded_at DESC'
      
      const files = await db.all(query, params)

      return files.map(file => ({
        id: file.id,
        userId: file.user_id,
        documentId: file.document_id,
        filename: file.filename,
        originalFilename: file.original_filename,
        mimeType: file.mime_type,
        size: file.size,
        filePath: file.file_path,
        url: file.url,
        uploadedAt: file.uploaded_at
      }))
    } catch (error) {
      logger.error('Error getting user files:', error)
      throw error
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const db = await getDatabase()
      
      // Get file info first
      const file = await this.getFile(fileId, userId)
      if (!file) return false

      // Delete from disk
      try {
        await fs.unlink(file.filePath)
        logger.info(`File deleted from disk: ${file.filename}`)
      } catch (error) {
        logger.warn(`Failed to delete file from disk: ${file.filePath}`, error)
      }

      // Delete from database
      const result = await db.run(
        'DELETE FROM uploads WHERE id = ? AND user_id = ?',
        [fileId, userId]
      )

      return (result.changes || 0) > 0
    } catch (error) {
      logger.error('Error deleting file:', error)
      throw error
    }
  }

  /**
   * Get file path for serving
   */
  async getFilePath(filename: string, subfolder: 'images' | 'attachments'): Promise<string | null> {
    try {
      const filePath = path.join(this.uploadsDir, subfolder, filename)
      
      // Check if file exists
      try {
        await fs.access(filePath)
        return filePath
      } catch {
        return null
      }
    } catch (error) {
      logger.error('Error getting file path:', error)
      return null
    }
  }

  /**
   * Clean up orphaned files (files not linked to any document after 7 days)
   */
  async cleanupOrphanedFiles(): Promise<number> {
    try {
      const db = await getDatabase()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const orphanedFiles = await db.all(
        `SELECT * FROM uploads 
         WHERE document_id IS NULL 
         AND uploaded_at < ?`,
        [sevenDaysAgo.toISOString()]
      )

      let deletedCount = 0
      for (const file of orphanedFiles) {
        try {
          await fs.unlink(file.file_path)
          await db.run('DELETE FROM uploads WHERE id = ?', [file.id])
          deletedCount++
        } catch (error) {
          logger.warn(`Failed to delete orphaned file: ${file.filename}`, error)
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} orphaned files`)
      }

      return deletedCount
    } catch (error) {
      logger.error('Error cleaning up orphaned files:', error)
      throw error
    }
  }

  /**
   * Link file to document
   */
  async linkFileToDocument(fileId: string, documentId: string, userId: string): Promise<boolean> {
    try {
      const db = await getDatabase()
      const result = await db.run(
        'UPDATE uploads SET document_id = ? WHERE id = ? AND user_id = ?',
        [documentId, fileId, userId]
      )

      return (result.changes || 0) > 0
    } catch (error) {
      logger.error('Error linking file to document:', error)
      throw error
    }
  }

  /**
   * Get storage statistics for user
   */
  async getUserStorageStats(userId: string): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const db = await getDatabase()
      const stats = await db.get(
        `SELECT COUNT(*) as total_files, SUM(size) as total_size 
         FROM uploads WHERE user_id = ?`,
        [userId]
      )

      return {
        totalFiles: stats?.total_files || 0,
        totalSize: stats?.total_size || 0
      }
    } catch (error) {
      logger.error('Error getting storage stats:', error)
      throw error
    }
  }
}