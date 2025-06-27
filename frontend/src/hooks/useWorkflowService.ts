import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { workflowService } from '../services/workflowService';
import { useNotifications } from '.';

interface WorkflowData {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused'; // removed 'ready'
  lastModified: string;
}

interface WorkflowApiData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

export function useWorkflowService(workflowId: string) {
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
          data: node.data || {}
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
        });
        setWorkflow(prev => ({ ...prev, id: newWorkflow.id }));
        showSuccess('Created', 'Workflow created and saved successfully');
      } else {
        // Update existing workflow
        await workflowService.updateWorkflow(workflow.id, {
          name: workflow.name,
          description: workflow.description,
          ...workflowData
        });
        showSuccess('Saved', 'Workflow saved successfully');
      }
      setWorkflow(prev => ({ ...prev, lastModified: new Date().toISOString() }));
    } catch (error) {
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
          data: node.data || {}
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
        setWorkflow(prev => ({ ...prev, status: 'running' })); // set to 'running' instead of 'ready'
        setShowValidationErrors(false);
      } else {
        showError('Build Failed', buildResponse.message);
        if (buildResponse.errors) {
          setValidationErrors(buildResponse.errors);
          setShowValidationErrors(true);
        }
      }
    } catch (error) {
      console.error('Error building workflow:', error);
      showError('Build Failed', 'Failed to build workflow. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  }, [saveWorkflow, showSuccess, showError]);

  const executeWorkflow = useCallback(async (workflowId: string, query: string) => {
    try {
      const response = await workflowService.executeWorkflow(workflowId, { query });
      return response.result?.result || 'Workflow execution completed successfully';
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Unknown error');
    }
  }, []);

  return {
    isBuilding,
    saveWorkflow,
    buildWorkflow,
    executeWorkflow
  };
}
