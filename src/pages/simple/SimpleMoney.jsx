import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simpleLifeService } from '../../services/simpleLifeService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { 
  Plus, Loader2, Trash, Coffee, MapPin, ShoppingBag, 
  Zap, Film, Heart, HelpCircle, ArrowRight, Home, CreditCard,
  TrendingDown, TrendingUp, Edit2, MinusCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

// Helper to get category icons
const getCategoryIcon = (category) => {
  switch(category?.toLowerCase()) {
    case 'food': return <Coffee size={18} />;
    case 'travel': return <MapPin size={18} />;
    case 'shopping': return <ShoppingBag size={18} />;
    case 'bills': return <Zap size={18} />;
    case 'rent': case 'housing': return <Home size={18} />;
    case 'entertainment': return <Film size={18} />;
    case 'family': return <Heart size={18} />;
    default: return <HelpCircle size={18} />;
  }
};

export default function SimpleMoney() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Food', description: '' });
  const [newIncome, setNewIncome] = useState({ amount: '', source: 'Salary' });
  const [editingIncome, setEditingIncome] = useState({ id: null, amount: '', source: '' });

  // Fetch all data
  const { data: expenses, isLoading: expLoad } = useQuery({ queryKey: ['simple-expenses', user?.id], queryFn: () => simpleLifeService.getExpenses(user?.id), enabled: !!user?.id });
  const { data: incomes, isLoading: incLoad } = useQuery({ queryKey: ['simple-income', user?.id], queryFn: () => simpleLifeService.getIncome(user?.id), enabled: !!user?.id });
  const { data: bills, isLoading: bilLoad } = useQuery({ queryKey: ['simple-bills', user?.id], queryFn: () => simpleLifeService.getBills(user?.id), enabled: !!user?.id });
  const { data: visits, isLoading: visLoad } = useQuery({ queryKey: ['simple-visits', user?.id], queryFn: () => simpleLifeService.getHomeVisits(user?.id), enabled: !!user?.id });

  // Mutations
  const addExpMut = useMutation({ mutationFn: (d) => simpleLifeService.addExpense(user?.id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['simple-expenses'] }); setIsAddOpen(false); setNewExpense({ amount: '', category: 'Food', description: '' }); Swal.fire({ icon: 'success', title: 'Added', timer: 1000, showConfirmButton: false }); }});
  const addIncMut = useMutation({ mutationFn: (d) => simpleLifeService.addIncome(user?.id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['simple-income'] }); setIsAddIncomeOpen(false); setNewIncome({ amount: '', source: 'Salary' }); Swal.fire({ icon: 'success', title: 'Income Added', timer: 1000, showConfirmButton: false }); }});
  const editIncMut = useMutation({ mutationFn: (d) => simpleLifeService.updateIncome(editingIncome.id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['simple-income'] }); setIsEditIncomeOpen(false); Swal.fire({ icon: 'success', title: 'Income Updated', timer: 1000, showConfirmButton: false }); }});
  const delExpMut = useMutation({ mutationFn: (id) => simpleLifeService.deleteExpense(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-expenses'] }) });
  const delIncMut = useMutation({ mutationFn: (id) => simpleLifeService.deleteIncome(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-income'] }) });

  const isLoading = expLoad || incLoad || bilLoad || visLoad;

  // Calculations
  const calculatedData = useMemo(() => {
    if (!expenses || !incomes || !bills || !visits) return null;

    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();
    const currDay = now.getDate();
    const daysInMonth = new Date(currYear, currMonth + 1, 0).getDate();
    const remainingDays = Math.max(1, daysInMonth - currDay + 1);

    // This Month Filter
    const isThisMonth = (dateStr) => {
      const d = new Date(dateStr);
      return d.getMonth() === currMonth && d.getFullYear() === currYear;
    };

    const thisMonthExp = expenses.filter(e => isThisMonth(e.date));
    const thisMonthInc = incomes.filter(i => isThisMonth(i.date));
    
    // Aggregates
    const totalSpent = thisMonthExp.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalIncome = thisMonthInc.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const remaining = totalIncome - totalSpent;

    // Upcoming Bills (this month)
    const upcomingBills = bills.filter(b => b.is_active && b.due_date >= currDay).sort((a,b) => a.due_date - b.due_date);
    const billsTotal = upcomingBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);

    // Upcoming Home Visits (this month)
    const upcomingVisitsThisMonth = visits.filter(v => {
      const d = new Date(v.departure);
      return d > now && isThisMonth(v.departure);
    });
    const visitBudgetTotal = upcomingVisitsThisMonth.reduce((sum, v) => sum + (v.travel_cost ? parseFloat(v.travel_cost) : 0), 0);
    
    // Next general visit (any time)
    const nextVisit = visits.filter(v => new Date(v.departure) > now).sort((a,b) => new Date(a.departure) - new Date(b.departure))[0] || null;

    // Safe to Spend
    const safeToSpend = totalIncome - totalSpent - billsTotal - visitBudgetTotal;
    const safeDaily = safeToSpend > 0 ? safeToSpend / remainingDays : 0;

    // Category Breakdowns
    const categories = thisMonthExp.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
      return acc;
    }, {});
    const sortedCategories = Object.entries(categories).sort((a,b) => b[1] - a[1]);

    // Recent Transactions (merge and sort)
    const recentExp = expenses.map(e => ({ ...e, type: 'expense' }));
    const recentInc = incomes.map(i => ({ ...i, type: 'income', category: 'Income' }));
    const mergedTransactions = [...recentExp, ...recentInc]
      .sort((a,b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);

    return {
      totalSpent, totalIncome, remaining, safeToSpend, safeDaily, 
      upcomingBills, billsTotal, nextVisit, sortedCategories, mergedTransactions,
      currMonthName: now.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  }, [expenses, incomes, bills, visits]);

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  const d = calculatedData;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-zinc-50">Money</h2>
          <p className="text-slate-500 font-medium">{d.currMonthName}</p>
        </div>
      </header>

      {/* Hero: Safe to Spend */}
      <Card className="border-none shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-10 -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 p-2 md:p-4">
          <p className="text-slate-500 text-sm font-semibold tracking-widest uppercase mb-2">SAFE TO SPEND</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h3 className={`text-5xl md:text-6xl font-black tracking-tight ${d.safeToSpend < 0 ? 'text-red-500' : 'text-slate-900 dark:text-zinc-50'}`}>
                ₹{d.safeToSpend.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </h3>
              {d.safeToSpend > 0 && (
                <p className="text-slate-600 dark:text-zinc-400 font-medium mt-2 text-lg">
                  ≈ ₹{d.safeDaily.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-slate-400 text-sm">/ day</span>
                </p>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-500 mb-1">Income</p>
                <p className="font-bold text-slate-800 dark:text-zinc-300">₹{d.totalIncome.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-500 mb-1">Spent</p>
                <p className="font-bold text-slate-800 dark:text-zinc-300">₹{d.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={() => setIsAddOpen(true)} className="flex-1 bg-white dark:bg-zinc-900/90 backdrop-blur-sm text-slate-900 dark:text-zinc-50 py-4 rounded-2xl font-bold text-sm md:text-base flex justify-center items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors shadow-sm border border-slate-200 dark:border-zinc-800 active:scale-[0.98]">
          <MinusCircle size={20} className="text-rose-500" /> Expense
        </button>
        <button onClick={() => setIsAddIncomeOpen(true)} className="flex-1 bg-white dark:bg-zinc-900/90 backdrop-blur-sm text-slate-900 dark:text-zinc-50 py-4 rounded-2xl font-bold text-sm md:text-base flex justify-center items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors shadow-sm border border-slate-200 dark:border-zinc-800 active:scale-[0.98]">
          <Plus size={20} className="text-emerald-500" /> ADD INCOME
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 md:p-5 text-center bg-emerald-50/50 dark:bg-zinc-900/90 backdrop-blur-sm border border-emerald-100 dark:border-zinc-800">
          <p className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">Income</p>
          <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-zinc-300">₹{d.totalIncome.toLocaleString()}</p>
        </Card>
        <Card className="p-4 md:p-5 text-center bg-rose-50/50 dark:bg-zinc-900/90 backdrop-blur-sm border border-rose-100 dark:border-zinc-800">
          <p className="text-xs md:text-sm text-rose-600 dark:text-rose-400 font-bold uppercase mb-1">Spent</p>
          <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-zinc-300">₹{d.totalSpent.toLocaleString()}</p>
        </Card>
        <Card className="p-4 md:p-5 text-center bg-indigo-50/50 dark:bg-zinc-900/90 backdrop-blur-sm border border-indigo-100 dark:border-zinc-800">
          <p className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">Remaining</p>
          <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-zinc-300">₹{d.remaining.toLocaleString()}</p>
        </Card>
      </div>
      
      {/* Spend Progress Bar */}
      {d.totalIncome > 0 && (
        <div className="px-2">
          <div className="w-full bg-slate-200 dark:bg-zinc-800/60 rounded-full h-2.5 mb-2 overflow-hidden">
            <div className={`h-2.5 rounded-full ${d.totalSpent / d.totalIncome > 0.9 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, (d.totalSpent / d.totalIncome) * 100)}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 font-medium text-right">{Math.round((d.totalSpent / d.totalIncome) * 100)}% of income spent</p>
        </div>
      )}

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category Breakdown */}
        <Card className="h-full">
          <h3 className="font-bold text-slate-700 dark:text-zinc-300 tracking-wider text-sm mb-6 flex items-center gap-2">
            SPENDING BY CATEGORY
          </h3>
          {d.sortedCategories.length > 0 ? (
            <div className="space-y-5">
              {d.sortedCategories.map(([cat, amount]) => {
                const percent = Math.min(100, (amount / Math.max(1, d.totalSpent)) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{cat}</span>
                      <span className="font-bold text-slate-900 dark:text-zinc-50">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800/60 rounded-full h-2">
                      <div className="bg-slate-400 dark:bg-slate-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
              <p className="text-slate-500 font-medium mb-2">No expenses yet</p>
              <button onClick={() => setIsAddOpen(true)} className="text-indigo-600 font-bold text-sm">Start tracking &rarr;</button>
            </div>
          )}
        </Card>

        {/* Upcoming Payments */}
        <Card className="h-full bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm/50">
          <h3 className="font-bold text-slate-700 dark:text-zinc-300 tracking-wider text-sm mb-6 flex items-center gap-2">
            <CreditCard size={18} className="text-indigo-500" /> UPCOMING PAYMENTS
          </h3>
          {d.upcomingBills.length > 0 ? (
            <>
              <div className="space-y-3 mb-6">
                {d.upcomingBills.map(bill => {
                  const daysLeft = bill.due_date - new Date().getDate();
                  return (
                    <div key={bill.id} className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-zinc-300">{bill.name}</p>
                        <p className={`text-xs font-semibold ${daysLeft <= 3 ? 'text-red-500' : 'text-indigo-500'}`}>
                          {daysLeft === 0 ? 'Due today' : `In ${daysLeft} days`}
                        </p>
                      </div>
                      <span className="font-black text-slate-800 dark:text-zinc-50">₹{parseFloat(bill.amount).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-zinc-800">
                <span className="text-sm font-semibold text-slate-500">Upcoming this month</span>
                <span className="font-bold text-slate-800 dark:text-zinc-50">₹{d.billsTotal.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500 font-medium mb-2">No upcoming payments</p>
              <p className="text-xs text-slate-400 mb-4">Add recurring bills to stay on top of them.</p>
            </div>
          )}
        </Card>

      </div>

      {/* Home Visit Card */}
      <Card 
        className="bg-amber-50 dark:bg-zinc-900/90 backdrop-blur-sm border border-amber-200 dark:border-zinc-800 overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow group"
        onClick={() => navigate('/simple-home-visits')}
      >
        <div className="absolute right-0 top-0 text-amber-500/10 -mt-8 -mr-8 group-hover:scale-110 transition-transform duration-500">
          <Home size={150} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-500 tracking-wider text-sm mb-2 flex items-center gap-2">
              <Home size={18} /> NEXT HOME VISIT
            </h3>
            {d.nextVisit ? (
              <>
                <h4 className="text-2xl md:text-3xl font-black text-amber-950 dark:text-amber-100 mb-1">
                  Home in {Math.ceil((new Date(d.nextVisit.departure) - new Date()) / (1000 * 60 * 60 * 24))} days
                </h4>
                <p className="text-amber-700 dark:text-amber-600 font-medium">
                  {new Date(d.nextVisit.departure).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} 
                  {d.nextVisit.return && ` → ${new Date(d.nextVisit.return).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`}
                </p>
              </>
            ) : (
              <>
                <h4 className="text-2xl font-black text-amber-950 dark:text-amber-100 mb-1">No upcoming visit</h4>
                <p className="text-amber-700 dark:text-amber-600 font-medium">Plan your next trip home</p>
              </>
            )}
          </div>
          {d.nextVisit ? (
            <div className="bg-white/60 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200/50 backdrop-blur-sm min-w-[200px]">
              <p className="text-xs text-amber-800 dark:text-amber-500 font-bold uppercase mb-1">Travel Budget</p>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-50">
                {d.nextVisit.estimated_cost ? `₹${parseFloat(d.nextVisit.estimated_cost).toLocaleString()}` : 'Not set'}
              </p>
            </div>
          ) : (
             <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm">
               Plan Visit
             </button>
          )}
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <h3 className="font-bold text-slate-700 dark:text-zinc-300 tracking-wider text-sm mb-6">RECENT TRANSACTIONS</h3>
        {d.mergedTransactions.length > 0 ? (
          <div className="space-y-1">
            {d.mergedTransactions.map((tx) => (
              <div key={`${tx.type}-${tx.id}`} className="group flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400'}`}>
                    {tx.type === 'income' ? <TrendingUp size={20} /> : getCategoryIcon(tx.category)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-zinc-300">{tx.description || tx.source || tx.category}</p>
                    <p className="text-xs text-slate-500">{tx.category} • {new Date(tx.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-black ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-zinc-50'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                  </span>
                  {tx.type === 'income' && (
                    <button 
                      onClick={() => {
                        setEditingIncome({ id: tx.id, amount: tx.amount, source: tx.source });
                        setIsEditIncomeOpen(true);
                      }} 
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-500 transition-all p-1 ml-2"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button onClick={() => tx.type === 'income' ? delIncMut.mutate(tx.id) : delExpMut.mutate(tx.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button className="w-full text-center py-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 mt-2">
              View all transactions &rarr;
            </button>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500 font-medium">No recent transactions</p>
          </div>
        )}
      </Card>

      {/* Modals */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Fast Add Expense">
        <form onSubmit={(e) => { e.preventDefault(); addExpMut.mutate(newExpense); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input type="number" autoFocus required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full text-2xl font-bold py-3 border-b-2 border-slate-200 focus:border-emerald-500 outline-none bg-transparent min-h-[44px]" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <input type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-emerald-500 min-h-[44px]" placeholder="e.g. Lunch at Cafe" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Other'].map(cat => (
                <button type="button" key={cat} onClick={() => setNewExpense({...newExpense, category: cat})} className={`p-2 rounded-lg text-sm font-medium border transition-colors ${newExpense.category === cat ? 'bg-indigo-100 border-indigo-500 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-zinc-800/60 dark:border-zinc-800 dark:text-zinc-400'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={addExpMut.isPending} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50">Save Expense</button>
        </form>
      </Modal>

      <Modal isOpen={isAddIncomeOpen} onClose={() => setIsAddIncomeOpen(false)} title="Add Income">
        <form onSubmit={(e) => { e.preventDefault(); addIncMut.mutate(newIncome); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input type="number" autoFocus required value={newIncome.amount} onChange={e => setNewIncome({...newIncome, amount: e.target.value})} className="w-full text-2xl font-bold py-3 border-b-2 border-slate-200 focus:border-emerald-500 outline-none bg-transparent min-h-[44px]" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <input type="text" required value={newIncome.source} onChange={e => setNewIncome({...newIncome, source: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-emerald-500 min-h-[44px]" placeholder="e.g. Salary, Bonus" />
          </div>
          <button type="submit" disabled={addIncMut.isPending} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50">Save Income</button>
        </form>
      </Modal>

      <Modal isOpen={isEditIncomeOpen} onClose={() => setIsEditIncomeOpen(false)} title="Edit Income">
        <form onSubmit={(e) => { e.preventDefault(); editIncMut.mutate({ amount: editingIncome.amount, source: editingIncome.source }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input type="number" autoFocus required value={editingIncome.amount} onChange={e => setEditingIncome({...editingIncome, amount: e.target.value})} className="w-full text-2xl font-bold py-3 border-b-2 border-slate-200 focus:border-indigo-500 outline-none bg-transparent" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <input type="text" required value={editingIncome.source} onChange={e => setEditingIncome({...editingIncome, source: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-indigo-500" placeholder="e.g. Salary, Bonus" />
          </div>
          <button type="submit" disabled={editIncMut.isPending} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
}
