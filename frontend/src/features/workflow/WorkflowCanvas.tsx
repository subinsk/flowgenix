import React, { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from 'reactflow';
import { motion } from 'framer-motion';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../../store/workflow';
import { ANIMATIONS } from '../../shared/constants';
import type { WorkflowNode, WorkflowEdge } from '../../shared/types';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface WorkflowCanvasProps {
  onNodeSelect?: (node: Node | null) => void;
  className?: string;
}

export default function WorkflowCanvas({ 
  onNodeSelect,
  className = '',
}: WorkflowCanvasProps) {
  const { 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    setSelectedNode,
    addNode,
    addEdge: addWorkflowEdge,
  } = useWorkflowStore();

  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  // Use ReactFlow hooks with store state
  const [internalNodes, setInternalNodes, onNodesChange] = useNodesState(nodes.length > 0 ? nodes : initialNodes);
  const [internalEdges, setInternalEdges, onEdgesChange] = useEdgesState(edges.length > 0 ? edges : initialEdges);

  // Sync with store when ReactFlow state changes
  React.useEffect(() => {
    setNodes(internalNodes);
  }, [internalNodes, setNodes]);

  React.useEffect(() => {
    setEdges(internalEdges);
  }, [internalEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        const newEdge: Edge = {
          id: `edge-${params.source}-${params.target}`,
          source: params.source,
          target: params.target,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        };
        setInternalEdges((eds) => addEdge(newEdge, eds));
        addWorkflowEdge(newEdge);
      }
    },
    [setInternalEdges, addWorkflowEdge]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      onNodeSelect?.(node);
    },
    [setSelectedNode, onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [setSelectedNode, onNodeSelect]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance?.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position,
        data: { 
          label: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: type,
          status: 'idle',
        },
        style: {
          background: '#ffffff',
          border: '2px solid #6366f1',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '150px',
          fontSize: '12px',
          color: '#374151',
        },
      };

      setInternalNodes((nds) => nds.concat(newNode));
      addNode(newNode);
    },
    [reactFlowInstance, setInternalNodes, addNode]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={ANIMATIONS.SPRING_SMOOTH}
      className={`
        relative w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden
        ${className}
      `}
    >
      <ReactFlow
        nodes={internalNodes}
        edges={internalEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        className="bg-transparent"
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          className="opacity-50"
        />
        <Controls 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        />
        <MiniMap 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          nodeColor="#6366f1"
          maskColor="rgba(99, 102, 241, 0.1)"
        />
      </ReactFlow>
      
      {/* Empty state */}
      {internalNodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...ANIMATIONS.SPRING_SMOOTH }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              Build Your Workflow
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm">
              Drag components from the library panel to start building your AI workflow
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
