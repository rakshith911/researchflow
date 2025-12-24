// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express'
import { AuthService } from '../services/auth/auth.service'
import { AuthRequest } from '../middleware/auth.middleware'
import { logger } from '../utils/logger'

const authService = new AuthService()

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    const result = await authService.register({
      email: email.toLowerCase(),
      password,
      name
    })

    logger.info(`User registered: ${email}`)

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully'
    })
  } catch (error) {
    logger.error('Registration error:', error)

    // Security: Don't expose internal error details
    const errorMessage = error instanceof Error && error.message.includes('exists')
      ? 'Registration failed. Email may already be in use.'
      : 'Registration failed. Please try again.'

    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const result = await authService.login({
      email: email.toLowerCase(),
      password
    })

    logger.info(`User logged in: ${email}`)

    res.json({
      success: true,
      data: result,
      message: 'Login successful'
    })
  } catch (error) {
    logger.warn('Failed login attempt')

    // Security: Use generic error message to prevent user enumeration
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    })
  }
}

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const user = await authService.getUserById(req.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    })
  } catch (error) {
    logger.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    })
  }
}

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // Note: With JWT, logout is handled client-side by removing the token
    logger.info(`User logged out: ${req.userId}`)

    res.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    })
  }
}