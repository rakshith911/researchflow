// frontend/src/stores/knowledge-graph-store.ts
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'

interface GraphNode {
  id: string
  title: string
  type: string
  tags: string[]
  wordCount: number
  concepts: string[]
  createdAt: string
  updatedAt: string
}

interface GraphEdge {
  source: string
  target: string
  weight: number
  sharedConcepts: string[]
  sharedTags: string[]
  connectionType: 'concept' | 'tag' | 'content' | 'temporal'
}

interface DocumentCluster {
  id: string
  name: string
  documents: string[]
  centralConcepts: string[]
  type: string
}

interface KnowledgeGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: DocumentCluster[]
}

interface DocumentDetails {
  document: any
  recommendations: any[]
  connectionCount: number
}

interface TooltipData {
  id: string
  title: string
  type: string
  wordCount: number
  tags: string[]
  lastModified: string
  readingTime: number
  connectionCount: number
}

interface KnowledgeGraphStore {
  graph: KnowledgeGraph | null
  selectedNode: GraphNode | null
  documentDetails: DocumentDetails | null
  tooltipData: TooltipData | null
  recommendations: any[]
  isLoading: boolean
  error: string | null
  lastRefreshTime: number // ✅ NEW: Track last refresh to prevent duplicate calls
  
  // Actions
  loadGraph: () => Promise<void>
  selectNode: (nodeId: string) => void
  loadDocumentDetails: (documentId: string) => Promise<void>
  loadTooltipData: (documentId: string) => Promise<void>
  getRecommendations: (documentId: string) => Promise<void>
  clearSelection: () => void
  clearTooltip: () => void
  refreshGraph: () => Promise<void>
  openDocument: (documentId: string) => void
}

export const useKnowledgeGraphStore = create<KnowledgeGraphStore>((set, get) => ({
  graph: null,
  selectedNode: null,
  documentDetails: null,
  tooltipData: null,
  recommendations: [],
  isLoading: false,
  error: null,
  lastRefreshTime: 0,

  loadGraph: async () => {
    // ✅ FIX: Prevent duplicate loads within 1 second
    const now = Date.now()
    const state = get()
    if (state.isLoading || (now - state.lastRefreshTime < 1000)) {
      return
    }

    set({ isLoading: true, error: null, lastRefreshTime: now })
    
    try {
      const result = await apiClient.get<any>('/api/knowledge-graph')
      
      if (result.success) {
        set({ graph: result.data, isLoading: false })
      } else {
        throw new Error(result.error || 'Failed to load graph')
      }
    } catch (error) {
      console.error('Failed to load knowledge graph:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      })
    }
  },

  selectNode: (nodeId: string) => {
    const { graph } = get()
    if (!graph) return
    
    const node = graph.nodes.find(n => n.id === nodeId)
    set({ selectedNode: node || null })
    
    if (node) {
      get().loadDocumentDetails(nodeId)
    }
  },

  loadDocumentDetails: async (documentId: string) => {
    try {
      const result = await apiClient.get<any>(`/api/knowledge-graph/document/${documentId}/details`)
      
      if (result.success) {
        set({ 
          documentDetails: result.data,
          recommendations: result.data.recommendations 
        })
      }
    } catch (error) {
      console.error('Failed to load document details:', error)
    }
  },

  loadTooltipData: async (documentId: string) => {
    try {
      const result = await apiClient.get<any>(`/api/knowledge-graph/document/${documentId}/tooltip`)
      
      if (result.success) {
        set({ tooltipData: result.data })
      }
    } catch (error) {
      console.error('Failed to load tooltip data:', error)
    }
  },

  getRecommendations: async (documentId: string) => {
    try {
      const result = await apiClient.get<any>(`/api/knowledge-graph/recommendations/${documentId}`)
      
      if (result.success) {
        set({ recommendations: result.data })
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error)
    }
  },

  clearSelection: () => {
    set({ selectedNode: null, documentDetails: null, recommendations: [] })
  },

  clearTooltip: () => {
    set({ tooltipData: null })
  },

  refreshGraph: async () => {
    // ✅ FIX: Debounced refresh with explicit reload
    const state = get()
    const now = Date.now()
    
    // If already loading or refreshed within last second, skip
    if (state.isLoading || (now - state.lastRefreshTime < 1000)) {
      console.log('Skipping refresh - too soon or already loading')
      return
    }

    console.log('Refreshing knowledge graph...')
    await get().loadGraph()
  },

  openDocument: (documentId: string) => {
    // Navigate to document editor
    console.log(`Opening document: ${documentId}`)
    // For Next.js App Router:
    window.location.href = `/editor?docId=${documentId}`
    // Or if using Next.js router:
    // router.push(`/editor?docId=${documentId}`)
  }
}))