import api from './api';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export const workflowService = {
  createWorkflow: async (workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow> => {
    const response = await api.post('/workflows', workflow);
    return response.data;
  },

  getWorkflows: async (): Promise<Workflow[]> => {
    const response = await api.get('/workflows');
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

  executeWorkflow: async (workflowId: string, input?: any): Promise<WorkflowExecution> => {
    const response = await api.post(`/workflows/${workflowId}/execute`, { input });
    return response.data;
  },

  getExecutionStatus: async (executionId: string): Promise<WorkflowExecution> => {
    const response = await api.get(`/executions/${executionId}`);
    return response.data;
  },

  validateWorkflow: async (nodes: any[], edges: any[]): Promise<{ valid: boolean; errors: string[] }> => {
    const response = await api.post('/workflows/validate', { nodes, edges });
    return response.data;
  },
};
