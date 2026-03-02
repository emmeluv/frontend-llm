import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

function parseLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s,\]]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline break-all hover:text-blue-300"
        >
          {part}
        </a>
      )
    }
    urlRegex.lastIndex = 0
    return <span key={i}>{part}</span>
  })
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-3 mt-1">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
            <path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[#2f2f2f] text-white rounded-br-md'
            : 'bg-[#1e1e1e] text-gray-100 rounded-bl-md'
        }`}
      >
        {isUser ? message.content : parseLinks(message.content)}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center ml-3 mt-1">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />
          </svg>
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex w-full mb-6 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-3">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
          <path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z" />
        </svg>
      </div>
      <div className="bg-[#1e1e1e] px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

let idCounter = 0

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const question = input.trim()
    if (!question || loading) return

    const userMsg: Message = { id: ++idCounter, role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('http://localhost:3000/api/query/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      const answer = data?.answer ?? 'No answer returned.'
      const assistantMsg: Message = { id: ++idCounter, role: 'assistant', content: answer }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      const errMsg: Message = {
        id: ++idCounter,
        role: 'assistant',
        content: 'Error: Unable to reach the server. Please try again.',
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-[#212121] text-white">
      {/* Header */}
      <header className="flex items-center justify-center h-14 border-b border-white/10 flex-shrink-0">
        <span className="text-base font-semibold text-gray-200 tracking-wide">LLM-ontology</span>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isEmpty && !loading && (
            <div className="flex flex-col items-center justify-center h-full mt-24 gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                  <path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-200">How can I help you today?</h2>
              <p className="text-gray-400 text-sm">Ask me anything about DX projects.</p>
            </div>
          )}
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="flex-shrink-0 border-t border-white/10 bg-[#212121] px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-[#2f2f2f] rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/20 transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message LLM Saya..."
              disabled={loading}
              className="flex-1 bg-transparent resize-none text-sm text-gray-100 placeholder-gray-500 focus:outline-none max-h-[200px] leading-6"
              style={{ overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                input.trim() && !loading
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-[#3f3f3f] text-gray-600 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </footer>
    </div>
  )
}
