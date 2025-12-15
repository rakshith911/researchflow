// backend/src/services/document/document.service.ts
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../config/database'
import { logger } from '../../utils/logger'

interface Document {
  id: string
  user_id: string
  title: string
  content: string
  type: 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general'
  format: 'markdown' | 'latex'
  tags: string
  linked_documents: string
  collaborators: string
  created_at: string
  updated_at: string
  last_accessed_at: string | null
  version: number
  word_count: number
  reading_time: number
  is_favorite: boolean
}

interface DocumentFilters {
  type?: string
  tags?: string[]
  limit: number
  offset: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface CreateDocumentInput {
  title: string
  content: string
  type: Document['type']
  format?: 'markdown' | 'latex'
  tags: string[]
  linkedDocuments: string[]
  collaborators: string[]
}

export class DocumentService {
  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  private calculateReadingTime(wordCount: number): number {
    return Math.ceil(wordCount / 200)
  }

  async createDocument(userId: string, input: CreateDocumentInput): Promise<Document> {
    const db = await getDatabase()
    const id = uuidv4()
    const now = new Date().toISOString()
    const wordCount = this.calculateWordCount(input.content)

    await db.run(
      `INSERT INTO documents (
        id, user_id, title, content, type, format, tags, linked_documents, 
        collaborators, created_at, updated_at, last_accessed_at, version, 
        word_count, reading_time, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        input.title,
        input.content,
        input.type,
        input.format || 'markdown', // Default
        JSON.stringify(input.tags),
        JSON.stringify(input.linkedDocuments),
        JSON.stringify(input.collaborators),
        now,
        now,
        now,
        1,
        wordCount,
        this.calculateReadingTime(wordCount),
        false
      ]
    )

    const document = await db.get<Document>('SELECT * FROM documents WHERE id = ?', [id])
    if (!document) {
      throw new Error('Failed to create document')
    }

    logger.info(`Document created: ${id}`)
    return this.parseDocument(document)
  }

  async getDocument(userId: string, id: string, updateLastAccessed: boolean = false): Promise<Document | null> {
    const db = await getDatabase()

    if (updateLastAccessed) {
      await db.run(
        'UPDATE documents SET last_accessed_at = ? WHERE id = ? AND user_id = ?',
        [new Date().toISOString(), id, userId]
      )
    }

    const document = await db.get<Document>(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    return document ? this.parseDocument(document) : null
  }

  async getDocuments(userId: string, filters: DocumentFilters): Promise<{ documents: Document[], total: number }> {
    const db = await getDatabase()

    let query = 'SELECT * FROM documents WHERE user_id = ?'
    const params: any[] = [userId]

    if (filters.type) {
      query += ' AND type = ?'
      params.push(filters.type)
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ')
      query += ` AND (${tagConditions})`
      filters.tags.forEach(tag => params.push(`%"${tag}"%`))
    }

    query += ` ORDER BY ${filters.sortBy} ${filters.sortOrder.toUpperCase()}`
    query += ` LIMIT ? OFFSET ?`
    params.push(filters.limit, filters.offset)

    const documents = await db.all<Document[]>(query, params)
    const countResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM documents WHERE user_id = ?',
      [userId]
    )

    return {
      documents: documents.map(doc => this.parseDocument(doc)),
      total: countResult?.count || 0
    }
  }

  async updateDocument(userId: string, id: string, updates: Partial<Document>): Promise<Document | null> {
    const db = await getDatabase()

    const document = await this.getDocument(userId, id)
    if (!document) {
      return null
    }

    const now = new Date().toISOString()
    let wordCount = document.word_count
    let readingTime = document.reading_time

    if (updates.content !== undefined) {
      wordCount = this.calculateWordCount(updates.content)
      readingTime = this.calculateReadingTime(wordCount)
    }

    const updateFields: string[] = []
    const params: any[] = []

    if (updates.title !== undefined) {
      updateFields.push('title = ?')
      params.push(updates.title)
    }
    if (updates.content !== undefined) {
      updateFields.push('content = ?')
      params.push(updates.content)
      updateFields.push('word_count = ?')
      params.push(wordCount)
      updateFields.push('reading_time = ?')
      params.push(readingTime)
    }
    if (updates.type !== undefined) {
      updateFields.push('type = ?')
      params.push(updates.type)
    }
    if (updates.tags !== undefined) {
      updateFields.push('tags = ?')
      params.push(JSON.stringify(updates.tags))
    }
    if (updates.linked_documents !== undefined) {
      updateFields.push('linked_documents = ?')
      params.push(JSON.stringify(updates.linked_documents))
    }

    updateFields.push('updated_at = ?')
    params.push(now)
    updateFields.push('version = version + 1')

    params.push(id, userId)

    await db.run(
      `UPDATE documents SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    )

    logger.info(`Document updated: ${id}`)
    return await this.getDocument(userId, id)
  }

