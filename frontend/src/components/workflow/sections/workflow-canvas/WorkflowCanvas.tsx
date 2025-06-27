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

  const canvasProps: React.ComponentProps<typeof ReactFlow> = useMemo(() => ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    nodeTypes,
    onNodeClick,
    onInit,
    // Accessibility & UX
    nodesFocusable: true,
    edgesFocusable: true,
    autoPanOnConnect: true,
    autoPanOnNodeDrag: true,
    // Performance
    onlyRenderVisibleElements: true,
    // Viewport & interaction
    attributionPosition: 'bottom-left',
    panOnScroll: true,
    panOnDrag: [1, 2], // middle/right mouse
    selectionOnDrag: true,
    selectNodesOnDrag: false,
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
    minZoom: 0.25,
    maxZoom: 2,
    // Keyboard
    deleteKeyCode: 'Delete',
    multiSelectionKeyCode: 'Shift',
    selectionKeyCode: 'Shift',
    panActivationKeyCode: 'Space',
    zoomActivationKeyCode: ['Meta', 'Control'],
    // Optionally enable grid snapping:
    // snapToGrid: true,
    // snapGrid: [16, 16],
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
    <div
      className="w-full h-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}>
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
          gap={16}
          size={3}
          color="#e2e8f0"
        />
      </ReactFlow>
    </div>
  );
}