export interface User {
  id: string
  email: string
  password_hash: string
  name?: string
  created_at: Date
  updated_at: Date
}

export interface UserResponse {
  id: string
  email: string
  name?: string
  created_at: Date
  updated_at: Date
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: UserResponse
  token: string
}

export interface JWTPayload {
  userId: string
  email: string
}