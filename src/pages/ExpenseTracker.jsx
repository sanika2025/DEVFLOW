import { useState, useMemo } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../components/Card';
import { StatsCard } from '../components/StatsCard';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Sparkles, Loader2, Plus, Trash, Edit2, Search, Filter, Calendar, Settings2, Receipt, Coffee, Car, ShoppingBag, Lightbulb, Heart, BookOpen, CircleDollarSign, Target } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';
import { useAuthStore } from '../store/useAuthStore';
import { Modal } from '../components/Modal';
import Swal from 'sweetalert2';

const COLORS = ['#6366f1', '#34d399', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899', '#64748b'];

const CATEGORY_ICONS = {
  Food: Coffee,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Lightbulb,
  Entertainment: Sparkles,
  Health: Heart,
  Education: BookOpen,
  Other: CircleDollarSign
};

export default function ExpenseTracker() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [currentMonthStr, setCurrentMonthStr] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ id: null, amount: '', category: 'Food', description: '', payment_method: 'Cash', date: new Date().toISOString().split('T')[0] });

  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ total_budget: '', category_budgets: {} });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [trendView, setTrendView] = useState('Daily'); // Daily, Weekly

  // Fetch Data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['expenses_analytics', user?.id, currentMonthStr],
    queryFn: () => expenseService.getMonthlyAnalytics(user?.id, currentMonthStr),
    enabled: !!user?.id
  });

  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', user?.id, currentMonthStr],
    queryFn: () => expenseService.getBudget(user?.id, currentMonthStr),
    enabled: !!user?.id
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (data) => expenseService.addExpense(user?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses_analytics', user?.id, currentMonthStr] });
      setIsAddExpenseOpen(false);
      resetExpenseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => expenseService.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses_analytics', user?.id, currentMonthStr] });
      setIsAddExpenseOpen(false);
      resetExpenseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses_analytics', user?.id, currentMonthStr] });
    }
  });

  const budgetMutation = useMutation({
    mutationFn: (data) => expenseService.upsertBudget(user?.id, currentMonthStr, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', user?.id, currentMonthStr] });
      setIsBudgetOpen(false);
    }
  });

  const resetExpenseForm = () => setExpenseForm({ id: null, amount: '', category: 'Food', description: '', payment_method: 'Cash', date: new Date().toISOString().split('T')[0] });

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.amount) return;
    if (expenseForm.id) {
      updateMutation.mutate({ id: expenseForm.id, data: expenseForm });
    } else {
      addMutation.mutate(expenseForm);
    }
  };

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (!budgetForm.total_budget) return;
    budgetMutation.mutate(budgetForm);
  };

  const openEditExpense = (exp) => {
    setExpenseForm({
      id: exp.id,
      amount: exp.amount,
      category: exp.category,
      description: exp.description || '',
      payment_method: exp.payment_method || 'Cash',
      date: exp.date.split('T')[0]
    });
    setIsAddExpenseOpen(true);
  };

  const openBudgetModal = () => {
    setBudgetForm({
      total_budget: budget?.total_budget || '',
      category_budgets: budget?.category_budgets || {}
    });
    setIsBudgetOpen(true);
  };

  if (analyticsLoading || budgetLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  const { totalSpent = 0, prevTotalSpent = 0, categoryBreakdown = [], dailyTotals = {}, rawCurrentMonth = [] } = analyticsData?.data || {};
  const budget = budgetData?.data || { total_budget: 0, category_budgets: {} };
  
  const totalBudget = parseFloat(budget.total_budget);
  const isBudgetSet = totalBudget > 0;
  const remaining = isBudgetSet ? totalBudget - totalSpent : null;
  const progressPercent = isBudgetSet ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  
  const [year, month] = currentMonthStr.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = month === new Date().getMonth() + 1 && year === new Date().getFullYear() ? new Date().getDate() : daysInMonth;
  const dailyAverage = totalSpent / (currentDay || 1);

  // Month diff
  const spendDiff = prevTotalSpent > 0 ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 : 0;

  // Chart Data Preparation
  const chartData = [];
  if (trendView === 'Daily') {
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      chartData.push({ name: i.toString(), amount: dailyTotals[dStr] || 0 });
    }
  } else {
    // Weekly grouping
    let weekSum = 0;
    let weekCount = 1;
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      weekSum += dailyTotals[dStr] || 0;
      if (i % 7 === 0 || i === daysInMonth) {
        chartData.push({ name: `Week ${weekCount}`, amount: weekSum });
        weekSum = 0;
        weekCount++;
      }
    }
  }

  // Filtered Transactions
  const filteredExpenses = rawCurrentMonth
    .filter(exp => (categoryFilter === 'All' || exp.category === categoryFilter))
    .filter(exp => (exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) || exp.category.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // AI Insight Generation
  let aiInsight = "Track your expenses to receive personalized insights.";
  if (totalSpent > 0) {
    if (isBudgetSet) {
      if (remaining < 0) aiInsight = `You have exceeded your budget by ₹${Math.abs(remaining).toLocaleString()}. Review your recent expenses to see where you overspent.`;
      else if (progressPercent > 85) aiInsight = `You've used ${progressPercent.toFixed(1)}% of your budget. Slow down spending to stay under limit.`;
      else aiInsight = `At your current pace of ₹${dailyAverage.toFixed(0)}/day, you are on track to stay under budget.`;
    } else {
      if (spendDiff > 10) aiInsight = `Your spending is ${spendDiff.toFixed(1)}% higher than last month. Consider setting a budget to keep things in check.`;
      else if (spendDiff < -10) aiInsight = `Great job! Your spending is ${Math.abs(spendDiff).toFixed(1)}% lower than last month.`;
      else aiInsight = "Your spending is consistent with last month.";
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50">Expense Tracker</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage your budget and track spending.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input 
            type="month" 
            value={currentMonthStr} 
            onChange={(e) => setCurrentMonthStr(e.target.value)}
            className="border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
          />
          <button 
            onClick={openBudgetModal}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
          >
            <Settings2 size={16} /> Set Budget
          </button>
          <button 
            onClick={() => { resetExpenseForm(); setIsAddExpenseOpen(true); }}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </header>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Spent" 
          value={`₹${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={Receipt} 
          trend={`${spendDiff > 0 ? '+' : ''}${spendDiff.toFixed(1)}% vs last month`}
          trendUp={spendDiff <= 0} // Less spending is "up" (positive)
        />
        <StatsCard 
          title="Monthly Budget" 
          value={isBudgetSet ? `₹${totalBudget.toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'Not set'} 
          icon={Target} 
          trend={isBudgetSet ? "Budget set" : "Set a limit"}
          trendUp={isBudgetSet}
        />
        <StatsCard 
          title="Remaining" 
          value={isBudgetSet ? `₹${remaining.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'} 
          icon={PiggyBank} 
          trend={isBudgetSet ? `${(100 - progressPercent).toFixed(1)}% remaining` : "N/A"}
          trendUp={remaining >= 0}
          iconColor={isBudgetSet ? (remaining >= 0 ? "text-emerald-500" : "text-red-500") : "text-slate-400"}
          iconBg={isBudgetSet ? (remaining >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10") : "bg-slate-50"}
        />
        <StatsCard 
          title="Daily Average" 
          value={`₹${dailyAverage.toLocaleString(undefined, {maximumFractionDigits: 0})}/day`} 
          icon={TrendingUp} 
          trend="Based on current month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Progress & AI Insight & Categories) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Budget Progress */}
          <Card className="flex flex-col relative overflow-hidden group border border-slate-200 dark:border-zinc-800">
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2">
              <Target size={18} className="text-indigo-500" /> Monthly Budget
            </h3>
            {isBudgetSet ? (
               <div>
                 <div className="flex justify-between items-end mb-2">
                   <div>
                     <span className="text-2xl font-bold text-slate-800 dark:text-zinc-50">₹{totalSpent.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                     <span className="text-sm text-slate-500"> / ₹{totalBudget.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                   </div>
                   <div className="text-right">
                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${progressPercent > 100 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : progressPercent > 85 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                       {progressPercent > 100 ? 'Over budget' : progressPercent > 85 ? 'Approaching' : 'On track'}
                     </span>
                   </div>
                 </div>
                 <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-3 mb-2">
                   <div 
                     className={`h-3 rounded-full transition-all duration-1000 ${progressPercent > 100 ? 'bg-red-500' : progressPercent > 85 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                     style={{ width: `${Math.min(progressPercent, 100)}%` }}
                   ></div>
                 </div>
                 <p className="text-sm text-slate-500 dark:text-zinc-400">
                   {remaining >= 0 ? `₹${remaining.toLocaleString(undefined, {maximumFractionDigits: 0})} remaining` : `₹${Math.abs(remaining).toLocaleString(undefined, {maximumFractionDigits: 0})} over budget`}
                 </p>
               </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
                <p className="text-sm text-slate-500 mb-3">No budget set for this month.</p>
                <button onClick={openBudgetModal} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Set Budget</button>
              </div>
            )}
          </Card>

          {/* AI Insight */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-none shadow-sm relative overflow-hidden">
             <div className="flex gap-4 items-start relative z-10">
               <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm shrink-0 mt-1">
                 <Sparkles className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
               </div>
               <div>
                 <h4 className="font-bold text-slate-800 dark:text-zinc-50 mb-1">AI Insight</h4>
                 <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                   {aiInsight}
                 </p>
               </div>
             </div>
             {/* Decorative element */}
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl"></div>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 mb-6 flex items-center gap-2">
              <PieChart size={18} className="text-indigo-500" /> Expenses by Category
            </h3>
            
            {categoryBreakdown.length > 0 ? (
              <>
                <div className="h-[200px] w-full relative mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={categoryBreakdown} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => `₹${value}`}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-zinc-50">
                      ₹{totalSpent > 1000 ? (totalSpent/1000).toFixed(1)+'k' : totalSpent.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {categoryBreakdown.map((item, i) => {
                    const Icon = CATEGORY_ICONS[item.name] || CATEGORY_ICONS.Other;
                    const percent = ((item.value / totalSpent) * 100).toFixed(0);
                    return (
                      <div key={item.name} className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: `${COLORS[i % COLORS.length]}15`, color: COLORS[i % COLORS.length]}}>
                            <Icon size={14} />
                          </div>
                          <span className="font-medium text-slate-700 dark:text-zinc-300">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="font-semibold text-slate-800 dark:text-zinc-50">₹{item.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          <span className="text-xs text-slate-400 w-8">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-zinc-500 text-sm border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-xl">
                <Receipt className="mb-2 opacity-50" size={24} />
                No expenses this month
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (Trend Chart & Transactions) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spending Trend Chart */}
          <Card className="flex flex-col min-h-[380px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-500" /> Spending Trend
              </h3>
              <div className="bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg flex">
                <button onClick={() => setTrendView('Daily')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${trendView === 'Daily' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Daily</button>
                <button onClick={() => setTrendView('Weekly')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${trendView === 'Weekly' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Weekly</button>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
              {totalSpent > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} tickFormatter={(val) => `₹${val}`} />
                    <RechartsTooltip 
                      formatter={(value) => [`₹${value}`, 'Spent']}
                      contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2}} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm">
                  <TrendingUp className="mb-2 opacity-30" size={32} />
                  Add expenses to see your trend
                </div>
              )}
            </div>
          </Card>

          {/* Transactions List */}
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
                <Receipt size={18} className="text-indigo-500" /> Recent Expenses
              </h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="py-1.5 pl-3 pr-8 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {Object.keys(CATEGORY_ICONS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => {
                  const Icon = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS.Other;
                  return (
                    <div key={exp.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-sm transition-all gap-4 sm:gap-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-zinc-50">{exp.description || exp.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{exp.category}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12}/> {new Date(exp.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                            <span className="text-xs text-slate-400 hidden sm:inline">• {exp.payment_method}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                        <span className="font-bold text-slate-800 dark:text-zinc-50 ml-14 sm:ml-0">₹{parseFloat(exp.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditExpense(exp)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"><Edit2 size={16}/></button>
                          <button onClick={() => deleteMutation.mutate(exp.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash size={16}/></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                  {rawCurrentMonth.length === 0 ? (
                    <>
                      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Receipt size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-50 mb-2">Start tracking your spending</h3>
                      <p className="text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-6 text-sm">Add your first expense to see spending trends, category breakdowns, and personalized insights.</p>
                      <button onClick={() => { resetExpenseForm(); setIsAddExpenseOpen(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                        + Add Expense
                      </button>
                    </>
                  ) : (
                    <p className="text-slate-500">No expenses match your search or filters.</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title={expenseForm.id ? "Edit Expense" : "Add Expense"} className="max-w-xl">
        <form onSubmit={handleExpenseSubmit} className="space-y-5">
          <div className="text-center mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amount (₹)</label>
            <input 
              type="number" 
              step="0.01" 
              required
              autoFocus
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
              className="w-full text-4xl sm:text-5xl font-extrabold text-center bg-transparent outline-none focus:ring-0 text-slate-800 dark:text-zinc-50 border-b-2 border-slate-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors pb-2" 
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Expense Name / Notes</label>
              <input 
                type="text" 
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900" 
                placeholder="e.g. Lunch at Cafe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Category</label>
              <select 
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900"
              >
                {Object.keys(CATEGORY_ICONS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Date</label>
              <input 
                type="date" 
                required
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Payment Method</label>
              <select 
                value={expenseForm.payment_method}
                onChange={(e) => setExpenseForm({...expenseForm, payment_method: e.target.value})}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900"
              >
                {['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button type="button" onClick={() => setIsAddExpenseOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
            <button type="submit" disabled={addMutation.isPending || updateMutation.isPending} className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
              {(addMutation.isPending || updateMutation.isPending) && <Loader2 size={16} className="animate-spin" />}
              {expenseForm.id ? "Update Expense" : "Save Expense"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Set Budget Modal */}
      <Modal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} title={`Set Budget (${new Date(`${currentMonthStr}-01`).toLocaleDateString(undefined, {month: 'long', year: 'numeric'})})`} className="max-w-md">
        <form onSubmit={handleBudgetSubmit} className="space-y-5">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
             <label className="block text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">Total Monthly Budget (₹)</label>
             <input 
                type="number" 
                required
                value={budgetForm.total_budget}
                onChange={(e) => setBudgetForm({...budgetForm, total_budget: e.target.value})}
                className="w-full text-2xl font-bold bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50" 
                placeholder="0"
              />
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400 mt-2">Setting a budget enables personalized AI insights and progress tracking.</p>
          </div>
          
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-50 mb-3 flex justify-between items-center">
              Category Limits (Optional)
              <span className="text-xs font-normal text-slate-500">Total must match budget</span>
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
               {Object.keys(CATEGORY_ICONS).map(cat => (
                 <div key={cat} className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 shrink-0">
                     {(() => { const Icon = CATEGORY_ICONS[cat]; return <Icon size={14} />; })()}
                   </div>
                   <div className="flex-1">
                     <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{cat}</span>
                   </div>
                   <div className="w-1/3">
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                       <input 
                         type="number" 
                         value={budgetForm.category_budgets[cat] || ''}
                         onChange={(e) => setBudgetForm({
                           ...budgetForm, 
                           category_budgets: { ...budgetForm.category_budgets, [cat]: parseFloat(e.target.value) || 0 }
                         })}
                         className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg pl-7 pr-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm" 
                         placeholder="0"
                       />
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
            <button type="button" onClick={() => setIsBudgetOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
            <button type="submit" disabled={budgetMutation.isPending} className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
              {budgetMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Save Budget
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
