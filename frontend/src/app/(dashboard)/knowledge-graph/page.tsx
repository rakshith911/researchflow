'use client'

import { KnowledgeGraphViewer } from '@/components/knowledge-graph/knowledge-graph-viewer'
import { useDocumentStore } from '@/stores/document-store'
import { useRouter } from 'next/navigation'

export default function KnowledgeGraphPage() {
  const { setCurrentDocument, documents } = useDocumentStore()
  const router = useRouter()
  
  const handleNodeClick = (nodeId: string) => {
    const document = documents.find(doc => doc.id === nodeId)
    if (document) {
      setCurrentDocument(document)
      router.push('/editor')
    }
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Knowledge Graph</h1>
        <p className="text-muted-foreground">
          Visualize connections and relationships between your documents
        </p>
      </div>
      
      <KnowledgeGraphViewer 
        className="flex-1"
        onNodeClick={handleNodeClick}
      />
    </div>
  )
}
