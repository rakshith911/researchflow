import { FileText, Microscope, Stethoscope, ClipboardList, BookOpen, Activity, Calendar, Award, GraduationCap, Briefcase } from 'lucide-react';

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
    tags: string[];
    featured?: boolean;
    citationStyle?: string;
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
        description: 'Standard Neural Information Processing Systems conference template.',
        domain: ['research'],
        category: 'research_paper',
        tags: ['conference', 'ai', 'computer-science', 'two-column'],
        featured: true,
        citationStyle: 'neurips',
        content: `# [Title of Paper]

**Abstract**
The abstract must be limited to one paragraph. It should provide a concise summary of the key contributions, methodology, and results.

## 1. Introduction
The problem of [Problem Description] is of central importance in the field of [Field Name]. Recent approaches such as [Reference 1] have attempted to address this...

## 2. Related Work
### 2.1. [Topic Area 1]
Discuss previous work in this area...

### 2.2. [Topic Area 2]
Compare with other methods...

## 3. Method
We propose a novel framework for...

### 3.1. Architecture
Describe the system architecture here.

$$
L(\theta) = \sum_{i=1}^{N} \log p(x_i | \theta)
$$

## 4. Experiments
We evaluated our method on the following datasets...

### 4.1. Results
| Model | Accuracy | F1 Score |
|-------|----------|----------|
| Baseline | 85.2% | 0.84 |
| **Ours** | **89.5%** | **0.89** |

## 5. Conclusion
In this work, we presented...

## References
1. Author, A. et al. (2024). Title of the paper. *Journal*, Vol(issue).
`
    },
    {
        id: 'icml-paper',
        name: 'ICML Paper',
        description: 'International Conference on Machine Learning submission format.',
        domain: ['research'],
        category: 'research_paper',
        tags: ['conference', 'machine-learning', 'academic'],
        citationStyle: 'icml',
        content: `# [Title of Paper]

**Abstract**
This paper presents [Method Name], a new approach for...

## 1. Introduction
Machine learning models often suffer from...

## 2. Proposed Method
Let $\mathcal{X}$ be the input space...

## 3. Theoretical Analysis
**Theorem 1.** *Under assumptions (A1)-(A3), our estimator is consistent.*

## 4. Empirical Evaluation
We compare against state-of-the-art methods...

## 5. Conclusion
We have improved upon...
`
    },
    {
        id: 'iclr-paper',
        name: 'ICLR Paper',
        description: 'International Conference on Learning Representations template.',
        domain: ['research'],
        category: 'research_paper',
        tags: ['conference', 'deep-learning', 'academic'],
        citationStyle: 'iclr',
        content: `# [Title of Paper]

**Abstract**
Representation learning is at the core of...

## 1. Introduction
Deep neural networks have achieved remarkable success...

## 2. Method
We introduce a regularization term...

## 3. Experiments
Experiments were conducted on ImageNet...

## 4. Conclusion
Future work involves...
`
    },

    // LAB WORK
    {
        id: 'lab-notebook',
        name: 'Lab Notebook Entry',
        description: 'Daily tracking for experiments and raw data observations.',
        domain: ['research'],
        category: 'lab_work',
        tags: ['daily', 'experimental', 'data'],
        featured: true,
        content: `# Experiment: [Title]
**Date**: ${new Date().toLocaleDateString()}
**Investigator**: [Your Name]

## Objective
To determine if...

## Materials & Methods
- Reagents: [List]
- Equipment: [List]
- Procedure:
  1. Prepare sample...
  2. Incubate at 37°C...

## Observations
- [Time]: Sample turned blue...
- [Time]: pH stabilized at 7.4...

## Results (Raw Data)
| Sample ID | OD600 | Concentration (mM) |
|-----------|-------|--------------------|
| A1        | 0.45  | 10                 |
| A2        | 0.89  | 20                 |

## Conclusion & Next Steps
The results suggest that... Next, we will...
`
    },
    {
        id: 'clinical-observation',
        name: 'Clinical Observation',
        description: 'Structured notes for clinical rounds or patient observations.',
        domain: ['medical'],
        category: 'lab_work',
        tags: ['clinical', 'observation', 'rounds'],
        content: `# Clinical Observation
**Date**: ${new Date().toLocaleDateString()}
**Rotation**: [Specialty]

## Patient Summary
Patient presented with...

## Observations
- Vitals: Stable
- Symptoms: ...

## Assessment
Likely diagnosis involves...

## Plan
- Order [Test]
- Monitor for [Symptom]
`
    },

    // ENGINEERING
    {
        id: 'adr',
        name: 'Architecture Decision Record',
        description: 'Capture significant architectural decisions and their context.',
        domain: ['research'],
        category: 'engineering',
        tags: ['technical', 'documentation', 'architecture'],
        featured: true,
        content: `# ADR: [Decision Title]
**Status**: [Proposed | Accepted | Deprecated]
**Date**: ${new Date().toLocaleDateString()}

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
We will... [describe the proposed solution]

## Consequences
**Positive**:
- Improves performance...

**Negative**:
- Increases complexity...

## Alternatives Considered
- Option A: ...
- Option B: ...
`
    },
    {
        id: 'api-spec',
        name: 'API Design Spec',
        description: 'Define REST/GraphQL endpoints, request bodies, and responses.',
        domain: ['research'],
        category: 'engineering',
        tags: ['api', 'technical', 'backend'],
        content: `# API Specification: [Service Name]

## Overview
This service handles [functionality]...

## Authentication
Requests must include \`Authorization: Bearer <token>\`.

## Endpoints

### GET /api/resource
Returns a list of resources.

**Response**:
\`\`\`json
{
  "data": [
    { "id": "1", "name": "Item" }
  ]
}
\`\`\`

### POST /api/resource
Creates a new resource.

**Body**:
\`\`\`json
{
  "name": "New Item"
}
\`\`\`
`
    },
    {
        id: 'system-design',
        name: 'System Design Doc',
        description: 'High-level architecture, components, and data flow.',
        domain: ['research'],
        category: 'engineering',
        tags: ['architecture', 'design', 'technical'],
        content: `# System Design: [System Name]

## 1. Overview
High level summary of the system and its purpose.

## 2. Goals & Non-Goals
**Goals**:
- Scalability to 1M users...
- < 100ms latency...

**Non-Goals**:
- Offline support...

## 3. Architecture
### 3.1. High Level Diagram
[Insert Mermaid Diagram]

### 3.2. Components
- **Service A**: Handles...
- **Database**: PostgreSQL for...

## 4. Data Model
- \`User\`: id, email...
- \`Order\`: id, user_id, amount...
`
    },

    // ACADEMIC
    {
        id: 'literature-review',
        name: 'Literature Review',
        description: 'Matrix for synthesizing multiple research papers.',
        domain: ['research'],
        category: 'academic',
        tags: ['research', 'synthesis', 'writing'],
        content: `# Literature Review: [Topic]

## Theme 1: [Theme Name]
**Key Papers**: [Author A], [Author B]

Findings suggest that...

## Theme 2: [Theme Name]
**Key Papers**: [Author C]

Contradictory evidence shows...

## Synthesis Matrix
| Paper | Methodology | Key Findings | Limitations |
|-------|-------------|--------------|-------------|
| [A]   | Survey      | ...          | Small N     |
| [B]   | Experiment  | ...          | No control  |

## Conclusion & Gaps
The literature lacks...
`
    },
    {
        id: 'course-notes',
        name: 'Course Notes',
        description: 'Structured lecture notes with key concepts and summaries.',
        domain: ['general', 'research'],
        category: 'academic',
        tags: ['learning', 'study', 'notes'],
        content: `# Course: [Course Name]
## Lecture: [Topic]
**Date**: ${new Date().toLocaleDateString()}

### Key Concepts
- **concept 1**: definition...
- **concept 2**: definition...

### Detailed Notes
Professor explained that...

### Summary
Today's lecture covered...
`
    },

    // PROFESSIONAL
    {
        id: 'grant-proposal',
        name: 'Grant Proposal',
        description: 'NIH/NSF style funding application structure.',
        domain: ['research'],
        category: 'professional',
        tags: ['funding', 'formal', 'proposal'],
        content: `# Project Title

## Project Summary
Concise overview of the proposed work.

## Specific Aims
**Aim 1**: Verify that...
**Aim 2**: Demonstrate...

## Research Strategy
### A. Significance
Why is this important?

### B. Innovation
What is new?

### C. Approach
How will we do it?

## References
`
    },
    {
        id: 'resume',
        name: 'Resume / CV',
        description: 'Clean, professional resume layout.',
        domain: ['general'],
        category: 'professional',
        tags: ['career', 'personal'],
        content: `# [Your Name]
[Email] | [Phone] | [LinkedIn] | [Portfolio]

## Summary
Experienced professional with a background in...

## Experience
**[Company Name]** - [Role]
*[Start Date] - [End Date/Present]*
- Led the development of...
- Increased performance by 20%...

## Education
**[University Name]**
[Degree], [Major] | [Year]

## Skills
- **Technical**: Python, React, ...
- **Soft Skills**: Leadership, Communication...
`
    },

    // MEDICAL RECORDS
    {
        id: 'soap-note',
        name: 'SOAP Note',
        description: 'Standard Subjective, Objective, Assessment, Plan format.',
        domain: ['medical'],
        category: 'medical_record',
        tags: ['clinical', 'standard', 'medical'],
        featured: true,
        content: `# SOAP Note
**Patient Name**: ...
**Date**: ${new Date().toLocaleDateString()}

## Subjective (S)
Create a chief complaint (CC) and history of present illness (HPI).
- "I have a headache..."

## Objective (O)
Vital signs and physical exam findings.
- BP: 120/80
- HR: 72

## Assessment (A)
Differential diagnosis and likely condition.
- Tension headache

## Plan (P)
- Recommend rest...
- Follow up in 1 week...
`
    },
    {
        id: 'patient-history',
        name: 'Patient History',
        description: 'Comprehensive medical history intake form.',
        domain: ['medical'],
        category: 'medical_record',
        tags: ['clinical', 'intake', 'history'],
        content: `# Patient History
**Name**: ...
**DOB**: ...

## Chief Complaint (CC)
...

## History of Present Illness (HPI)
...

## Past Medical History (PMH)
- [Condition]
- [Surgery]

## Medications
- [Drug A] [Dose]

## Allergies
- [Allergen]: [Reaction]

## Family History
...

## Social History
...
`
    },

    // GENERAL
    {
        id: 'simple-note',
        name: 'Simple Note',
        description: 'A blank canvas for your thoughts.',
        domain: ['general', 'research', 'medical'],
        category: 'general',
        tags: ['basic', 'blank'],
        content: `# Untitled Note
Start typing...
`
    },
    {
        id: 'todo-list',
        name: 'To-Do List',
        description: 'Simple checklist for tasks.',
        domain: ['general'],
        category: 'general',
        tags: ['productivity', 'tasks'],
        content: `# To-Do List

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
`
    },
    {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Minutes, agenda, and action items.',
        domain: ['general', 'research'],
        category: 'general',
        tags: ['business', 'meeting', 'collaboration'],
        content: `# Meeting: [Topic]
**Date**: ${new Date().toLocaleDateString()}
**Attendees**: [List]

## Agenda
1. Review last week...
2. Discuss new feature...

## Notes
- Point 1
- Point 2

## Action Items
- [ ] @[Name] to do X
- [ ] @[Name] to do Y
`
    }
];