  async deleteDocument(userId: string, id: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.run(
      'DELETE FROM documents WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    logger.info(`Document deleted: ${id}`)
    return (result.changes || 0) > 0
  }

  async searchDocuments(
    userId: string,
    query: string,
    options: { type?: string, limit: number, offset: number }
  ): Promise<{ documents: Document[], total: number }> {
    const db = await getDatabase()

    let sql = `
      SELECT * FROM documents 
      WHERE user_id = ? 
      AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
    `
    const params: any[] = [userId, `%${query}%`, `%${query}%`, `%${query}%`]

    if (options.type) {
      sql += ' AND type = ?'
      params.push(options.type)
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count')
    const countResult = await db.get<{ count: number }>(countSql, params)

    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    params.push(options.limit, options.offset)

    const documents = await db.all<Document[]>(sql, params)

    return {
      documents: documents.map(doc => this.parseDocument(doc)),
      total: countResult?.count || 0
    }
  }

  async duplicateDocument(userId: string, id: string): Promise<Document> {
    const db = await getDatabase()
    const originalDoc = await this.getDocument(userId, id)

    if (!originalDoc) {
      throw new Error('Document not found')
    }

    const newId = uuidv4()
    const now = new Date().toISOString()
    const newTitle = `${originalDoc.title} (Copy)`

    await db.run(
      `INSERT INTO documents (
        id, user_id, title, content, type, tags, linked_documents, 
        collaborators, created_at, updated_at, last_accessed_at, version, 
        word_count, reading_time, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        userId,
        newTitle,
        originalDoc.content,
        originalDoc.type,
        JSON.stringify(originalDoc.tags),
        JSON.stringify(originalDoc.linked_documents),
        JSON.stringify(originalDoc.collaborators),
        now,
        now,
        now,
        1,
        originalDoc.word_count,
        originalDoc.reading_time,
        false
      ]
    )

    const newDocument = await db.get<Document>('SELECT * FROM documents WHERE id = ?', [newId])
    if (!newDocument) {
      throw new Error('Failed to duplicate document')
    }

    logger.info(`Document duplicated: ${id} -> ${newId}`)
    return this.parseDocument(newDocument)
  }

  async toggleFavorite(userId: string, id: string): Promise<Document | null> {
    const db = await getDatabase()
    const document = await this.getDocument(userId, id)

    if (!document) {
      return null
    }

    const newFavoriteStatus = !document.is_favorite

    await db.run(
      'UPDATE documents SET is_favorite = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [newFavoriteStatus ? 1 : 0, new Date().toISOString(), id, userId]
    )

    logger.info(`Document favorite toggled: ${id} -> ${newFavoriteStatus}`)
    return await this.getDocument(userId, id)
  }

  async getFavorites(
    userId: string,
    options: { limit: number, offset: number }
  ): Promise<{ documents: Document[], total: number }> {
    const db = await getDatabase()

    const countResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND is_favorite = 1',
      [userId]
    )

    const documents = await db.all<Document[]>(
      `SELECT * FROM documents 
       WHERE user_id = ? AND is_favorite = 1 
       ORDER BY updated_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, options.limit, options.offset]
    )

    return {
      documents: documents.map(doc => this.parseDocument(doc)),
      total: countResult?.count || 0
    }
  }

  async getRecentDocuments(userId: string, limit: number): Promise<Document[]> {
    const db = await getDatabase()

    const documents = await db.all<Document[]>(
      `SELECT * FROM documents 
       WHERE user_id = ? AND last_accessed_at IS NOT NULL
       ORDER BY last_accessed_at DESC 
       LIMIT ?`,
      [userId, limit]
    )

    return documents.map(doc => this.parseDocument(doc))
  }

  async bulkDeleteDocuments(userId: string, documentIds: string[]): Promise<number> {
    const db = await getDatabase()

    if (documentIds.length === 0) {
      return 0
    }

    const placeholders = documentIds.map(() => '?').join(',')
    const result = await db.run(
      `DELETE FROM documents WHERE user_id = ? AND id IN (${placeholders})`,
      [userId, ...documentIds]
    )

    const deletedCount = result.changes || 0
    logger.info(`Bulk deleted ${deletedCount} documents for user: ${userId}`)
    return deletedCount
  }

  async bulkUpdateTags(
    userId: string,
    documentIds: string[],
    tags: string[],
    operation: 'add' | 'remove' | 'replace'
  ): Promise<number> {
    const db = await getDatabase()

    if (documentIds.length === 0) {
      return 0
    }

    let updatedCount = 0

    for (const docId of documentIds) {
      const document = await this.getDocument(userId, docId)
      if (!document) continue

      // document.tags is already parsed by getDocument() -> parseDocument()
      const currentTags = Array.isArray(document.tags) ? document.tags : []
      let newTags: string[]

      switch (operation) {
        case 'add':
          newTags = [...new Set([...currentTags, ...tags])]
          break
        case 'remove':
          newTags = currentTags.filter(tag => !tags.includes(tag))
          break
        case 'replace':
          newTags = tags
          break
        default:
          newTags = currentTags
      }

      await db.run(
        'UPDATE documents SET tags = ?, updated_at = ? WHERE id = ? AND user_id = ?',
        [JSON.stringify(newTags), new Date().toISOString(), docId, userId]
      )

      updatedCount++
    }

    logger.info(`Bulk updated tags for ${updatedCount} documents for user: ${userId}`)
    return updatedCount
  }

  private parseDocument(doc: Document): Document {
    return {
      ...doc,
      tags: JSON.parse(doc.tags as any),
      linked_documents: JSON.parse(doc.linked_documents as any),
      collaborators: JSON.parse(doc.collaborators as any),
      is_favorite: Boolean(doc.is_favorite)
    }
  }
}