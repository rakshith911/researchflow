import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth/auth.service'
import { logger } from '../utils/logger'

const authService = new AuthService()

export interface AuthRequest extends Request {
  userId?: string
  user?: any
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const payload = authService.verifyToken(token)

    req.userId = payload.userId
    req.user = await authService.getUserById(payload.userId)

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      })
    }

    next()
  } catch (error) {
    logger.error('Auth middleware error:', error)
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
  }
}

export function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = authService.verifyToken(token)
      req.userId = payload.userId
    }

    next()
  } catch (error) {
    // Optional auth - continue even if token is invalid
    next()
  }
}