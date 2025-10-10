import { DocumentService } from '../document/document.service'
import { WorkflowDetectorService } from '../ai/workflow-detector.service'
import nlp from 'compromise'

interface GraphNode {
  id: string
  title: string
  type: string
  tags: string[]
  wordCount: number
  concepts: string[]
  createdAt: Date
  updatedAt: Date
}

interface GraphEdge {
  source: string
  target: string
  weight: number
  sharedConcepts: string[]
  sharedTags: string[]
  connectionType: 'concept' | 'tag' | 'content' | 'temporal'
}

interface KnowledgeGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: DocumentCluster[]
}

interface DocumentCluster {
  id: string
  name: string
  documents: string[]
  centralConcepts: string[]
  type: string
}

export class KnowledgeGraphService {
  private documentService: DocumentService
  private workflowDetector: WorkflowDetectorService

  constructor() {
    this.documentService = new DocumentService()
    this.workflowDetector = new WorkflowDetectorService()
  }

  async buildKnowledgeGraph(userId: string): Promise<KnowledgeGraph> {
    const { documents } = await this.documentService.getDocuments(userId, {
      limit: 1000,
      offset: 0,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    })

    const nodes = this.createNodes(documents)
    const edges = this.createEdges(nodes)
    const clusters = this.identifyClusters(nodes, edges)

    return { nodes, edges, clusters }
  }

  private createNodes(documents: any[]): GraphNode[] {
    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      tags: doc.tags || [],
      wordCount: doc.word_count || 0,
      concepts: this.extractConcepts(doc.content),
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at)
    }))
  }

  private createEdges(nodes: GraphNode[]): GraphEdge[] {
    const edges: GraphEdge[] = []

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]
        
        const connection = this.calculateConnection(nodeA, nodeB)
        if (connection.weight > 0.1) {
          edges.push(connection)
        }
      }
    }

    return edges.sort((a, b) => b.weight - a.weight)
  }

  private calculateConnection(nodeA: GraphNode, nodeB: GraphNode): GraphEdge {
    const sharedConcepts = this.findSharedItems(nodeA.concepts, nodeB.concepts)
    const sharedTags = this.findSharedItems(nodeA.tags, nodeB.tags)
    
    const conceptWeight = sharedConcepts.length * 0.4
    const tagWeight = sharedTags.length * 0.3
    const typeWeight = nodeA.type === nodeB.type ? 0.2 : 0
    const temporalWeight = this.calculateTemporalWeight(nodeA, nodeB) * 0.1

    const totalWeight = conceptWeight + tagWeight + typeWeight + temporalWeight
    
    let connectionType: 'concept' | 'tag' | 'content' | 'temporal' = 'concept'
    if (sharedTags.length > sharedConcepts.length) connectionType = 'tag'
    if (nodeA.type === nodeB.type && sharedConcepts.length === 0) connectionType = 'content'

    return {
      source: nodeA.id,
      target: nodeB.id,
      weight: Math.min(totalWeight, 1.0),
      sharedConcepts,
      sharedTags,
      connectionType
    }
  }

  private findSharedItems(arrayA: string[], arrayB: string[]): string[] {
    return arrayA.filter(item => arrayB.includes(item))
  }

  private calculateTemporalWeight(nodeA: GraphNode, nodeB: GraphNode): number {
    const timeDiff = Math.abs(nodeA.updatedAt.getTime() - nodeB.updatedAt.getTime())
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
    
    if (daysDiff < 1) return 0.8
    if (daysDiff < 7) return 0.5
    if (daysDiff < 30) return 0.2
    return 0
  }

  private extractConcepts(content: string): string[] {
    const doc = nlp(content)
    const concepts: string[] = []

    try {
      const nouns = doc.nouns().out('array') as string[]
      concepts.push(...nouns.filter(noun => noun && noun.length > 3).slice(0, 15))

      const technicalTerms = content.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g) || []
      concepts.push(...technicalTerms.slice(0, 10))
    } catch (error) {
      console.warn('Error extracting concepts:', error)
    }

    return [...new Set(concepts.map(c => c.toLowerCase()))]
  }

  private identifyClusters(nodes: GraphNode[], edges: GraphEdge[]): DocumentCluster[] {
    const clusters: DocumentCluster[] = []
    const typeGroups = this.groupBy(nodes, 'type')
    
    Object.entries(typeGroups).forEach(([type, typeNodes]) => {
      if (typeNodes.length >= 2) {
        const nodeIds = typeNodes.map(n => n.id)
        const allConcepts = typeNodes.flatMap(n => n.concepts)
        const conceptCounts = this.countOccurrences(allConcepts)
        const centralConcepts = Object.entries(conceptCounts)
          .filter(([_, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([concept, _]) => concept)

        clusters.push({
          id: `cluster-${type}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Documents`,
          documents: nodeIds,
          centralConcepts,
          type
        })
      }
    })

    return clusters
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  private countOccurrences(array: string[]): Record<string, number> {
    return array.reduce((counts, item) => {
      counts[item] = (counts[item] || 0) + 1
      return counts
    }, {} as Record<string, number>)
  }

  async getDocumentRecommendations(userId: string, documentId: string, limit = 5): Promise<any[]> {
    const graph = await this.buildKnowledgeGraph(userId)
    const connections = graph.edges
      .filter(e => e.source === documentId || e.target === documentId)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)

    const recommendedIds = connections.map(e => 
      e.source === documentId ? e.target : e.source
    )

    const { documents } = await this.documentService.getDocuments(userId, {
      limit: 1000,
      offset: 0,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    })

    return documents.filter(doc => recommendedIds.includes(doc.id))
  }
}