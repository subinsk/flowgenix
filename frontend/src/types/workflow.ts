import { STATUS_MAP } from "@/constants";
import { Node } from "@xyflow/react";
import { ChatMessage } from "@/types/chat";

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatInterfaceProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  chatLoading: boolean
}

export interface NodeConfigurationPanelProps {
  selectedNode: any;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: any) => void;
  onDeleteNode: (nodeId: string) => void;
}

export interface NodeWrapperProps {
  children: React.ReactNode;
  type: string;
  selected: boolean;
  hasSource?: boolean;
  hasTarget?: boolean;
  onSettings?: () => void;
  onDelete?: (id: string) => void;
  id: string;
  validationErrors?: string[];
}

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
  status: string
}

export type WorkflowStatus = keyof typeof STATUS_MAP;

export interface DashboardWorkflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: WorkflowStatus | string
}

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
