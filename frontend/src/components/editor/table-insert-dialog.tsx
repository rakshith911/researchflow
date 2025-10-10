'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table as TableIcon, Plus, Minus } from 'lucide-react'

interface TableInsertDialogProps {
  open: boolean
  onClose: () => void
  onInsert: (tableMarkdown: string) => void
}

export function TableInsertDialog({ open, onClose, onInsert }: TableInsertDialogProps) {
  const [rows, setRows] = useState(3)
  const [columns, setColumns] = useState(3)
  const [headers, setHeaders] = useState<string[]>(['Column 1', 'Column 2', 'Column 3'])
  const [includeHeader, setIncludeHeader] = useState(true)
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left')

  const generateTable = (): string => {
    const cols = Math.max(1, Math.min(columns, 10))
    const rowCount = Math.max(1, Math.min(rows, 20))
    
    let table = ''

    // Generate header row
    if (includeHeader) {
      const headerRow = headers.slice(0, cols).map((h, i) => h || `Column ${i + 1}`).join(' | ')
      table += `| ${headerRow} |\n`
      
      // Generate separator
      const alignChar = alignment === 'center' ? ':---:' : alignment === 'right' ? '---:' : '---'
      const separator = Array(cols).fill(alignChar).join(' | ')
      table += `| ${separator} |\n`
    }

    // Generate data rows
    for (let i = 0; i < rowCount; i++) {
      const cells = Array(cols).fill(`Cell ${i + 1}`).join(' | ')
      table += `| ${cells} |\n`
    }

    return table
  }

  const handleInsert = () => {
    const tableMarkdown = generateTable()
    onInsert(tableMarkdown)
    handleClose()
  }

  const handleClose = () => {
    setRows(3)
    setColumns(3)
    setHeaders(['Column 1', 'Column 2', 'Column 3'])
    setIncludeHeader(true)
    setAlignment('left')
    onClose()
  }

  const updateColumns = (newCount: number) => {
    const count = Math.max(1, Math.min(newCount, 10))
    setColumns(count)
    
    // Update headers array
    const newHeaders = [...headers]
    while (newHeaders.length < count) {
      newHeaders.push(`Column ${newHeaders.length + 1}`)
    }
    setHeaders(newHeaders)
  }

  const updateHeaderText = (index: number, text: string) => {
    const newHeaders = [...headers]
    newHeaders[index] = text
    setHeaders(newHeaders)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Table Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows">Rows</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRows(Math.max(1, rows - 1))}
                  disabled={rows <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="20"
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRows(Math.min(20, rows + 1))}
                  disabled={rows >= 20}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="columns">Columns</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateColumns(columns - 1)}
                  disabled={columns <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="columns"
                  type="number"
                  min="1"
                  max="10"
                  value={columns}
                  onChange={(e) => updateColumns(parseInt(e.target.value) || 1)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateColumns(columns + 1)}
                  disabled={columns >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Header Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeHeader"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="includeHeader" className="cursor-pointer">
                Include header row
              </Label>
            </div>
          </div>

          {/* Header Labels */}
          {includeHeader && (
            <div className="space-y-2">
              <Label>Column Headers</Label>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: columns }).map((_, i) => (
                  <Input
                    key={i}
                    value={headers[i] || `Column ${i + 1}`}
                    onChange={(e) => updateHeaderText(i, e.target.value)}
                    placeholder={`Column ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Alignment */}
          <div className="space-y-2">
            <Label>Text Alignment</Label>
            <div className="flex space-x-2">
              <Button
                variant={alignment === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlignment('left')}
                className="flex-1"
              >
                Left
              </Button>
              <Button
                variant={alignment === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlignment('center')}
                className="flex-1"
              >
                Center
              </Button>
              <Button
                variant={alignment === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlignment('right')}
                className="flex-1"
              >
                Right
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="rounded-md bg-gray-50 p-3 border overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre">
                {generateTable()}
              </pre>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>
            <TableIcon className="h-4 w-4 mr-2" />
            Insert Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}