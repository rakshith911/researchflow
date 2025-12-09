import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  TrendingUp,
  Lightbulb,
  Link2,
  FileText
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface SmartWritingAssistantProps {
  analysis: any
  isAnalyzing: boolean
  onDocumentClick: (id: string) => void
  onSendMessage?: (messages: any[]) => Promise<string>
  initialMessages?: ChatMessage[] // New prop
  className?: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function SmartWritingAssistant({
  analysis,
  isAnalyzing,
  onDocumentClick,
  onSendMessage,
  initialMessages = [], // Default to empty
  className
}: SmartWritingAssistantProps) {
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState("analysis")
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages) // Initialize with history
  const [inputValue, setInputValue] = useState("")
  const [isChatting, setIsChatting] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages])

  // Sync state with prop
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !onSendMessage) return

    const newMessage: ChatMessage = { role: 'user', content: inputValue }
    const updatedMessages = [...messages, newMessage]

    setMessages(updatedMessages)
    setInputValue("")
    setIsChatting(true)

    try {
      const response = await onSendMessage(updatedMessages)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error("Chat error:", error)
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error receiving the response." }])
    } finally {
      setIsChatting(false)
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-500 border-green-500/20"
    if (score >= 60) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    return "bg-red-500/10 text-red-500 border-red-500/20"
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
        <div className="px-4 pt-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="chat">Assistant</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analysis" className="flex-1 overflow-y-auto p-4 space-y-4 data-[state=inactive]:hidden">
          {isAnalyzing ? (
            <Card>
              <CardContent className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Analyzing content...</p>
              </CardContent>
            </Card>
          ) : !analysis ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start writing to get AI insights.</p>
              </CardContent>
            </Card>
          ) : !isAuthenticated ? (
            // GUEST LIMITATION VIEW
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    Preview Analysis
                  </div>
                  <Badge variant="outline" className={getQualityColor(analysis.qualityScore)}>
                    {analysis.qualityScore}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You are viewing a limited preview of the Smart Assistant.
                </p>

                {/* Blurred Sections */}
                <div className="space-y-3 opacity-50 blur-[2px] pointer-events-none select-none">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-20 bg-muted rounded w-full"></div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button size="sm" className="w-full" asChild>
                    <a href="/login">Log in to view detailed insights</a>
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Unlock structure, readability breakdown, and AI improvements.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Quality Score */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Quality Score
                    </div>
                    <Badge variant="outline" className={getQualityColor(analysis.qualityScore)}>
                      {analysis.qualityScore}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Readability</span>
                    <span>{analysis.readabilityScore || 0}/100</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${analysis.readabilityScore || 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysis.suggestions.map((suggestion: any, i: number) => (
                      <div key={i} className="text-sm border-l-2 border-primary/50 pl-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize text-xs text-muted-foreground">{suggestion.type}</span>
                        </div>
                        <p className="text-muted-foreground">{suggestion.message}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Related */}
              {analysis.relatedDocuments && analysis.relatedDocuments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Link2 className="h-4 w-4 mr-2" />
                      Related
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.relatedDocuments.map((doc: any) => (
                      <button
                        key={doc.documentId}
                        onClick={() => onDocumentClick(doc.documentId)}
                        className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm flex items-start"
                      >
                        <FileText className="h-3 w-3 mt-1 mr-2 shrink-0" />
                        <span className="line-clamp-2">{doc.title}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col h-full overflow-hidden data-[state=inactive]:hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 p-4">
                <Bot className="h-10 w-10 mb-2" />
                <p className="text-center text-sm">Ask me anything about your document.<br />"Summarize this", "Fix grammar", etc.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "rounded-lg p-3 text-sm max-w-[85%]",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isChatting && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-background">
            <div className="relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI..."
                className="pr-10"
                disabled={isChatting}
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isChatting}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}