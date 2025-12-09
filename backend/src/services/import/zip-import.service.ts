import AdmZip from 'adm-zip';
import path from 'path';

export class ZipImportService {
    /**
     * Extracts a zip file and returns the content of the main document.
     * Heuristic for main document:
     * 1. 'main.tex', 'index.tex', 'master.tex'
     * 2. 'main.md', 'index.md', 'README.md'
     * 3. The largest .tex file
     * 4. The largest .md file
     * 5. The largest .txt file
     */
    processZipFile(buffer: Buffer): { content: string; filename: string; type: string } {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        const textEntries = zipEntries.filter(entry =>
            !entry.isDirectory &&
            ['.tex', '.md', '.txt'].includes(path.extname(entry.name).toLowerCase())
        );

        if (textEntries.length === 0) {
            throw new Error('No valid text files (.tex, .md, .txt) found in the zip archive.');
        }

        // Helper to find entry by specific names
        const findByName = (names: string[]) =>
            textEntries.find(entry => names.includes(entry.name.toLowerCase()));

        // 1. Explicit Main LaTeX files
        let mainEntry = findByName(['main.tex', 'index.tex', 'master.tex', 'thesis.tex', 'article.tex']);

        // 2. Explicit Main Markdown files
        if (!mainEntry) {
            mainEntry = findByName(['main.md', 'index.md', 'readme.md']);
        }

        // 3. Fallback: Largest .tex file
        if (!mainEntry) {
            const texFiles = textEntries.filter(e => e.name.endsWith('.tex'));
            if (texFiles.length > 0) {
                mainEntry = texFiles.sort((a, b) => b.header.size - a.header.size)[0];
            }
        }

        // 4. Fallback: Largest .md file
        if (!mainEntry) {
            const mdFiles = textEntries.filter(e => e.name.endsWith('.md'));
            if (mdFiles.length > 0) {
                mainEntry = mdFiles.sort((a, b) => b.header.size - a.header.size)[0];
            }
        }

        // 5. Fallback: Largest text file
        if (!mainEntry) {
            mainEntry = textEntries.sort((a, b) => b.header.size - a.header.size)[0];
        }

        if (!mainEntry) {
            throw new Error('Could not identify a main document file.');
        }

        const rawContent = mainEntry.getData().toString('utf8');
        const ext = path.extname(mainEntry.name).toLowerCase();
        let finalContent = rawContent;
        let type = 'text';

        // Basic LaTeX processing
        if (ext === '.tex') {
            type = 'latex';
            // Wrap in a code block for now to preserve structure, 
            // since we don't have a full LaTeX->Markdown converter yet.
            finalContent = `\`\`\`latex\n${rawContent}\n\`\`\``;

            // Or add a header?
            finalContent = `# Imported LaTeX Project: ${mainEntry.name}\n\n` + finalContent;
        } else if (ext === '.md') {
            type = 'markdown';
        }

        return {
            content: finalContent,
            filename: mainEntry.name,
            type
        };
    }
}

export const zipImportService = new ZipImportService();
