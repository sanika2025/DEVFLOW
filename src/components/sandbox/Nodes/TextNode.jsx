import { NodeResizer } from '@xyflow/react';

export function TextNode({ data, selected }) {
  const customStyle = {
    width: '100%',
    height: '100%',
    color: data.textColor || 'inherit',
    fontSize: data.fontSize || 16,
    fontWeight: data.fontWeight || 'normal',
    textAlign: data.textAlign || 'left',
  };

  return (
    <div 
      className={`relative px-2 py-1 min-w-[50px] transition-all ${selected ? 'ring-1 ring-indigo-500 rounded bg-indigo-50/10' : ''}`}
      style={customStyle}
    >
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={30} 
        minHeight={20}
      />
      {data.label || 'Text Node'}
    </div>
  );
}
