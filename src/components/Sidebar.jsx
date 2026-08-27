import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Mic, 
  Code2, 
  Rocket, 
  Bot, 
  CreditCard, 
  PieChart, 
  Calendar,
  Settings,
  Menu,
  ChevronLeft,
  Box,
  Activity,
  Briefcase,
  LogOut,
  Moon,
  CheckSquare,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

const FULL_NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'Learning Hub', path: '/learning' },
  { icon: FileText, label: 'Smart Notes', path: '/notes' },
  { icon: Mic, label: 'Interview Prep', path: '/interview' },
  { icon: Rocket, label: 'Projects', path: '/projects' },
  { icon: Bot, label: 'AI Mentor', path: '/ai-mentor' },
  { icon: CreditCard, label: 'Expense Tracker', path: '/expenses' },
  { icon: Calendar, label: 'Planner', path: '/planner' },
  { icon: Activity, label: 'Workout Tracking', path: '/workout' },


  { icon: Box, label: 'System Design', path: '/sandbox' },
];

const SIMPLE_NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/simple-dashboard' },
  { icon: CreditCard, label: 'Money', path: '/simple-money' },
  { icon: Clock, label: 'Shifts', path: '/simple-shifts' },
  { icon: Home, label: 'Home Visits', path: '/simple-home-visits' }, // Using Home for now
  { icon: Moon, label: 'Routine', path: '/simple-routine' },
  { icon: CheckSquare, label: 'Tasks', path: '/simple-tasks' },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const { logout, profile } = useAuthStore();

  const isSimpleLife = profile?.user_mode === 'simple_life';
  const currentNavItems = isSimpleLife ? SIMPLE_NAV_ITEMS : FULL_NAV_ITEMS;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed md:relative top-0 left-0 h-full flex flex-col glass-panel dark:glass-panel-dark z-50 shadow-xl md:shadow-lg transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:flex`}
        style={{ width: isOpen ? 280 : 80 }}
      >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-zinc-800">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 font-bold text-xl text-indigo-600 tracking-tight"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Code2 className="text-white w-5 h-5" />
              </div>
              {isSimpleLife ? 'Life Manager' : 'DevMind AI'}
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors absolute right-4 hidden md:block"
        >
          {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
        {currentNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 768) setIsOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:bg-indigo-500/10 dark:bg-none text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm border-l-2 border-indigo-600 dark:border-indigo-500 dark:shadow-[inset_2px_0_10px_rgba(99,102,241,0.15)]' 
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200 hover:shadow-sm border-l-2 border-transparent'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-200'} />
              
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-800 dark:bg-zinc-800/60 text-white dark:border dark:border-zinc-800 text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-1">
        <Link
          to="/settings"
          onClick={() => { if (window.innerWidth < 768) setIsOpen(false); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors group relative border-l-2 border-transparent"
        >
          <Settings size={20} />
          <AnimatePresence>
            {isOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-medium whitespace-nowrap">Settings</motion.span>}
          </AnimatePresence>
          {!isOpen && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-800 dark:bg-zinc-800/60 text-white dark:border dark:border-zinc-800 text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              Settings
            </div>
          )}
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group relative"
        >
          <LogOut size={20} />
          <AnimatePresence>
            {isOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-medium whitespace-nowrap">Log Out</motion.span>}
          </AnimatePresence>
          {!isOpen && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-800 dark:bg-zinc-800/60 text-white dark:border dark:border-zinc-800 text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              Log Out
            </div>
          )}
        </button>
      </div>
    </motion.aside>
    </>
  );
}
