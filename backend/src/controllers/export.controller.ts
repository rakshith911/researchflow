import { Request, Response } from 'express';
import { exportService } from '../services/export/export.service';

import { marked } from 'marked';

export const exportDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { format } = req.query;
        const { html: markdownContent, title } = req.body; // Frontend sends markdown in 'html' field for now

        if (!markdownContent) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }

        // Convert Markdown to HTML for PDF generation
        // We wrap it in a div to ensure styles apply
        const htmlContent = `
    <div class="markdown-body">
        ${marked.parse(markdownContent)}
    </div>
    `;

        let buffer: Buffer;
        let contentType: string;
        let extension: string;

        switch (format) {
            case 'pdf':
                buffer = await exportService.toPdf(htmlContent, { title });
                contentType = 'application/pdf';
                extension = 'pdf';
                break;

            case 'docx':
                buffer = await exportService.toDocx(htmlContent, title);
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                extension = 'docx';
                break;

            default:
                return res.status(400).json({ success: false, error: 'Invalid format. Supported: pdf, docx' });
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.${extension}"`);
        res.send(buffer);

    } catch (error) {
        console.error('EXPORT CONTROLLER ERROR DETAILED:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        res.status(500).json({ success: false, error: 'Failed to export document. Check server logs.' });
    }
};
