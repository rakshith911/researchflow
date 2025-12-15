import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

export class LatexService {
    /**
     * Compiles LaTeX content to PDF
     * Currently uses a MOCK implementation using PDFKit to render the raw source
     * real implementation would use 'pdflatex' or 'pandoc' locally or via container
     */
    async compileToPdf(content: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument()
                const chunks: Buffer[] = []

                doc.on('data', (chunk) => chunks.push(chunk))
                doc.on('end', () => resolve(Buffer.concat(chunks)))

                // Mock PDF Content
                doc.fontSize(20).text('LaTeX Compilation Preview (Mock)', { align: 'center' })
                doc.moveDown()
                doc.fontSize(12).text('The following content was submitted for compilation:', { align: 'left' })
                doc.moveDown()

                // Render raw latex code
                doc.font('Courier').fontSize(10).text(content)

                doc.moveDown()
                doc.font('Helvetica').fontSize(10).fillColor('red')
                doc.text('Note: Real LaTeX compilation requires a local LaTeX distribution (texlive).')

                doc.end()
            } catch (error) {
                reject(error)
            }
        })
    }
}

export const latexService = new LatexService()
