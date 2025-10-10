'use client'

import { useEffect, useRef, useState } from 'react'
import { useKnowledgeGraphStore } from '@/stores/knowledge-graph-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import * as d3 from 'd3'
import { 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Filter,
  Info,
  Network,
  FileText,
  ExternalLink
} from 'lucide-react'

interface KnowledgeGraphViewerProps {
  className?: string
  onNodeClick?: (nodeId: string) => void
}

export function KnowledgeGraphViewer({ className, onNodeClick }: KnowledgeGraphViewerProps) {
  const { 
    graph, 
    selectedNode, 
    documentDetails,
    recommendations,
    isLoading, 
    error, 
    loadGraph, 
    selectNode, 
    loadTooltipData,
    clearTooltip,
    clearSelection,
    openDocument
  } = useKnowledgeGraphStore()
  
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [showClusters, setShowClusters] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  useEffect(() => {
    if (graph && svgRef.current) {
      renderGraph()
    }
  }, [graph, filterType, showClusters])

  const getNodeColor = (type: string) => {
    const colors = {
      research: '#3B82F6',
      engineering: '#10B981', 
      healthcare: '#EF4444',
      meeting: '#8B5CF6',
      general: '#6B7280'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  const getNodeSize = (wordCount: number) => {
    return Math.max(8, Math.min(20, wordCount / 50))
  }

  const renderGraph = () => {
    if (!graph || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 800
    const height = 600
    
    // Filter nodes and edges based on current filter
    let filteredNodes = graph.nodes
    if (filterType !== 'all') {
      filteredNodes = graph.nodes.filter(node => node.type === filterType)
    }
    
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredEdges = graph.edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )

    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredEdges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoomLevel(event.transform.k)
      })

    svg.call(zoom as any)

    const g = svg.append('g')

    // Draw clusters if enabled
    if (showClusters) {
      graph.clusters.forEach((cluster, index) => {
        const clusterNodes = filteredNodes.filter(node => 
          cluster.documents.includes(node.id)
        )
        
        if (clusterNodes.length > 1) {
          const hull = d3.polygonHull(clusterNodes.map(d => [d.x || 0, d.y || 0]))
          if (hull) {
            g.append('path')
              .datum(hull)
              .attr('class', 'cluster')
              .attr('fill', getNodeColor(cluster.type))
              .attr('fill-opacity', 0.1)
              .attr('stroke', getNodeColor(cluster.type))
              .attr('stroke-opacity', 0.3)
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '5,5')
          }
        }
      })
    }

    // Draw edges
    const links = g.append('g')
      .selectAll('line')
      .data(filteredEdges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', (d: any) => d.weight)
      .attr('stroke-width', (d: any) => Math.max(1, d.weight * 3))

    // Draw nodes
    const nodes = g.append('g')
      .selectAll('circle')
      .data(filteredNodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => getNodeSize(d.wordCount))
      .attr('fill', (d: any) => getNodeColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        if (event.detail === 1) {
          // Single click - select node
          selectNode(d.id)
          if (onNodeClick) {
            onNodeClick(d.id)
          }
        }
      })
      .on('dblclick', (event, d: any) => {
        // Double click - open document
        event.stopPropagation()
        openDocument(d.id)
      })
      .on('mouseover', async function(event, d: any) {
        d3.select(this).attr('stroke-width', 4)
        
        // Load enhanced tooltip data
        await loadTooltipData(d.id)
        const store = useKnowledgeGraphStore.getState()
        const tooltipInfo = store.tooltipData
        
        // Show enhanced tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.9)')
          .style('color', 'white')
          .style('padding', '12px')
          .style('border-radius', '8px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.3)')
          .style('max-width', '250px')
          .html(`
            <div style="border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 8px;">
              <strong style="font-size: 14px;">${d.title}</strong>
            </div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 11px;">
              <span style="color: #aaa;">Type:</span><span style="text-transform: capitalize;">${d.type}</span>
              <span style="color: #aaa;">Words:</span><span>${d.wordCount.toLocaleString()}</span>
              <span style="color: #aaa;">Reading:</span><span>${tooltipInfo?.readingTime || Math.ceil(d.wordCount / 200)} min</span>
              <span style="color: #aaa;">Connections:</span><span>${tooltipInfo?.connectionCount || '...'}</span>
            </div>
            ${d.tags.length > 0 ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                <div style="font-size: 10px; color: #aaa; margin-bottom: 4px;">Tags:</div>
                <div>${d.tags.slice(0, 3).map((tag: string) => `<span style="background: #333; padding: 2px 6px; border-radius: 4px; margin-right: 4px; font-size: 10px;">${tag}</span>`).join('')}</div>
              </div>
            ` : ''}
            <div style="margin-top: 8px; font-size: 10px; color: #666;">
              Click to view details • Double-click to open
            </div>
          `)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-width', 2)
        d3.selectAll('.tooltip').remove()
        clearTooltip()
      })

    // Add labels
    const labels = g.append('g')
      .selectAll('text')
      .data(filteredNodes)
      .enter()
      .append('text')
      .text((d: any) => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title)
      .attr('font-size', '10px')
      .attr('dx', 12)
      .attr('dy', 4)
      .style('pointer-events', 'none')

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      nodes
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
    })

    // Drag behavior
    const drag = d3.drag()
      .on('start', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d: any) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    nodes.call(drag as any)
  }

  const zoomIn = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      (d3.zoom() as any).scaleBy,
      1.2
    )
  }

  const zoomOut = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      (d3.zoom() as any).scaleBy,
      0.8
    )
  }

  const resetZoom = () => {
    const svg = d3.select(svgRef.current)
    svg.transition().call(
      (d3.zoom() as any).transform,
      d3.zoomIdentity
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Building knowledge graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading graph: {error}</p>
          <Button onClick={loadGraph}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex h-full", className)}>
      {/* Graph Visualization */}
      <div className="flex-1 flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Knowledge Graph</h2>
            {graph && (
              <Badge variant="secondary">
                {graph.nodes.length} documents, {graph.edges.length} connections
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="research">Research</option>
              <option value="engineering">Engineering</option>
              <option value="healthcare">Healthcare</option>
              <option value="meeting">Meeting</option>
              <option value="general">General</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClusters(!showClusters)}
            >
              {showClusters ? 'Hide' : 'Show'} Clusters
            </Button>
            
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={resetZoom}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={loadGraph}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Graph Canvas */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="border"
            viewBox="0 0 800 600"
          >
          </svg>
          
          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 bg-white/90 px-2 py-1 rounded text-xs">
            Zoom: {(zoomLevel * 100).toFixed(0)}%
          </div>
        </div>
      </div>
      
      {/* Enhanced Side Panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-background overflow-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Document Details</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openDocument(selectedNode.id)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Open
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  ×
                </Button>
              </div>
            </div>
            
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{selectedNode.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    style={{ 
                      backgroundColor: `${getNodeColor(selectedNode.type)}20`,
                      borderColor: getNodeColor(selectedNode.type)
                    }}
                  >
                    {selectedNode.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedNode.wordCount.toLocaleString()} words
                  </span>
                  {documentDetails && (
                    <span className="text-sm text-muted-foreground">
                      • {documentDetails.connectionCount} connections
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {selectedNode.tags.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.tags.slice(0, 5).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedNode.concepts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Concepts</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.concepts.slice(0, 8).map((concept, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {documentDetails?.document && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Reading Time</h4>
                    <p className="text-sm text-muted-foreground">
                      {documentDetails.document.readingTime} minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Related Documents</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {recommendations.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          selectNode(doc.id)
                          if (onNodeClick) onNodeClick(doc.id)
                        }}
                        onDoubleClick={() => {
                          openDocument(doc.id)
                        }}
                        >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {doc.type} • {doc.wordCount.toLocaleString()} words • {doc.readingTime}min read
                            </p>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}