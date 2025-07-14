import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Document API
export const documentAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  search: async (query: string) => {
    const response = await apiClient.post('/documents/search', { query });
    return response.data;
  },
};

// Types for workflow API
export interface WorkflowSaveData {
  name: string;
  description?: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    data?: Record<string, unknown>;
  }>;
}

export interface WorkflowExecuteData {
  workflow_id: string;
  query: string;
}

export const workflowAPI = {
  save: async (workflow: WorkflowSaveData) => {
    const response = await apiClient.post('/workflows', workflow);
    return response.data;
  },
  
  load: async (workflowId: string) => {
    const response = await apiClient.get(`/workflows/${workflowId}`);
    return response.data;
  },
  
  execute: async (workflowData: WorkflowExecuteData) => {
    const response = await apiClient.post('/workflows/execute', workflowData);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (message: string, workflowId?: string) => {
    const response = await apiClient.post('/chat', { 
      message, 
      workflow_id: workflowId 
    });
    return response.data;
  },
  
  getHistory: async (workflowId: string) => {
    const response = await apiClient.get(`/chat/history/${workflowId}`);
    return response.data;
  },
};

// LLM API
export interface LLMGenerateContext {
  [key: string]: unknown;
}

export const llmAPI = {
  generate: async (prompt: string, context?: LLMGenerateContext) => {
    const response = await apiClient.post('/llm/generate', { 
      prompt, 
      context 
    });
    return response.data;
  },
};

// Search API
export const searchAPI = {
  web: async (query: string, provider: 'brave' | 'serpapi' = 'brave') => {
    const response = await apiClient.post('/search/web', { 
      query, 
      provider 
    });
    return response.data;
  },
};

export default apiClient;
