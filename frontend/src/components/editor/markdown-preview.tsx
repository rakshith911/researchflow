'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
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
      "prose dark:prose-invert max-w-none p-6 overflow-auto",
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
                    onNavigateToDocument?.(title)
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:opacity-80 hover:underline font-medium cursor-pointer"
                  title={`Navigate to: ${title}`}
                >
                  {children}
                </span>
              )
            }
            return <a href={href} {...props}>{children}</a>
          },
        }}
      >
        {processedContent || '*Start typing to see your content here...*'}
      </ReactMarkdown>
    </div>
  )
}