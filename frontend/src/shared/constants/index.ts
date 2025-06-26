// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Animation Constants
export const ANIMATIONS = {
  // Durations
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
  
  // Easing
  EASE_IN_OUT: [0.4, 0, 0.2, 1],
  EASE_OUT: [0, 0, 0.2, 1],
  EASE_IN: [0.4, 0, 1, 1],
  
  // Spring configs
  SPRING_SMOOTH: { type: 'spring', stiffness: 300, damping: 30 },
  SPRING_BOUNCY: { type: 'spring', stiffness: 400, damping: 10 },
  SPRING_STIFF: { type: 'spring', stiffness: 600, damping: 40 },
} as const;

// Layout Constants
export const LAYOUT = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 40,
  PANEL_MIN_WIDTH: 300,
  PANEL_MAX_WIDTH: 600,
} as const;

// Workflow Component Types
export const COMPONENT_TYPES = {
  USER_QUERY: 'user-query',
  KNOWLEDGE_BASE: 'knowledge-base',
  LLM_ENGINE: 'llm-engine',
  WEB_SEARCH: 'web-search',
  OUTPUT: 'output',
} as const;

// Workflow Component Library
export const WORKFLOW_COMPONENTS = [
  {
    id: 'user-query',
    type: COMPONENT_TYPES.USER_QUERY,
    name: 'User Query',
    description: 'Accepts user input and questions',
    icon: '🤔',
    color: '#3B82F6',
    config: {
      placeholder: 'Enter your question...',
      maxLength: 1000,
    },
  },
  {
    id: 'knowledge-base',
    type: COMPONENT_TYPES.KNOWLEDGE_BASE,
    name: 'Knowledge Base',
    description: 'Searches through uploaded documents',
    icon: '📚',
    color: '#10B981',
    config: {
      searchType: 'semantic',
      maxResults: 5,
      threshold: 0.7,
    },
  },
  {
    id: 'llm-engine',
    type: COMPONENT_TYPES.LLM_ENGINE,
    name: 'LLM Engine',
    description: 'Processes queries using AI language models',
    icon: '🧠',
    color: '#8B5CF6',
    config: {
      model: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
  {
    id: 'web-search',
    type: COMPONENT_TYPES.WEB_SEARCH,
    name: 'Web Search',
    description: 'Searches the web for additional information',
    icon: '🌐',
    color: '#F59E0B',
    config: {
      provider: 'brave',
      maxResults: 10,
      country: 'US',
    },
  },
  {
    id: 'output',
    type: COMPONENT_TYPES.OUTPUT,
    name: 'Output',
    description: 'Displays the final result',
    icon: '📤',
    color: '#EF4444',
    config: {
      format: 'markdown',
      showMetadata: true,
    },
  },
] as const;

// Search Providers
export const SEARCH_PROVIDERS = {
  BRAVE: 'brave',
  SERPAPI: 'serpapi',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  CHUNK_SIZE: 1024, // tokens
  OVERLAP: 100, // tokens
} as const;

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  WORKFLOW_NAME_MAX_LENGTH: 100,
  MESSAGE_MAX_LENGTH: 10000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  WORKFLOW_DRAFT: 'workflow_draft',
  CHAT_HISTORY: 'chat_history',
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  EXECUTION_START: 'execution_start',
  EXECUTION_PROGRESS: 'execution_progress',
  EXECUTION_COMPLETE: 'execution_complete',
  EXECUTION_ERROR: 'execution_error',
  CHAT_MESSAGE: 'chat_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
