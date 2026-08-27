import { X } from 'lucide-react';
import { useDiagramStore } from '../../../store/useDiagramStore';
import { useState, useEffect } from 'react';

export function PropertiesPanel() {
  const selectedNodes = useDiagramStore(state => state.selectedNodes);
  const selectedEdges = useDiagramStore(state => state.selectedEdges);
  const updateNodeProperties = useDiagramStore(state => state.updateNodeProperties);
  const updateEdgeProperties = useDiagramStore(state => state.updateEdgeProperties);

  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const selectedEdge = selectedEdges.length === 1 ? selectedEdges[0] : null;

  const [nodeState, setNodeState] = useState(null);
  const [edgeState, setEdgeState] = useState(null);
  
  useEffect(() => {
    if (selectedNode) {
      setNodeState({
        label: selectedNode.data?.label || '',
        backgroundColor: selectedNode.style?.backgroundColor || '',
        width: selectedNode.style?.width || '',
        height: selectedNode.style?.height || '',
      });
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      setEdgeState({
        label: selectedEdge.label || '',
        animated: selectedEdge.animated || false,
        type: selectedEdge.type || 'default',
      });
    }
  }, [selectedEdge]);

  if (!selectedNode && !selectedEdge) return null;

  const handleNodeChange = (field, value) => {
    setNodeState(prev => ({ ...prev, [field]: value }));
    
    if (field === 'label') {
      updateNodeProperties(selectedNode.id, { data: { label: value } });
    } else {
      updateNodeProperties(selectedNode.id, { style: { [field]: value } });
    }
  };

  const handleEdgeChange = (field, value) => {
    setEdgeState(prev => ({ ...prev, [field]: value }));
    updateEdgeProperties(selectedEdge.id, { [field]: value });
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-72 glass-panel dark:glass-panel-dark rounded-xl shadow-xl flex flex-col border border-slate-200 dark:border-zinc-800 z-50">
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-zinc-50">Properties</h3>
        {/* We can just let React Flow handle deselection when clicking canvas, or we could add an explicit clear */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedNode && nodeState && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Label</label>
              <input 
                type="text" 
                value={nodeState.label}
                onChange={(e) => handleNodeChange('label', e.target.value)}
                className="w-full bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-zinc-50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Width</label>
                <input 
                  type="number" 
                  value={nodeState.width || ''}
                  onChange={(e) => handleNodeChange('width', parseInt(e.target.value) || undefined)}
                  className="w-full bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Height</label>
                <input 
                  type="number" 
                  value={nodeState.height || ''}
                  onChange={(e) => handleNodeChange('height', parseInt(e.target.value) || undefined)}
                  className="w-full bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-zinc-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Background Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={nodeState.backgroundColor || '#ffffff'}
                  onChange={(e) => handleNodeChange('backgroundColor', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                />
                <input 
                  type="text"
                  value={nodeState.backgroundColor || ''}
                  onChange={(e) => handleNodeChange('backgroundColor', e.target.value)}
                  placeholder="e.g. #ffffff or transparent"
                  className="flex-1 bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-zinc-50"
                />
              </div>
            </div>
          </>
        )}

        {selectedEdge && edgeState && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Arrow Label</label>
              <input 
                type="text" 
                value={edgeState.label}
                onChange={(e) => handleEdgeChange('label', e.target.value)}
                placeholder="e.g. HTTPS, Kafka Topic"
                className="w-full bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-zinc-50"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Animated (Flowing)</label>
              <input 
                type="checkbox"
                checked={edgeState.animated}
                onChange={(e) => handleEdgeChange('animated', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Line Style</label>
              <select
                value={edgeState.type}
                onChange={(e) => handleEdgeChange('type', e.target.value)}
                className="w-full bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-zinc-50"
              >
                <option value="default">Bezier Curve</option>
                <option value="straight">Straight Line</option>
                <option value="step">Step (Orthogonal)</option>
                <option value="smoothstep">Smooth Step</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
