import { Bell, Search, Menu, Moon, Sun, Plus, CheckSquare, DollarSign, Briefcase, Target, Home as HomeIcon, X, User, Settings, LogOut, Dumbbell, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { GlobalCommandModals } from './GlobalCommandModals';
import { SearchOverlay } from './SearchOverlay';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { simpleLifeService } from '../services/simpleLifeService';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar({ toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [modalType, setModalType] = useState(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const quickAddRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // For Today Status & Notification Dot
  const { data: tasks } = useQuery({
    queryKey: ['simple-tasks'],
    queryFn: () => simpleLifeService.getTasks(user?.id),
    enabled: !!user?.id
  });
  
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingTasksToday = tasks ? tasks.filter(t => !t.completed && t.due_date === todayStr).length : 0;
  const hasNotifications = pendingTasksToday > 0; // We can add shift checks too

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) setIsQuickAddOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Format pathname into a readable title (e.g. /ai-mentor -> AI Mentor)
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path || path === 'dashboard') return 'Dashboard';
    
    // Handle specific nested routes gracefully
    if (path.startsWith('learning/lesson/')) return 'Lesson View';
    if (path.startsWith('learning/quiz/')) return 'Quiz View';

    // Get the first segment for other routes (e.g., /learning/something -> Learning)
    const mainPathSegment = path.split('/')[0];
    return mainPathSegment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const openModal = (type) => {
    setModalType(type);
    setIsQuickAddOpen(false);
  };

  return (
    <>
    <header className="h-16 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 z-30 sticky top-0 transition-colors">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-zinc-50 tracking-tight hidden md:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Bar (Desktop) */}
        <div className="relative hidden md:block group" onClick={() => setIsSearchOpen(true)}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            readOnly
            placeholder="Search everything... (Cmd+K)" 
            className="w-48 lg:w-64 pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg text-sm cursor-pointer hover:border-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 dark:text-zinc-50"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Search Icon */}
          <button onClick={() => setIsSearchOpen(true)} className="md:hidden p-2 rounded-full text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
            <Search size={20} />
          </button>

          {/* Quick Add Dropdown */}
          <div className="relative" ref={quickAddRef}>
            <button 
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              className="w-8 h-8 md:w-auto md:px-3 md:py-1.5 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full md:rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden md:inline text-sm">Quick Add</span>
            </button>

            <AnimatePresence>
              {isQuickAddOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-2 space-y-1">
                    <button onClick={() => openModal('task')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><CheckSquare size={16} className="text-indigo-500" /> Add Task</button>
                    <button onClick={() => openModal('expense')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><DollarSign size={16} className="text-emerald-500" /> Add Expense</button>
                    <button onClick={() => openModal('income')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Wallet size={16} className="text-emerald-500" /> Add Income</button>
                    <button onClick={() => openModal('shift')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Briefcase size={16} className="text-blue-500" /> Add Shift</button>
                    <button onClick={() => openModal('routine')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Target size={16} className="text-blue-500" /> Add Routine</button>
                    <button onClick={() => { setIsQuickAddOpen(false); navigate('/workout', { state: { openCreateModal: true } }); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Dumbbell size={16} className="text-indigo-500" /> Add Workout</button>
                    <button onClick={() => openModal('visit')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><HomeIcon size={16} className="text-amber-500" /> Plan Home Visit</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsDark(!isDark)}
            className="hidden md:flex p-2 rounded-full text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 relative rounded-full text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Bell size={20} />
              {hasNotifications && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-800"></span>}
            </button>
            <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
          
          <div className="hidden lg:flex flex-col items-end justify-center mr-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
              {pendingTasksToday} tasks left
            </span>
          </div>

          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-800 hover:ring-2 hover:ring-indigo-500/30 transition-all ml-1 focus:outline-none"
            >
              <img 
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'Analyst'}&backgroundColor=e0e7ff`} 
                alt="Profile" 
                className="w-full h-full object-cover bg-indigo-50"
              />
            </button>
            
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-50 truncate">Hello, {user?.email?.split('@')[0] || 'Analyst'}</p>
                  </div>
                  <div className="p-1">
                    <button onClick={() => { setIsProfileOpen(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><User size={16} /> Profile</button>
                    <button onClick={() => { setIsProfileOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Settings size={16} /> Settings</button>
                  </div>
                  <div className="p-1 border-t border-slate-100 dark:border-zinc-800">
                    <button 
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await useAuthStore.getState().logout();
                        navigate('/login');
                      }} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
      
      <GlobalCommandModals isOpen={!!modalType} onClose={() => setModalType(null)} type={modalType} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
