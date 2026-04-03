'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send,
  MessageSquare,
  User,
  Loader2,
  BarChart3,
  Trash2,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 max-w-3xl"
    >
      <div className="flex size-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 flex-shrink-0 mt-1">
        <MessageSquare className="size-4" />
      </div>
      <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </motion.div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <motion.div
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        className="flex justify-center"
      >
        <div className="max-w-2xl mx-auto rounded-lg bg-teal-50 border border-teal-100 px-4 py-3 text-sm text-teal-800">
          {message.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={cn('flex items-start gap-3 max-w-3xl', isUser && 'ml-auto flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={cn(
        'flex size-8 items-center justify-center rounded-full flex-shrink-0 mt-1',
        isUser
          ? 'bg-teal-600 text-white'
          : 'bg-teal-100 text-teal-700'
      )}>
        {isUser ? <User className="size-4" /> : <MessageSquare className="size-4" />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'rounded-2xl px-4 py-3 max-w-[80%] min-w-0',
        isUser
          ? 'rounded-tr-md bg-teal-600 text-white'
          : 'rounded-tl-md bg-muted text-foreground'
      )}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-neutral max-w-none break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:text-foreground [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code:before]:content-none [&_code:after]:content-none [&_pre]:bg-background [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h4]:text-sm [&_table]:text-xs">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function SmeAiChat() {
  const user = useAuthStore((s) => s.user)
  const orgId = user?.orgId ?? ''
  const orgName = user?.orgName ?? ''

  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  // System greeting
  React.useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'system',
          content: `Bonjour ! Je suis votre assistant **DataBridge** 👋\n\nJe peux vous aider à analyser vos données de **${orgName}**, répondre à des questions sur vos pipelines, sources de données, et dashboards.\n\nEssayez par exemple :\n- *"Quelles sont mes métriques récentes ?"*\n- *"Comment améliorer mon pipeline de vente ?"*\n- *"Résumé de mes sources de données"*`,
          timestamp: new Date(),
        },
      ])
    }
  }, [messages.length, orgName])

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (userMessage: string) => {
      const conversationMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...conversationMessages, { role: 'user', content: userMessage }],
          orgId,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || 'Failed to get response')
      }

      return res.json() as Promise<{ message: string; timestamp: string }>
    },
    onMutate: () => {
      setIsTyping(true)
    },
    onSuccess: (data, userMessage) => {
      // Add user message
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      }

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsTyping(false)
      setInput('')
      inputRef.current?.focus()
    },
    onError: (error) => {
      setIsTyping(false)
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Erreur** : ${error.message || 'Impossible de contacter l\'assistant. Veuillez réessayer.'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    },
  })

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isTyping || sendMessage.isPending) return
    sendMessage.mutate(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
  }

  if (!orgId) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Vous devez être connecté en tant qu'utilisateur PME pour accéder à cette page.</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px]"
    >
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Assistant DataBridge</h2>
            <p className="text-xs text-muted-foreground">
              {orgName} · Contextualisé avec vos données
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={handleNewChat}>
            <Plus className="size-3" />
            Nouveau chat
          </Button>
          {messages.length > 1 && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 text-muted-foreground" onClick={handleClear}>
              <Trash2 className="size-3" />
              Effacer
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 py-4" ref={scrollRef}>
        <div className="space-y-4 px-1">
          {messages.length === 0 && !isTyping && (
            <div className="flex items-center justify-center py-20">
              <Skeleton className="h-4 w-48" />
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      <div className="pt-4 border-t">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question sur vos données..."
              className="min-h-[44px] max-h-[120px] resize-none pr-12 text-sm"
              rows={1}
              disabled={isTyping || sendMessage.isPending}
            />
          </div>
          <Button
            size="icon"
            className="size-10 flex-shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleSubmit}
            disabled={!input.trim() || isTyping || sendMessage.isPending}
          >
            {isTyping || sendMessage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Les réponses sont basées sur les données disponibles. Vérifiez les informations importantes.
        </p>
      </div>
    </motion.div>
  )
}
