import api from './api';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  workflow_id?: string;
}

export interface ChatSession {
  id: string;
  workflow_id: string;
  created_at: string;
  messages: ChatMessage[];
}

export const chatService = {
  createChatSession: async (workflowId: string): Promise<ChatSession> => {
    const response = await api.post('/chat/sessions', { workflow_id: workflowId });
    return response.data;
  },

  getChatSessions: async (workflowId?: string): Promise<ChatSession[]> => {
    const params = workflowId ? { workflow_id: workflowId } : {};
    const response = await api.get('/chat/sessions', { params });
    return response.data;
  },

  sendMessage: async (sessionId: string, message: string): Promise<ChatMessage> => {
    const response = await api.post(`/chat/sessions/${sessionId}/messages`, { 
      content: message 
    });
    return response.data;
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  },

  deleteChatSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/chat/sessions/${sessionId}`);
  },
};
