'use client'


import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs' // Import Tabs
import {
  FileText,
  Microscope,
  Code,
  Heart,
  Users,
  BookOpen,
  Zap,
  Brain,
  X
} from 'lucide-react'

interface DocumentTemplateSelectorProps {
  onSelectTemplate: (type: string, template?: string, format?: 'markdown' | 'latex') => void // Updated signature
  onClose: () => void
}

interface Template {
  id: string
  name: string
  description: string
  type: 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general'
  icon: any
  features: string[]
  estimatedTime: string
}

export function DocumentTemplateSelector({ onSelectTemplate, onClose }: DocumentTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'latex'>('markdown') // New state

  const templates: Template[] = [
    {
      id: 'research-paper',
      name: 'Research Paper',
      description: 'Comprehensive academic research document with methodology and citations',
      type: 'research',
      icon: Microscope,
      features: ['Abstract', 'Literature Review', 'Methodology', 'Results', 'References'],
      estimatedTime: '2-4 hours'
    },
    {
      id: 'literature-review',
      name: 'Literature Review',
      description: 'Systematic review of existing research in your field',
      type: 'research',
      icon: BookOpen,
      features: ['Source Analysis', 'Thematic Organization', 'Critical Evaluation', 'Gap Identification'],
      estimatedTime: '3-6 hours'
    },
    {
      id: 'tech-spec',
      name: 'Technical Specification',
      description: 'Detailed technical documentation for software projects',
      type: 'engineering',
      icon: Code,
      features: ['Architecture', 'API Design', 'Database Schema', 'Testing Strategy'],
      estimatedTime: '1-3 hours'
    },
    {
      id: 'api-docs',
      name: 'API Documentation',
      description: 'Comprehensive API documentation with examples',
      type: 'engineering',
      icon: Zap,
      features: ['Endpoints', 'Request/Response', 'Authentication', 'Examples'],
      estimatedTime: '2-4 hours'
    },
    {
      id: 'clinical-protocol',
      name: 'Clinical Protocol',
      description: 'Standardized medical procedure documentation',
      type: 'healthcare',
      icon: Heart,
      features: ['Patient Criteria', 'Procedure Steps', 'Safety Guidelines', 'Outcomes'],
      estimatedTime: '1-2 hours'
    },
    {
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Structured meeting documentation with action items',
      type: 'meeting',
      icon: Users,
      features: ['Agenda', 'Discussion Points', 'Action Items', 'Follow-up'],
      estimatedTime: '30-60 minutes'
    },
    {
      id: 'project-plan',
      name: 'Project Plan',
      description: 'Comprehensive project planning document',
      type: 'general',
      icon: Brain,
      features: ['Objectives', 'Timeline', 'Resources', 'Risk Assessment'],
      estimatedTime: '2-3 hours'
    }
  ]

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'research', name: 'Research', count: templates.filter(t => t.type === 'research').length },
    { id: 'engineering', name: 'Engineering', count: templates.filter(t => t.type === 'engineering').length },
    { id: 'healthcare', name: 'Healthcare', count: templates.filter(t => t.type === 'healthcare').length },
    { id: 'meeting', name: 'Meeting', count: templates.filter(t => t.type === 'meeting').length },
    { id: 'general', name: 'General', count: templates.filter(t => t.type === 'general').length }
  ]

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.type === selectedCategory)

  const getTypeColor = (type: string) => {
    const colors = {
      research: 'bg-blue-500/10 border-blue-500/30 dark:bg-blue-500/20 dark:border-blue-500/40',
      engineering: 'bg-green-500/10 border-green-500/30 dark:bg-green-500/20 dark:border-green-500/40',
      healthcare: 'bg-red-500/10 border-red-500/30 dark:bg-red-500/20 dark:border-red-500/40',
      meeting: 'bg-purple-500/10 border-purple-500/30 dark:bg-purple-500/20 dark:border-purple-500/40',
      general: 'bg-muted border-border'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  const getIconColor = (type: string) => {
    const colors = {
      research: 'text-blue-600 dark:text-blue-400',
      engineering: 'text-green-600 dark:text-green-400',
      healthcare: 'text-red-600 dark:text-red-400',
      meeting: 'text-purple-600 dark:text-purple-400',
      general: 'text-muted-foreground'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-background border-border flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-foreground">Smart Document Templates</span>
            </div>

            {/* Format Selection Toggle */}
            <div className="flex items-center space-x-2 mr-8">
              <span className="text-sm font-medium text-muted-foreground line-clamp-1">Editor Format:</span>
              <Tabs value={selectedFormat} onValueChange={(val) => setSelectedFormat(val as 'markdown' | 'latex')} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="markdown" className="text-xs">Markdown</TabsTrigger>
                  <TabsTrigger value="latex" className="text-xs">LaTeX</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button variant="ghost" size="sm" onClick={onClose} className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-48 border-r border-border pr-4 space-y-2 pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Categories</h3>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                size="sm"
                className="w-full justify-between"
                onClick={() => setSelectedCategory(category.id)}
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="flex-1 pl-4 overflow-y-auto pt-4">
            <div className={`mb-4 p-4 rounded-lg border ${selectedFormat === 'latex' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-full ${selectedFormat === 'latex' ? 'bg-orange-500/10 text-orange-600' : 'bg-blue-500/10 text-blue-600'}`}>
                  {selectedFormat === 'latex' ? <Code className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <p className="text-sm text-foreground font-medium">
                  {selectedFormat === 'latex' ? 'LaTeX Mode Selected' : 'Markdown WYSIWYG Mode Selected'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-9">
                {selectedFormat === 'latex'
                  ? 'You will be editing raw LaTeX code. Ideal for precise academic formatting and equations.'
                  : 'You will be editing in a rich-text environment. Ideal for quick drafting and general writing.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${getTypeColor(template.type)}`}
                  onClick={() => onSelectTemplate(template.type, template.id, selectedFormat)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-background rounded-lg shadow-sm border border-border">
                          <template.icon className={`h-5 w-5 ${getIconColor(template.type)}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base text-foreground">{template.name}</CardTitle>
                          <Badge variant="outline" className="text-xs capitalize mt-1">
                            {template.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">
                          INCLUDES
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {template.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{template.estimatedTime}</span>
                        <Badge variant="outline" className="text-xs">
                          AI-Optimized
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium text-foreground mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate('general', 'blank', selectedFormat)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Blank Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate('meeting', 'meeting', selectedFormat)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Quick Meeting
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate('research', 'research', selectedFormat)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Research Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}