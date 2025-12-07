import { useState, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TEMPLATES, DocumentTemplate, CATEGORY_CONFIG, TemplateCategory } from '@/config/templates'
import { useSettingsStore } from '@/stores/settings-store'
import { cn } from '@/lib/utils'
import { X, FileText, Upload, Loader2, LayoutGrid, Folder } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface DocumentTemplateSelectorProps {
  onSelect: (type: any, template?: string) => void
  onClose: () => void
}

export function DocumentTemplateSelector({ onSelect, onClose }: DocumentTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const userDomain = useSettingsStore(state => state.settings?.userDomain || 'general')
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    onSelect(template.id, template.content)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    try {
      const result = await apiClient.importTemplateFromPdf(file)

      if (result.success && result.data) {
        toast({
          title: "Success",
          description: "Template imported successfully"
        })
        onSelect('imported-pdf', result.data.content)
      } else {
        toast({
          title: "Import failed",
          description: result.error || 'Failed to import template',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during import",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Filter available categories based on user domain + always include general/supported
  const availableCategories = useMemo(() => {
    // Get all unique categories from templates that match the user domain
    const categories = new Set<TemplateCategory>()
    TEMPLATES.forEach(t => {
      if (t.domain.includes(userDomain) || userDomain === 'general') { // Show mostly everything for general or strictly filter? 
        // Let's filter slightly but keep it open:
        if (t.domain.includes(userDomain) || t.domain.includes('general')) {
          categories.add(t.category)
        }
      }
    })
    return Array.from(categories)
  }, [userDomain])

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesDomain = t.domain.includes(userDomain) || t.domain.includes('general') // Relaxed filtering
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    return matchesDomain && matchesCategory
  })

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl h-[85vh] bg-background border border-border rounded-2xl shadow-2xl flex overflow-hidden"
      >

        {/* Sidebar - Categories */}
        <div className="w-64 border-r border-border bg-muted/10 flex flex-col p-4 space-y-2">
          <div className="px-2 py-3 mb-2">
            <h2 className="text-lg font-semibold tracking-tight">Templates</h2>
            <p className="text-xs text-muted-foreground">Select a category to browse</p>
          </div>

          <Button
            variant={activeCategory === 'all' ? "secondary" : "ghost"}
            className="justify-start w-full"
            onClick={() => setActiveCategory('all')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            All Templates
          </Button>

          <div className="space-y-1">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Folders</p>
            {availableCategories.map(cat => {
              const config = CATEGORY_CONFIG[cat]
              return (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "secondary" : "ghost"}
                  className="justify-start w-full"
                  onClick={() => setActiveCategory(cat)}
                >
                  {config.icon && <config.icon className="mr-2 h-4 w-4" />}
                  {config.label}
                </Button>
              )
            })}
          </div>

          {/* Start Blank Button in Sidebar for quick access */}
          <div className="mt-auto pt-4 border-t border-border">
            <Button variant="default" className="w-full justify-start" onClick={() => onSelect('general')}>
              <FileText className="mr-2 h-4 w-4" />
              Start Blank
            </Button>
          </div>
        </div>

        {/* Main Content - Grid */}
        <div className="flex-1 flex flex-col min-h-0 bg-card/50">
          {/* Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur sticky top-0 z-10">
            <div>
              <h3 className="text-lg font-medium">
                {activeCategory === 'all' ? 'All Templates' : CATEGORY_CONFIG[activeCategory].label}
              </h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {/* Import from PDF Card */}
              <div
                className="group relative border border-dashed border-primary/40 rounded-xl p-4 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center h-48 text-center"
                onClick={handleImportClick}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {isImporting ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
                </div>
                <h4 className="font-semibold text-primary mb-1">Import from PDF</h4>
                <p className="text-xs text-muted-foreground px-4">Upload a paper to extract structure</p>
              </div>

              {filteredTemplates.map((template) => {
                // @ts-ignore
                const CatIcon = CATEGORY_CONFIG[template.category]?.icon || FileText
                return (
                  <motion.div
                    key={template.id}
                    layoutId={template.id}
                    className="group relative bg-background border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer flex flex-col h-48"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <CatIcon className="h-5 w-5 text-foreground group-hover:text-primary" />
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">{template.category.replace('_', ' ')}</Badge>
                    </div>

                    <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">{template.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{template.description}</p>
                  </motion.div>
                )
              })}

              {filteredTemplates.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No templates found in this category for your domain.</p>
                </div>
              )}
            </div>
          </div>
          {/* Removed Footer with Cancel Button */}
        </div>

      </motion.div>
    </div>
  )
}