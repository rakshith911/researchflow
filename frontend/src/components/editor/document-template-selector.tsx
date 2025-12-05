import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TEMPLATES, DocumentTemplate } from '@/config/templates'
import { useSettingsStore } from '@/stores/settings-store'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { X, FileText, Upload, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'

interface DocumentTemplateSelectorProps {
  onSelect: (type: any, template?: string) => void
  onClose: () => void
}

export function DocumentTemplateSelector({ onSelect, onClose }: DocumentTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const userDomain = useSettingsStore(state => state.settings?.userDomain || 'general')
  const [showAll, setShowAll] = useState(false)
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

  const filteredTemplates = TEMPLATES.filter(t =>
    showAll || t.domain.includes(userDomain)
  )

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto m-4 bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-foreground">Choose a Template</CardTitle>
            <CardDescription className="text-muted-foreground">
              {showAll ? 'Showing all templates' : `Showing templates for ${userDomain} domain`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
              <Label htmlFor="show-all">Show All</Label>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              className="w-full border-dashed border-2 h-24 flex flex-col gap-2 hover:border-primary/50 hover:bg-accent/50"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>Analyzing PDF structure...</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div className="flex flex-col items-center">
                    <span className="font-medium">Import from PDF</span>
                    <span className="text-xs text-muted-foreground font-normal">Upload a paper to extract its template structure</span>
                  </div>
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              // @ts-ignore - Icon is a component in config
              const IconComponent = template.icon || FileText
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50 bg-card"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <CardTitle className="text-lg text-card-foreground">{template.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {template.domain.map(d => (
                        <Badge key={d} variant="outline" className="w-fit capitalize text-xs">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                You can always change the template later or start with a blank document.
              </p>
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={() => onSelect('general')}>
                  Start Blank
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}