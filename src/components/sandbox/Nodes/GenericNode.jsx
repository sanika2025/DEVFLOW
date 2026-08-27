import { Handle, Position, NodeResizer } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';

const SHAPES = {
  rectangle: 'rounded-none',
  rounded: 'rounded-xl',
  circle: 'rounded-full aspect-square justify-center',
  ellipse: 'rounded-[50%]',
  diamond: 'rotate-45', // Need to rotate content back
  triangle: 'clip-triangle', // Custom CSS class needed in index.css
  hexagon: 'clip-hexagon',
  cylinder: 'rounded-t-[50%] rounded-b-[50%]',
  cloud: 'rounded-[3rem]', // Simplify cloud for now
  document: 'rounded-bl-xl rounded-tl-xl rounded-br-xl',
  sticky: 'rounded-none border-t-8 border-yellow-400 bg-yellow-100',
  text: 'border-transparent bg-transparent shadow-none',
  container: 'border-2 border-dashed border-indigo-300 bg-indigo-50/20'
};

export function GenericNode({ data, selected, id }) {
  const Icon = data.icon && LucideIcons[data.icon.charAt(0).toUpperCase() + data.icon.slice(1)] 
    ? LucideIcons[data.icon.charAt(0).toUpperCase() + data.icon.slice(1)] 
    : null;

  const shapeClass = SHAPES[data.shape] || SHAPES.rounded;
  const isDiamond = data.shape === 'diamond';
  
  // Custom styles from properties panel
  const customStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: data.backgroundColor,
    borderColor: data.borderColor,
    borderWidth: data.borderWidth,
    borderStyle: data.borderStyle,
    color: data.textColor,
    fontSize: data.fontSize,
  };

  return (
    <div 
      className={`relative flex items-center gap-3 p-3 transition-all
        ${shapeClass}
        ${!data.backgroundColor ? 'bg-white dark:bg-zinc-900/90 backdrop-blur-sm' : ''}
        ${!data.borderColor ? 'border-slate-200 dark:border-zinc-800' : ''}
        ${!data.borderWidth ? 'border' : ''}
        ${selected ? 'ring-2 ring-indigo-500 shadow-lg' : 'shadow-sm'}
        ${data.shape !== 'text' ? 'glass dark:glass-dark' : ''}
      `}
      style={customStyle}
    >
      <div className={`flex items-center gap-2 w-full h-full ${isDiamond ? '-rotate-45' : ''} ${data.shape === 'circle' ? 'flex-col justify-center text-center' : ''}`}>
        {Icon && (
          <div className="w-8 h-8 flex-shrink-0 rounded flex items-center justify-center text-indigo-500">
            <Icon size={20} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {data.typeLabel && data.shape !== 'text' && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate leading-tight">
              {data.typeLabel}
            </div>
          )}
          <div className="font-medium text-slate-800 dark:text-zinc-50 truncate leading-tight">
            {data.label}
          </div>
        </div>
      </div>

      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={50} 
        minHeight={50}
      />
      {/* Ports */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-800" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-800" />
      <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-800" />
      <Handle type="target" position={Position.Right} id="right" className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-800" />
    </div>
  );
}
