import { Handle, Position } from '@xyflow/react';
import { Database, Server, Cloud, Globe, Cpu, Smartphone, Lock, Activity } from 'lucide-react';

const iconMap = {
  database: Database,
  server: Server,
  cloud: Cloud,
  client: Globe,
  compute: Cpu,
  mobile: Smartphone,
  security: Lock,
  monitor: Activity,
};

export function SystemNode({ data, isConnectable }) {
  const Icon = iconMap[data.icon] || Server;
  
  return (
    <div className="glass dark:glass-dark rounded-xl px-4 py-3 min-w-[150px] border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
      <Handle 
        type="target" 
        position={Position.Top} 
        isConnectable={isConnectable} 
        className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-800" 
      />
      
      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-0.5">{data.typeLabel || 'Component'}</div>
        <div className="text-sm font-medium text-slate-800 dark:text-zinc-50">{data.label}</div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-800" 
      />
    </div>
  );
}

export const nodeTypes = {
  systemNode: SystemNode,
};
