import { z } from 'zod';

export const CreateDocumentSchema = z.object({
    body: z.object({
        title: z.string().max(500, 'Title must be less than 500 characters').optional(),
        content: z.string().max(10000000, 'Content must be less than 10MB').optional(),
        type: z.enum(['research', 'engineering', 'healthcare', 'meeting', 'general']).optional(),
        format: z.enum(['markdown', 'latex']).optional(),
        tags: z.array(z.string()).optional(),
        linkedDocuments: z.array(z.string()).optional(),
        collaborators: z.array(z.string()).optional(),
    }),
});

export const UpdateDocumentSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid document ID'),
    }),
    body: z.object({
        title: z.string().max(500).optional(),
        content: z.string().max(10000000).optional(),
        type: z.enum(['research', 'engineering', 'healthcare', 'meeting', 'general']).optional(),
        format: z.enum(['markdown', 'latex']).optional(),
        tags: z.array(z.string()).optional(),
        linked_documents: z.array(z.string()).optional(),
    }),
});

export const SearchDocumentSchema = z.object({
    query: z.object({
        q: z.string().min(2, 'Query must be at least 2 characters').max(200, 'Query too long'),
        type: z.string().optional(),
        limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional(),
        offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(0)).optional(),
    }),
});

export const BulkOperationSchema = z.object({
    body: z.object({
        documentIds: z.array(z.string().uuid()).min(1, 'At least one document ID is required').max(100, 'Cannot process more than 100 documents'),
        tags: z.array(z.string()).optional(), // For bulk tags
        operation: z.enum(['add', 'remove', 'replace']).optional(), // For bulk tags
    }),
});

export const DocumentIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid document ID'),
    }),
});

export const RenameDocumentSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        title: z.string().min(1).max(500),
    }),
});
