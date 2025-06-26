import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Node, Edge } from 'reactflow';

interface WorkflowState {
  // Workflow state
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  currentWorkflowId: string | null;
  lastBuildTime: Date | null;
  executionId: string | null;
  
  // UI state
  isBuilding: boolean;
  isChatting: boolean;
  showExecutionProgress: boolean;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node | null) => void;
  setCurrentWorkflowId: (id: string | null) => void;
  setLastBuildTime: (time: Date | null) => void;
  setExecutionId: (id: string | null) => void;
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
        isBuilding: false,
        isChatting: false,
        showExecutionProgress: false,

        // Actions
        setNodes: (nodes) => set({ nodes }),
        setEdges: (edges) => set({ edges }),
        setSelectedNode: (selectedNode) => set({ selectedNode }),
        setCurrentWorkflowId: (currentWorkflowId) => set({ currentWorkflowId }),
        setLastBuildTime: (lastBuildTime) => set({ lastBuildTime }),
        setExecutionId: (executionId) => set({ executionId }),
        setIsBuilding: (isBuilding) => set({ isBuilding }),
        setIsChatting: (isChatting) => set({ isChatting }),
        setShowExecutionProgress: (showExecutionProgress) => set({ showExecutionProgress }),

        addNode: (node) => {
          const { nodes } = get();
          set({ nodes: [...nodes, node] });
        },

        removeNode: (nodeId) => {
          const { nodes, edges } = get();
          const filteredNodes = nodes.filter((n) => n.id !== nodeId);
          const filteredEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
          set({ nodes: filteredNodes, edges: filteredEdges });
        },

        updateNode: (nodeId, updates) => {
          const { nodes } = get();
          const updatedNodes = nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          );
          set({ nodes: updatedNodes });
        },

        addEdge: (edge) => {
          const { edges } = get();
          set({ edges: [...edges, edge] });
        },

        removeEdge: (edgeId) => {
          const { edges } = get();
          set({ edges: edges.filter((e) => e.id !== edgeId) });
        },

        clearWorkflow: () => set({
          nodes: [],
          edges: [],
          selectedNode: null,
          currentWorkflowId: null,
          lastBuildTime: null,
          executionId: null,
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
        }),
      }
    )
  )
);
