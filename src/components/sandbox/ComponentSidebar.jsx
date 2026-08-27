import { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { componentRegistry } from '../../data/componentRegistry';
import { useDiagramStore } from '../../store/useDiagramStore';

export function ComponentSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    'Basic Shapes': true,
    'Compute': true,
    'Network': true
  });
  
  const customComponents = useDiagramStore(state => state.customComponents);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const onDragStart = (event, nodeKey, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ ...nodeData, type: nodeKey }));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Group registry by category
  const categorized = useMemo(() => {
    const groups = {};
    Object.entries(componentRegistry).forEach(([key, comp]) => {
      if (!groups[comp.category]) {
        groups[comp.category] = [];
      }
      groups[comp.category].push({ key, ...comp });
    });
    
    if (customComponents.length > 0) {
      groups['Custom'] = customComponents;
    }
    
    return groups;
  }, [customComponents]);

  // Filter based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categorized;
    
    const filtered = {};
    const lowerSearch = searchTerm.toLowerCase();
    
    Object.entries(categorized).forEach(([category, items]) => {
      const matchedItems = items.filter(item => 
        item.label.toLowerCase().includes(lowerSearch) || 
        category.toLowerCase().includes(lowerSearch)
      );
      
      if (matchedItems.length > 0) {
        filtered[category] = matchedItems;
      }
    });
    
    return filtered;
  }, [categorized, searchTerm]);

  return (
    <div className="w-72 glass-panel dark:glass-panel-dark h-full flex flex-col border-r border-slate-200 dark:border-zinc-800 z-10">
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
        <h3 className="font-semibold text-slate-800 dark:text-zinc-50 flex items-center justify-between">
          Components
          <button className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-indigo-600 transition-colors">
            <Plus size={16} />
          </button>
        </h3>
        
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-zinc-50"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Object.entries(filteredCategories).map(([category, items]) => {
          const isExpanded = searchTerm ? true : expandedCategories[category];
          
          return (
            <div key={category} className="mb-2">
              <button 
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50/50 rounded-lg transition-colors"
              >
                {category}
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              {isExpanded && (
                <div className="grid grid-cols-2 gap-2 mt-1 px-1">
                  {items.map((comp) => {
                    const IconName = comp.icon.charAt(0).toUpperCase() + comp.icon.slice(1);
                    const Icon = LucideIcons[IconName] || LucideIcons.Box;
                    
                    return (
                      <div
                        key={comp.key || comp.id}
                        className="flex flex-col items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-zinc-900/90 backdrop-blur-sm/50 border border-slate-200 dark:border-zinc-800/50 cursor-grab hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all active:cursor-grabbing text-center"
                        onDragStart={(e) => onDragStart(e, comp.key || comp.id, comp)}
                        draggable
                      >
                        <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Icon size={16} />
                        </div>
                        <div className="text-[10px] font-medium text-slate-700 dark:text-zinc-300 leading-tight">
                          {comp.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
