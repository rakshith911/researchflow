export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message: string
  error?: string
}

export type ProfessionalDomain = 'academic' | 'engineering' | 'healthcare' | 'general'

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}
