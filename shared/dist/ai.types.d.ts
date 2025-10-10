import { ProfessionalDomain } from './common.types';
export interface TextAnalysis {
    wordCount: number;
    characterCount: number;
    estimatedReadingTime: number;
    detectedDomain: ProfessionalDomain;
    keyPhrases: string[];
}
export interface AIProcessingRequest {
    text: string;
    type: 'analysis' | 'extraction' | 'summary';
    domain?: ProfessionalDomain;
}
//# sourceMappingURL=ai.types.d.ts.map