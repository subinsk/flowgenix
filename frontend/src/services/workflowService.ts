import { WorkflowNode as TypesWorkflowNode, WorkflowEdge as TypesWorkflowEdge, Workflow as TypesWorkflow } from '@/types/workflow';
import api from './api';

// Helper function to check if there's a path between nodes
const hasPathBetweenNodes = (sourceId: string, targetId: string, edges: TypesWorkflowEdge[]): boolean => {
  if (sourceId === targetId) {
    return true;
  }
  
  // Build adjacency list
  const graph: Record<string, string[]> = {};
  edges.forEach(edge => {
    if (!graph[edge.source]) {
      graph[edge.source] = [];
    }
    graph[edge.source].push(edge.target);
  });
  
  // DFS to find path
  const visited = new Set<string>();
  
  const dfs = (currentId: string): boolean => {
    if (currentId === targetId) {
      return true;
    }
    if (visited.has(currentId)) {
      return false;
    }
    
    visited.add(currentId);
    
    const neighbors = graph[currentId] || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }
    
    return false;
  };
  
  return dfs(sourceId);
};

// Use types from types/workflow.ts
export type WorkflowNode = TypesWorkflowNode;
export type WorkflowEdge = TypesWorkflowEdge;  
export type Workflow = TypesWorkflow;

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error_message?: string;
  input_query: string;
  started_at: string;
  completed_at?: string;
}

export interface WorkflowBuildRequest {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowBuildResponse {
  success: boolean;
  message: string;
  errors?: string[];
  execution_plan?: Record<string, unknown>;
}

export interface WorkflowExecuteRequest {
  query: string;
}

export interface WorkflowExecuteResponse {
  execution_id: string;
  status: string;
  result?: Record<string, unknown>;
  message: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings?: string[];
}

export const workflowService = {
  createWorkflow: async (workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>): Promise<Workflow> => {
    const response = await api.post('/workflows/', workflow);
    return response.data;
  },

  getWorkflows: async (): Promise<Workflow[]> => {
    const response = await api.get('/workflows/');
    return response.data;
  },

  getWorkflow: async (workflowId: string): Promise<Workflow> => {
    const response = await api.get(`/workflows/${workflowId}`);
    return response.data;
  },

  updateWorkflow: async (workflowId: string, workflow: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.put(`/workflows/${workflowId}`, workflow);
    return response.data;
  },

  deleteWorkflow: async (workflowId: string): Promise<void> => {
    await api.delete(`/workflows/${workflowId}`);
  },

  buildWorkflow: async (workflowId: string, buildRequest: WorkflowBuildRequest): Promise<WorkflowBuildResponse> => {
    const response = await api.post(`/workflows/${workflowId}/build`, buildRequest);
    return response.data;
  },

  executeWorkflow: async (workflowId: string, executeRequest: WorkflowExecuteRequest): Promise<WorkflowExecuteResponse> => {
    const response = await api.post(`/workflows/${workflowId}/execute`, executeRequest);
    return response.data;
  },

  getWorkflowExecutions: async (workflowId: string): Promise<WorkflowExecution[]> => {
    const response = await api.get(`/workflows/${workflowId}/executions`);
    return response.data;
  },

  getExecutionStatus: async (executionId: string): Promise<WorkflowExecution> => {
    const response = await api.get(`/workflows/executions/${executionId}`);
    return response.data;
  },

  uploadDocuments: async (
    workflowId: string,
    files: File[],
    embeddingModel: string,
    apiKey: string
  ): Promise<{ message: string; files: Record<string, unknown>[] }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('embedding_model', embeddingModel);
    formData.append('api_key', apiKey);
    const response = await api.post(`/workflows/${workflowId}/upload-documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getWorkflowDocuments: async (workflowId: string): Promise<Record<string, unknown>[]> => {
    const response = await api.get(`/workflows/${workflowId}/documents`);
    return response.data;
  },

  validateWorkflow: async (nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<ValidationResult> => {
    // Client-side validation for immediate feedback
    const errors: string[] = [];
    
    // Check for required node types
    const nodeTypes = nodes.map(n => n.type);
    
    if (!nodeTypes.includes('userQuery')) {
      errors.push('Workflow must contain a User Query component');
    }
    
    if (!nodeTypes.includes('llmEngine')) {
      errors.push('Workflow must contain an LLM Engine component');
    }
    
    if (!nodeTypes.includes('output')) {
      errors.push('Workflow must contain an Output component');
    }
    
    // Check connections - allow paths through other nodes, not just direct connections
    const userQueryNode = nodes.find(n => n.type === 'userQuery');
    const llmEngineNode = nodes.find(n => n.type === 'llmEngine');
    const outputNode = nodes.find(n => n.type === 'output');
    
    if (userQueryNode && llmEngineNode) {
      const hasPath = hasPathBetweenNodes(userQueryNode.id, llmEngineNode.id, edges);
      if (!hasPath) {
        errors.push('User Query must be connected to LLM Engine (directly or through other components)');
      }
    }
    
    if (llmEngineNode && outputNode) {
      const hasPath = hasPathBetweenNodes(llmEngineNode.id, outputNode.id, edges);
      if (!hasPath) {
        errors.push('LLM Engine must be connected to Output (directly or through other components)');
      }
    }
    
    return {
      is_valid: errors.length === 0,
      errors,
      warnings: []
    };
  },
};
