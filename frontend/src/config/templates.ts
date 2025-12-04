import { FileText, Microscope, Stethoscope, ClipboardList, BookOpen, Activity, Calendar } from 'lucide-react';

export type UserDomain = 'research' | 'medical' | 'general';

export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    domain: UserDomain[];
}

export const DOMAINS = [
    {
        id: 'research' as UserDomain,
        label: 'Research & Engineering',
        description: 'For scientists, engineers, and technical writers',
        icon: Microscope
    },
    {
        id: 'medical' as UserDomain,
        label: 'Medical & Healthcare',
        description: 'For doctors, nurses, and medical students',
        icon: Stethoscope
    },
    {
        id: 'general' as UserDomain,
        label: 'General Note Taking',
        description: 'For everyone else',
        icon: FileText
    },
];

export const TEMPLATES: DocumentTemplate[] = [
    // RESEARCH & ENGINEERING
    {
        id: 'research-paper',
        name: 'Research Paper',
        description: 'Standard IEEE/Academic paper structure',
        domain: ['research'],
        content: `# Title

## Abstract
Brief summary of the research.

## Introduction
Background and problem statement.

## Methodology
How the research was conducted.

## Results
Findings and data analysis.

## Discussion
Interpretation of results.

## Conclusion
Summary and future work.

## References
- [1] 
`
    },
    {
        id: 'technical-design',
        name: 'Technical Design Doc (RFC)',
        description: 'Engineering design document for new features',
        domain: ['research'],
        content: `# RFC: [Feature Name]

## Summary
Brief explanation of the proposed change.

## Motivation
Why are we doing this? What problem does it solve?

## Detailed Design
Technical implementation details, architecture diagrams, data models.

## Alternatives Considered
What else did we discuss and why was it rejected?

## Risks & Mitigation
Potential issues and how to handle them.
`
    },
    {
        id: 'meeting-notes-agile',
        name: 'Agile Meeting Notes',
        description: 'Standup or sprint planning notes',
        domain: ['research', 'general'],
        content: `# Meeting: [Date]

## Attendees
- 

## Agenda
1. 
2. 

## Discussion Points
- 

## Action Items
- [ ] 
- [ ] 
`
    },
    {
        id: 'class-notes',
        name: 'Cornell Class Notes',
        description: 'Structured note-taking for lectures',
        domain: ['research', 'general'],
        content: `# Lecture: [Topic]
Date: [Date]

## Key Concepts
- Concept 1: Definition
- Concept 2: Definition

## Detailed Notes
Detailed explanation of the concepts...

## Summary
Brief summary of the lecture (write this after class).

## Questions
- [ ] What about X?
`
    },

    // MEDICAL
    {
        id: 'soap-note',
        name: 'SOAP Note',
        description: 'Subjective, Objective, Assessment, Plan',
        domain: ['medical'],
        content: `# SOAP Note
Patient Name: 
Date: 

## Subjective
(Patient's complaints, history of present illness)
- 

## Objective
(Vital signs, physical exam findings, lab results)
- BP: 
- HR: 
- Temp: 

## Assessment
(Diagnosis or differential diagnosis)
- 

## Plan
(Treatment, medication, follow-up)
- 
`
    },
    {
        id: 'patient-history',
        name: 'Patient History',
        description: 'Comprehensive medical history',
        domain: ['medical'],
        content: `# Patient History

## Chief Complaint
Reason for visit.

## History of Present Illness (HPI)
Details of the complaint.

## Past Medical History (PMH)
- 

## Medications
- 

## Allergies
- 

## Family History
- 

## Social History
- 
`
    },
    {
        id: 'clinical-observation',
        name: 'Clinical Observation',
        description: 'Notes from rounds or clinical rotation',
        domain: ['medical'],
        content: `# Clinical Observation
Rotation: 
Date: 

## Case Summary
Brief description of the patient case.

## Key Learning Points
- 

## Questions for Attending
- 
`
    },

    // GENERAL
    {
        id: 'simple-note',
        name: 'Simple Note',
        description: 'Just a blank canvas with a title',
        domain: ['general', 'research', 'medical'],
        content: `# Untitled Note

Start typing here...
`
    },
    {
        id: 'todo-list',
        name: 'To-Do List',
        description: 'Simple checklist for tasks',
        domain: ['general'],
        content: `# To-Do List

## High Priority
- [ ] 

## Medium Priority
- [ ] 

## Low Priority
- [ ] 
`
    },
    {
        id: 'journal-entry',
        name: 'Journal Entry',
        description: 'Daily reflection or diary',
        domain: ['general'],
        content: `# Journal: [Date]

## Mood
(Emoji or description)

## Highlights
- 

## Challenges
- 

## Gratitude
I am grateful for...
`
    }
];
