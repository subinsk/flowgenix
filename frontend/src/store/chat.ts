import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { chatService } from '@/services/chatService';
import { ChatMessage, ChatSession } from '@/types/chat';

interface ChatState {
  // Chat state
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  
  // Actions
  setCurrentSession: (session: ChatSession | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (messageId: string) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  createSession: (workflowId: string, title?: string) => ChatSession;
  deleteSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  clearAllSessions: () => void;
  loadSessions: () => Promise<void>;
  createSessionAsync: (workflowId: string, title?: string) => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  sendMessageAsync: (sessionId: string, content: string, role?: 'user' | 'assistant', searchSources?: any[]) => Promise<void>;
}

// API response type for ChatMessage
interface ApiChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string | number | Date;
  workflow_id: string;
  session_id: string;
}

// Utility to convert API ChatMessage to local Message type
function toMessage(msg: ApiChatMessage | ChatMessage): ChatMessage {
  // If already a ChatMessage, return as is
  if ('workflowId' in msg && 'sessionId' in msg) {
    return msg as ChatMessage;
  }
  // Otherwise, convert from API format
  const apiMsg = msg as ApiChatMessage;
  return {
    id: apiMsg.id,
    content: apiMsg.content,
    role: apiMsg.role,
    timestamp: new Date(apiMsg.timestamp),
    workflowId: apiMsg.workflow_id,
    sessionId: apiMsg.session_id,
  };
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSession: null,
        sessions: [],
        messages: [],
        isLoading: false,
        isTyping: false,

        // Actions
        setCurrentSession: (currentSession) => {
          set({ currentSession });
          if (currentSession) {
            set({ messages: currentSession.messages });
          }
        },

        setSessions: (sessions) => set({ sessions }),
        setMessages: (messages) => set({ messages }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setIsTyping: (isTyping) => set({ isTyping }),

        addMessage: (message) => {
          const { messages, currentSession, sessions } = get();
          const newMessages = [...messages, message];
          
          set({ messages: newMessages });
          
          if (currentSession) {
            const updatedSession = {
              ...currentSession,
              messages: newMessages,
              updatedAt: new Date(),
            };
            
            const updatedSessions = sessions.map((s) =>
              s.id === currentSession.id ? updatedSession : s
            );
            
            set({ 
              currentSession: updatedSession, 
              sessions: updatedSessions 
            });
          }
        },

        removeMessage: (messageId) => {
          const { messages, currentSession, sessions } = get();
          const filteredMessages = messages.filter((m) => m.id !== messageId);
          
          set({ messages: filteredMessages });
          
          if (currentSession) {
            const updatedSession = {
              ...currentSession,
              messages: filteredMessages,
              updatedAt: new Date(),
            };
            
            const updatedSessions = sessions.map((s) =>
              s.id === currentSession.id ? updatedSession : s
            );
            
            set({ 
              currentSession: updatedSession, 
              sessions: updatedSessions 
            });
          }
        },

        updateMessage: (messageId, updates) => {
          const { messages, currentSession, sessions } = get();
          const updatedMessages = messages.map((message) =>
            message.id === messageId ? { ...message, ...updates } : message
          );
          
          set({ messages: updatedMessages });
          
          if (currentSession) {
            const updatedSession = {
              ...currentSession,
              messages: updatedMessages,
              updatedAt: new Date(),
            };
            
            const updatedSessions = sessions.map((s) =>
              s.id === currentSession.id ? updatedSession : s
            );
            
            set({ 
              currentSession: updatedSession, 
              sessions: updatedSessions 
            });
          }
        },

        createSession: (workflowId: string, title?: string) => {
          const { sessions } = get();
          const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            workflowId,
            title: title || `Chat ${sessions.length + 1}`,
            messages: [],
            createdAt: new Date(),
          };
          
          const updatedSessions = [...sessions, newSession];
          set({ 
            sessions: updatedSessions,
            currentSession: newSession,
            messages: [],
          });
          
          return newSession;
        },

        deleteSession: (sessionId) => {
          const { sessions, currentSession } = get();
          const filteredSessions = sessions.filter((s) => s.id !== sessionId);
          
          set({ sessions: filteredSessions });
          
          if (currentSession?.id === sessionId) {
            set({ 
              currentSession: null,
              messages: [],
            });
          }
        },

        clearCurrentSession: () => set({
          currentSession: null,
          messages: [],
        }),

        clearAllSessions: () => set({
          currentSession: null,
          sessions: [],
          messages: [],
        }),

        loadSessions: async () => {
          set({ isLoading: true });
          try {
            const sessions = await chatService.getChatSessions();
            set({
              sessions: sessions.map((s) => ({
                id: s.id,
                workflowId: s.workflow_id,
                title: s.title,
                messages: ((s.messages || []) as (ApiChatMessage | ChatMessage)[]).map(toMessage),
                createdAt: new Date(s.created_at),
              })),
            });
          } finally {
            set({ isLoading: false });
          }
        },
        createSessionAsync: async (workflowId, title) => {
          set({ isLoading: true });
          try {
            const session = await chatService.createChatSession(workflowId, title);
            set((state) => ({
              sessions:[...state.sessions, {
                id: session.id,
                workflowId: session.workflow_id,
                title: session.title,
                messages: ((session.messages || []) as (ApiChatMessage | ChatMessage)[]).map(toMessage),
                createdAt: new Date(session.created_at),
              }],
              currentSession: {
                id: session.id,
                workflowId: session.workflow_id,
                title: session.title,
                messages: ((session.messages || []) as (ApiChatMessage | ChatMessage)[]).map(toMessage),
                createdAt: new Date(session.created_at),
              },  
              messages: ((session.messages || []) as (ApiChatMessage | ChatMessage)[]).map(toMessage),         
            }));
          } finally {
            set({ isLoading: false });
          }
        },
        loadMessages: async (sessionId) => {
          set({ isLoading: true });
          try {
            const messages = await chatService.getMessages(sessionId);
            set({ messages: (messages as (ApiChatMessage | ChatMessage)[]).map(toMessage) });
          } finally {
            set({ isLoading: false });
          }
        },
        sendMessageAsync: async (sessionId, content, role = 'user', searchSources) => {
          set({ isTyping: true });
          try {
            console.log('🔍 Chat store - sending message with search sources:', searchSources);
            const message = await chatService.sendMessage(sessionId, content, role);
            const messageWithSources = {
              ...toMessage(message as ApiChatMessage | ChatMessage),
              searchSources: searchSources || undefined
            };
            console.log('🔍 Chat store - final message with sources:', messageWithSources);
            set((state) => ({ messages: [...state.messages, messageWithSources] }));
          } finally {
            set({ isTyping: false });
          }
        },
      }),
      { name: 'chat-store' }
    )
  )
);
