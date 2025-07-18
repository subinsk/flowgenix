import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { workflowService } from '../services/workflowService';
import { useNotifications } from '.';
import { UIWorkflow, Workflow } from '@/types';

interface WorkflowData extends UIWorkflow {
  lastModified?: string;
}

interface WorkflowNodeApiData<T = Record<string, string | number | boolean | Record<string, unknown>>> {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: T;
}

interface WorkflowEdgeApiData<T = Record<string, string | number | boolean | Record<string, unknown>>> {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: T;
}

interface WorkflowApiData {
  nodes: Array<WorkflowNodeApiData>;
  edges: Array<WorkflowEdgeApiData>;
}

export function useWorkflowService() {
  const { showSuccess, showError } = useNotifications();
  const [isBuilding, setIsBuilding] = useState(false);

  const saveWorkflow = useCallback(async (
    workflow: WorkflowData,
    nodes: Node[],
    edges: Edge[],
    setWorkflow: (updater: (prev: WorkflowData) => WorkflowData) => void
  ) => {
    try {
      const workflowData: WorkflowApiData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'unknown',
          position: node.position,
          data: (node.data || {}) as Record<string, string | number | boolean | Record<string, unknown>>
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined
        }))
      };

      if (workflow.id === 'new') {
        // Create new workflow
        const newWorkflow = await workflowService.createWorkflow({
          name: workflow.name,
          description: workflow.description,
          ...workflowData
        } as Omit<Workflow, 'id' | 'status' | 'created_at' | 'updated_at' | 'user_id'>);
        setWorkflow(prev => ({ ...prev, id: newWorkflow.id }));
        showSuccess('Created', 'Workflow created and saved successfully');
      } else {
        // Update existing workflow
        await workflowService.updateWorkflow(workflow.id, {
          name: workflow.name,
          description: workflow.description,
          ...workflowData
        } as Partial<Workflow>);
        showSuccess('Saved', 'Workflow saved successfully');
      }
      setWorkflow(prev => ({ ...prev, lastModified: new Date().toISOString() }));
    } catch (error: unknown) {
      console.error('Error saving workflow:', error);
      showError('Save Error', 'Failed to save workflow');
    }
  }, [showSuccess, showError]);

  const buildWorkflow = useCallback(async (
    workflow: WorkflowData,
    nodes: Node[],
    edges: Edge[],
    setWorkflow: (updater: (prev: WorkflowData) => WorkflowData) => void,
    setValidationErrors: (errors: string[]) => void,
    setShowValidationErrors: (show: boolean) => void
  ) => {
    setIsBuilding(true);
    try {
      // Save workflow first
      await saveWorkflow(workflow, nodes, edges, setWorkflow);
      
      // Build workflow using API
      const buildResponse = await workflowService.buildWorkflow(workflow.id, {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'unknown',
          position: node.position,
          data: (node.data || {}) as Record<string, string | number | boolean | Record<string, unknown>>
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined
        }))
      });
      
      if (buildResponse.success) {
        showSuccess('Build Complete', buildResponse.message);
        setWorkflow(prev => ({ ...prev, status: 'ready' })); // set to 'ready' after successful build
        setShowValidationErrors(false);
      } else {
        showError('Build Failed', buildResponse.message);
        if (buildResponse.errors) {
          setValidationErrors(buildResponse.errors);
          setShowValidationErrors(true);
        }
      }
    } catch (error: unknown) {
      console.error('Error building workflow:', error);
      showError('Build Failed', 'Failed to build workflow. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  }, [saveWorkflow, showSuccess, showError]);

  const executeWorkflow = useCallback(async (workflowId: string, query: string) => {
    try {
      const response = await workflowService.executeWorkflow(workflowId, { query });
      // Return the full result object to preserve search sources
      return response.result || 'Workflow execution completed successfully';
    } catch (error: unknown) {
      console.error('Error executing workflow:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && (error as { response?: { data?: { detail?: string } } }).response?.data?.detail) {
        throw new Error((error as { response: { data: { detail: string } } }).response.data.detail);
      }
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Unknown error');
    }
  }, []);

  return {
    isBuilding,
    saveWorkflow,
    buildWorkflow,
    executeWorkflow
  };
}
