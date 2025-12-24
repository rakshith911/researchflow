import { z } from 'zod';

export const LinkFileSchema = z.object({
    body: z.object({
        fileId: z.string().uuid('Invalid file ID'),
        documentId: z.string().uuid('Invalid document ID'),
    }),
});

export const FileIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid file ID'),
    }),
});

// Since file upload body is primarily 'file' handled by Multer,
// we might check for optional documentId if it's sent as a text field.
// Multer puts files in req.file, text fields in req.body.
export const UploadFileSchema = z.object({
    body: z.object({
        documentId: z.string().uuid('Invalid document ID').optional(),
    }),
});
