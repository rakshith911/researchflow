import { useState, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TEMPLATES, DocumentTemplate, CATEGORY_CONFIG, TemplateCategory } from '@/config/templates'
import { useSettingsStore } from '@/stores/settings-store'
import { cn } from '@/lib/utils'
import { X, FileText, Upload, Loader2, LayoutGrid, Folder, Search, Star } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [isZipImporting, setIsZipImporting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    onSelect(template.id, template.content)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleZipClick = () => {
    zipInputRef.current?.click()
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
        onSelect(result.data.type || 'imported-pdf', result.data.content)
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

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple extension check since mime type for zip can vary
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .zip file",
        variant: "destructive"
      })
      return
    }

    setIsZipImporting(true)
    try {
      const result = await apiClient.importZip(file)

      if (result.success && result.data) {
        toast({
          title: "Success",
          description: `Imported project: ${result.data.filename}`
        })
        onSelect('imported-zip', result.data.content)
      } else {
        toast({
          title: "Import failed",
          description: result.error || 'Failed to import zip',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during zip import",
        variant: "destructive"
      })
    } finally {
      setIsZipImporting(false)
      if (zipInputRef.current) {
        zipInputRef.current.value = ''
      }
    }
  }

  // Filter available categories based on user domain + always include general/supported
  const availableCategories = useMemo(() => {
    const categories = new Set<TemplateCategory>()
    TEMPLATES.forEach(t => {
      if (t.domain.includes(userDomain) || t.domain.includes('general')) {
        categories.add(t.category)
      }
    })
    return Array.from(categories)
  }, [userDomain])

  const filteredTemplates = useMemo(() => {
    let templates = TEMPLATES.filter(t => {
      const matchesDomain = t.domain.includes(userDomain) || t.domain.includes('general')
      const matchesCategory = activeCategory === 'all' || t.category === activeCategory
      const query = searchQuery.toLowerCase()
      const matchesSearch = !query ||
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))

      return matchesDomain && matchesCategory && matchesSearch
    })

    // Sort: Featured first
    return templates.sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return 0
    })
  }, [userDomain, activeCategory, searchQuery])

  // Prevent hydration mismatch and ensure document.body exists
  if (!mounted) return null

  return createPortal(
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
          <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur sticky top-0 z-10 gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9 bg-background/50 border-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </Button>
            </div>
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

              {/* Import from ZIP Card */}
              <div
                className="group relative border border-dashed border-primary/40 rounded-xl p-4 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center h-48 text-center"
                onClick={handleZipClick}
              >
                <input type="file" ref={zipInputRef} className="hidden" accept=".zip" onChange={handleZipChange} />
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {isZipImporting ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Folder className="h-5 w-5 text-primary" />}
                </div>
                <h4 className="font-semibold text-primary mb-1">Import Project (.zip)</h4>
                <p className="text-xs text-muted-foreground px-4">Upload LaTeX/text project folder</p>
              </div>

              {filteredTemplates.map((template) => {
                // @ts-ignore
                const CatIcon = CATEGORY_CONFIG[template.category]?.icon || FileText
                return (
                  <motion.div
                    key={template.id}
                    layoutId={template.id}
                    className="group relative bg-background border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer flex flex-col h-auto min-h-[12rem]"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          <CatIcon className="h-5 w-5 text-foreground group-hover:text-primary" />
                        </div>
                        {template.featured && (
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                            <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">{template.category.replace('_', ' ')}</Badge>
                    </div>

                    <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">{template.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{template.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                      {template.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground uppercase tracking-wide">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )
              })}

              {filteredTemplates.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No templates found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </div>,
    document.body
  )
}