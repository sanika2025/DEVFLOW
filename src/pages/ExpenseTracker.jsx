import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../components/Card';
import { StatsCard } from '../components/StatsCard';
import { DollarSign, TrendingDown, PiggyBank, CreditCard, Sparkles } from 'lucide-react';

const PIE_DATA = [
  { name: 'Food', value: 400 },
  { name: 'Travel', value: 300 },
  { name: 'Shopping', value: 300 },
  { name: 'Bills', value: 200 },
];
const COLORS = ['#6366f1', '#34d399', '#f43f5e', '#f59e0b'];

const BAR_DATA = [
  { name: 'Mon', amount: 120 },
  { name: 'Tue', amount: 80 },
  { name: 'Wed', amount: 45 },
  { name: 'Thu', amount: 300 },
  { name: 'Fri', amount: 65 },
  { name: 'Sat', amount: 200 },
  { name: 'Sun', amount: 150 },
];

export default function ExpenseTracker() {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Expense Tracker</h2>
          <p className="text-slate-500 mt-1">Manage your budget and track spending.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <DollarSign size={18} /> Add Expense
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Today's Expense" value="$45.00" icon={DollarSign} trend="Normal" />
        <StatsCard title="Monthly Expense" value="$1,200.00" icon={TrendingDown} trend="+12%" />
        <StatsCard title="Savings" value="$4,500.00" icon={PiggyBank} trend="+2%" trendUp />
        <StatsCard title="Budget Remaining" value="$800.00" icon={CreditCard} />
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
        <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
          <Sparkles className="text-indigo-600 w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">AI Insight</h4>
          <p className="text-sm text-slate-600 mt-1">
            "You spent 18% more on Food this month compared to last month. Consider cutting down on eating out to stay within your $2,000 monthly budget."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-6">Weekly Spending Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(val) => `$${val}`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-800 mb-6">Expenses by Category</h3>
          <div className="h-[220px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={PIE_DATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-slate-400 text-xs font-medium">Total</span>
              <span className="text-xl font-bold text-slate-800">$1.2k</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {PIE_DATA.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">${item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
