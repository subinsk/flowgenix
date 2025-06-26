import { Node, Edge } from 'reactflow';

// Auth types
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// Workflow types
export interface WorkflowComponent {
  id: string;
  type: 'user-query' | 'knowledge-base' | 'llm-engine' | 'web-search' | 'output';
  name: string;
  description: string;
  icon: string;
  config: Record<string, any>;
}

export interface WorkflowNode extends Node {
  data: {
    label: string;
    type: WorkflowComponent['type'];
    config?: Record<string, any>;
    status?: 'idle' | 'running' | 'completed' | 'error';
    output?: any;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

// Chat types
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
  updatedAt: Date;
}

// Document types
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  url?: string;
  embeddings?: number[][];
  metadata?: Record<string, any>;
}

export interface DocumentUploadOptions {
  extractText: boolean;
  generateEmbeddings: boolean;
  chunkSize?: number;
  overlap?: number;
}

// Execution types
export interface ExecutionStep {
  id: string;
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  steps: ExecutionStep[];
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

// Search types
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  rank: number;
}

export interface SearchOptions {
  provider: 'brave' | 'serpapi';
  maxResults?: number;
  country?: string;
  language?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// UI types
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: Record<string, any>;
}

// Animation types
export interface AnimationVariants {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
}

export interface AnimationProps {
  variants?: AnimationVariants;
  initial?: string | Record<string, any>;
  animate?: string | Record<string, any>;
  exit?: string | Record<string, any>;
  transition?: Record<string, any>;
  delay?: number;
  duration?: number;
}
