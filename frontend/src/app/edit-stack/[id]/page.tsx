'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, NodeTypes } from '@xyflow/react';
import { ChevronRight, User, BookOpen, Brain, Monitor } from 'lucide-react';

import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { workflowService } from '@/services';
import { ChatInterface } from '@/components';
import { UserQueryNode, KnowledgeBaseNode, LLMEngineNode, OutputNode } from '@/components/workflow';
import WorkflowCanvas from '@/components/workflow/sections/workflow-canvas/WorkflowCanvas';
import NodeConfigurationPanel from '@/components/NodeConfigurationPanel';
import { useChatStore } from '@/store/chat';
import { useWorkflowStore } from '@/store/workflow';
import { chatService } from '@/services/chatService';

import WorkflowHeader from '@/components/workflow/sections/WorkflowHeader';
import ComponentSidebar from '@/components/workflow/sections/ComponentSidebar';
import WorkflowActionButtons from '@/components/workflow/sections/workflow-canvas/WorkflowActionButtons';
import CanvasEmptyState from '@/components/workflow/sections/workflow-canvas/CanvasEmptyState';
import { useNotifications, useWorkflowService, useWorkflowValidation } from '@/hooks';
import { WorkflowStatus } from '@/types';

const nodeTypes: NodeTypes = {
  userQuery: UserQueryNode,
  knowledgeBase: KnowledgeBaseNode,
  llmEngine: LLMEngineNode,
  output: OutputNode,
};

const componentTypes = [
  { id: 'userQuery', name: 'User Query', icon: <User className="w-5 h-5" /> },
  { id: 'knowledgeBase', name: 'Knowledge Base', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'llmEngine', name: 'LLM Engine', icon: <Brain className="w-5 h-5" /> },
  { id: 'output', name: 'Output', icon: <Monitor className="w-5 h-5" /> }
];

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Type guard for allowed workflow statuses
const allowedStatuses = ['draft', 'running', 'paused', 'ready'] as const;
type AllowedWorkflowStatus = typeof allowedStatuses[number];
const isAllowedWorkflowStatus = (status: any): status is AllowedWorkflowStatus =>
  allowedStatuses.includes(status);

