'use client'

import { KnowledgeGraphViewer } from '@/components/knowledge-graph/knowledge-graph-viewer'
import { useDocumentStore } from '@/stores/document-store'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export default function KnowledgeGraphPage() {
  const { setCurrentDocument, documents } = useDocumentStore()
  const { isGuestMode } = useAuthStore()
  const router = useRouter()
  
  const handleNodeClick = (nodeId: string) => {
    const document = (documents || []).find(doc => doc.id === nodeId)
    if (document) {
      setCurrentDocument(document)
      router.push('/editor')
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border p-4 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Knowledge Graph</h1>
            <p className="text-muted-foreground">
              Visualize connections and relationships between your documents
            </p>
          </div>
          
          {/* ✅ Show guest mode indicator if in guest mode */}
          {isGuestMode && (
            <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              Guest Mode - Data stored locally
            </div>
          )}
        </div>
      </div>
      
      {/* ✅ Knowledge Graph works for both guest and authenticated users */}
      <KnowledgeGraphViewer 
        className="flex-1"
        onNodeClick={handleNodeClick}
      />
    </div>
  )
}