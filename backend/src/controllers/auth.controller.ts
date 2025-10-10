// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express'
import { AuthService } from '../services/auth/auth.service'
import { AuthRequest } from '../middleware/auth.middleware'
import { logger } from '../utils/logger'

const authService = new AuthService()

// Security: Input sanitization helper
function sanitizeInput(input: string): string {
  if (!input) return ''
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove XSS characters
    .substring(0, 255) // Limit length
}

// Security: Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

// Security: Password strength validation
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const minLength = parseInt(process.env.MIN_PASSWORD_LENGTH || '8')

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`)
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Check for special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return { valid: errors.length === 0, errors }
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    // Security: Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
    }

    // Security: Email format validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      })
    }

    // Security: Strong password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      })
    }

    // Security: Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.toLowerCase())
    const sanitizedName = name ? sanitizeInput(name) : undefined

    const result = await authService.register({ 
      email: sanitizedEmail, 
      password, 
      name: sanitizedName 
    })

    logger.info(`User registered: ${sanitizedEmail}`)

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

    // Security: Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
    }

    // Security: Sanitize email
    const sanitizedEmail = sanitizeInput(email.toLowerCase())

    const result = await authService.login({ 
      email: sanitizedEmail, 
      password 
    })

    logger.info(`User logged in: ${sanitizedEmail}`)

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