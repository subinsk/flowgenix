import { useCallback, useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';

export interface NodeFieldError {
  nodeId: string;
  nodeType: string;
  field: string;
  error: string;
}

export function useWorkflowValidation(nodes: Node[], edges: Edge[]) {
  const [isWorkflowValid, setIsWorkflowValid] = useState(true); // Start as valid
  const [validationErrors, setValidationErrors] = useState<NodeFieldError[]>([]);
  const [hasValidated, setHasValidated] = useState(false); // Track if validation has been triggered

  const validateNode = useCallback((node: Node): NodeFieldError[] => {
    const errors: NodeFieldError[] = [];
    const { id, type, data } = node;

    if (type === 'userQuery') {
      // No validation for query input or queryType anymore
    }
    if (type === 'knowledgeBase') {
      // Check if there are uploaded documents or file inputs
      const uploadedDocs = Array.isArray(data?.uploadedDocuments) ? data.uploadedDocuments : [];
      const fileList = Array.isArray(data?.fileList) ? data.fileList : [];
      const hasFiles = uploadedDocs.length > 0 || data?.file || fileList.length > 0;
      if (!hasFiles) {
        errors.push({ nodeId: id, nodeType: type, field: 'file', error: 'File input is required.' });
      }
      if (!data?.apiKey || typeof data.apiKey !== 'string' || data.apiKey.trim() === '') {
        errors.push({ nodeId: id, nodeType: type, field: 'apiKey', error: 'API key is required.' });
      }
    }
    if (type === 'llmEngine') {
      if (!data?.model) {
        errors.push({ nodeId: id, nodeType: type, field: 'model', error: 'Model selection is required.' });
      }
      if (!data?.apiKey || typeof data.apiKey !== 'string' || data.apiKey.trim() === '') {
        errors.push({ nodeId: id, nodeType: type, field: 'apiKey', error: 'API key is required.' });
      }
    }
    // Output format validation removed
    return errors;
  }, []);

  const validateWorkflow = useCallback((forceValidation = false): boolean => {
    console.log('validateWorkflow called with forceValidation:', forceValidation, 'hasValidated:', hasValidated);
    
    // Only validate if forceValidation is true (when build is clicked)
    if (!forceValidation && !hasValidated) {
      return true; // Return true if validation hasn't been triggered yet
    }

    let errors: NodeFieldError[] = [];

    nodes.forEach(node => {
      errors = errors.concat(validateNode(node));
    });

    // Workflow-level errors (not tied to a field)
    const nodeTypes = nodes.map(n => n.type);
    if (!nodeTypes.includes('userQuery')) {
      errors.push({ nodeId: 'workflow', nodeType: 'workflow', field: 'userQuery', error: 'Workflow must contain a User Query component.' });
    }
    if (!nodeTypes.includes('llmEngine')) {
      errors.push({ nodeId: 'workflow', nodeType: 'workflow', field: 'llmEngine', error: 'Workflow must contain an LLM Engine component.' });
    }
    if (!nodeTypes.includes('output')) {
      errors.push({ nodeId: 'workflow', nodeType: 'workflow', field: 'output', error: 'Workflow must contain an Output component.' });
    }

    console.log('validateWorkflow errors found:', errors);
    const isValid = errors.length === 0 && nodes.length >= 3;
    console.log('validateWorkflow isValid:', isValid);

    if (forceValidation) {
      console.log('Setting validation state - hasValidated: true, errors:', errors, 'isValid:', isValid);
      setHasValidated(true);
      setValidationErrors(errors);
      setIsWorkflowValid(isValid);
    }

    return isValid;
  }, [nodes, validateNode, hasValidated]);

  const triggerValidation = useCallback(() => {
    console.log('triggerValidation called');
    const result = validateWorkflow(true);
    console.log('triggerValidation result:', result);
    console.log('triggerValidation validationErrors after:', validationErrors);
    return result;
  }, [validateWorkflow, validationErrors]);

  const clearValidationError = useCallback((nodeId: string, nodeType: string, field: string) => {
    setValidationErrors(prev => 
      prev.filter(error => 
        !(error.nodeId === nodeId && error.nodeType === nodeType && error.field === field)
      )
    );
  }, []);

  return {
    isWorkflowValid,
    validationErrors,
    validateWorkflow,
    triggerValidation,
    clearValidationError,
    hasValidated
  };
}
