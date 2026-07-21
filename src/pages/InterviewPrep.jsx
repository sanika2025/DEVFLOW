import { useState } from 'react';
import { Search, Filter, Bookmark, CheckCircle, AlertCircle, PlayCircle, Bot, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewService } from '../services/interviewService';
import { useAuthStore } from '../store/useAuthStore';

const CATEGORIES = ['All', 'React', 'Python', 'System Design', 'SQL', 'Docker', 'Node.js'];

export default function InterviewPrep() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', activeCategory],
    queryFn: () => interviewService.getQuestions(activeCategory)
  });

  const { data: bookmarksData } = useQuery({
    queryKey: ['bookmarks', user?.id, 'interview_question'],
    queryFn: () => interviewService.getBookmarks(user?.id),
    enabled: !!user?.id
  });

  const bookmarkMutation = useMutation({
    mutationFn: (questionId) => interviewService.saveBookmark(user?.id, questionId),
    onSuccess: () => queryClient.invalidateQueries(['bookmarks'])
  });

  const unbookmarkMutation = useMutation({
    mutationFn: (questionId) => interviewService.removeBookmark(user?.id, questionId),
    onSuccess: () => queryClient.invalidateQueries(['bookmarks'])
  });

  const handleToggleBookmark = (qId, isBookmarked) => {
    if (isBookmarked) {
      unbookmarkMutation.mutate(qId);
    } else {
      bookmarkMutation.mutate(qId);
    }
  };

  const questions = questionsData?.data || [];
  const bookmarkedIds = (bookmarksData?.data || []).map(b => b.item_id);

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center p-12 text-slate-500 bg-white rounded-xl border border-slate-200">No questions found.</div>
          ) : (
            filteredQuestions.map(q => (
              <QuestionCard 
                key={q.id}
                title={q.question}
                difficulty={q.difficulty || 'Medium'}
                category={q.category || 'General'}
                status="new" // Could map from user progress if tracking
                bookmarked={bookmarkedIds.includes(q.id)}
                onBookmark={() => handleToggleBookmark(q.id, bookmarkedIds.includes(q.id))}
              />
            ))
          )}
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
                  <span className="font-semibold text-indigo-700">Tip:</span> Keep practicing. Your responses are getting better, but remember to always start with clarifying questions before jumping into a solution!
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">Revision Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Needs Review (Red)</span>
                <span className="font-semibold text-rose-600">0</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Solid (Green)</span>
                <span className="font-semibold text-emerald-600">0</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2 flex overflow-hidden">
                <div className="bg-emerald-500 w-[0%] h-full"></div>
                <div className="bg-rose-500 w-[0%] h-full"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ title, difficulty, category, status, bookmarked, onBookmark }) {
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
        <button 
          onClick={(e) => { e.stopPropagation(); onBookmark(); }}
          className={`text-slate-400 hover:text-indigo-500 transition-colors ${bookmarked ? 'text-indigo-500 fill-indigo-500' : ''}`}
        >
          <Bookmark size={20} />
        </button>
        {getStatusIcon(status)}
      </div>
    </Card>
  );
}
