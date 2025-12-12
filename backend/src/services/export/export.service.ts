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

      // Set content with tailored CSS for print
      const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

            body {
              font-family: 'Inter', sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              margin: 0;
              padding: 2.5cm; /* Standard margin */
            }

            /* Custom Fonts from Frontend */
            .font-serif { font-family: 'Merriweather', serif; }
            .font-mono { font-family: 'JetBrains Mono', monospace; }

            /* Typography */
            h1 { font-size: 2.25em; font-weight: 700; margin-bottom: 0.5em; letter-spacing: -0.025em; }
            h2 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; letter-spacing: -0.025em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25em; }
            h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; }
            p { margin-bottom: 1em; }
            
            /* Links */
            a { color: #2563eb; text-decoration: none; }
            
            /* Code */
            code { 
              font-family: 'JetBrains Mono', monospace; 
              background: #f3f4f6; 
              padding: 0.2em 0.4em; 
              border-radius: 0.25em; 
              font-size: 0.875em; 
            }
            pre { 
              background: #1f2937; 
              color: #f3f4f6; 
              padding: 1em; 
              border-radius: 0.5em; 
              overflow-x: auto; 
              font-family: 'JetBrains Mono', monospace;
              margin-bottom: 1em;
            }

            /* Blockquotes */
            blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 1em;
              margin-left: 0;
              font-style: italic;
              color: #4b5563;
            }

            /* Lists */
            ul, ol { margin-bottom: 1em; padding-left: 1.5em; }
            li { margin-bottom: 0.25em; }

            /* Images */
            img { max-width: 100%; height: auto; border-radius: 0.375em; }

            /* Print Overrides */
            @media print {
              body { -webkit-print-color-adjust: exact; }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${options.title ? `<h1 style="margin-bottom: 1cm; text-align: center;">${options.title}</h1>` : ''}
          ${html}
        </body>
        </html>
      `;

      await page.setContent(styledHtml, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: options.includeBackground ?? true,
        scale: options.scale || 1,
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
