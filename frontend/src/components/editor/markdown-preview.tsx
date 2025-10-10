'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import 'highlight.js/styles/github.css'
import React from 'react'

interface MarkdownPreviewProps {
  content: string
  onNavigateToDocument?: (title: string) => void 
  className?: string
}

export function MarkdownPreview({ content, onNavigateToDocument, className }: MarkdownPreviewProps) {
  // Convert [[wiki links]] to markdown links - FIXED VERSION
  const processedContent = React.useMemo(() => {
    if (!content) return content
    
    return content.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (match, title, displayText) => {
        const linkText = displayText || title
        return `[${linkText}](#wiki:${encodeURIComponent(title.trim())})`
      }
    )
  }, [content])


  return (
    <div className={cn(
      "prose prose-neutral max-w-none p-6 overflow-auto",
      "prose-headings:font-semibold prose-headings:text-gray-900",
      "prose-h1:text-3xl prose-h1:border-b prose-h1:pb-2 prose-h1:mb-6",
      "prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4",
      "prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3",
      "prose-p:text-gray-700 prose-p:leading-7 prose-p:mb-4",
      "prose-ul:my-4 prose-ol:my-4",
      "prose-li:text-gray-700 prose-li:my-1",
      "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600",
      "prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-red-600",
      "prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto",
      "prose-table:border-collapse prose-table:border prose-table:border-gray-300",
      "prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-th:font-semibold prose-th:text-left",
      "prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2",
      "prose-a:text-blue-600 prose-a:hover:text-blue-800 prose-a:no-underline hover:prose-a:underline",
      "prose-strong:font-semibold prose-strong:text-gray-900",
      "prose-em:italic prose-em:text-gray-700",
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Wiki link handler
          a: ({ node, href, children, ...props }) => {
  if (href?.startsWith('#wiki:')) {
    const title = decodeURIComponent(href.replace('#wiki:', ''))
    return (
      <span
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Clicking wiki link:', title) // Debug
          onNavigateToDocument?.(title)
        }}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
        title={`Navigate to: ${title}`}
      >
        {children}
      </span>
    )
  }
  return <a href={href} {...props}>{children}</a>
},
          // Custom checkbox rendering for task lists
          input: ({ node, ...props }) => (
            <input {...props} className="mr-2" />
          ),
          // Custom table rendering
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border border-gray-300">
                {children}
              </table>
            </div>
          ),
          // Custom blockquote rendering
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-6 italic bg-blue-50">
              {children}
            </blockquote>
          ),
          // Custom code block rendering
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-6">
              {children}
            </pre>
          ),
          // Custom heading anchors
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 border-b pb-2 mb-6 mt-8 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              {children}
            </h3>
          ),
          // Custom paragraph rendering
          p: ({ children }) => (
            <p className="text-gray-700 leading-7 mb-4">
              {children}
            </p>
          ),
          // Custom list rendering
          ul: ({ children }) => (
            <ul className="list-disc ml-6 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-6 mb-4 space-y-1">
              {children}
            </ol>
          ),
        }}
      >
        {processedContent || '*Start typing to see your content here...*'}
      </ReactMarkdown>
    </div>
  )
}