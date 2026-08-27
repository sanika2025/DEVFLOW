import { Undo2, Redo2, Save, Download, CheckCircle2, Trash2, FolderOpen } from 'lucide-react';
import { useDiagramStore } from '../../../store/useDiagramStore';

export function Toolbar({ onValidate }) {
  const undo = useDiagramStore(state => state.undo);
  const redo = useDiagramStore(state => state.redo);
  
  const handleSave = () => {
    const state = useDiagramStore.getState();
    const data = JSON.stringify({ nodes: state.nodes, edges: state.edges });
    localStorage.setItem('diagram_save', data);
    alert('Diagram saved locally!');
  };

  const handleLoad = () => {
    const dataStr = localStorage.getItem('diagram_save');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        useDiagramStore.getState().setNodes(data.nodes || []);
        useDiagramStore.getState().setEdges(data.edges || []);
      } catch (e) {
        console.error("Failed to load diagram", e);
      }
    }
  };

  const handleExport = () => {
    const state = useDiagramStore.getState();
    const data = JSON.stringify({ nodes: state.nodes, edges: state.edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architecture.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass-dark rounded-xl p-1.5 flex items-center gap-1 shadow-lg border border-indigo-500/20">
      <div className="flex items-center gap-1 border-r border-indigo-500/20 pr-2 mr-1">
        <button onClick={undo} className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-colors" title="Undo">
          <Undo2 size={18} />
        </button>
        <button onClick={redo} className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-colors" title="Redo">
          <Redo2 size={18} />
        </button>
      </div>
      
      <div className="flex items-center gap-1 border-r border-indigo-500/20 pr-2 mr-1">
        <button onClick={handleSave} className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-colors" title="Save">
          <Save size={18} />
        </button>
        <button onClick={handleLoad} className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-colors" title="Load">
          <FolderOpen size={18} />
        </button>
        <button onClick={handleExport} className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-500/20 transition-colors" title="Export">
          <Download size={18} />
        </button>
      </div>
      
      <button 
        onClick={onValidate}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
      >
        <CheckCircle2 size={16} />
        Validate
      </button>
    </div>
  );
}
