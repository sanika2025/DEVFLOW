import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap,
  SelectionMode,
  useReactFlow
} from '@xyflow/react';
import { GenericNode } from '../Nodes/GenericNode';
import { GroupNode } from '../Nodes/GroupNode';
import { TextNode } from '../Nodes/TextNode';
import { useDiagramStore } from '../../../store/useDiagramStore';

const nodeTypes = {
  generic: GenericNode,
  group: GroupNode,
  text: TextNode,
};

export function Canvas() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const nodes = useDiagramStore(state => state.nodes);
  const edges = useDiagramStore(state => state.edges);
  const onNodesChange = useDiagramStore(state => state.onNodesChange);
  const onEdgesChange = useDiagramStore(state => state.onEdgesChange);
  const onConnect = useDiagramStore(state => state.onConnect);
  const addNode = useDiagramStore(state => state.addNode);
  const setSelectedNodes = useDiagramStore(state => state.setSelectedNodes);
  const setSelectedEdges = useDiagramStore(state => state.setSelectedEdges);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeDataStr = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataStr) return;
      
      const nodeData = JSON.parse(nodeDataStr);
      
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Simple UUID fallback
      const newId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const isGroup = nodeData.shape === 'container';
      const isText = nodeData.shape === 'text';
      
      const newNodeType = isGroup ? 'group' : isText ? 'text' : 'generic';

      const newNode = {
        id: newId,
        type: newNodeType,
        position,
        data: { 
          label: nodeData.label, 
          icon: nodeData.icon, 
          shape: nodeData.shape,
          typeLabel: nodeData.typeLabel,
          category: nodeData.category
        },
        style: {
          width: isGroup ? 400 : (nodeData.shape === 'circle' ? 160 : 160),
          height: isGroup ? 300 : (nodeData.shape === 'circle' ? 160 : 80),
        }
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  const onSelectionChange = useCallback(({ nodes, edges }) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  }, [setSelectedNodes, setSelectedEdges]);

  return (
    <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionMode={SelectionMode.Partial}
        className="bg-slate-50 dark:bg-zinc-950"
      >
        <Controls className="bg-white dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-800 shadow-md" />
        <MiniMap 
          nodeStrokeColor={(n) => '#6366f1'}
          nodeColor={(n) => '#eef2ff'}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="bg-white dark:bg-zinc-900/90 backdrop-blur-sm border-slate-200 dark:border-zinc-800 rounded-lg shadow-md" 
        />
        <Background color="#94a3b8" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
