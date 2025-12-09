
// Define types for our rich extraction
export interface TextItem {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontName: string;
    hasEOL: boolean;
}

export interface LinkAnnotation {
    url: string;
    rect: number[]; // [x1, y1, x2, y2]
}

export interface PageContent {
    pageNumber: number;
    textItems: TextItem[];
    links: LinkAnnotation[];
    width: number;
    height: number;
}


export interface FontInfo {
    name: string;
    isBold: boolean;
    isItalic: boolean;
}

export class FullPdfImportService {
    async extract(buffer: Buffer): Promise<PageContent[]> {
        // Dynamic import for ESM compatibility in CJS project
        // @ts-ignore
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Load the document
        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const doc = await loadingTask.promise;

        const pages: PageContent[] = [];

        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            const annotations = await page.getAnnotations();
            const viewport = page.getViewport({ scale: 1.0 });

            // Extract Font Definitions from page commonObjs
            const fontMap = new Map<string, FontInfo>();

            // Note: getCommonObj is internal, but commonObjs is accessible on the page object usually
            // However, pdfjs-dist 4+ usually attaches styles to text items.
            // Let's rely on fontName match. Standard PDF fonts have semantic names.
            const isRefBold = (fontName: string) => /bold|black|heavy/i.test(fontName);
            const isRefItalic = (fontName: string) => /italic|oblique/i.test(fontName);

            // Extract Text
            const textItems: TextItem[] = textContent.items.map((item: any) => ({
                str: item.str,
                x: item.transform[4], // transform[4] is x translation
                y: item.transform[5], // transform[5] is y translation
                width: item.width,
                height: item.height,
                fontName: item.fontName,
                hasEOL: item.hasEOL
            }));

            // Extract Links
            const links: LinkAnnotation[] = annotations
                .filter((ann: any) => ann.subtype === 'Link' && ann.url)
                .map((ann: any) => ({
                    url: ann.url,
                    rect: ann.rect // PDF coordinates
                }));

            pages.push({
                pageNumber: i,
                textItems,
                links,
                width: viewport.width,
                height: viewport.height
            });
        }

        return pages;
    }

    /**
     * Converts the extracted rich content into a structure optimized for LLM consumption.
     */
    formatForLLM(pages: PageContent[]): string {
        let output = "";

        const isBoldName = (fontName: string) => /bold|black|heavy/i.test(fontName);
        const isItalicName = (fontName: string) => /italic|oblique/i.test(fontName);

        pages.forEach(page => {
            output += `--- PAGE ${page.pageNumber} ---\n`;

            // 1. Group items into Rows based on Y-coordinate overlap
            const rows: { y: number; items: TextItem[] }[] = [];
            const Y_TOLERANCE = 4; // pixels tolerance to consider items on "Same Line"

            // Sort all items by Y descending (Top -> Bottom) initially
            const allItems = [...page.textItems].sort((a, b) => b.y - a.y);

            allItems.forEach(item => {
                // Find an existing row that this item fits into
                const matchRow = rows.find(r => Math.abs(r.y - item.y) < Y_TOLERANCE);

                if (matchRow) {
                    matchRow.items.push(item);
                } else {
                    rows.push({ y: item.y, items: [item] });
                }
            });

            // 2. Sort Rows by Y descending (Top -> Bottom)
            rows.sort((a, b) => b.y - a.y);

            // 3. Process each row
            output += "CONTENT STREAM (Visual Rows):\n";

            rows.forEach(row => {
                // Sort items in row by X (Left -> Right)
                row.items.sort((a, b) => a.x - b.x);

                // Construct the line string
                let lineStr = "";
                let currentX = 0;

                row.items.forEach(item => {
                    // Check for links
                    const isPointInRect = (x: number, y: number, rect: number[]) => {
                        return x >= rect[0] && x <= rect[2] && y >= rect[1] && y <= rect[3];
                    };
                    const link = page.links.find(l => isPointInRect(item.x, item.y, l.rect));

                    let text = item.str;

                    // Add Font Metadata (VERY IMPORTANT FOR USER)
                    const isBold = isBoldName(item.fontName);
                    const isItalic = isItalicName(item.fontName);

                    if (isBold) text = `[BOLD]${text}[/BOLD]`;
                    if (isItalic) text = `[ITALIC]${text}[/ITALIC]`;

                    if (link) {
                        text = `[LINK url="${link.url}"]${text}[/LINK]`;
                    }

                    // Add spacing based on X distance
                    // If there's a significant gap, add spaces to hint layout
                    const gap = item.x - currentX;
                    if (currentX > 0 && gap > 10) {
                        lineStr += "  "; // Visual separator for wide gaps
                        // If gap is huge (column-like), maybe add more
                        if (gap > 50) lineStr += "    ";
                    } else if (currentX > 0) {
                        lineStr += " "; // Normal word spacing
                    }

                    lineStr += text;
                    currentX = item.x + item.width;
                });

                if (lineStr.trim()) {
                    output += `(y=${Math.round(row.y)}) ${lineStr}\n`;
                }
            });

            output += "\n";
        });

        return output;
    }
}

export const fullPdfImportService = new FullPdfImportService();
