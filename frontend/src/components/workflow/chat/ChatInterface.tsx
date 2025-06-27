import { ChatInterfaceProps } from '@/types';
import { ChatMessage } from '@/types/chat';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Copy, RefreshCw, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown';

export function ChatInterface({ messages = [], onSendMessage, isLoading = false, chatLoading }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onSendMessage && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Defensive timestamp formatter: accepts string | Date, returns '' for invalid/empty
  const formatTimestamp = (timestamp: string | Date | undefined | null) => {
    if (!timestamp) return '';
    let dateObj: Date;
    if (typeof timestamp === 'string') {
      // Try to parse string as ISO date
      const parsed = Date.parse(timestamp);
      if (isNaN(parsed)) return '';
      dateObj = new Date(parsed);
    } else if (timestamp instanceof Date) {
      if (isNaN(timestamp.getTime())) return '';
      dateObj = timestamp;
    } else {
      return '';
    }
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-gray-50/50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-sm flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Ready to help with your workflow</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{messages.length}</span>
        </div>
      </motion.div>
      
      {/* Messages Container - Enhanced scrollable area */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto scrollbar-thin">
          <div className="p-6 space-y-6 min-h-full flex flex-col justify-end">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center flex-1 text-center py-12"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">Start a conversation</h4>
                  <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                    Ask questions about your workflow, uploaded documents, or get help with your data processing needs.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role !== 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`group relative max-w-[75%] ${message.role === 'user' ? 'order-2' : ''}`}>
                        <div
                          className={`px-5 py-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-lg'
                              : 'bg-card border border-border text-card-foreground rounded-bl-lg'
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            <div className="max-h-80 overflow-y-auto scrollbar-thin pr-2">
                              {message.role === 'assistant' ? (
                                <Markdown>{message.content}</Markdown>
                              ) : (
                                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
                            <div className="flex items-center gap-2 text-xs opacity-70">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(message.timestamp)}</span>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content)}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-current/10 rounded-lg text-current hover:scale-105 h-auto"
                              title="Copy message"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Typing Indicator */}
            {chatLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-4 justify-start"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card border border-border px-5 py-4 rounded-2xl rounded-bl-lg shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2.5 h-2.5 bg-blue-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2.5 h-2.5 bg-blue-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2.5 h-2.5 bg-blue-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      
      {/* Input Area */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-sm flex-shrink-0"
      >
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-none"
              placeholder="Type your message... (Shift+Enter for new line)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isLoading || chatLoading}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading || chatLoading}
              className="absolute right-4 bottom-3 p-2 h-8 w-8 rounded-lg hover:scale-105 active:scale-95 transition-transform"
              size="icon"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className={inputValue.length > 800 ? 'text-orange-500' : ''}>{inputValue.length}/1000</span>
        </div>
      </motion.div>
    </div>
  );
}
