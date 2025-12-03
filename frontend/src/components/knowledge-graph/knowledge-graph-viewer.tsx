// frontend/src/components/knowledge-graph/knowledge-graph-viewer.tsx
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
  Minimize2,
  Network,
  FileText,
  ExternalLink,
  X
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
    openDocument,
    refreshGraph
  } = useKnowledgeGraphStore()

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const simulationRef = useRef<any>(null)
  const zoomBehaviorRef = useRef<any>(null)

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  useEffect(() => {
    if (graph && svgRef.current) {
      // Stop any existing simulation
      if (simulationRef.current) {
        simulationRef.current.stop()
        simulationRef.current = null
      }

      // Clear any existing zoom behavior
      if (zoomBehaviorRef.current && svgRef.current) {
        d3.select(svgRef.current).on('.zoom', null)
      }

      renderGraph()
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
        simulationRef.current = null
      }
    }
  }, [graph, filterType])

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

    const width = 800
    const height = 600

    // Filter nodes and edges
    let filteredNodes = graph.nodes
    if (filterType !== 'all') {
      filteredNodes = graph.nodes.filter(node => node.type === filterType)
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

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

    simulationRef.current = simulation

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoomLevel(event.transform.k)
      })

    zoomBehaviorRef.current = zoom
    svg.call(zoom as any)

    const g = svg.append('g')

    // Always draw cluster backgrounds
    const clusterGroup = g.append('g').attr('class', 'clusters')

    if (graph.clusters && graph.clusters.length > 0) {
      graph.clusters.forEach((cluster) => {
        const clusterNodes = filteredNodes.filter(node =>
          cluster.documents.includes(node.id)
        )

        if (clusterNodes.length > 1) {
          const clusterPath = clusterGroup.append('path')
            .attr('class', 'cluster-path')
            .attr('fill', getNodeColor(cluster.type))
            .attr('fill-opacity', 0.1)
            .attr('stroke', getNodeColor(cluster.type))
            .attr('stroke-opacity', 0.3)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')

          const updateClusterHull = () => {
            const positions: [number, number][] = clusterNodes
              .map(d => {
                const x = (d as any).x || 0
                const y = (d as any).y || 0
                return [x, y] as [number, number]
              })
              .filter(pos => !isNaN(pos[0]) && !isNaN(pos[1]))

            if (positions.length > 2) {
              const hull = d3.polygonHull(positions)
              if (hull) {
                clusterPath.attr('d', `M${hull.join('L')}Z`)
              }
            }
          }

          simulation.on(`tick.cluster-${cluster.id}`, updateClusterHull)
        }
      })
    }

    // Draw edges
    const links = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredEdges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', (d: any) => d.weight)
      .attr('stroke-width', (d: any) => Math.max(1, d.weight * 3))

    // Draw nodes
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation()
        selectNode(d.id)
        if (onNodeClick) {
          onNodeClick(d.id)
        }
      })
      .on('dblclick', (event, d: any) => {
        event.stopPropagation()
        openDocument(d.id)
      })
      .on('mouseover', async function (event, d: any) {
        d3.select(this).select('circle').attr('stroke-width', 4)

        await loadTooltipData(d.id)
        const store = useKnowledgeGraphStore.getState()
        const tooltipInfo = store.tooltipData

        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'kg-tooltip')
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
              <span style="color: #aaa;">Words:</span><span>${(d.wordCount || 0).toLocaleString()}</span>
              ${tooltipInfo ? `
                <span style="color: #aaa;">Reading:</span><span>${tooltipInfo.readingTime} min</span>
                <span style="color: #aaa;">Connections:</span><span>${tooltipInfo.connectionCount}</span>
              ` : ''}
            </div>
            ${d.tags && d.tags.length > 0 ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                <div style="color: #aaa; font-size: 10px; margin-bottom: 4px;">TAGS</div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  ${d.tags.slice(0, 3).map((tag: string) => `
                    <span style="background: #333; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${tag}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444; font-size: 10px; color: #888;">
              Click to select • Double-click to open
            </div>
          `)

        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').attr('stroke-width', 2)
        d3.selectAll('.kg-tooltip').remove()
      })
      .call(d3.drag<any, any>()
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
        }))

    // ✅ FIX: Add circle to each node group
    nodes.append('circle')
      .attr('r', (d: any) => getNodeSize(d.wordCount))
      .attr('fill', (d: any) => getNodeColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // ✅ FIX: Add text label with proper dark mode styling
    nodes.append('text')
      .attr('dx', (d: any) => getNodeSize(d.wordCount) + 5)
      .attr('dy', '0.35em')
      .text((d: any) => d.title)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', 'currentColor')
      .attr('class', 'text-foreground')
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    // Update positions on each tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })
  }

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1.3)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 0.7)
    }
  }

  const handleRefresh = async () => {
    await refreshGraph()
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (isLoading && !graph) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-background", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-background", className)}>
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load knowledge graph</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-background", className)}>
        <div className="text-center max-w-md">
          <Network className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">No Connections Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create documents and add [[wiki links]] to see connections in your knowledge graph
          </p>
          <Button onClick={() => window.location.href = '/editor'}>
            Create Your First Document
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex h-full",
      isFullscreen && "fixed inset-0 z-50 bg-background",
      className
    )}>
      <div className="flex-1 flex flex-col bg-background">
        {/* Toolbar */}
        <div className="border-b border-border p-3 flex items-center justify-between bg-background">
          <div className="flex items-center space-x-3">
            <Network className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Knowledge Graph</h3>
              <p className="text-xs text-muted-foreground">
                {graph.nodes.length} documents • {graph.edges.length} connections
              </p>
            </div>
            {isLoading && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-md text-sm bg-background text-foreground"
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
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              title="Refresh Graph"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Graph Canvas */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-background">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="border-0"
            viewBox="0 0 800 600"
            style={{ background: 'transparent' }}
          />

          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium shadow-md text-foreground">
            Zoom: {(zoomLevel * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Side Panel */}
      {selectedNode && (
        <div className="w-80 border-l border-border bg-background overflow-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Document Details</h3>
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
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card className="mb-4 bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-card-foreground">{selectedNode.title}</CardTitle>
                <div className="flex items-center space-x-2 flex-wrap">
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
                    <h4 className="text-sm font-medium mb-2 text-foreground">Tags</h4>
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
                    <h4 className="text-sm font-medium mb-2 text-foreground">Key Concepts</h4>
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
                    <h4 className="text-sm font-medium mb-2 text-foreground">Reading Time</h4>
                    <p className="text-sm text-muted-foreground">
                      {documentDetails.document.readingTime} minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {recommendations.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-card-foreground">Related Documents</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {recommendations.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="p-3 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          selectNode(doc.id)
                          if (onNodeClick) onNodeClick(doc.id)
                        }}
                        onDoubleClick={() => openDocument(doc.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-foreground">{doc.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {doc.type} • {(doc.wordCount || 0).toLocaleString()} words • {doc.readingTime || 0}min read
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