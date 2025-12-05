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
        id: 'neurips-paper',
        name: 'NeuralIPS Paper',
        description: 'Official NeuralIPS conference template structure',
        domain: ['research'],
        content: `# [Title of the Paper]

## Abstract
The abstract must be limited to one paragraph. For example: We propose a novel framework for [Problem Domain] that significantly improves upon state-of-the-art methods. Our approach leverages [Key Technique] to address the limitations of [Existing Methods]. We demonstrate the effectiveness of our method on [Datasets], achieving a [X]% improvement in [Metric].

## 1. Introduction
The problem of [Problem Description] is of central importance in [Field]. Recent advances in [Related Area] have shown promise, yet they fail to address [Specific Challenge]. In this work, we introduce [Method Name], a new approach that...

The main contributions of this paper are:
1. We propose [Method Name], which...
2. We provide a theoretical analysis showing that...
3. We achieve state-of-the-art results on [Benchmarks].

## 2. Related Work
**[Topic 1]**: Several works have explored [Topic] [1, 2]. However, these methods typically suffer from [Limitation].
**[Topic 2]**: Our work is also related to [Topic] [3]. Unlike [3], which focuses on [X], our method addresses [Y].

## 3. Method
In this section, we describe [Method Name] in detail. We first define the problem setting and notation.

### 3.1 Problem Setting
Let $X$ be the input space and $Y$ be the output space. We aim to learn a function $f: X \\to Y$ that minimizes...

### 3.2 Proposed Architecture
Our model consists of [Number] layers of [Layer Type]. The key innovation is the [Module Name], which computes:
$$ y = \\sigma(Wx + b) $$
where $\\sigma$ is the non-linear activation function.

## 4. Experiments
We evaluate our method on [Number] standard datasets: [Dataset 1], [Dataset 2], and [Dataset 3].

### 4.1 Experimental Setup
We implement our model using [Framework] and train on [Hardware]. We use the [Optimizer] with a learning rate of [Rate].

### 4.2 Results
Table 1 shows the performance of our method compared to baselines.
| Method | Accuracy | F1 Score |
|--------|----------|----------|
| Baseline 1 | 85.2% | 0.84 |
| Baseline 2 | 87.1% | 0.86 |
| **Ours** | **89.5%** | **0.89** |

As shown in Table 1, our method outperforms the strongest baseline by [X]%.

## 5. Conclusion
In this work, we presented [Method Name], a novel approach for [Problem]. Our experiments demonstrate its effectiveness and robustness. Future work includes extending this method to [New Domain].

## Broader Impact
This work has potential positive impacts in [Area], such as [Benefit]. However, it could also be misused for [Negative Use Case]. We mitigate this by [Mitigation Strategy].

## References
[1] Vaswani, A., et al. (2017). Attention is all you need. *NeurIPS*.
[2] Goodfellow, I., et al. (2014). Generative adversarial nets. *NeurIPS*.
[3] LeCun, Y., et al. (2015). Deep learning. *Nature*.
`
    },
    {
        id: 'icml-paper',
        name: 'ICML Paper',
        description: 'Official ICML conference template structure',
        domain: ['research'],
        content: `# [Title of the Paper]

## Abstract
This paper presents [Method Name], a scalable algorithm for [Problem]. Unlike previous approaches that scale linearly with [Parameter], our method scales logarithmically. We provide a rigorous theoretical analysis and extensive empirical evaluation.

## 1. Introduction
Machine learning models for [Task] have become increasingly popular. However, a major bottleneck is [Bottleneck]. To overcome this, we propose...

## 2. Related Work
The study of [Topic] dates back to [Author, Year]. More recently, [Author, Year] proposed using [Technique]. Our work builds on this by...

## 3. Proposed Method
We consider the problem of minimizing the objective function $J(\\theta)$.

### 3.1 Algorithm Details
Algorithm 1 describes the main steps of our approach.
1. Initialize parameters $\\theta$.
2. For each iteration $t=1$ to $T$:
    a. Sample batch $B$.
    b. Update $\\theta$ using gradient descent.

### 3.2 Theoretical Analysis
**Theorem 1 (Convergence)**: Under Assumptions 1 and 2, our algorithm converges to a critical point with rate $O(1/\\sqrt{T})$.
*Proof Sketch*: We start by bounding the variance of the gradient estimator...

## 4. Experiments
### 4.1 Datasets
We use the following datasets:
*   **MNIST**: A dataset of handwritten digits.
*   **CIFAR-10**: A dataset of natural images.

### 4.2 Baselines
We compare against:
*   **SGD**: Stochastic Gradient Descent.
*   **Adam**: Adaptive Moment Estimation.

### 4.3 Results
Figure 1 shows the training loss over time. Our method converges significantly faster than the baselines.

## 5. Conclusion
We introduced [Method Name], which solves [Problem] efficiently. We proved its convergence properties and demonstrated its practical performance.

## References
[1] Kingma, D. P., & Ba, J. (2014). Adam: A method for stochastic optimization. *ICLR*.
[2] He, K., et al. (2016). Deep residual learning for image recognition. *CVPR*.
`
    },
    {
        id: 'iclr-paper',
        name: 'ICLR Paper',
        description: 'Official ICLR conference template structure',
        domain: ['research'],
        content: `# [Title of the Paper]

## Abstract
Representation learning is at the core of deep learning. We propose a self-supervised method that learns robust representations by [Technique]. Our method achieves state-of-the-art on linear evaluation protocols.

## 1. Introduction
Unsupervised learning of representations is a challenging problem. Contrastive learning methods [1, 2] have recently closed the gap with supervised methods. We identify a key limitation in current contrastive approaches: [Limitation].

## 2. Related Work
**Self-Supervised Learning**: Recent works [1, 2, 3] utilize data augmentations to define positive pairs.
**Generative Models**: VAEs [4] and GANs [5] learn representations by generating data.

## 3. Method
Our method, [Method Name], maximizes the mutual information between views.

### 3.1 Contrastive Loss
We use the InfoNCE loss defined as:
$$ L = -\\log \\frac{\\exp(sim(z_i, z_j)/\\tau)}{\\sum_{k} \\exp(sim(z_i, z_k)/\\tau)} $$

### 3.2 Implementation Details
We use a ResNet-50 backbone and a 2-layer MLP projection head. We train for [Number] epochs with a batch size of [Size].

## 4. Experiments
We evaluate the quality of learned representations on ImageNet.

### 4.1 Linear Evaluation
We freeze the backbone and train a linear classifier. Our method achieves [X]% top-1 accuracy.

### 4.2 Semi-Supervised Learning
Fine-tuning with 1% of labels, we achieve [Y]% accuracy, outperforming [Baseline] by [Z]%.

## 5. Conclusion
We proposed [Method Name], a simple yet effective framework for representation learning.

## Ethics Statement
This work involves training models on public datasets. We do not foresee any immediate negative ethical consequences. However, like all deep learning models, biases in the data may be reflected in the representations.

## Reproducibility Statement
We provide the complete source code in the supplementary material. All hyperparameters are listed in Appendix A.

## References
[1] Chen, T., et al. (2020). A simple framework for contrastive learning of visual representations. *ICML*.
[2] He, K., et al. (2020). Momentum contrast for unsupervised visual representation learning. *CVPR*.
`
    },
    {
        id: 'lab-notebook',
        name: 'Lab Notebook Entry',
        description: 'Daily experiment tracking and observations',
        domain: ['research'],
        content: `# Experiment: [Title]
**Date**: ${new Date().toLocaleDateString()}
**Investigator**: 

## Objective
What is the hypothesis or goal of this experiment?

## Materials & Equipment
- 
- 

## Procedure
1. 
2. 

## Observations & Data
Record raw data and observations here.

## Analysis
Interpretation of the results.

## Next Steps
What should be done next based on these results?
`
    },
    {
        id: 'literature-review',
        name: 'Literature Review Matrix',
        description: 'Synthesize multiple research papers',
        domain: ['research'],
        content: `# Literature Review: [Topic]

## Theme 1: [Theme Name]
| Source | Key Findings | Methodology | Strengths/Weaknesses |
|--------|--------------|-------------|----------------------|
| [Author, Year] | ... | ... | ... |
| [Author, Year] | ... | ... | ... |

## Theme 2: [Theme Name]
| Source | Key Findings | Methodology | Strengths/Weaknesses |
|--------|--------------|-------------|----------------------|
| [Author, Year] | ... | ... | ... |

## Synthesis
Common trends and contradictions across sources.

## Gaps in Literature
What is missing or needs further research?
`
    },
    {
        id: 'grant-proposal',
        name: 'Grant Proposal',
        description: 'Standard NSF/NIH style funding application',
        domain: ['research'],
        content: `# Project Title

## Project Summary
Brief overview of the proposed work.

## Specific Aims
1. **Aim 1**: ...
2. **Aim 2**: ...

## Research Strategy
### Significance
Why is this problem important?

### Innovation
What is new or novel about your approach?

### Approach
Detailed plan for achieving the specific aims.

## References
`
    },
    {
        id: 'adr',
        name: 'Architecture Decision Record',
        description: 'Document important technical decisions',
        domain: ['research'], // "Engineering" falls under Research & Engineering
        content: `# ADR: [Decision Title]
**Status**: Proposed / Accepted / Deprecated
**Date**: ${new Date().toLocaleDateString()}

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
### Positive
- 

### Negative
- 
`
    },
    {
        id: 'api-spec',
        name: 'API Design Spec',
        description: 'Define API endpoints and data models',
        domain: ['research'],
        content: `# API Specification: [Service Name]

## Overview
High-level description of the service API.

## Authentication
How to authenticate requests (e.g., Bearer Token).

## Endpoints

### GET /path/to/resource
**Description**: ...
**Query Params**:
- \`param1\`: ...

**Response**:
\`\`\`json
{
  "key": "value"
}
\`\`\`

### POST /path/to/resource
**Description**: ...
**Body**:
\`\`\`json
{
  "key": "value"
}
\`\`\`

## Error Codes
| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
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
