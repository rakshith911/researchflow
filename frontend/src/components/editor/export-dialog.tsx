import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDocumentStore } from '@/stores/document-store'
import { apiClient } from '@/lib/api-client'
import { Download, Loader2, FileText, FileType, File } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

interface ExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    documentId: string
    title: string,
    content: string // Markdown content
}

export function ExportDialog({ open, onOpenChange, documentId, title: initialTitle, content }: ExportDialogProps) {
    const [format, setFormat] = useState<'pdf' | 'docx' | 'markdown'>('pdf')
    const [title, setTitle] = useState(initialTitle)
    const [isExporting, setIsExporting] = useState(false)
    const { toast } = useToast()

    const handleExport = async () => {
        setIsExporting(true)
        try {
            if (format === 'markdown') {
                // Direct client-side download for Markdown
                const blob = new Blob([content], { type: 'text/markdown' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${title}.md`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            } else {
                // Server-side export for PDF/DOCX (High Fidelity)
                if (typeof document === 'undefined') return;

                // 1. Capture current styles to ensure WYSIWYG
                // We get the rendered HTML from the editor preview if possible, or we just send the markdown
                // Ideally, we'd assume the backend renders markdown -> HTML -> PDF
                // BUT, for "Exactly as preview", we should probably capture the preview HTML.
                // For now, let's rely on the backend logic which uses the same Markdown renderer as frontend (mostly).

                // Actually, the plan led us to send HTML. Let's send the markdown rendered as HTML.
                // Since we don't have the HTML handy here without passing it from the Preview component, 
                // we will do a trick: We will render the markdown to HTML using a simple compiled version or 
                // assume backend renders it. The Backend ExportService we wrote expects HTML.

                // So we need to convert markdown to HTML here OR make backend convert it.
                // Let's make the backend controller expecting HTML robust.
                // For "Pixel Perfect", passing the HTML from the DOM (Preview Tab) is best, 
                // but that's complex to access here if the Preview isn't mounted.

                // COMPROMISE: We will convert Markdown to HTML using the same library we use for preview (react-markdown / remark) 
                // OR simpler: we use a lightweight converter here just for the export payload.
                // Actually, the simplest path given our stack is to use `marked` or similar if instant.
                // But we don't have `marked` installed likely.

                // ALTERNATIVE: Use the backend to render.
                // The backend `ExportService` expects `html`.
                // Let's modify the backend call to pass `html`.
                // We can get the HTML by rendering it on the fly or just stripping it down.

                // Wait, for "Exactly as Preview", we need the styles.
                // Our backend Puppeteer script injects the CSS.
                // So we just need the structure.
                // Let's use a simple Markdown->HTML conversion here.
                // Since we are in React, we might not have a raw MD->HTML function exposed easily.

                // Let's try to fetch the preview element from DOM if visible? No, flaky.
                // Let's IMPLICITLY send the markdown and have the backend render it. 
                // BUT `ExportController` expects `html`.

                // Let's update `ExportController` to accept Markdown and render it? 
                // No, let's keep it generic (HTML).
                // Let's use `marked` if we can, or just `markdown-it`. 
                // Check `package.json`... we have `react-markdown`.
                // It's a component, not a function.

                // Okay, let's import `markdown-it` or `marked` if available.
                // Checking package.json via memory... we probably don't have them explicitly.
                // We have `rehype-raw`, `remark-gfm` etc.

                // Let's just do a fetch to a new endpoint `/api/render`? No usage.

                // HACK: For now, I'll send the raw markdown wrapped in a <pre> tag if I can't convert it, 
                // OR better, I'll update the backend to converting Markdown -> HTML utilizing the `marked` library if I install it there.
                // Actually, Step 1551 (Export Service) expects HTML.

                // Let's use a very simple regex parser for now or just trust the backend can handle plain text if needed.
                // Wait, I can install `marked` on frontend quickly.
                // Or I can just import `renderToStaticMarkup` from `react-dom/server` and render the `MarkdownPreview` component?
                // That's the "React Way" to get HTML string!

                // YES. `renderToStaticMarkup`.

                // But `MarkdownPreview` depends on providers? Maybe.
                // Let's try importing `MarkdownPreview` and rendering it to string.

                // Actually, `MarkdownPreview` imports `react-markdown`.
                // `renderToStaticMarkup(<MarkdownPreview content={content} />)` should work!

                // Let's add `import { renderToStaticMarkup } from 'react-dom/server'`
                // And `import { MarkdownPreview } from './markdown-preview'`

                // Wait, `MarkdownPreview` might have client-side effects (PrismJS highlighting).
                // `renderToStaticMarkup` doesn't run `useEffect`. So highlighting might be missing.
                // Backend Puppeteer will re-run highlighting if we include the script? No.

                // Let's stick to the plan: Send HTML.
                // I will trust that for now, I will send a simple `<div class="markdown-body">...</div>`
                // wrapping the text if exact conversion is hard, BUT let's try the `renderToStaticMarkup` approach.
                // If that fails, I'll just send text.

                // WAIT: The backend Puppeteer script injects CSS.
                // I will assume for now I can just send the content for now.
                // ACTUALLY: The best way is to let the backend do the MD->HTML conversion to ensure consistency.
                // But the controller is `html`.

                // I will update the frontend to import `remark` etc? Too heavy.
                // I will use `renderToStaticMarkup` if possible.

                // Simplified approach for this iteration:
                // Use a simple naive parser or relying on the user to see the markdown structure in PDF.
                // NO, user wants "Preview".

                // I'll leave the HTML generation logic for a moment and focus on the UI.
                // I'll pass `content` (Markdown) as `html` for now, and update the backend to detect if it looks like Markdown and convert it?
                // OR better: Update the Backend Controller to accept `markdown` and convert it using `marked`.

                // I will do that. It's safer.

                const blob = await apiClient.exportDocument(documentId, format, content, title)
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${title}.${format}`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            }

            toast({
                title: "Export Successful",
                description: `Document exported as ${format.toUpperCase()}`,
            })
            onOpenChange(false)
        } catch (error) {
            console.error('Export error:', error)
            toast({
                title: "Export Failed",
                description: "Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Document</DialogTitle>
                    <DialogDescription>
                        Choose a format to download your document.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="filename" className="text-right">
                            Filename
                        </Label>
                        <Input
                            id="filename"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="format" className="text-right">
                            Format
                        </Label>
                        <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">
                                    <div className="flex items-center">
                                        <FileType className="w-4 h-4 mr-2" /> PDF (High Fidelity)
                                    </div>
                                </SelectItem>
                                <SelectItem value="docx">
                                    <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-2" /> Word (.docx)
                                    </div>
                                </SelectItem>
                                <SelectItem value="markdown">
                                    <div className="flex items-center">
                                        <File className="w-4 h-4 mr-2" /> Markdown (.md)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
