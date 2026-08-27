import { NodeResizer } from '@xyflow/react';

export function GroupNode({ data, selected }) {
  const customStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: data.backgroundColor || 'rgba(99, 102, 241, 0.05)',
    borderColor: data.borderColor || 'rgba(99, 102, 241, 0.3)',
    borderWidth: data.borderWidth || 2,
    borderStyle: data.borderStyle || 'dashed',
  };

  return (
    <div 
      className={`relative rounded-xl transition-all ${selected ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}
      style={customStyle}
    >
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={100} 
        minHeight={100}
      />
      <div className="absolute -top-6 left-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-md border border-indigo-200 dark:border-indigo-800 shadow-sm">
        {data.label || 'Group'}
      </div>
    </div>
  );
}
