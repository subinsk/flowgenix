export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  workflowId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  workflowId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}