'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  NodeTypes,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const backgroundVariant = BackgroundVariant.Dots;

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeSelect?: (node: Node | null) => void;
  nodeTypes: NodeTypes;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDragLeave?: (event: React.DragEvent) => void;
  onConnect: OnConnect;
  onInit?: (instance: ReactFlowInstance) => void;
}

export default function WorkflowCanvas({ 
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  nodeTypes,
  onDrop,
  onDragOver,
  onDragLeave,
  onConnect,
  onInit
}: WorkflowCanvasProps) {
  
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  // Memoize the canvas props to prevent unnecessary re-renders
  const canvasProps = useMemo(() => ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    nodeTypes,
    onNodeClick,
    onInit,
    onDrop,
    onDragOver,
    onDragLeave,
    // Performance optimizations
    fitView: false,
    attributionPosition: 'bottom-left' as const,
    // Better performance with these settings
    panOnScroll: true,
    selectionOnDrag: true,
    panOnDrag: [1, 2], // Allow panning with middle mouse or right mouse
    selectNodesOnDrag: false,
    // Improve rendering performance
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
    // Better default behavior
    deleteKeyCode: 'Delete',
    multiSelectionKeyCode: 'Shift',
  }), [
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    nodeTypes,
    onNodeClick,
    onInit,
    onDrop,
    onDragOver,
    onDragLeave
  ]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        {...canvasProps}
        className="bg-background"
      >
        <Controls 
          className="bg-card border border-border"
          showZoom
          showFitView
          showInteractive
        />
        {/*<MiniMap 
          className="bg-card border border-border"
          nodeColor="#e2e8f0"
          maskColor="rgba(0, 0, 0, 0.2)"
          pannable
          zoomable
        />*/}
        <Background 
          variant={backgroundVariant} 
          gap={20} 
          size={2} 
          color="#d1d5db"
          className="opacity-60"
        />
      </ReactFlow>
    </div>
  );
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];
