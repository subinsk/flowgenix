import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';

interface WorkflowState {
  // Workflow state
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  currentWorkflowId: string | null;
  lastBuildTime: Date | null;
  executionId: string | null;
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
  
  // UI state
  isBuilding: boolean;
  isChatting: boolean;
  showExecutionProgress: boolean;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  loadNodes: (nodes: Node[]) => void;
  loadEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node | null) => void;
  setCurrentWorkflowId: (id: string | null) => void;
  setLastBuildTime: (time: Date | null) => void;
  setExecutionId: (id: string | null) => void;
  setLastSaveTime: (time: Date | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setIsBuilding: (building: boolean) => void;
  setIsChatting: (chatting: boolean) => void;
  setShowExecutionProgress: (show: boolean) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: string) => void;
  clearWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        nodes: [],
        edges: [],
        selectedNode: null,
        currentWorkflowId: null,
        lastBuildTime: null,
        executionId: null,
        lastSaveTime: null,
        hasUnsavedChanges: false,
        isBuilding: false,
        isChatting: false,
        showExecutionProgress: false,

        // Actions
        setNodes: (nodes) => set({ nodes, hasUnsavedChanges: true }),
        setEdges: (edges) => set({ edges, hasUnsavedChanges: true }),
        loadNodes: (nodes) => set({ nodes }),
        loadEdges: (edges) => set({ edges }),
        setSelectedNode: (selectedNode) => set({ selectedNode }),
        setCurrentWorkflowId: (currentWorkflowId) => set({ currentWorkflowId }),
        setLastBuildTime: (lastBuildTime) => set({ lastBuildTime }),
        setExecutionId: (executionId) => set({ executionId }),
        setLastSaveTime: (lastSaveTime) => set({ lastSaveTime, hasUnsavedChanges: false }),
        setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
        setIsBuilding: (isBuilding) => set({ isBuilding }),
        setIsChatting: (isChatting) => set({ isChatting }),
        setShowExecutionProgress: (showExecutionProgress) => set({ showExecutionProgress }),

        addNode: (node) => {
          const { nodes } = get();
          set({ nodes: [...nodes, node], hasUnsavedChanges: true });
        },

        removeNode: (nodeId) => {
          const { nodes, edges } = get();
          const filteredNodes = nodes.filter((n) => n.id !== nodeId);
          const filteredEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
          set({ nodes: filteredNodes, edges: filteredEdges, hasUnsavedChanges: true });
        },

        updateNode: (nodeId, updates) => {
          const { nodes } = get();
          const updatedNodes = nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          );
          set({ nodes: updatedNodes, hasUnsavedChanges: true });
        },

        addEdge: (edge) => {
          const { edges } = get();
          set({ edges: [...edges, edge], hasUnsavedChanges: true });
        },

        removeEdge: (edgeId) => {
          const { edges } = get();
          set({ edges: edges.filter((e) => e.id !== edgeId), hasUnsavedChanges: true });
        },

        clearWorkflow: () => set({
          nodes: [],
          edges: [],
          selectedNode: null,
          currentWorkflowId: null,
          lastBuildTime: null,
          executionId: null,
          lastSaveTime: null,
          hasUnsavedChanges: false,
          isBuilding: false,
          isChatting: false,
          showExecutionProgress: false,
        }),
      }),
      {
        name: 'workflow-store',
        partialize: (state) => ({
          nodes: state.nodes,
          edges: state.edges,
          currentWorkflowId: state.currentWorkflowId,
          lastBuildTime: state.lastBuildTime,
          lastSaveTime: state.lastSaveTime,
          hasUnsavedChanges: state.hasUnsavedChanges,
        }),
      }
    )
  )
);
