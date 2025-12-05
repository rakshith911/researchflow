import { Request, Response } from 'express';
const pdfParse = require('pdf-parse');
import OpenAI from 'openai';
import { logger } from '../utils/logger';

export const importTemplateFromPdf = async (req: Request, res: Response) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            logger.error('OPENAI_API_KEY is missing');
            return res.status(500).json({ success: false, error: 'OpenAI API key is not configured on the server' });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // 1. Parse PDF text
        const pdfData = await pdfParse(req.file.buffer);
        const text = pdfData.text;

        // Truncate text if too long to avoid token limits (approx 10k chars should be enough for structure)
        const truncatedText = text.substring(0, 15000);

        // 2. Use OpenAI to extract structure
        const prompt = `
      Analyze the following text from a research paper or document and extract its structural template.
      Return ONLY a Markdown string that represents the empty template structure.
      
      Rules:
      1. Use H1 (#) for the main title (use placeholder [Title]).
      2. Use H2 (##) for main sections (Abstract, Introduction, Methods, etc.).
      3. Use H3 (###) for subsections if clear.
      4. Add brief placeholder descriptions for each section (e.g., "Summary of the paper").
      5. Do NOT include the actual content from the text, just the structure.
      6. If you see specific formatting like "Ethics Statement" or "Broader Impact", include them.
      7. Format as clean Markdown.

      Text to analyze:
      ${truncatedText}
    `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are an expert at analyzing document structures and creating Markdown templates." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
        });

        const templateContent = completion.choices[0].message.content || '';

        // Clean up markdown code blocks if present
        const cleanContent = templateContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');

        res.json({
            success: true,
            data: {
                content: cleanContent,
                originalName: req.file.originalname
            }
        });

    } catch (error) {
        logger.error('Error importing template:', error);
        res.status(500).json({ success: false, error: 'Failed to process PDF' });
    }
};
