export interface Document {
  id: string
  title: string
  content: string
  type: DocumentType
  tags: string[]
  linkedDocuments: string[]
  collaborators: string[]
  createdAt: Date
  updatedAt: Date
  version: number
  lastEditedBy?: string
  wordCount: number
  readingTime: number
}

export type DocumentType = 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general'

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
