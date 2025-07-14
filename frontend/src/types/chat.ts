export interface SearchSource {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  workflowId?: string;
  sessionId?: string;
  metadata?: Record<string, string | number | boolean>;
  searchSources?: SearchSource[];
}

export interface ChatSession {
  id: string;
  workflowId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}