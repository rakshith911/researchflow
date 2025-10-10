import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ResearchFlow - AI-Powered Productivity Platform',
  description: 'Intelligent productivity platform for researchers, engineers, and healthcare professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="app-root" className="min-h-screen bg-background">
          {children}
        </div>
        <Toaster /> {/* Add this line */}
      </body>
    </html>
  )
}
