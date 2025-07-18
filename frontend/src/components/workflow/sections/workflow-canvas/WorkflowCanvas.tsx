'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
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
    nodesFocusable: true,
    edgesFocusable: true,
    autoPanOnConnect: true,
    autoPanOnNodeDrag: true,
    onlyRenderVisibleElements: true,
    attributionPosition: 'bottom-left',
    panOnScroll: true,
    panOnDrag: [1, 2],
    selectionOnDrag: true,
    selectNodesOnDrag: false,
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
    minZoom: 0.25,
    maxZoom: 2,
    deleteKeyCode: 'Delete',
    multiSelectionKeyCode: 'Shift',
    selectionKeyCode: 'Shift',
    panActivationKeyCode: 'Space',
    zoomActivationKeyCode: ['Meta', 'Control'],
  }), [
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    nodeTypes,
    onNodeClick,
    onInit
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
          position='bottom-center'
          orientation='horizontal'
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
          color="#d4d4d4"
          bgColor='#f5f5f5'
        />
      </ReactFlow>
    </div>
  );
}