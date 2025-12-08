import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { ChatService } from '../services/ai/chat.service'
import { logger } from '../utils/logger'

const chatService = new ChatService()

export const chatWithDocument = async (req: AuthRequest, res: Response) => {
    try {
        // Allow guests (no userId) but flag them
        const isGuest = !req.userId
        const userId = req.userId

        const { messages, documentContext, documentType, documentId } = req.body

        if (!messages || !documentContext || (userId && !documentId)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: messages, documentContext, documentId'
            })
        }

        const response = await chatService.chatWithDocument(
            messages,
            documentContext,
            documentType || 'general',
            isGuest,
            userId,
            documentId
        )

        res.json({
            success: true,
            data: { message: response }
        })
    } catch (error) {
        logger.error('Error in chat controller:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to process chat request'
        })
    }
}

export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            })
        }

        const { documentId } = req.params

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Missing documentId'
            })
        }

        const history = await chatService.getChatHistory(documentId, req.userId)

        res.json({
            success: true,
            data: history
        })
    } catch (error) {
        logger.error('Error fetching chat history:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat history'
        })
    }
}
