import { ChatInterfaceProps } from '@/types';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown';
import { Logo } from '@/components/common/logo';
import { DialogHeader, DialogTitle, Separator, Textarea } from '@/components/ui';
import { Icon as Iconify } from '@iconify/react';
import Image from 'next/image';

export function ChatInterface({ messages = [], onSendMessage, isLoading = false, chatLoading }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <>
      <DialogHeader className='border-none shadow'>
        <DialogTitle className="pl-5 pr-14 pt-3 m-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Logo type="dark" variant='small' className='h-[25px] w-[25px]' />
              <h1 className="text-lg font-semibold text-foreground">GenAI Stack Chat</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{messages.length}</span>
            </div>
          </div>
        </DialogTitle>
        <Separator />
      </DialogHeader>

      <div className="flex-1 h-full w-full overflow-y-auto scrollbar-thin px-6 py-6 bg-muted/70">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className='flex flex-col gap-4 m-auto text-center items-center justify-center h-full'>
              <div className="flex items-center space-x-2">
                <Logo type="dark" variant='small' className='h-[25px] w-[25px]' />
                <h1 className="text-lg font-semibold text-foreground">GenAI Stack Chat</h1>
              </div>
              <p className='text-muted-foreground'>Start a conversation to test your stack</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`flex gap-4 items-start justify-start`}
                >
                  {message.role !== 'user' && (
                    <div className="flex rounded-md bg-[#D2FFD1] p-1 h-10 w-10 items-center justify-center text-lg">
                      🤖
                    </div>
                  )}

                  <div className={`group relative max-w-[75%] ${message.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`px-5 pt-2`}
                    >
                      <div className="text-sm leading-relaxed">
                        <div className="">
                          {message.role === 'assistant' ? (
                            <Markdown>{message.content}</Markdown>
                          ) : (
                            <div className="whitespace-pre-wrap break-words">{message.content}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex rounded-md bg-[#C0DAFF] p-1 h-10 w-10 items-center justify-center text-lg">
                      <Image
                        src="/user-chat.png"
                        alt="User Icon"
                        width={20}
                        height={20}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-border/50 backdrop-blur-sm flex-shrink-0 bg-muted/70 rounded-b-lg"
      >
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              className="overflow-auto w-full bg-background border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-muted-foreground/60 transition-colors resize-none"
              placeholder={isLoading || chatLoading ? "Thinking..." : "Send a message"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || chatLoading}
              style={{ height: "80px" }}
            />

            <Button
              type="submit"
              variant="ghost"
              disabled={!inputValue.trim() || isLoading || chatLoading}
              className="absolute right-4 bottom-3 p-2 h-8 w-8 rounded-lg hover:scale-105 active:scale-95 transition-transform"
              size="icon"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Iconify
                  icon="iconoir:send"
                  style={{
                    height: '23px', width: '23px'
                  }} />
              )}
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span className={inputValue.length > 800 ? 'text-orange-500' : ''}>{inputValue.length}/1000</span>
        </div>
      </motion.div>
    </>
  );
}
