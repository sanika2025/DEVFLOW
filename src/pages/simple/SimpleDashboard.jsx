import { useQuery } from '@tanstack/react-query';
import { simpleLifeService } from '../../services/simpleLifeService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/Card';
import { Moon, Sun, DollarSign, Home, CheckSquare, Clock, CreditCard, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SimpleDashboard() {
  const { user } = useAuthStore();

  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['simple-shifts', user?.id],
    queryFn: () => simpleLifeService.getShifts(user?.id),
    enabled: !!user?.id
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['simple-expenses', user?.id],
    queryFn: () => simpleLifeService.getExpenses(user?.id),
    enabled: !!user?.id
  });

  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ['simple-bills', user?.id],
    queryFn: () => simpleLifeService.getBills(user?.id),
    enabled: !!user?.id
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['simple-tasks', user?.id],
    queryFn: () => simpleLifeService.getTasks(user?.id),
    enabled: !!user?.id
  });

  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ['simple-visits', user?.id],
    queryFn: () => simpleLifeService.getHomeVisits(user?.id),
    enabled: !!user?.id
  });

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ['simple-income', user?.id],
    queryFn: () => simpleLifeService.getIncome(user?.id),
    enabled: !!user?.id
  });

  if (shiftsLoading || expensesLoading || billsLoading || tasksLoading || visitsLoading || incomeLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  // Calculate insights
  const today = new Date().toISOString().split('T')[0];
  const todayShift = shifts?.find(s => s.date === today);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses?.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }) || [];
  
  const spentThisMonth = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  const thisMonthIncome = incomeData?.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }) || [];
  const salary = thisMonthIncome.reduce((sum, i) => sum + parseFloat(i.amount), 0);
  
  const remaining = salary - spentThisMonth;

  const todayTasks = tasks?.filter(t => !t.completed).slice(0, 4) || [];
  
  const upcomingBills = bills?.filter(b => b.is_active).sort((a, b) => a.due_date - b.due_date).slice(0, 3) || [];
  
  const upcomingVisit = visits?.find(v => new Date(v.departure) > new Date()) || null;
  const daysToHome = upcomingVisit ? Math.ceil((new Date(upcomingVisit.departure) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-3">
          Good Morning 👋
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1">Here is what's happening today.</p>
      </header>

      {/* Today's Shift */}
      <Card className="bg-gradient-to-br from-slate-900 to-indigo-900 border-none text-white dark:bg-zinc-900/90 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute -right-10 -top-10 opacity-10">
          <Moon size={150} />
        </div>
        <div className="relative z-10">
          <h3 className="text-indigo-200 font-medium text-sm tracking-wider uppercase mb-2">TODAY</h3>
          {todayShift ? (
            <div>
              <div className="flex items-center gap-3 mb-1">
                {todayShift.shift_type === 'Night' ? <Moon size={24} className="text-indigo-300" /> : <Sun size={24} className="text-amber-300" />}
                <span className="text-3xl font-bold">{todayShift.shift_type} Shift</span>
              </div>
              <p className="text-indigo-100 text-lg opacity-90 ml-9">
                {todayShift.start_time} &rarr; {todayShift.end_time}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-200">Off Day</span>
              <span className="text-2xl">🎉</span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Money Snapshot */}
        <Link to="/simple-money" className="block group">
          <Card className="h-full hover:shadow-md transition-all border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <DollarSign className="text-emerald-500" size={18} />
                MONEY
              </h3>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">This Month</p>
                <p className="text-xl font-semibold text-slate-800 dark:text-zinc-50">₹{spentThisMonth.toLocaleString()} spent</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Remaining</p>
                <p className="text-2xl font-bold text-emerald-600">₹{remaining.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Home Visit */}
        <Link to="/simple-home-visits" className="block group">
          <Card className="h-full hover:shadow-md transition-all border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <Home className="text-amber-500" size={18} />
                HOME
              </h3>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
            
            <div className="space-y-4">
              {upcomingVisit ? (
                <>
                  <div>
                    <p className="text-3xl font-bold text-amber-600 mb-1">In {daysToHome} days</p>
                    <p className="text-sm font-medium text-slate-600">Next visit</p>
                  </div>
                  <div>
                    <p className="text-slate-700 dark:text-zinc-300 font-medium">
                      {new Date(upcomingVisit.departure).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} 
                      {upcomingVisit.return && ` → ${new Date(upcomingVisit.return).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-4 text-slate-500 text-sm">
                  No upcoming home visits planned. Time to plan one!
                </div>
              )}
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Tasks */}
        <Card className="border-t-4 border-t-indigo-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <CheckSquare className="text-indigo-500" size={18} />
              TODAY'S TASKS
            </h3>
            <Link to="/simple-tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
          </div>
          
          {todayTasks.length > 0 ? (
            <div className="space-y-2">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                  <div className="w-5 h-5 rounded border-2 border-slate-300 shrink-0 mt-0.5"></div>
                  <span className="text-slate-700 dark:text-zinc-300">{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic py-4">No pending tasks for today.</p>
          )}
        </Card>

        {/* Upcoming Bills */}
        <Card className="border-t-4 border-t-rose-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <CreditCard className="text-rose-500" size={18} />
              UPCOMING BILLS
            </h3>
            <Link to="/simple-money" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
          </div>
          
          {upcomingBills.length > 0 ? (
            <div className="space-y-3">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-zinc-300">{bill.name}</p>
                    <p className="text-xs text-rose-500 font-medium">Due on {bill.due_date}th</p>
                  </div>
                  <span className="font-bold text-slate-800">₹{parseFloat(bill.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic py-4">No upcoming bills this week.</p>
          )}
        </Card>
      </div>

    </div>
  );
}
