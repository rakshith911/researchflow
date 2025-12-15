import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, RefreshCw, AlertCircle, Loader2, Download } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'

interface LatexPreviewProps {
    content: string
    documentId: string
    className?: string
}

export function LatexPreview({ content, documentId, className }: LatexPreviewProps) {
    const [isCompiling, setIsCompiling] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [lastCompiledHash, setLastCompiledHash] = useState<string>('')
    const { toast } = useToast()

    // Cleanup PDF URL on unmount
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl)
            }
        }
    }, [pdfUrl])

    const handleCompile = async () => {
        setIsCompiling(true)
        try {
            const blob = await apiClient.compileDocument(documentId)
            const url = URL.createObjectURL(blob)

            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl)
            }

            setPdfUrl(url)
            setLastCompiledHash(generateContentHash(content))

            toast({
                title: "Compilation Successful",
                description: "PDF has been generated.",
                duration: 3000,
            })

        } catch (error) {
            console.error('Compilation failed:', error)
            toast({
                title: "Compilation Failed",
                description: "There was an error compiling your LaTeX document.",
                variant: "destructive",
            })
        } finally {
            setIsCompiling(false)
        }
    }

    // Simple hash to detect changes (naive)
    const generateContentHash = (str: string) => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i)
            hash |= 0
        }
        return hash.toString()
    }

    const hasUncompiledChanges = generateContentHash(content) !== lastCompiledHash

    return (
        <div className={`flex flex-col h-full bg-muted/10 ${className}`}>

            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-background/50 backdrop-blur">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground px-2">
                        {pdfUrl ? 'PDF Ready' : 'Not Compiled'}
                    </span>
                    {hasUncompiledChanges && pdfUrl && (
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full">
                            Uncompiled Changes
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {pdfUrl && (
                        <Button variant="ghost" size="sm" asChild>
                            <a href={pdfUrl} download="document.pdf">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </a>
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={handleCompile}
                        disabled={isCompiling}
                        className={hasUncompiledChanges && pdfUrl ? "animate-pulse border-orange-500 border" : ""}
                    >
                        {isCompiling ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Compiling...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Compile
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-hidden relative">
                {pdfUrl ? (
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-none bg-white"
                        title="PDF Preview"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="p-4 bg-primary/5 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                            <FileText className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium">Ready to Compile</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                            Click the compile button to generate a PDF preview of your LaTeX document.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
