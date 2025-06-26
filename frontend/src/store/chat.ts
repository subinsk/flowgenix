import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  workflowId?: string;
}

interface ChatSession {
  id: string;
  workflowId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  // Chat state
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  
  // Actions
  setCurrentSession: (session: ChatSession | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setMessages: (messages: Message[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  addMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  createSession: (workflowId: string, title?: string) => ChatSession;
  deleteSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  clearAllSessions: () => void;
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
            updatedAt: new Date(),
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
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          sessions: state.sessions,
          currentSession: state.currentSession,
        }),
      }
    )
  )
);
