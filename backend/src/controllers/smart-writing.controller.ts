import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { SmartLinkingService } from '../services/ai/smart-linking.service'
import { logger } from '../utils/logger'

const smartLinkingService = new SmartLinkingService()

export const analyzeWritingContext = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { content, documentId, documentType } = req.body

    if (!content || !documentId || !documentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, documentId, documentType'
      })
    }

    const analysis = await smartLinkingService.analyzeWritingContext(
      req.userId,
      content,
      documentId,
      documentType
    )

    res.json({
      success: true,
      data: analysis,
      message: 'Writing context analyzed successfully'
    })
  } catch (error) {
    logger.error('Error analyzing writing context:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze writing context'
    })
  }
}

export const suggestLinks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const { selectedText, documentId } = req.body

    if (!selectedText || !documentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: selectedText, documentId'
      })
    }

    const suggestions = await smartLinkingService.suggestLinksForSelection(
      req.userId,
      selectedText,
      documentId
    )

    res.json({
      success: true,
      data: suggestions,
      message: 'Link suggestions generated successfully'
    })
  } catch (error) {
    logger.error('Error suggesting links:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate link suggestions'
    })
  }
}