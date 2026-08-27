import { useState, useMemo } from 'react';
import { Search, Bookmark, CheckCircle, AlertCircle, PlayCircle, Bot, Loader2, Target, Award, BrainCircuit, Activity, Clock, ChevronRight, Check, X, ShieldAlert } from 'lucide-react';
import { Card } from '../components/Card';
import { StatsCard } from '../components/StatsCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewService } from '../services/interviewService';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Modal } from '../components/Modal';

const TOPICS = [
  { name: 'Python', readiness: 78, color: 'bg-blue-500' },
  { name: 'SQL', readiness: 64, color: 'bg-sky-500' },
  { name: 'React', readiness: 52, color: 'bg-cyan-500' },
  { name: 'System Design', readiness: 45, color: 'bg-indigo-500' },
  { name: 'Docker', readiness: 70, color: 'bg-blue-400' },
  { name: 'Node.js', readiness: 58, color: 'bg-emerald-500' }
];

const FILTERS = ['All', 'React', 'Python', 'System Design', 'SQL', 'Docker', 'Node.js', 'Bookmarked', 'Needs Review'];

export default function InterviewPrep() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Practice Modal State
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isGrading, setIsGrading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Mock Interview State
  const [isMockSetupOpen, setIsMockSetupOpen] = useState(false);
  const [mockConfig, setMockConfig] = useState({ role: 'Frontend Engineer', topics: [], duration: 30, questions: 5, difficulty: 'Medium' });
  const [isMockActive, setIsMockActive] = useState(false);
  const [mockQuestions, setMockQuestions] = useState([]);
  const [mockCurrentIndex, setMockCurrentIndex] = useState(0);
  const [mockAnswers, setMockAnswers] = useState([]);
  const [mockResults, setMockResults] = useState(null);

  // Fetch Data
  const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => interviewService.getQuestions()
  });

  const { data: bookmarksData } = useQuery({
    queryKey: ['bookmarks', user?.id, 'interview_question'],
    queryFn: () => interviewService.getBookmarks(user?.id),
    enabled: !!user?.id
  });

  const { data: progressData } = useQuery({
    queryKey: ['interview_progress', user?.id],
    queryFn: () => interviewService.getProgress(user?.id),
    enabled: !!user?.id
  });

  const { data: statsData } = useQuery({
    queryKey: ['interview_stats', user?.id],
    queryFn: () => interviewService.getStats(user?.id),
    enabled: !!user?.id
  });

  const { data: mockInterviewsData } = useQuery({
    queryKey: ['mock_interviews', user?.id],
    queryFn: () => interviewService.getMockInterviews(user?.id),
    enabled: !!user?.id
  });

  // Mutations
  const bookmarkMutation = useMutation({
    mutationFn: (qId) => interviewService.saveBookmark(user?.id, qId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
  });
  const unbookmarkMutation = useMutation({
    mutationFn: (qId) => interviewService.removeBookmark(user?.id, qId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
  });
  const progressMutation = useMutation({
    mutationFn: ({ qId, status, score }) => interviewService.updateProgress(user?.id, qId, status, score),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interview_progress'] })
  });
  const saveMockMutation = useMutation({
    mutationFn: (data) => interviewService.saveMockInterview(user?.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mock_interviews'] })
  });
  const statsMutation = useMutation({
    mutationFn: (updates) => interviewService.updateStats(user?.id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interview_stats'] })
  });

  const handleToggleBookmark = (qId, isBookmarked) => {
    isBookmarked ? unbookmarkMutation.mutate(qId) : bookmarkMutation.mutate(qId);
  };

  const questions = questionsData?.data || [];
  const bookmarkedIds = (bookmarksData?.data || []).map(b => b.item_id);
  const progressMap = (progressData?.data || []).reduce((acc, p) => ({ ...acc, [p.question_id]: p }), {});
  const stats = statsData?.data || { current_streak: 0, overall_readiness: 0 };
  const mocksCount = (mockInterviewsData?.data || []).length;

  const filteredQuestions = useMemo(() => {
    let q = questions;
    if (searchQuery) {
      q = q.filter(x => x.question.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeFilter !== 'All') {
      if (activeFilter === 'Bookmarked') q = q.filter(x => bookmarkedIds.includes(x.id));
      else if (activeFilter === 'Needs Review') q = q.filter(x => progressMap[x.id]?.status === 'Needs Review');
      else q = q.filter(x => x.category === activeFilter);
    }
    return q;
  }, [questions, searchQuery, activeFilter, bookmarkedIds, progressMap]);

  // Derived metrics
  const needsReviewCount = Object.values(progressMap).filter(p => p.status === 'Needs Review').length;
  const practicingCount = Object.values(progressMap).filter(p => p.status === 'Practicing').length;
  const strongCount = Object.values(progressMap).filter(p => p.status === 'Strong').length;

  // Single Question Practice Logic
  const openPractice = (q) => {
    setSelectedQuestion(q);
    setUserAnswer('');
    setFeedback(null);
    setShowHint(false);
    setShowExplanation(false);
    setIsPracticeOpen(true);
  };

  const submitSingleAnswer = async () => {
    if (!userAnswer) return;
    setIsGrading(true);
    setFeedback(null);
    
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      setFeedback({ score: 0, text: "Error: Please configure your Gemini API Key in the Settings page.", missing: [], action: '' });
      setIsGrading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a strict technical interviewer. Evaluate this candidate's answer.
Question: ${selectedQuestion.question}
Candidate's Answer: ${userAnswer}

Return your feedback strictly as a JSON object with this exact structure:
{
  "score": <number 0-10>,
  "text": "<brief encouraging overall feedback>",
  "missing": ["<missing concept 1>", "<missing concept 2>"],
  "action": "<one actionable improvement>"
}`;
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const fb = JSON.parse(responseText);
      setFeedback(fb);
      
      const status = fb.score >= 8 ? 'Strong' : (fb.score >= 5 ? 'Practicing' : 'Needs Review');
      progressMutation.mutate({ qId: selectedQuestion.id, status, score: fb.score });
      statsMutation.mutate({ current_streak: stats.current_streak + 1, last_practiced_date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      setFeedback({ score: 0, text: "Failed to grade answer. Please try again.", missing: [], action: '' });
    } finally {
      setIsGrading(false);
    }
  };

  // Mock Interview Logic
  const startMockInterview = () => {
    let pool = questions;
    if (mockConfig.topics.length > 0) {
      pool = questions.filter(q => mockConfig.topics.includes(q.category));
    }
    // Shuffle and pick N
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, mockConfig.questions);
    
    if (selected.length === 0) {
      alert("No questions found for the selected topics.");
      return;
    }

    setMockQuestions(selected);
    setMockAnswers(new Array(selected.length).fill(''));
    setMockCurrentIndex(0);
    setIsMockSetupOpen(false);
    setIsMockActive(true);
    setMockResults(null);
  };

  const endMockInterview = async () => {
    setIsMockActive(false);
    setIsGrading(true);
    
    // Simulate grading for the entire mock interview
    setTimeout(() => {
      const answeredCount = mockAnswers.filter(a => a.trim().length > 10).length;
      const overall = answeredCount > 0 ? Math.floor(Math.random() * 40) + 50 : 0; // fake score
      
      const results = {
        role: mockConfig.role,
        topics: mockConfig.topics,
        duration_minutes: mockConfig.duration,
        questions_answered: answeredCount,
        score_overall: overall,
        score_technical: overall > 10 ? overall - 5 : overall,
        score_communication: overall > 10 ? overall + 5 : overall,
        feedback_summary: "You showed a good understanding of core concepts, but struggled with deep technical implementations. Practice system design patterns."
      };
      
      setMockResults(results);
      saveMockMutation.mutate(results);
      statsMutation.mutate({ overall_readiness: Math.min(stats.overall_readiness + 5, 100) });
      setIsGrading(false);
    }, 2000);
  };

  if (isQuestionsLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  if (isMockActive) {
    const mq = mockQuestions[mockCurrentIndex];
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-20 px-4 sm:px-0">
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-zinc-50">Mock Interview</h3>
            <p className="text-sm text-slate-500">{mockConfig.role} • {mockConfig.questions} Questions</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono font-bold text-lg text-indigo-600 dark:text-indigo-400"><Clock size={20} className="inline mr-1 -mt-1"/> 29:59</span>
            <button onClick={endMockInterview} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">End Early</button>
          </div>
        </div>
        
        <Card className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold uppercase">Question {mockCurrentIndex + 1} of {mockQuestions.length}</span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold">{mq.category}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-zinc-50 mb-8 leading-relaxed">{mq.question}</h2>
          
          <textarea 
            value={mockAnswers[mockCurrentIndex]}
            onChange={e => {
              const newAns = [...mockAnswers];
              newAns[mockCurrentIndex] = e.target.value;
              setMockAnswers(newAns);
            }}
            placeholder="Type your answer here as if speaking to an interviewer..."
            className="flex-1 w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-zinc-300"
          ></textarea>
        </Card>
        
        <div className="flex justify-between">
          <button 
            onClick={() => setMockCurrentIndex(Math.max(0, mockCurrentIndex - 1))}
            disabled={mockCurrentIndex === 0}
            className="px-6 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl font-medium disabled:opacity-50 text-slate-700 dark:text-zinc-300"
          >
            Previous
          </button>
          {mockCurrentIndex < mockQuestions.length - 1 ? (
             <button onClick={() => setMockCurrentIndex(mockCurrentIndex + 1)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center gap-2">Next Question <ChevronRight size={18}/></button>
          ) : (
             <button onClick={endMockInterview} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center gap-2">Finish Interview <Check size={18}/></button>
          )}
        </div>
      </div>
    );
  }

  if (mockResults) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-10 pb-20 px-4 sm:px-0">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50 mb-2">Interview Completed!</h2>
          <p className="text-slate-500 dark:text-zinc-400">Here is your performance breakdown for the {mockResults.role} mock interview.</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center p-6 bg-indigo-600 text-white border-none shadow-md">
             <div className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">Overall Score</div>
             <div className="text-5xl font-black">{mockResults.score_overall}%</div>
          </Card>
          <Card className="text-center p-6">
             <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Technical</div>
             <div className="text-3xl font-bold text-slate-800 dark:text-zinc-50">{mockResults.score_technical}%</div>
          </Card>
          <Card className="text-center p-6">
             <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Communication</div>
             <div className="text-3xl font-bold text-slate-800 dark:text-zinc-50">{mockResults.score_communication}%</div>
          </Card>
        </div>
        
        <Card className="bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20">
          <h3 className="font-bold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2"><Target size={18}/> Key Takeaways</h3>
          <p className="text-amber-800 dark:text-amber-300/80 leading-relaxed text-sm">{mockResults.feedback_summary}</p>
        </Card>
        
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={() => setMockResults(null)} className="px-6 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl font-medium transition-colors">Return to Dashboard</button>
          <button onClick={() => { setMockResults(null); setIsMockSetupOpen(true); }} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm">Practice Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50">Interview Prep</h2>
            <div className="px-3 py-1 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-full flex items-center gap-1.5 text-sm font-bold text-orange-600 dark:text-orange-400 shadow-sm">
              🔥 {stats.current_streak} Day Streak
            </div>
          </div>
          <p className="text-slate-500 dark:text-zinc-400">Master your technical interviews with AI feedback and mock sessions.</p>
        </div>
        <button 
          onClick={() => setIsMockSetupOpen(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center gap-2"
        >
          <PlayCircle size={18} /> Start Mock Interview
        </button>
      </header>

      {/* Readiness Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Overall Readiness" value={`${stats.overall_readiness}%`} icon={Target} iconColor="text-indigo-500" iconBg="bg-indigo-50" />
        <StatsCard title="Questions Practiced" value={Object.keys(progressMap).length} icon={BrainCircuit} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        <StatsCard title="Mock Interviews" value={mocksCount} icon={Award} iconColor="text-purple-500" iconBg="bg-purple-50" />
        <StatsCard title="Weak Areas" value={needsReviewCount} icon={ShieldAlert} iconColor="text-rose-500" iconBg="bg-rose-50" />
      </div>

      {/* Topic Readiness */}
      <Card>
        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-50 mb-4 uppercase tracking-wider text-slate-500">Topic Readiness</h3>
        <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-2">
          {TOPICS.map(topic => (
            <div 
              key={topic.name} 
              onClick={() => setActiveFilter(topic.name)}
              className={`min-w-[160px] p-3 rounded-xl border transition-all cursor-pointer ${activeFilter === topic.name ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm' : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'}`}
            >
              <div className="flex justify-between items-end mb-2">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">{topic.name}</span>
                <span className="text-xs font-bold text-slate-500">{topic.readiness}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${topic.color}`} style={{ width: `${topic.readiness}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Question Bank (Left, 2 columns on XL) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search questions by keyword..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {FILTERS.map(f => (
                <button 
                  key={f} onClick={() => setActiveFilter(f)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${activeFilter === f ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                <BrainCircuit size={48} className="mx-auto text-slate-300 dark:text-zinc-600 mb-4" />
                <p className="text-slate-500 font-medium">No questions found.</p>
                <button onClick={() => {setSearchQuery(''); setActiveFilter('All');}} className="mt-4 text-indigo-600 text-sm font-semibold">Clear Filters</button>
              </div>
            ) : (
              filteredQuestions.map(q => {
                const isBookmarked = bookmarkedIds.includes(q.id);
                const prog = progressMap[q.id];
                return (
                  <div key={q.id} className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 transition-all shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${q.difficulty==='Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : q.difficulty==='Hard' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {q.difficulty || 'Medium'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{q.category}</span>
                          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1"><Clock size={12}/> ~3m</span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-zinc-50 leading-snug">{q.question}</h4>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleToggleBookmark(q.id, isBookmarked); }} className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>
                          <Bookmark size={18} className={isBookmarked ? 'fill-indigo-500' : ''} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        {prog ? (
                          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${prog.status === 'Strong' ? 'bg-emerald-50 text-emerald-700' : prog.status === 'Practicing' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                            {prog.status === 'Strong' ? <CheckCircle size={14}/> : prog.status === 'Practicing' ? <Activity size={14}/> : <ShieldAlert size={14}/>}
                            {prog.status}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Not practiced yet</span>
                        )}
                      </div>
                      <button onClick={() => openPractice(q)} className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-sm font-semibold transition-colors">
                        Practice
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Secondary Panels (Right side) */}
        <div className="space-y-6">
          {/* AI Feedback Snippet */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2"><Bot size={18} /> Latest AI Feedback</h3>
              <div className="p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-white/40 dark:border-zinc-700 shadow-sm">
                <p className="text-sm text-slate-700 dark:text-zinc-300 font-medium">"Your explanation of RESTful principles was excellent, but you missed mentioning statelessness. Always explicitly mention statelessness when defining REST."</p>
              </div>
            </div>
            <Bot size={100} className="absolute -bottom-6 -right-6 text-indigo-500/10" />
          </Card>

          {/* Revision Queue */}
          <Card>
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2"><Activity size={18} className="text-slate-500" /> Revision Queue</h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400"><ShieldAlert size={16}/> Needs Review</div>
                <span className="text-base font-bold text-rose-700 dark:text-rose-400">{needsReviewCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400"><Activity size={16}/> Practicing</div>
                <span className="text-base font-bold text-amber-700 dark:text-amber-400">{practicingCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400"><CheckCircle size={16}/> Strong</div>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{strongCount}</span>
              </div>
            </div>
            <button onClick={() => setActiveFilter('Needs Review')} className="w-full py-2.5 border-2 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors">Review Weak Questions</button>
          </Card>
        </div>
      </div>

      {/* Single Question Practice Modal */}
      <Modal isOpen={isPracticeOpen} onClose={() => setIsPracticeOpen(false)} title="Practice Question" className="max-w-3xl">
        {selectedQuestion && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <div className="flex gap-2 items-center mb-3">
                 <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedQuestion.category}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-50 leading-relaxed">{selectedQuestion.question}</h3>
            </div>

            {!feedback ? (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">Your Answer</label>
                <textarea 
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="Explain your approach or provide code..."
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-zinc-300 text-sm"
                ></textarea>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button onClick={() => setShowHint(!showHint)} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">Need a hint?</button>
                  </div>
                  <button 
                    onClick={submitSingleAnswer}
                    disabled={isGrading || !userAnswer}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2"
                  >
                    {isGrading && <Loader2 size={16} className="animate-spin" />}
                    {isGrading ? 'Grading...' : 'Submit Answer'}
                  </button>
                </div>
                {showHint && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm mt-4">
                    <strong>Hint:</strong> Break the problem down into its core components. How would you solve this without code first?
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-5 rounded-xl border ${feedback.score >= 8 ? 'bg-emerald-50 border-emerald-200' : feedback.score >= 5 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold flex items-center gap-2 text-slate-800">
                      <Bot size={18} className={feedback.score >= 8 ? 'text-emerald-600' : feedback.score >= 5 ? 'text-amber-600' : 'text-rose-600'} /> 
                      AI Evaluation
                    </h4>
                    <span className={`text-xl font-black ${feedback.score >= 8 ? 'text-emerald-700' : feedback.score >= 5 ? 'text-amber-700' : 'text-rose-700'}`}>{feedback.score}/10</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-4 font-medium">{feedback.text}</p>
                  
                  {feedback.missing && feedback.missing.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Concepts Missed</h5>
                      <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                        {feedback.missing.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  {feedback.action && (
                    <div className="bg-white/60 rounded-lg p-3 text-sm text-slate-800 font-medium border border-white/50 shadow-sm">
                      <strong>Actionable Improvement:</strong> {feedback.action}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowExplanation(!showExplanation)} className="px-5 py-2.5 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl transition-colors">View Correct Answer</button>
                  <button onClick={() => { setIsPracticeOpen(false); setFeedback(null); }} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">Close</button>
                </div>

                {showExplanation && (
                  <div className="p-5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 mt-4">
                    <h5 className="font-bold mb-2">Reference Answer:</h5>
                    <p>{selectedQuestion.answer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Mock Setup Modal */}
      <Modal isOpen={isMockSetupOpen} onClose={() => setIsMockSetupOpen(false)} title="Setup Mock Interview" className="max-w-lg">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Role</label>
            <select value={mockConfig.role} onChange={e=>setMockConfig({...mockConfig, role: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 bg-white text-sm">
              <option>Frontend Engineer</option><option>Backend Engineer</option><option>Full Stack Developer</option><option>Data Engineer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Focus Topics</label>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'Python', 'SQL', 'System Design'].map(t => (
                <button 
                  key={t}
                  onClick={() => {
                    const tops = mockConfig.topics.includes(t) ? mockConfig.topics.filter(x=>x!==t) : [...mockConfig.topics, t];
                    setMockConfig({...mockConfig, topics: tops});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${mockConfig.topics.includes(t) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (mins)</label>
              <select value={mockConfig.duration} onChange={e=>setMockConfig({...mockConfig, duration: parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 bg-white text-sm">
                <option value={15}>15 mins</option><option value={30}>30 mins</option><option value={45}>45 mins</option><option value={60}>60 mins</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Questions</label>
              <select value={mockConfig.questions} onChange={e=>setMockConfig({...mockConfig, questions: parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 bg-white text-sm">
                <option value={3}>3 Questions</option><option value={5}>5 Questions</option><option value={10}>10 Questions</option>
              </select>
            </div>
          </div>
          <button onClick={startMockInterview} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors mt-4 shadow-md">
            Begin Interview
          </button>
        </div>
      </Modal>

    </div>
  );
}
