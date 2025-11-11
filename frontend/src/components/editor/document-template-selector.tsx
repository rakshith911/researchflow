'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, FileText, Code, Heart, Users, BookOpen } from 'lucide-react'

interface DocumentTemplate {
  id: string
  name: string
  type: 'research' | 'engineering' | 'healthcare' | 'meeting' | 'general'
  description: string
  icon: React.ComponentType<any>
  template: string
}

const documentTemplates: DocumentTemplate[] = [
  {
    id: 'research-paper',
    name: 'Research Paper',
    type: 'research',
    description: 'Academic research paper with structured sections',
    icon: BookOpen,
    template: `# Research Title

## Abstract
Brief summary of your research findings and methodology...

## 1. Introduction
### Background
### Research Questions
### Objectives

## 2. Literature Review
Review of existing research...

## 3. Methodology
### Research Design
### Data Collection
### Analysis Methods

## 4. Results
### Key Findings
### Data Analysis

## 5. Discussion
### Implications
### Limitations

## 6. Conclusion
Summary and future work...

## References
1. Author, A. (Year). Title. Journal.
2. Author, B. (Year). Title. Conference.`
  },
  {
    id: 'technical-spec',
    name: 'Technical Specification',
    type: 'engineering',
    description: 'Technical project specification and requirements',
    icon: Code,
    template: `# Technical Specification: [Project Name]

## Overview
Brief description of the project and its purpose...

## Requirements
### Functional Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### Non-Functional Requirements
- **Performance**: Response time < 200ms
- **Scalability**: Support 10k concurrent users
- **Security**: Implement OAuth 2.0 authentication

## System Architecture
### High-Level Design
Description of the overall system architecture...

### Components
- **Frontend**: React/Next.js application
- **Backend**: Node.js API server
- **Database**: PostgreSQL with Redis cache

## API Specification
### Endpoints
\`\`\`
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
\`\`\`

## Implementation Plan
### Phase 1: Core Features
- [ ] User authentication
- [ ] Basic CRUD operations

### Phase 2: Advanced Features
- [ ] Real-time updates
- [ ] Advanced search

## Testing Strategy
- Unit tests for all components
- Integration tests for API endpoints
- End-to-end tests for critical user flows`
  },
  {
    id: 'clinical-protocol',
    name: 'Clinical Protocol',
    type: 'healthcare',
    description: 'Medical protocol and patient care guidelines',
    icon: Heart,
    template: `# Clinical Protocol: [Condition/Procedure]

## Patient Population
### Inclusion Criteria
- Criteria 1
- Criteria 2

### Exclusion Criteria
- Criteria 1
- Criteria 2

## Assessment Protocol
### Initial Assessment
- [ ] Medical history review
- [ ] Physical examination
- [ ] Diagnostic tests

### Follow-up Schedule
- Day 1: Initial assessment
- Week 1: Follow-up evaluation
- Month 1: Progress review

## Treatment Guidelines
### Standard Care
1. Primary intervention
2. Supportive care measures
3. Monitoring parameters

### Emergency Procedures
If complications arise:
1. Immediate actions
2. Escalation protocol
3. Documentation requirements

## Documentation Requirements
- [ ] Informed consent obtained
- [ ] Baseline measurements recorded
- [ ] Treatment plan documented
- [ ] Progress notes updated

## Quality Metrics
- Primary outcome measure
- Secondary outcome measures
- Safety parameters

## References
- Clinical guidelines reference 1
- Research study reference 2`
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    type: 'meeting',
    description: 'Structured meeting notes with action items',
    icon: Users,
    template: `# Meeting Notes
**Date**: ${new Date().toLocaleDateString()}
**Time**: 
**Location**: 
**Meeting Type**: 

## Attendees
- [ ] Name 1 (Role)
- [ ] Name 2 (Role)
- [ ] Name 3 (Role)

## Agenda
1. Review previous action items
2. Topic 1
3. Topic 2
4. Next steps

## Discussion Points

### Topic 1: [Title]
**Discussion**: 
**Decisions**: 
**Concerns**: 

### Topic 2: [Title]
**Discussion**: 
**Decisions**: 
**Concerns**: 

## Action Items
- [ ] **Action 1** - Assigned to: [Name] - Due: [Date]
- [ ] **Action 2** - Assigned to: [Name] - Due: [Date]
- [ ] **Action 3** - Assigned to: [Name] - Due: [Date]

## Next Meeting
- **Date**: 
- **Time**: 
- **Agenda Items**: 

## Notes
Additional notes and comments...`
  },
  {
    id: 'general-document',
    name: 'General Document',
    type: 'general',
    description: 'Blank document for any purpose',
    icon: FileText,
    template: `# Document Title

## Introduction
Start writing your content here...

## Section 1
Content for section 1...

## Section 2
Content for section 2...

## Conclusion
Summary and next steps...`
  }
]

interface DocumentTemplateSelectorProps {
  onSelect: (type: any, template?: string) => void
  onClose: () => void
}

export function DocumentTemplateSelector({ onSelect, onClose }: DocumentTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  
  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    onSelect(template.type, template.template)
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto m-4 bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-foreground">Choose a Template</CardTitle>
            <CardDescription className="text-muted-foreground">
              Select a template that matches your workflow to get started quickly
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTemplates.map((template) => {
              const IconComponent = template.icon
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
                    <Badge variant="outline" className="w-fit capitalize">
                      {template.type}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-muted-foreground">
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