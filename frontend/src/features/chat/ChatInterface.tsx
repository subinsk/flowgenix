import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/chat';
import { useWorkflowStore } from '../../store/workflow';
import { Button, Card } from '../../shared/components';
import { useNotifications } from '../../shared/hooks';
import { ANIMATIONS } from '../../shared/constants';

interface ChatInterfaceProps {
  className?: string;
  onSendMessage?: (message: string) => Promise<void>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  className = '',
  onSendMessage,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { 
    currentSession, 
    messages, 
    isLoading, 
    isTyping,
    addMessage,
    setIsLoading,
    setIsTyping,
  } = useChatStore();

  const { currentWorkflowId, lastBuildTime } = useWorkflowStore();
  const { showError } = useNotifications();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!lastBuildTime) {
      showError('Workflow Not Built', 'Please build the workflow stack first.');
      return;
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      content: inputMessage.trim(),
      role: 'user' as const,
      timestamp: new Date(),
      workflowId: currentWorkflowId || undefined,
    };

    // Add user message immediately
    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      await onSendMessage?.(userMessage.content);
    } catch (error) {
      showError('Message Failed', error instanceof Error ? error.message : 'Failed to send message');
      
      // Add error message
      addMessage({
        id: `msg-error-${Date.now()}`,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        workflowId: currentWorkflowId || undefined,
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={ANIMATIONS.SPRING_SMOOTH}
      className={`
        flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chat Interface
          </h3>
          {currentSession && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentSession.title}
            </span>
          )}
        </div>
        {!lastBuildTime && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            ⚠️ Build your workflow stack first to start chatting
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1, ...ANIMATIONS.SPRING_SMOOTH }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <Card
                  padding="sm"
                  className={`
                    ${message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                    }
                  `}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div className={`
                    text-xs mt-2 opacity-70
                    ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}
                  `}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </Card>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start"
          >
            <Card padding="sm" className="bg-gray-100 dark:bg-gray-700">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">AI is typing...</span>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Empty state */}
        {messages.length === 0 && lastBuildTime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                Start a conversation
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm">
                Your workflow is ready! Ask a question to get started.
              </p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={lastBuildTime ? "Type your message..." : "Build workflow first..."}
            disabled={!lastBuildTime || isLoading}
            rows={1}
            className="flex-1 resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <Button
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={!inputMessage.trim() || !lastBuildTime || isLoading}
            onClick={handleSendMessage}
            icon="🚀"
          >
            Send
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInterface;
