import { DocumentService } from './document.service'
import { logger } from '../../utils/logger'

interface WikiLink {
  title: string
  displayText?: string
  position: { start: number; end: number }
}

interface Backlink {
  documentId: string
  documentTitle: string
  documentType: string
  excerpt: string
  linkCount: number
}

export class BacklinksService {
  private documentService: DocumentService

  constructor() {
    this.documentService = new DocumentService()
  }

  extractWikiLinks(content: string): WikiLink[] {
    const links: WikiLink[] = []
    const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
    let match

    while ((match = regex.exec(content)) !== null) {
      links.push({
        title: match[1].trim(),
        displayText: match[2]?.trim(),
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      })
    }

    return links
  }

  async findBacklinks(userId: string, documentId: string): Promise<Backlink[]> {
    try {
      const targetDoc = await this.documentService.getDocument(userId, documentId)
      if (!targetDoc) {
        return []
      }

      const { documents } = await this.documentService.getDocuments(userId, {
        limit: 10000,
        offset: 0,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      })

      const backlinks: Backlink[] = []

      for (const doc of documents) {
        if (doc.id === documentId) continue

        const links = this.extractWikiLinks(doc.content)
        const matchingLinks = links.filter(link => 
          link.title.toLowerCase() === targetDoc.title.toLowerCase()
        )

        if (matchingLinks.length > 0) {
          const firstLink = matchingLinks[0]
          const excerpt = this.getExcerpt(doc.content, firstLink.position.start)

          backlinks.push({
            documentId: doc.id,
            documentTitle: doc.title,
            documentType: doc.type,
            excerpt,
            linkCount: matchingLinks.length
          })
        }
      }

      return backlinks
    } catch (error) {
      logger.error('Error finding backlinks:', error)
      return []
    }
  }

  async searchDocumentsForLinking(userId: string, query: string): Promise<Array<{ id: string; title: string; type: string }>> {
    try {
      const { documents } = await this.documentService.getDocuments(userId, {
        limit: 50,
        offset: 0,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      })

      if (!query) {
        return documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.type
        }))
      }

      const searchTerm = query.toLowerCase()
      return documents
        .filter(doc => doc.title.toLowerCase().includes(searchTerm))
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.type
        }))
        .slice(0, 10)
    } catch (error) {
      logger.error('Error searching documents for linking:', error)
      return []
    }
  }

  async updateDocumentLinks(userId: string, documentId: string, content: string): Promise<void> {
    try {
      const links = this.extractWikiLinks(content)
      const { documents } = await this.documentService.getDocuments(userId, {
        limit: 10000,
        offset: 0,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      })

      const linkedDocumentIds: string[] = []
      for (const link of links) {
        const linkedDoc = documents.find(
          doc => doc.title.toLowerCase() === link.title.toLowerCase()
        )
        if (linkedDoc) {
          linkedDocumentIds.push(linkedDoc.id)
        }
      }

      await this.documentService.updateDocument(userId, documentId, {
        linked_documents: JSON.stringify([...new Set(linkedDocumentIds)])
      } as any)
    } catch (error) {
      logger.error('Error updating document links:', error)
    }
  }

  private getExcerpt(content: string, position: number, contextLength = 100): string {
    const start = Math.max(0, position - contextLength)
    const end = Math.min(content.length, position + contextLength)
    
    let excerpt = content.substring(start, end).trim()
    
    if (start > 0) excerpt = '...' + excerpt
    if (end < content.length) excerpt = excerpt + '...'
    
    return excerpt
  }

  async validateWikiLink(userId: string, title: string): Promise<boolean> {
    try {
      const { documents } = await this.documentService.getDocuments(userId, {
        limit: 10000,
        offset: 0,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      })

      return documents.some(
        doc => doc.title.toLowerCase() === title.toLowerCase()
      )
    } catch (error) {
      logger.error('Error validating wiki link:', error)
      return false
    }
  }
}