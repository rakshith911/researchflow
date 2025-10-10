export interface Document {
  id: string
  title: string
  content: string // Markdown content
  type: DocumentType
  tags: string[]
  linkedDocuments: string[]
  collaborators: string[]
  createdAt: Date
  updatedAt: Date
  version: number
  lastEditedBy?: string
  wordCount: number
  readingTime: number // minutes
}

export type DocumentType = 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general'

export interface DocumentTemplate {
  id: string
  name: string
  type: DocumentType
  description: string
  content: string
  icon: string
}

export interface DocumentSettings {
  showPreview: boolean
  splitView: boolean
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  lineHeight: number
  wordWrap: boolean
  showLineNumbers: boolean
}

export interface AutoSaveState {
  lastSaved: Date
  hasUnsavedChanges: boolean
  isAutoSaving: boolean
}
