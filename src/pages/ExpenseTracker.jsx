import { useState } from 'react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../components/Card';
import { StatsCard } from '../components/StatsCard';
import { DollarSign, TrendingDown, PiggyBank, CreditCard, Sparkles, Loader2, Plus, Trash } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';
import { useAuthStore } from '../store/useAuthStore';
import { Modal } from '../components/Modal';
import Swal from 'sweetalert2';

const COLORS = ['#6366f1', '#34d399', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ExpenseTracker() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Food', description: '' });

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: () => expenseService.getMonthlyAnalytics(user?.id),
    enabled: !!user?.id
  });

  const addMutation = useMutation({
    mutationFn: (expenseData) => expenseService.addExpense(user?.id, expenseData),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', user?.id]);
      setIsAddExpenseOpen(false);
      setNewExpense({ amount: '', category: 'Food', description: '' });
      Swal.fire({ icon: 'success', title: 'Expense Added', timer: 1500, showConfirmButton: false });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', user?.id]);
    }
  });

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.amount) return;
    addMutation.mutate(newExpense);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  const chartData = analyticsData?.data?.chartData || [];
  const total = analyticsData?.data?.total || 0;
  const rawExpenses = analyticsData?.data?.raw || [];

  // Group by day for bar chart
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const barDataObj = {};
  rawExpenses.forEach(exp => {
    const d = new Date(exp.date).getDay();
    const dayName = days[d];
    barDataObj[dayName] = (barDataObj[dayName] || 0) + parseFloat(exp.amount);
  });
  const barData = days.map(d => ({ name: d, amount: barDataObj[d] || 0 }));

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Expense Tracker</h2>
          <p className="text-slate-500 mt-1">Manage your budget and track spending.</p>
        </div>
        <button 
          onClick={() => setIsAddExpenseOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <DollarSign size={18} /> Add Expense
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Expense" value={`$${total.toFixed(2)}`} icon={DollarSign} trend="Overall" />
        <StatsCard title="Monthly Budget" value="$2,000.00" icon={CreditCard} />
        <StatsCard title="Budget Remaining" value={`$${(2000 - total).toFixed(2)}`} icon={PiggyBank} trendUp={(2000 - total) > 0} />
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
        <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
          <Sparkles className="text-indigo-600 w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">AI Insight</h4>
          <p className="text-sm text-slate-600 mt-1">
            {total > 1500 ? "You are nearing your budget limit. Consider reviewing your top categories." : "You are doing great staying within your budget this month!"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-6">Spending Trend (By Day of Week)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(val) => `$${val}`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8">
            <h3 className="font-semibold text-slate-800 mb-4">Recent Expenses</h3>
            <div className="space-y-3">
              {rawExpenses.slice(0, 5).map(exp => (
                <div key={exp.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-800">{exp.description || exp.category}</p>
                    <p className="text-xs text-slate-500">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-800">${parseFloat(exp.amount).toFixed(2)}</span>
                    <button onClick={() => deleteMutation.mutate(exp.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {rawExpenses.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No expenses yet.</p>}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-800 mb-6">Expenses by Category</h3>
          <div className="h-[220px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              {chartData.length > 0 ? (
                <RechartsPie>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                </RechartsPie>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>
              )}
            </ResponsiveContainer>
            {chartData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-slate-400 text-xs font-medium">Total</span>
                <span className="text-xl font-bold text-slate-800">${total > 1000 ? (total/1000).toFixed(1)+'k' : total.toFixed(0)}</span>
              </div>
            )}
          </div>
          <div className="mt-6 space-y-3">
            {chartData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
            <input 
              type="number" 
              step="0.01" 
              required
              value={newExpense.amount}
              onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select 
              value={newExpense.category}
              onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {['Food', 'Travel', 'Education', 'Subscription', 'Shopping', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <input 
              type="text" 
              value={newExpense.description}
              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20" 
            />
          </div>
          <button type="submit" disabled={addMutation.isPending} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
            {addMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Save Expense
          </button>
        </form>
      </Modal>
    </div>
  );
}
