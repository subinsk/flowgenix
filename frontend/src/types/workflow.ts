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
  selectedNode: WorkflowNode | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
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
  type: string;
  name: string;
  description: string;
  icon: string;
  config: Record<string, string | number | boolean>;
}

// Base WorkflowNode interface for API compatibility
export interface WorkflowNode extends Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    type?: WorkflowComponent['type'];
    config?: Record<string, string | number | boolean>;
    status?: WorkflowStatus;
    output?: string | number | boolean | Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, string | number | boolean>;
  data?: Record<string, string | number | boolean>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
  updated_at: string;
  user_id: string;
  status: WorkflowStatus;
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
  metadata?: Record<string, string | number | boolean>;
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
  input?: string | number | boolean | Record<string, unknown>;
  output?: string | number | boolean | Record<string, unknown>;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  steps: ExecutionStep[];
  startTime: Date;
  endTime?: Date;
  result?: string | number | boolean | Record<string, unknown>;
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

// UI-specific workflow interface that converts backend format to frontend format
export interface UIWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  status: WorkflowStatus;
}

// Helper function to convert backend Workflow to UI Workflow
export function toUIWorkflow(workflow: Workflow): UIWorkflow {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    nodes: workflow.nodes,
    edges: workflow.edges,
    createdAt: new Date(workflow.created_at),
    updatedAt: new Date(workflow.updated_at),
    userId: workflow.user_id,
    status: workflow.status,
  };
}

// Helper function to convert UI Workflow to backend Workflow
export function fromUIWorkflow(uiWorkflow: UIWorkflow): Workflow {
  return {
    id: uiWorkflow.id,
    name: uiWorkflow.name,
    description: uiWorkflow.description,
    nodes: uiWorkflow.nodes,
    edges: uiWorkflow.edges,
    created_at: uiWorkflow.createdAt.toISOString(),
    updated_at: uiWorkflow.updatedAt.toISOString(),
    user_id: uiWorkflow.userId,
    status: uiWorkflow.status,
  };
}
