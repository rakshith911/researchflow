import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { BacklinksService } from '../services/document/backlinks.service'
import { logger } from '../utils/logger'

const backlinksService = new BacklinksService()

export const getBacklinks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const backlinks = await backlinksService.findBacklinks(req.userId, id)
    
    res.json({
      success: true,
      data: backlinks,
      message: 'Backlinks retrieved successfully'
    })
  } catch (error) {
    logger.error('Error fetching backlinks:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch backlinks'
    })
  }
}

export const searchForLinking = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { q } = req.query
    const results = await backlinksService.searchDocumentsForLinking(req.userId, q as string || '')
    
    res.json({
      success: true,
      data: results,
      message: 'Search completed successfully'
    })
  } catch (error) {
    logger.error('Error searching for linking:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search documents'
    })
  }
}

export const updateDocumentLinks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { id } = req.params
    const { content } = req.body
    
    await backlinksService.updateDocumentLinks(req.userId, id, content)
    
    res.json({
      success: true,
      message: 'Document links updated successfully'
    })
  } catch (error) {
    logger.error('Error updating document links:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update document links'
    })
  }
}

export const validateWikiLink = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { title } = req.query
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title parameter is required'
      })
    }
    
    const isValid = await backlinksService.validateWikiLink(req.userId, title as string)
    
    res.json({
      success: true,
      data: { isValid },
      message: 'Validation completed'
    })
  } catch (error) {
    logger.error('Error validating wiki link:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to validate link'
    })
  }
}