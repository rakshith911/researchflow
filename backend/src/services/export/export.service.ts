import puppeteer from 'puppeteer';
// import { exec } from 'child_process';
// import util from 'util';

// const execAsync = util.promisify(exec);

export class ExportService {
  /**
   * Generate PDF from HTML using Puppeteer for pixel-perfect rendering
   */
  async toPdf(html: string, options: {
    title?: string,
    includeBackground?: boolean,
    scale?: number
  } = {}): Promise<Buffer> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // Refined CSS for professional documents (Resumes/Papers)
      // Reduced margins, better typography scaling, page-break handling
      const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

            :root {
                --font-sans: Georgia, 'Times New Roman', Times, serif; /* LaTeX-like Serif style */
                --font-mono: 'Courier New', Courier, monospace;
            }

            @page {
                margin: 1.0cm; /* Keep the 'Best Yet' margins */
                size: A4;
            }

            body {
              font-family: var(--font-sans);
              line-height: 1.38; /* Micro-adjustment: +0.03 to fill page perfectly */
              color: #000000;
              margin: 0;
              padding: 0; 
              font-size: 10.5pt;
            }

            /* Custom Fonts from Frontend */
            .font-serif { font-family: var(--font-serif); }
            .font-mono { font-family: var(--font-mono); }

            /* Remove default HR */
            hr {
                display: none;
                margin: 0;
                border: none;
            }

            /* Typography */
            h1 { 
                font-size: 22pt; 
                font-weight: 700; 
                margin-top: 0;
                margin-bottom: 0.15em; 
                letter-spacing: 0.02em; 
                line-height: 1.2;
                text-align: center; 
                page-break-after: avoid; 
                text-transform: uppercase;
            }
            
            /* Subtitle/Contact info style */
            h1 + p {
                text-align: center;
                margin-bottom: 1.5em; 
                font-size: 10.5pt;
            }

            h2 { 
                font-size: 12pt; 
                font-weight: 700; 
                margin-top: 1.1em; 
                margin-bottom: 0.4em; 
                letter-spacing: 0.05em; 
                border-bottom: 1px solid #000; 
                padding-bottom: 0.15em; 
                page-break-after: avoid;
                text-transform: uppercase;
                text-align: left;
            }
            h3 { 
                font-size: 10.5pt; 
                font-weight: 700; 
                margin-top: 0.75em; 
                margin-bottom: 0.25em; 
                page-break-after: avoid;
                text-align: left;
            }
            p { 
                margin-bottom: 0.6em; /* +0.1em to breathe more */
                text-align: left; 
            }
            
            /* Links */
            a { color: #000000; text-decoration: none; }
            
            /* Code */
            code { 
              font-family: var(--font-mono); 
              background: #f3f4f6; 
              padding: 0.1em 0.3em; 
              border-radius: 0.25em; 
              font-size: 0.9em; 
            }
            pre { 
              background: #f3f4f6; 
              color: #000; 
              border: 1px solid #e5e7eb;
              padding: 0.6em; 
              border-radius: 0.25em; 
              overflow-x: auto; 
              font-family: var(--font-mono);
              margin-bottom: 0.6em;
              page-break-inside: avoid;
            }

            /* Blockquotes */
            blockquote {
              border-left: 2px solid #000;
              padding-left: 0.5em;
              margin-left: 0;
              font-style: italic;
              color: #333;
              margin-bottom: 0.6em;
            }

            /* Lists */
            ul, ol { 
                margin-bottom: 0.6em; 
                padding-left: 1.4em; 
            }
            li { 
                margin-bottom: 0.25em; /* +0.05em for better readability */
            }

            /* Images */
            img { 
                max-width: 100%; 
                height: auto; 
                border-radius: 0.375em; 
                page-break-inside: avoid;
            }

            /* Table Support */
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1em;
            }
            th, td {
                border: 1px solid #e5e7eb;
                padding: 0.5em;
                text-align: left;
            }
            th {
                background-color: #f9fafb;
                font-weight: 600;
            }

            /* Page Break Utilities */
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }

            /* Print Overrides */
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="content">
            ${html}
          </div>
        </body>
        </html>
      `;

      await page.setContent(styledHtml, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: options.includeBackground ?? true,
        scale: options.scale || 1,
        // Margins are handled by CSS @page now, but we keep 0 here to avoid double margins
        margin: {
          top: '0px',
          bottom: '0px',
          left: '0px',
          right: '0px'
        }
      });

      return Buffer.from(pdf);
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * Generate DOCX using html-to-docx (basic support)
   */
  async toDocx(html: string, title?: string): Promise<Buffer> {
    // Basic wrapper since html-docx-js-typescript works mainly in browser or with specific setup
    // For Node, we might need a different approach if this fails, but let's try.
    // Actually html-docx-js-typescript is often browser-centric. 
    // 'html-to-docx' package is better for Node. 

    // Let's assume we use 'html-to-docx' which is robust for Node.
    const HTMLtoDOCX = require('html-to-docx');

    const docx = await HTMLtoDOCX(html, null, {
      title: title || 'Document',
      font: 'Arial'
    });

    return docx;
  }
}

export const exportService = new ExportService();
