import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

export const useDiagramStore = create((set, get) => ({
  nodes: [],
  edges: [],
  
  // History
  history: [],
  historyIndex: -1,

  saveHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    // Remove future history if we are in the middle of undo stack and make a new change
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    
    // Limit history to 50 steps
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      set({
        nodes: previousState.nodes,
        edges: previousState.edges,
        historyIndex: newIndex
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      set({
        nodes: nextState.nodes,
        edges: nextState.edges,
        historyIndex: newIndex
      });
    }
  },

  onNodesChange: (changes) => {
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes);
      return { nodes: newNodes };
    });
    // We only want to save history on significant changes, usually handled at the component level
    // for drag-end, but we'll do it simply for now if a node is added/removed.
    const hasSignificantChange = changes.some(c => c.type === 'add' || c.type === 'remove' || c.type === 'replace');
    if (hasSignificantChange) {
      get().saveHistory();
    }
  },

  onEdgesChange: (changes) => {
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
    const hasSignificantChange = changes.some(c => c.type === 'add' || c.type === 'remove');
    if (hasSignificantChange) {
      get().saveHistory();
    }
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge({ 
        ...connection, 
        type: 'default', 
        animated: true, 
        style: { stroke: '#6366f1', strokeWidth: 2 } 
      }, state.edges)
    }));
    get().saveHistory();
  },

  setNodes: (nodes) => {
    set({ nodes });
    get().saveHistory();
  },

  setEdges: (edges) => {
    set({ edges });
    get().saveHistory();
  },

  updateNodeProperties: (nodeId, updates) => {
    set((state) => ({
      nodes: state.nodes.map(node => {
        if (node.id === nodeId) {
          // Deep merge for updates
          const newData = { ...node.data, ...updates.data };
          const newStyle = { ...node.style, ...updates.style };
          return { ...node, ...updates, data: newData, style: newStyle };
        }
        return node;
      })
    }));
    get().saveHistory();
  },
  
  updateEdgeProperties: (edgeId, updates) => {
    set((state) => ({
      edges: state.edges.map(edge => {
        if (edge.id === edgeId) {
          return { ...edge, ...updates };
        }
        return edge;
      })
    }));
    get().saveHistory();
  },

  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
    get().saveHistory();
  },

  // State
  selectedNodes: [],
  selectedEdges: [],
  
  setSelectedNodes: (nodes) => set({ selectedNodes: nodes }),
  setSelectedEdges: (edges) => set({ selectedEdges: edges }),

  // Custom Components
  customComponents: [],
  addCustomComponent: (comp) => set((state) => ({
    customComponents: [...state.customComponents, comp]
  }))
}));
