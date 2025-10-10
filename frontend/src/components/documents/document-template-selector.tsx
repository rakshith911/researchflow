'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  onSelectTemplate: (type: string, template?: string) => void
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
      research: 'bg-blue-50 border-blue-200 text-blue-700',
      engineering: 'bg-green-50 border-green-200 text-green-700',
      healthcare: 'bg-red-50 border-red-200 text-red-700',
      meeting: 'bg-purple-50 border-purple-200 text-purple-700',
      general: 'bg-gray-50 border-gray-200 text-gray-700'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>Smart Document Templates</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[60vh]">
          {/* Category Sidebar */}
          <div className="w-48 border-r pr-4 space-y-2">
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
          <div className="flex-1 pl-4 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${getTypeColor(template.type)}`}
                  onClick={() => onSelectTemplate(template.type)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <template.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
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
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate('general')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Blank Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate('meeting')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Quick Meeting
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate('research')}
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