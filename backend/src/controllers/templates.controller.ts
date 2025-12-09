import { Request, Response } from 'express';
import { fullPdfImportService } from '../services/import/full-pdf-import.service';
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

        // 1. Parse PDF using Advanced Service (extracts coords + links)
        const pages = await fullPdfImportService.extract(req.file.buffer);
        const richTextRepresentation = fullPdfImportService.formatForLLM(pages);

        // Truncate if extreme (though coordinate dump consumes more tokens, it's worth it for 1 page resume)
        // 150 lines of coord text is roughly 1.5k tokens. Should be fine. 
        const truncatedContent = richTextRepresentation.substring(0, 30000);

        // 2. Use OpenAI to convert to Markdown with Layout Awareness
        const prompt = `
      You are an expert Document Converter. Your task is to convert the following PDF content stream into pixel-perfect Github Flavored Markdown.

      **INPUT FORMAT:**
      - The input is pre-grouped into "Visual Rows" found in the PDF.
      - **Content on the same line in the input was on the same line in the PDF.**
      - **Formatting Markers**:
        - \`[BOLD]...[/BOLD]\`: Indicates bold text.
        - \`[ITALIC]...[/ITALIC]\`: Indicates italic text.
        - \`[LINK url="..."]...[/LINK]\`: Indicates a hyperlink.

      **CRITICAL INSTRUCTIONS:**
      1. **STRICT LINE PRESERVATION**: 
         - **Do not break a single input line into multiple lines.** 
         - If the input line says: \`Email | Phone | LinkedIn\`, your Markdown MUST be: \`Email | Phone | LinkedIn\`.
      2. **FORMATTING**:
         - Convert \`[BOLD]text[/BOLD]\` -> \`**text**\`.
         - Convert \`[ITALIC]text[/ITALIC]\` -> \`*text*\`.
         - Convert \`[LINK url="..."]text[/LINK]\` -> \`[text](url)\`.
         - **Header Styling**: Often the name (first line) is really big. If it's the document title, use \`# Title\`.
      3. **Headings & Separators (CRITICAL)**: 
         - Use H2 (##) for main section titles (e.g., EDUCATION, WORK EXPERIENCE).
         - **MANDATORY**: You **MUST** place a horizontal rule \`---\` on the next line after every H2 section title.
      4. **Links**: 
         - **Do NOT** append the URL to the link text. 
         - Only show the URL if the VISIBLE text in the PDF was the URL itself.
      5. **Accuracy**: Copy text EXACTLY. Do NOT summarize. Do ANY spelling correction.

      **Input Content Stream:**
      ${truncatedContent}
    `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a specialized AI that converts raw PDF streams into perfect Markdown." },
                { role: "user", content: prompt }
            ],
            temperature: 0.1,
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
