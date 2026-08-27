import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { simpleLifeService } from '../services/simpleLifeService';
import { useAuthStore } from '../store/useAuthStore';
import { Search, X, CheckSquare, DollarSign, Wallet, Briefcase, Target, Home as HomeIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SearchOverlay({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Fetch all data
  const { data: tasks } = useQuery({
    queryKey: ['simple-tasks'],
    queryFn: () => simpleLifeService.getTasks(user?.id),
    enabled: isOpen && !!user?.id
  });

  const { data: expenses } = useQuery({
    queryKey: ['simple-expenses'],
    queryFn: () => simpleLifeService.getExpenses(user?.id),
    enabled: isOpen && !!user?.id
  });

  const { data: income } = useQuery({
    queryKey: ['simple-income'],
    queryFn: () => simpleLifeService.getIncome(user?.id),
    enabled: isOpen && !!user?.id
  });

  const { data: shifts } = useQuery({
    queryKey: ['simple-shifts'],
    queryFn: () => simpleLifeService.getShifts(user?.id),
    enabled: isOpen && !!user?.id
  });

  const { data: routines } = useQuery({
    queryKey: ['simple-routines'],
    queryFn: () => simpleLifeService.getRoutines(user?.id),
    enabled: isOpen && !!user?.id
  });

  const { data: visits } = useQuery({
    queryKey: ['simple-home-visits'],
    queryFn: () => simpleLifeService.getHomeVisits(user?.id),
    enabled: isOpen && !!user?.id
  });

  // Filtering logic
  const searchResults = [];
  const q = query.toLowerCase().trim();

  if (q.length > 0) {
    if (tasks) {
      tasks.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)).forEach(t => {
        searchResults.push({ id: `t-${t.id}`, type: 'Task', title: t.title, subtitle: `${t.category} • ${t.due_date}`, icon: <CheckSquare size={16} className="text-indigo-500" />, path: '/simple-tasks' });
      });
    }
    if (expenses) {
      expenses.filter(e => (e.description && e.description.toLowerCase().includes(q)) || e.category.toLowerCase().includes(q)).forEach(e => {
        searchResults.push({ id: `e-${e.id}`, type: 'Expense', title: `₹${e.amount} - ${e.description || e.category}`, subtitle: e.category, icon: <DollarSign size={16} className="text-rose-500" />, path: '/simple-money' });
      });
    }
    if (income) {
      income.filter(i => i.source.toLowerCase().includes(q)).forEach(i => {
        searchResults.push({ id: `i-${i.id}`, type: 'Income', title: `₹${i.amount} from ${i.source}`, subtitle: 'Income', icon: <Wallet size={16} className="text-emerald-500" />, path: '/simple-money' });
      });
    }
    if (shifts) {
      shifts.filter(s => s.shift_type.toLowerCase().includes(q)).forEach(s => {
        searchResults.push({ id: `s-${s.id}`, type: 'Shift', title: `${s.shift_type} Shift`, subtitle: s.date, icon: <Briefcase size={16} className="text-blue-500" />, path: '/simple-shifts' });
      });
    }
    if (routines) {
      routines.filter(r => r.title.toLowerCase().includes(q)).forEach(r => {
        searchResults.push({ id: `r-${r.id}`, type: 'Routine', title: r.title, subtitle: r.category, icon: <Target size={16} className="text-blue-500" />, path: '/simple-routines' });
      });
    }
    if (visits) {
      visits.filter(v => v.notes?.toLowerCase().includes(q) || v.travel_mode.toLowerCase().includes(q)).forEach(v => {
        searchResults.push({ id: `v-${v.id}`, type: 'Home Visit', title: `Visit via ${v.travel_mode}`, subtitle: v.departure, icon: <HomeIcon size={16} className="text-amber-500" />, path: '/simple-home-visits' });
      });
    }
  }

  const navigateTo = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 relative z-10 flex flex-col max-h-[80vh]"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 py-3 md:p-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <Search className="text-slate-400 dark:text-zinc-500 w-5 h-5 mr-3 shrink-0" />
              <input 
                type="text" 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks, expenses, routines..." 
                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-zinc-50 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              />
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto p-2 md:p-4 flex-1">
              {q.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400 font-medium">Type something to search</p>
                  <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">Search across all your modules globally.</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 px-3 pb-2 uppercase tracking-wider">Results</p>
                  {searchResults.map((result) => (
                    <button 
                      key={result.id}
                      onClick={() => navigateTo(result.path)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-zinc-50 truncate">{result.title}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate">{result.type} • {result.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-500 dark:text-zinc-400 font-medium">No results found for "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
