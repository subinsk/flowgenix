import api from './api';

export interface SearchSource {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  searchSources?: SearchSource[];
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  workflow_id: string;
  created_at: string;
  messages: ChatMessage[];
}

export const chatService = {
  createChatSession: async (workflowId: string, title?: string): Promise<ChatSession> => {
    const response = await api.post('/chat/sessions', { workflow_id: workflowId, title });
    return response.data;
  },

  getChatSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get('/chat/sessions');
    return response.data;
  },

  sendMessage: async (sessionId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<ChatMessage> => {
    const response = await api.post('/chat/messages', {
      session_id: sessionId,
      content,
      role,
    });
    return response.data;
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  },
};
