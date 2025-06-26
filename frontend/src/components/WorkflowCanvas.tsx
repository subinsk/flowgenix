'use client';

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
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface WorkflowCanvasProps {
  onNodeSelect?: (node: Node | null) => void;
  nodes?: Node[];
  edges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  nodeTypes?: any; // Allow custom node types
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDragLeave?: (event: React.DragEvent) => void;
  onConnect?: (connection: Connection) => void;
  onInit?: (instance: any) => void;
}

export default function WorkflowCanvas({ 
  onNodeSelect, 
  nodes: externalNodes, 
  edges: externalEdges,
  onNodesChange: onExternalNodesChange,
  onEdgesChange: onExternalEdgesChange,
  nodeTypes,
  onDrop: externalOnDrop,
  onDragOver: externalOnDragOver,
  onDragLeave: externalOnDragLeave,
  onConnect: externalOnConnect,
  onInit: externalOnInit
}: WorkflowCanvasProps) {
  const [internalNodes, setInternalNodes, onInternalNodesChange] = useNodesState(initialNodes);
  const [internalEdges, setInternalEdges, onInternalEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Use external nodes/edges if provided, otherwise use internal state
  const nodes = externalNodes || internalNodes;
  const edges = externalEdges || internalEdges;
  // Filter out nodes without a valid position
  const validNodes = nodes.filter(
    (n) => n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number'
  );
  const setNodes = onExternalNodesChange || setInternalNodes;
  const setEdges = onExternalEdgesChange || setInternalEdges;
  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (onExternalNodesChange) {
        // Apply changes to create updated nodes array
        let updatedNodes = [...nodes];
        changes.forEach((change) => {
          switch (change.type) {
            case 'position':
              if (change.position) {
                updatedNodes = updatedNodes.map(node => 
                  node.id === change.id 
                    ? { ...node, position: change.position! }
                    : node
                );
              }
              break;
            case 'dimensions':
              if (change.dimensions) {
                updatedNodes = updatedNodes.map(node => 
                  node.id === change.id 
                    ? { ...node, width: change.dimensions!.width, height: change.dimensions!.height }
                    : node
                );
              }
              break;
            case 'select':
              updatedNodes = updatedNodes.map(node => 
                node.id === change.id 
                  ? { ...node, selected: change.selected }
                  : node
              );
              break;
            case 'remove':
              updatedNodes = updatedNodes.filter(node => node.id !== change.id);
              break;
          }
        });
        onExternalNodesChange(updatedNodes);
      } else {
        onInternalNodesChange(changes);
      }
    },
    [nodes, onExternalNodesChange, onInternalNodesChange],
  );

  // Handle edge changes  
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (onExternalEdgesChange) {
        let updatedEdges = [...edges];
        changes.forEach((change) => {
          switch (change.type) {
            case 'remove':
              updatedEdges = updatedEdges.filter(edge => edge.id !== change.id);
              break;
            case 'select':
              updatedEdges = updatedEdges.map(edge => 
                edge.id === change.id 
                  ? { ...edge, selected: change.selected }
                  : edge
              );
              break;
          }
        });
        onExternalEdgesChange(updatedEdges);
      } else {
        onInternalEdgesChange(changes);
      }
    },
    [edges, onExternalEdgesChange, onInternalEdgesChange],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (externalOnConnect) {
        externalOnConnect(params);
      } else {
        const newEdge = {
          id: `e${params.source}-${params.target}`,
          source: params.source!,
          target: params.target!,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
        };
        if (onExternalEdgesChange) {
          onExternalEdgesChange([...edges, newEdge]);
        } else {
          setInternalEdges((eds) => addEdge(params, eds));
        }
      }
    },
    [externalOnConnect, onExternalEdgesChange, setInternalEdges, edges],
  );

  // Use parent handlers if provided, otherwise use internal
  const onDrop = externalOnDrop || useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return; // Fix: don't run if not ready
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position,
        data: { label: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
      };
      if (onExternalNodesChange) {
        onExternalNodesChange([...(externalNodes || []), newNode]);
      } else {
        setInternalNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, onExternalNodesChange, setInternalNodes, externalNodes],
  );

  const onDragOver = externalOnDragOver || useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragLeave = externalOnDragLeave || useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node);
    },
    [onNodeSelect],
  );

  const handleInit = useCallback((instance: any) => {
    setReactFlowInstance(instance);
    if (externalOnInit) {
      externalOnInit(instance);
    }
  }, [externalOnInit]);

  return (
    <div className="flex-1 h-full bg-background">
      <ReactFlow
        nodes={validNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        className="bg-background"
        fitView
      >
        <Controls className="bg-card border border-border" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={3} className="opacity-30" />
      </ReactFlow>
    </div>
  );
}
