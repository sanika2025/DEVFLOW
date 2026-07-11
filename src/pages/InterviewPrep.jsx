import { useState } from 'react';
import { Search, Filter, Bookmark, CheckCircle, AlertCircle, PlayCircle, Bot } from 'lucide-react';
import { Card } from '../components/Card';

const CATEGORIES = ['All', 'React', 'Python', 'System Design', 'SQL', 'Docker', 'Node.js'];

export default function InterviewPrep() {
  const [activeCategory, setActiveCategory] = useState('React');

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Interview Prep</h2>
          <p className="text-slate-500 mt-1">Master your technical interviews with AI feedback.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <PlayCircle size={18} /> Start Mock Interview
        </button>
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat 
                ? 'bg-slate-800 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search questions..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <QuestionCard 
            title="Explain the difference between useEffect and useLayoutEffect"
            difficulty="Medium"
            category="React"
            status="review"
            bookmarked={true}
          />
          <QuestionCard 
            title="How does React Fiber architecture work?"
            difficulty="Hard"
            category="React"
            status="completed"
          />
          <QuestionCard 
            title="What is a Higher-Order Component (HOC)?"
            difficulty="Medium"
            category="React"
            status="new"
          />
        </div>

        {/* AI Feedback / Current Focus */}
        <div className="space-y-6">
          <Card className="border-indigo-100 bg-indigo-50/30">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="text-indigo-600" size={24} />
              <h3 className="font-semibold text-slate-800 text-lg">AI Feedback</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-indigo-700">Last Answer:</span> On "Virtual DOM", you explained the diffing process well, but missed mentioning the reconciliation algorithm (Heuristic O(n)).
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Score: 8/10</span>
                  <button className="text-indigo-600 text-xs font-medium hover:underline">Review Answer</button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">Revision Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Needs Review (Red)</span>
                <span className="font-semibold text-rose-600">4</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Solid (Green)</span>
                <span className="font-semibold text-emerald-600">28</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2 flex overflow-hidden">
                <div className="bg-emerald-500 w-[85%] h-full"></div>
                <div className="bg-rose-500 w-[15%] h-full"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ title, difficulty, category, status, bookmarked }) {
  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'Easy': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (stat) => {
    switch(stat) {
      case 'completed': return <CheckCircle size={20} className="text-emerald-500" />;
      case 'review': return <AlertCircle size={20} className="text-amber-500" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>;
    }
  };

  return (
    <Card className="flex items-start gap-4 group hover:border-indigo-200 transition-colors cursor-pointer" noPadding>
      <div className="p-5 flex-1">
        <div className="flex gap-2 items-center mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </span>
          <span className="text-xs font-medium text-slate-500">{category}</span>
        </div>
        <h4 className="font-semibold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">{title}</h4>
      </div>
      
      <div className="p-5 flex flex-col items-end justify-between gap-6 border-l border-slate-100 bg-slate-50/50">
        <button className={`text-slate-400 hover:text-indigo-500 transition-colors ${bookmarked ? 'text-indigo-500 fill-indigo-500' : ''}`}>
          <Bookmark size={20} />
        </button>
        {getStatusIcon(status)}
      </div>
    </Card>
  );
}