export default function EditStackPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError, showInfo } = useNotifications();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [workflow, setWorkflow] = useState({
    id: params?.id as string,
    name: 'Untitled Workflow',
    description: 'No description',
    status: 'draft' as AllowedWorkflowStatus,
    lastModified: new Date().toISOString()
  });

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false); // Start with errors hidden

  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isHistoryAction, setIsHistoryAction] = useState<boolean>(false); // Track when we're applying history

  const { isWorkflowValid, validationErrors, validateWorkflow, triggerValidation, clearValidationError, hasValidated } = useWorkflowValidation(nodes, edges);
  const { isBuilding, saveWorkflow, buildWorkflow, executeWorkflow } = useWorkflowService(workflow.id);
  const { hasUnsavedChanges, setLastSaveTime, setHasUnsavedChanges, setNodes: setWorkflowNodes, setEdges: setWorkflowEdges, loadNodes: loadWorkflowNodes, loadEdges: loadWorkflowEdges } = useWorkflowStore();

  const {
    currentSession,
    sessions,
    messages: storeMessages,
    isLoading: chatStoreLoading,
    isTyping,
    loadSessions,
    createSessionAsync,
    setCurrentSession,
    sendMessageAsync,
    loadMessages,
  } = useChatStore();

  // Auto-show validation errors when validation is triggered and there are errors
  useEffect(() => {
    console.log('Validation state changed - hasValidated:', hasValidated, 'validationErrors:', validationErrors.length);
    if (hasValidated && validationErrors.length > 0) {
      console.log('Auto-showing validation errors:', validationErrors);
      setShowValidationErrors(true);
      setSidebarCollapsed(false); // Ensure sidebar is visible to show errors
    }
  }, [hasValidated, validationErrors]);

  const saveToHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    // Don't save history during undo/redo operations
    if (isHistoryAction) return;

    const newEntry = { 
      nodes: JSON.parse(JSON.stringify(currentNodes)), 
      edges: JSON.parse(JSON.stringify(currentEdges)) 
    };

    setHistory(prevHistory => {
      // Remove any history after current index (when adding new entry after undo)
      const truncatedHistory = prevHistory.slice(0, historyIndex + 1);
      const newHistory = [...truncatedHistory, newEntry];

      // Keep only last 50 entries
      if (newHistory.length > 50) {
        return newHistory.slice(-50);
      }
      return newHistory;
    });

    // Update index to point to the new entry
    setHistoryIndex(prevIndex => {
      const truncatedLength = prevIndex + 1;
      const newLength = truncatedLength + 1;
      return newLength > 50 ? 49 : newLength - 1;
    });
  }, [historyIndex, isHistoryAction]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setIsHistoryAction(true);
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prevIndex);
      
      // Reset flag and sync with workflow store after state updates
      setTimeout(() => {
        setIsHistoryAction(false);
        setWorkflowNodes(prevState.nodes);
        setWorkflowEdges(prevState.edges);
      }, 0);
    }
  }, [history, historyIndex, setNodes, setEdges, setWorkflowNodes, setWorkflowEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsHistoryAction(true);
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(nextIndex);
      
      // Reset flag and sync with workflow store after state updates
      setTimeout(() => {
        setIsHistoryAction(false);
        setWorkflowNodes(nextState.nodes);
        setWorkflowEdges(nextState.edges);
      }, 0);
    }
  }, [history, historyIndex, setNodes, setEdges, setWorkflowNodes, setWorkflowEdges]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    loadWorkflow();
  }, [params?.id]);

  // Initialize history when component mounts or workflow is loaded
  useEffect(() => {
    if (history.length === 0) {
      const initialState = { 
        nodes: JSON.parse(JSON.stringify(nodes)), 
        edges: JSON.parse(JSON.stringify(edges)) 
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [nodes, edges, history.length]);

  // Sync nodes and edges with workflow store for user modifications
  // This effect runs when nodes/edges change due to user interactions
  useEffect(() => {
    // Only sync to workflow store if this is not a history action and not initial load
    if (!isHistoryAction && history.length > 0) {
      setWorkflowNodes(nodes);
      setWorkflowEdges(edges);
    }
  }, [nodes, edges, isHistoryAction, history.length, setWorkflowNodes, setWorkflowEdges]);

  // Auto-save to history with debouncing - only when not applying history actions
  useEffect(() => {
    if (isHistoryAction || history.length === 0) return;

    const timer = setTimeout(() => {
      const currentState = { nodes, edges };
      const lastState = history[historyIndex];
      
      // Only compare if we have a valid last state
      if (lastState) {
        const hasChanges = 
          JSON.stringify(currentState.nodes) !== JSON.stringify(lastState.nodes) ||
          JSON.stringify(currentState.edges) !== JSON.stringify(lastState.edges);

        if (hasChanges) {
          saveToHistory(nodes, edges);
        }
      }
    }, 500); // Reduced debounce time for better responsiveness

    return () => clearTimeout(timer);
  }, [nodes, edges, history, historyIndex, saveToHistory, isHistoryAction, setWorkflowNodes, setWorkflowEdges]);

  const loadWorkflow = async () => {
    try {
      const data = await workflowService.getWorkflow(params?.id as string);
      setWorkflow({
        id: data.id,
        name: data.name,
        description: data.description || 'No description',
        status: isAllowedWorkflowStatus(data.status) ? data.status : 'draft',
        lastModified: data.updated_at
      });

      // Load workflow documents
      let workflowDocuments: any[] = [];
      try {
        workflowDocuments = await workflowService.getWorkflowDocuments(params?.id as string);
      } catch (error) {
        console.warn('Failed to load workflow documents:', error);
      }

      if (data.nodes?.length > 0) {
        // Update KnowledgeBase nodes with uploaded documents
        const updatedNodes = data.nodes.map((node: any) => {
          if (node.data?.type === 'knowledgeBase') {
            return {
              ...node,
              data: {
                ...node.data,
                uploadedDocuments: workflowDocuments,
              }
            };
          }
          return node;
        });
        setNodes(updatedNodes);
        loadWorkflowNodes(updatedNodes); // Load into workflow store without triggering unsaved changes
      }
      if (data.edges?.length > 0) {
        setEdges(data.edges);
        loadWorkflowEdges(data.edges); // Load into workflow store without triggering unsaved changes
      }
      
      // Mark as saved since we just loaded from server
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false); // Reset unsaved changes since we just loaded
    } catch (error) {
      console.error('Error loading workflow:', error);
      showError('Load Error', 'Failed to load workflow');
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));

      setNodes((nds) => nds.map(node => {
        if (node.id === params.target) {
          const connectedSources = [...edges.filter(e => e.target === params.target), params]
            .map(e => e.source)
            .filter((source, index, arr) => arr.indexOf(source) === index);

          const inputTypes = connectedSources.map(sourceId =>
            getNodeOutputType(sourceId || '', nds)
          );

          return {
            ...node,
            data: {
              ...node.data,
              hasInput: true,
              inputTypes,
              connectedSources
            }
          };
        }
        return node;
      }));
    },
    [setEdges, setNodes, edges],
  );

  const getNodeOutputType = (nodeId: string, nodes: Node[]) => {
    const node = nodes.find(n => n.id === nodeId);
    switch (node?.type) {
      case 'userQuery': return 'query';
      case 'knowledgeBase': return 'context';
      case 'llmEngine': return 'output';
      default: return 'data';
    }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDraggingOver(false);

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      let position = { x: 0, y: 0 };
      if (reactFlowInstance && reactFlowInstance.screenToFlowPosition) {
        position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }

      const component = componentTypes.find(c => c.id === type);
      if (!component) return;

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: type,
        position,
        data: { label: component.name },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Model name mapping for backend compatibility
  const MODEL_NAME_MAP: Record<string, string> = {
    'GPT-4': 'gpt-4',
    'GPT-4 Turbo': 'gpt-4-turbo',
    'GPT-3.5 Turbo': 'gpt-3.5-turbo',
    'Gemini Pro': 'gemini-pro',
    'Gemini 2.0 Flash': 'gemini-2.0-flash',
    'Claude 3': 'claude-3',
  };

  function mapNodeModelsForBackend(nodes: Node[]): Node[] {
    return nodes.map(node => {
      if (node.type === 'llmEngine' && node.data?.model) {
        return {
          ...node,
          data: {
            ...node.data,
            model: typeof node.data.model === 'string' ? (MODEL_NAME_MAP[node.data.model] || node.data.model) : node.data.model,
          },
        };
      }
      return node;
    });
  }

  const handleBuildStack = async () => {
    // check if nodes are available or not
    if (nodes.length === 0) {
      showError('No Components', 'Please add at least one component to the workflow before building.');
      return;
    }
    
    console.log('Triggering validation...');
    // First trigger validation to check for UI errors
    const validationResult = triggerValidation();
    console.log('Validation result:', validationResult);
    console.log('Validation errors after trigger:', validationErrors);
    console.log('hasValidated after trigger:', hasValidated);
    
    if (!validationResult) {
      // If validation fails, show errors in both sidebar and nodes
      console.log('Setting showValidationErrors to true');
      setShowValidationErrors(true);
      setSidebarCollapsed(false); // Ensure sidebar is visible to show errors
      showError('Validation Errors', 'Please fix all validation errors before building the workflow');
      return;
    }

    // If validation passes, proceed with API calls
    try {
      const mappedNodes = mapNodeModelsForBackend(nodes);
      await buildWorkflow(
        workflow,
        mappedNodes,
        edges,
        setWorkflow,
        (errors) => {
          // If there are server-side validation errors, show them
          if (errors && errors.length > 0) {
            setShowValidationErrors(true);
            setSidebarCollapsed(false);
          }
        },
        setShowValidationErrors
      );
      
      // If build succeeds, show success message
      if (validationResult) {
        showSuccess('Build Successful', 'Your workflow has been built successfully!');
        setLastSaveTime(new Date()); // Mark as saved since build saves the workflow
        setHasUnsavedChanges(false); // Reset unsaved changes
      }
    } catch (error) {
      showError('Build Failed', 'Failed to build workflow. Please try again.');
    }
  };

  const handleSave = async () => {
    await saveWorkflow(workflow, nodes, edges, setWorkflow);
    setLastSaveTime(new Date());
    setHasUnsavedChanges(false); // Reset unsaved changes
  };

  // On chat open, load or create session for this workflow
  useEffect(() => {
    if (isChatOpen) {
      (async () => {
        await loadSessions();
        const allSessions = useChatStore.getState().sessions;
        let session = allSessions.find(s => s.workflowId === workflow.id);
        if (!session) {
          await createSessionAsync(workflow.id, workflow.name);
          session = useChatStore.getState().currentSession ?? undefined;
        } else {
          setCurrentSession(session);
        }
        if (session) {
          // Load messages using store method
          await loadMessages(session.id);
        }
      })();
    }
  }, [isChatOpen, workflow.id, loadSessions, createSessionAsync, setCurrentSession, loadMessages]);

  // Update handleChatMessage to use chat store methods
  const handleChatMessage = async (message: string) => {
    if (!currentSession) return;
    
    setChatLoading(true);
    try {
      // Send user message using store method
      await sendMessageAsync(currentSession.id, message, 'user');

      // Then trigger workflow execution and get AI response
      try {
        const result = await executeWorkflow(workflow.id, message);
        
        // Send AI response using store method
        await sendMessageAsync(currentSession.id, result, 'assistant');
        
      } catch (workflowError) {
        // Send error message as assistant response using store method
        const errorMessage = `Sorry, there was an error processing your request: ${workflowError instanceof Error ? workflowError.message : 'Unknown error'}`;
        await sendMessageAsync(currentSession.id, errorMessage, 'assistant');
      }
    } catch (error) {
      console.error('Chat error:', error);
      showError('Chat Error', 'Failed to send message. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));

    setNodes((nds) => {
      return nds.map((node) => {
        const wasConnected = edges.some((edge) => edge.target === node.id && edge.source === nodeId);
        if (wasConnected) {
          return {
            ...node,
            data: {
              ...node.data,
              hasInput: false,
              inputTypes: undefined,
              connectedSources: undefined,
            },
          };
        }
        return node;
      });
    });
  }, [setNodes, setEdges, edges]);

  const handleNodeSettings = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setShowConfigPanel(true);
    }
  }, [nodes]);

  const handleUpdateNode = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) => nds.map(node => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        data: {
          ...node.data,
          ...updates.data,
        },
      };
    }));
  }, [setNodes]);

  const enhancedNodes = useMemo(() => {
    console.log('enhancedNodes recomputing - hasValidated:', hasValidated, 'validationErrors:', validationErrors.length);
    return nodes.map(node => {
      const nodeErrors = hasValidated ? validationErrors.filter(e => e.nodeId === node.id) : [];
      console.log(`Node ${node.id} errors:`, nodeErrors);
      return {
        ...node,
        data: {
          ...node.data,
          onDelete: handleDeleteNode,
          onSettings: () => handleNodeSettings(node.id),
          onUpdate: handleUpdateNode,
          clearValidationError,
          validationErrors: nodeErrors,
        }
      };
    });
  }, [nodes, validationErrors, hasValidated, handleDeleteNode, handleNodeSettings, handleUpdateNode, clearValidationError]);

  // Custom edge change handler to update node UI when edges are disconnected
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      // Apply the changes to edges first
      onEdgesChange(changes);
      
      // Check for edge removals and update affected nodes
      const removedEdges = changes.filter(change => change.type === 'remove');
      
      if (removedEdges.length > 0) {
        setNodes((nds) => nds.map(node => {
          // Check if this node was affected by edge removal
          const wasConnected = removedEdges.some(change => 
            edges.find(edge => edge.id === change.id && edge.target === node.id)
          );
          
          if (wasConnected) {
            // Recalculate inputTypes based on remaining edges
            const remainingIncomingEdges = edges.filter(edge => 
              edge.target === node.id && 
              !removedEdges.some(change => change.id === edge.id)
            );
            
            const inputTypes = remainingIncomingEdges.map(edge =>
              getNodeOutputType(edge.source, nds)
            );
            
            const connectedSources = remainingIncomingEdges.map(edge => edge.source);
            
            return {
              ...node,
              data: {
                ...node.data,
                hasInput: inputTypes.length > 0,
                inputTypes: inputTypes.length > 0 ? inputTypes : undefined,
                connectedSources: connectedSources.length > 0 ? connectedSources : undefined
              }
            };
          }
          
          return node;
        }));
        
        showInfo('Disconnected', 'Components disconnected successfully');
      }
    },
    [onEdgesChange, edges, setNodes, showInfo]
  );

  // Custom nodes change handler to work with enhanced nodes
  const handleNodesChange = useCallback((changes: any[]) => {
    // Strip enhancement data before applying changes to base nodes
    const strippedChanges = changes.map(change => {
      if (change.type === 'position' || change.type === 'dimensions') {
        return change;
      }
      // For other changes, ensure we're working with clean node data
      return change;
    });
    onNodesChange(strippedChanges);
  }, [onNodesChange]);

  useEffect(() => {
    if (nodes.length === 1 && reactFlowInstance) {
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 0.8 }, { duration: 400 });
    }
  }, [nodes.length, reactFlowInstance]);

  // Debug: Log when validation errors change
  useEffect(() => {
    console.log('Validation errors changed:', validationErrors);
    console.log('hasValidated:', hasValidated);
    console.log('showValidationErrors:', showValidationErrors);
  }, [validationErrors, hasValidated, showValidationErrors]);

  // Auto-show validation errors when they exist and validation was triggered
  useEffect(() => {
    if (hasValidated && validationErrors.length > 0) {
      console.log('Auto-showing validation errors because hasValidated is true and errors exist');
      setShowValidationErrors(true);
      setSidebarCollapsed(false);
    }
  }, [hasValidated, validationErrors.length]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <WorkflowHeader
        workflow={workflow}
        isWorkflowValid={isWorkflowValid}
        validationErrors={validationErrors}
        showValidationErrors={showValidationErrors}
        hasValidated={hasValidated}
        onBack={() => router.push('/dashboard')}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleValidationErrors={() => {
          setShowValidationErrors(!showValidationErrors);
          if (!showValidationErrors && validationErrors.length > 0) {
            setSidebarCollapsed(false); // Expand sidebar when showing errors
          }
        }}
      />

      <ReactFlowProvider>
        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence>
            <ComponentSidebar
              collapsed={sidebarCollapsed}
              validationErrors={validationErrors}
              showValidationErrors={showValidationErrors}
              onToggleCollapse={() => setSidebarCollapsed(true)}
              onDragStart={onDragStart}
            />
          </AnimatePresence>

          <div className="flex-1 relative">
            <AnimatePresence>
              {nodes.length === 0 && (
                <CanvasEmptyState isDraggingOver={isDraggingOver} />
              )}
            </AnimatePresence>

            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(false)}
                className="absolute top-4 left-4 z-20 bg-card border border-border"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            <WorkflowCanvas
              nodes={enhancedNodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onNodeSelect={setSelectedNode}
              nodeTypes={nodeTypes}
              onDrop={handleDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
            />

            <WorkflowActionButtons
              isBuilding={isBuilding}
              hasUnsavedChanges={hasUnsavedChanges}
              onBuild={handleBuildStack}
              onChat={() => setIsChatOpen(true)}
            />
          </div>
        </div>
      </ReactFlowProvider>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-7xl h-[80vh] p-0 overflow-hidden">
          <div className="h-full pb-6 px-6">
            <ChatInterface
              messages={storeMessages}
              onSendMessage={handleChatMessage}
              isLoading={chatStoreLoading || isTyping}
              chatLoading={chatLoading}
            />
          </div>
        </DialogContent>
      </Dialog>

      {showConfigPanel && selectedNode && (
        <NodeConfigurationPanel
          selectedNode={selectedNode}
          onClose={() => {
            setShowConfigPanel(false);
            setSelectedNode(null);
          }}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={(nodeId) => {
            handleDeleteNode(nodeId);
            setShowConfigPanel(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}
