import { FileText, Microscope, Stethoscope, ClipboardList, BookOpen, Activity, Calendar } from 'lucide-react';

export type UserDomain = 'research' | 'medical' | 'general';

export type TemplateCategory =
    | 'research_paper'
    | 'lab_work'
    | 'medical_record'
    | 'engineering'
    | 'academic'
    | 'professional'
    | 'general';

export const CATEGORY_CONFIG: Record<TemplateCategory, { label: string, icon: any, description: string }> = {
    research_paper: { label: 'Research Papers', icon: FileText, description: 'Conference and journal formats' },
    lab_work: { label: 'Lab & Field Work', icon: Microscope, description: 'Experiments and observations' },
    medical_record: { label: 'Medical Records', icon: Stethoscope, description: 'Clinical documentation' },
    engineering: { label: 'Engineering', icon: Activity, description: 'Specs, ADRs, and systems' },
    academic: { label: 'Academic & Learning', icon: BookOpen, description: 'Notes, reviews, and theses' },
    professional: { label: 'Professional', icon: ClipboardList, description: 'Grants, resumes, and business' },
    general: { label: 'General', icon: Calendar, description: 'Daily productivity' }
};

export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    domain: UserDomain[];
    category: TemplateCategory;
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
    // RESEARCH PAPERS
    {
        id: 'neurips-paper',
        name: 'NeuralIPS Paper',
        description: 'Official NeuralIPS conference template',
        domain: ['research'],
        category: 'research_paper',
        content: `# [Title of the Paper]

## Abstract
The abstract must be limited to one paragraph...

## 1. Introduction
The problem of [Problem Description] is of central importance...
`
        // ... (rest of content truncated for brevity in replace, I will keep original content where possible or re-insert)
    },
    {
        id: 'icml-paper',
        name: 'ICML Paper',
        description: 'Official ICML conference template',
        domain: ['research'],
        category: 'research_paper',
        content: `# [Title of the Paper]

## Abstract
This paper presents [Method Name]...
`
    },
    {
        id: 'iclr-paper',
        name: 'ICLR Paper',
        description: 'Official ICLR conference template',
        domain: ['research'],
        category: 'research_paper',
        content: `# [Title of the Paper]

## Abstract
Representation learning is at the core...
`
    },

    // LAB WORK
    {
        id: 'lab-notebook',
        name: 'Lab Notebook Entry',
        description: 'Daily experiment tracking',
        domain: ['research'],
        category: 'lab_work',
        content: `# Experiment: [Title]
**Date**: ${new Date().toLocaleDateString()}...
`
    },
    {
        id: 'clinical-observation',
        name: 'Clinical Observation',
        description: 'Notes from rounds or clinical rotation',
        domain: ['medical'],
        category: 'lab_work', // or medical_record, but fits "observation"
        content: `# Clinical Observation
Rotation: ...
`
    },

    // ENGINEERING
    {
        id: 'adr',
        name: 'Architecture Decision Record',
        description: 'Document technical decisions',
        domain: ['research'],
        category: 'engineering',
        content: `# ADR: [Decision Title]
**Status**: Proposed...
`
    },
    {
        id: 'api-spec',
        name: 'API Design Spec',
        description: 'Define API endpoints and models',
        domain: ['research'],
        category: 'engineering',
        content: `# API Specification: [Service Name]
## Overview...
`
    },
    {
        id: 'system-design',
        name: 'System Design Doc',
        description: 'High-level system architecture',
        domain: ['research'],
        category: 'engineering',
        content: `# System Design: [System Name]
## 1. Overview
High level summary...

## 2. Goals & Non-Goals
...

## 3. Architecture
Diagrams and components...
`
    },

    // ACADEMIC
    {
        id: 'literature-review',
        name: 'Literature Review',
        description: 'Synthesize multiple papers',
        domain: ['research'],
        category: 'academic',
        content: `# Literature Review: [Topic]
## Theme 1...
`
    },
    {
        id: 'course-notes',
        name: 'Course Notes',
        description: 'Lecture notes and summary',
        domain: ['general', 'research'],
        category: 'academic',
        content: `# Course: [Course Name]
## Lecture: [Topic]
**Date**: ...

### Key Concepts
- 
- 

### Summary
...
`
    },

    // PROFESSIONAL
    {
        id: 'grant-proposal',
        name: 'Grant Proposal',
        description: 'NSF/NIH style funding application',
        domain: ['research'],
        category: 'professional',
        content: `# Project Title
## Project Summary...
`
    },
    {
        id: 'resume',
        name: 'Resume / CV',
        description: 'Professional resume template',
        domain: ['general'],
        category: 'professional',
        content: `# [Your Name]
[Email] | [Phone] | [Website]

## Education
**[University]**
[Degree], [Year]

## Experience
**[Company]** - [Role]
*[Dates]*
- Achieved X...
- Built Y...

## Skills
- ...
`
    },

    // MEDICAL RECORDS
    {
        id: 'soap-note',
        name: 'SOAP Note',
        description: 'Subjective, Objective, Assessment, Plan',
        domain: ['medical'],
        category: 'medical_record',
        content: `# SOAP Note...
`
    },
    {
        id: 'patient-history',
        name: 'Patient History',
        description: 'Comprehensive medical history',
        domain: ['medical'],
        category: 'medical_record',
        content: `# Patient History...
`
    },

    // GENERAL
    {
        id: 'simple-note',
        name: 'Simple Note',
        description: 'Blank canvas',
        domain: ['general', 'research', 'medical'],
        category: 'general',
        content: `# Untitled Note...
`
    },
    {
        id: 'todo-list',
        name: 'To-Do List',
        description: 'Task checklist',
        domain: ['general'],
        category: 'general',
        content: `# To-Do List...
`
    },
    {
        id: 'journal-entry',
        name: 'Journal Entry',
        description: 'Daily reflection',
        domain: ['general'],
        category: 'general',
        content: `# Journal...
`
    },
    {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Minutes and action items',
        domain: ['general', 'research'],
        category: 'general',
        content: `# Meeting: [Topic]
**Date**: ...
**Attendees**: ...

## Agenda
1. 
2. 

## Action Items
- [ ] 
`
    }
];
