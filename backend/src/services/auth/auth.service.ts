import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../config/database'
import { User, UserResponse, RegisterRequest, LoginRequest, AuthResponse, JWTPayload } from '../../types/auth.types'
import { logger } from '../../utils/logger'

export class AuthService {
  private readonly JWT_SECRET: string
  private readonly JWT_EXPIRES_IN: string

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.get<User>(
      'SELECT * FROM users WHERE email = ?',
      [data.email]
    )

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10)

    // Create user
    const userId = uuidv4()
    const now = new Date().toISOString()

    await db.run(
      `INSERT INTO users (id, email, password_hash, name, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.email, password_hash, data.name || null, now, now]
    )

    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) {
      throw new Error('Failed to create user')
    }

    const token = this.generateToken(user)
    const userResponse = this.toUserResponse(user)

    logger.info(`User registered: ${user.email}`)

    return { user: userResponse, token }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const db = await getDatabase()

    const user = await db.get<User>(
      'SELECT * FROM users WHERE email = ?',
      [data.email]
    )

    if (!user) {
      throw new Error('Invalid email or password')
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash)
    if (!isPasswordValid) {
      throw new Error('Invalid email or password')
    }

    const token = this.generateToken(user)
    const userResponse = this.toUserResponse(user)

    logger.info(`User logged in: ${user.email}`)

    return { user: userResponse, token }
  }

  async getUserById(userId: string): Promise<UserResponse | null> {
    const db = await getDatabase()
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId])
    
    return user ? this.toUserResponse(user) : null
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  private generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email
  }

  return jwt.sign(payload, this.JWT_SECRET, {
    expiresIn: this.JWT_EXPIRES_IN
  } as jwt.SignOptions)
}

  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  }
}