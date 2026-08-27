import { useQuery } from '@tanstack/react-query';
import { simpleLifeService } from '../services/simpleLifeService';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, CheckSquare, Briefcase, Target, Home as HomeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationDropdown({ isOpen, onClose }) {
  const { user } = useAuthStore();

  const { data: tasks } = useQuery({
    queryKey: ['simple-tasks'],
    queryFn: () => simpleLifeService.getTasks(user?.id),
    enabled: !!user?.id
  });

  const { data: shifts } = useQuery({
    queryKey: ['simple-shifts'],
    queryFn: () => simpleLifeService.getShifts(user?.id),
    enabled: !!user?.id
  });

  // Calculate notifications
  const notifications = [];
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (tasks) {
    const dueToday = tasks.filter(t => !t.completed && t.due_date === todayStr);
    if (dueToday.length > 0) {
      notifications.push({
        id: 'tasks-due',
        icon: <CheckSquare size={16} className="text-indigo-500" />,
        title: `${dueToday.length} Tasks due today`,
        time: 'Today'
      });
    }
  }

  if (shifts) {
    const upcomingShift = shifts.find(s => s.date === todayStr && s.shift_type !== 'Off');
    if (upcomingShift) {
      notifications.push({
        id: 'shift-today',
        icon: <Briefcase size={16} className="text-blue-500" />,
        title: `${upcomingShift.shift_type} Shift today`,
        time: `${upcomingShift.start_time} - ${upcomingShift.end_time}`
      });
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
        >
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
            <h3 className="font-semibold text-slate-800 dark:text-zinc-50">Notifications</h3>
            {notifications.length > 0 && (
              <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.length} New
              </span>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-zinc-400">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {notifications.map(n => (
                  <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors flex items-start gap-3 cursor-pointer">
                    <div className="mt-0.5 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      {n.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-zinc-50">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
