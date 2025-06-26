'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, NodeTypes, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronLeft, ChevronRight, Save, MessageCircle, Play, User, BookOpen, Brain, Monitor, Target, AlertCircle, CheckCircle, Hammer } from 'lucide-react';

import { Button, Modal } from '../../../shared/components';
import { useNotifications } from '../../../shared/hooks';
import { workflowService } from '../../../services/workflowService';
import ChatInterface from '../../../components/ChatInterface';
import { UserQueryNode, KnowledgeBaseNode, LLMEngineNode, OutputNode } from '../../../components/WorkflowNodes';
import WorkflowCanvas from '../../../components/WorkflowCanvas';
import NodeConfigurationPanel from '../../../components/NodeConfigurationPanel';

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
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function EditStackPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError, showInfo } = useNotifications();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Workflow state
  const [workflow, setWorkflow] = useState({
    id: params?.id as string,
    name: 'Untitled Workflow',
    description: 'No description',
    status: 'draft' as 'draft' | 'running' | 'paused' | 'ready',
    lastModified: new Date().toISOString()
  });
  
  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Track drag-over state for fade effect
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  // Configuration panel state
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  // Workflow validation state
  const [isWorkflowValid, setIsWorkflowValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    // Load workflow data
    loadWorkflow();
  }, [params?.id]);

  const loadWorkflow = async () => {
    try {
      if (params?.id === 'new') {
        // Creating new workflow
        setWorkflow({
          id: 'new',
          name: 'Untitled Workflow',
          description: 'No description',
          status: 'draft',
          lastModified: new Date().toISOString()
        });
        return;
      }

      // Load existing workflow
      const data = await workflowService.getWorkflow(params?.id as string);
      setWorkflow({
        id: data.id,
        name: data.name,
        description: data.description || 'No description',
        status: 'draft',
        lastModified: data.updated_at
      });
      
      if (data.nodes?.length > 0) {
        setNodes(data.nodes);
      }
      if (data.edges?.length > 0) {
        setEdges(data.edges);
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      showError('Load Error', 'Failed to load workflow');
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      
      // Update node data to indicate connections
      setNodes((nds) => nds.map(node => {
        if (node.id === params.target) {
          return {
            ...node,
            data: {
              ...node.data,
              hasInput: true,
              inputType: getNodeOutputType(params.source || '', nds)
            }
          };
        }
        return node;
      }));
      
      showInfo('Connected', 'Components connected successfully');
    },
    [setEdges, setNodes, showInfo],
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

  // Store zoom and center on drop
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDraggingOver(false);

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      // Use current zoom and center for drop position
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
      showSuccess('Component Added', `${component.name} added to workflow`);
    },
    [reactFlowInstance, setNodes, showSuccess]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    [],
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleBuildStack = async () => {
    if (!validateWorkflow()) {
      showError('Invalid Workflow', 'Please fix validation errors before building');
      return;
    }
    
    setIsBuilding(true);
    try {
      // Save workflow first
      await handleSave();
      
      // TODO: Call backend API to build/validate workflow
      // await workflowService.buildWorkflow(workflow.id, { nodes, edges });
      
      // Simulate build process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showSuccess('Build Complete', 'Your workflow has been built successfully!');
      setWorkflow(prev => ({ ...prev, status: 'ready' }));
    } catch (error) {
      console.error('Error building workflow:', error);
      showError('Build Failed', 'Failed to build workflow. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleSave = async () => {
    try {
      if (workflow.id === 'new') {
        // Create new workflow
        const newWorkflow = await workflowService.createWorkflow({
          name: workflow.name,
          description: workflow.description,
          nodes,
          edges
        });
        setWorkflow(prev => ({ ...prev, id: newWorkflow.id }));
        showSuccess('Created', 'Workflow created and saved successfully');
      } else {
        // Update existing workflow
        await workflowService.updateWorkflow(workflow.id, {
          name: workflow.name,
          description: workflow.description,
          nodes,
          edges
        });
        showSuccess('Saved', 'Workflow saved successfully');
      }
      setWorkflow(prev => ({ ...prev, lastModified: new Date().toISOString() }));
    } catch (error) {
      console.error('Error saving workflow:', error);
      showError('Save Error', 'Failed to save workflow');
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!isWorkflowValid) {
      showError('Invalid Workflow', 'Please build a valid workflow before chatting');
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);
    
    try {
      // TODO: Call backend API to execute workflow with user query
      // const response = await workflowService.executeWorkflow(workflow.id, message);
      
      // Simulate workflow execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        content: `I processed your query "${message}" through the workflow. Based on the configured components (${nodes.map(n => n.type).join(' → ')}), here's the response from the LLM engine.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error executing workflow:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        content: 'Sorry, there was an error processing your request. Please check your workflow configuration.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // Remove node handler
  const onNodesDelete = useCallback((deleted: Node[]) => {
    setNodes((nds) => nds.filter((n) => !deleted.some((d: Node) => d.id === n.id)));
  }, [setNodes]);

  // Visible delete button handler for nodes
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
  }, [setNodes]);

  // Handle opening node configuration
  const handleNodeSettings = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setShowConfigPanel(true);
    }
  }, [nodes]);

  // Handle updating node configuration
  const handleUpdateNode = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) => nds.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updates.data } }
        : node
    ));
  }, [setNodes]);

  // Workflow validation function
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    
    // Check if workflow has required components
    const hasUserQuery = nodes.some(n => n.type === 'userQuery');
    const hasLLMEngine = nodes.some(n => n.type === 'llmEngine');
    const hasOutput = nodes.some(n => n.type === 'output');
    
    if (!hasUserQuery) errors.push('Workflow must contain a User Query component');
    if (!hasLLMEngine) errors.push('Workflow must contain an LLM Engine component');
    if (!hasOutput) errors.push('Workflow must contain an Output component');
    
    // Check connections - workflow should be connected in sequence
    const userQueryNode = nodes.find(n => n.type === 'userQuery');
    const llmEngineNode = nodes.find(n => n.type === 'llmEngine');
    const outputNode = nodes.find(n => n.type === 'output');
    
    if (userQueryNode && llmEngineNode) {
      const hasUserToLLM = edges.some(e => 
        e.source === userQueryNode.id && e.target === llmEngineNode.id
      );
      if (!hasUserToLLM) errors.push('User Query must be connected to LLM Engine');
    }
    
    if (llmEngineNode && outputNode) {
      const hasLLMToOutput = edges.some(e => 
        e.source === llmEngineNode.id && e.target === outputNode.id
      );
      if (!hasLLMToOutput) errors.push('LLM Engine must be connected to Output');
    }
    
    setValidationErrors(errors);
    setIsWorkflowValid(errors.length === 0 && nodes.length >= 3);
    
    return errors.length === 0;
  }, [nodes, edges]);

  // Validate workflow when nodes or edges change
  useEffect(() => {
    validateWorkflow();
  }, [nodes, edges, validateWorkflow]);

  // In nodeTypes, inject delete handler into data
  const nodeTypesWithDelete = {
    userQuery: (props: any) => <UserQueryNode {...props} data={{ ...props.data, onDelete: handleDeleteNode, onSettings: () => handleNodeSettings(props.id) }} />, 
    knowledgeBase: (props: any) => <KnowledgeBaseNode {...props} data={{ ...props.data, onDelete: handleDeleteNode, onSettings: () => handleNodeSettings(props.id) }} />, 
    llmEngine: (props: any) => <LLMEngineNode {...props} data={{ ...props.data, onDelete: handleDeleteNode, onSettings: () => handleNodeSettings(props.id) }} />, 
    output: (props: any) => <OutputNode {...props} data={{ ...props.data, onDelete: handleDeleteNode, onSettings: () => handleNodeSettings(props.id) }} />
  };

  // Zoom out a little when the first node is added
  useEffect(() => {
    if (nodes.length === 1 && reactFlowInstance) {
      // Zoom out to 80% and center
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 0.8 }, { duration: 400 });
    }
  }, [nodes.length, reactFlowInstance]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{workflow.name}</h1>
              <p className="text-sm text-muted-foreground">{workflow.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Workflow Status Indicator */}
            <div className="flex items-center space-x-2">
              {isWorkflowValid ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-xs">Valid</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-xs">{validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <ReactFlowProvider>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card border-r border-border flex flex-col overflow-hidden"
            >
              {/* Component Library */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Components</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-1 h-auto"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {componentTypes.map((component) => (
                    <motion.div
                      key={component.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-2 bg-background border border-border rounded-lg cursor-grab hover:border-primary transition-colors flex items-center gap-2"
                      draggable
                      onDragStart={(event) => onDragStart(event as any, component.id)}
                    >
                      <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-sm">
                        {component.icon}
                      </div>
                      <span className="font-medium text-foreground text-sm">{component.name}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Validation Errors Panel */}
                {validationErrors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Validation Errors
                    </h4>
                    <ul className="text-xs text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="flex-1 relative">
          {/* Canvas background overlay for empty state */}
          <AnimatePresence>
            {nodes.length === 0 && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: isDraggingOver ? 0.5 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
              >
                <div className="text-center bg-white px-8 py-10 rounded-lg border">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Start Building Your Workflow</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag components from the sidebar to create your AI workflow
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connect components by dragging from one node to another
                  </p>
                </div>
              </motion.div>
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
            nodes={nodes}
            edges={edges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onNodeSelect={setSelectedNode}
            nodeTypes={nodeTypesWithDelete}
            onDrop={handleDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
          />
          {/* Bottom Action Buttons */}
          <div className="absolute bottom-6 right-6 flex gap-2 z-20">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBuildStack}
              disabled={!isWorkflowValid || isBuilding}
              className="p-2 w-auto px-3"
            >
              {isBuilding ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="ml-1">Build</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsChatOpen(true)}
              disabled={!isWorkflowValid}
              className="p-2 w-auto px-3"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="ml-1">Chat</span>
            </Button>
          </div>
        </div>
      </div>
      </ReactFlowProvider>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <Modal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            title="Chat with Your Workflow"
            className="max-w-2xl h-[600px]"
          >
            <div className="h-full">
              <ChatInterface
                messages={chatMessages}
                onSendMessage={handleChatMessage}
                isLoading={chatLoading}
              />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Node Configuration Panel */}
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
