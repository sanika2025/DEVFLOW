import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lessonService } from '../services/lessonService';
import { Loader2, ArrowLeft, BookOpen, Code, FileImage, Volume2, VolumeX, Sparkles, Play, CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const synth = window.speechSynthesis;

  // Ask AI State
  const [selectionBox, setSelectionBox] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const contentRef = useRef(null);

  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonService.getLessonDetails(lessonId),
    enabled: !!lessonId
  });

  // Handle Text Selection for "Ask AI"
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Don't trigger if clicking inside the popover
      if (e.target.closest('#ai-popover')) return;

      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && text.length > 5 && contentRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Positioning logic
        setSelectionBox({
          top: rect.top + window.scrollY - 50,
          left: rect.left + window.scrollX + (rect.width / 2) - 60
        });
        setSelectedText(text);
        setAiExplanation(null);
      } else if (!e.target.closest('#ai-popover')) {
        setSelectionBox(null);
        setSelectedText('');
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleAskAI = () => {
    setIsExplaining(true);
    // Simulate AI API Call
    setTimeout(() => {
      setAiExplanation(`Here's a simple breakdown of what you highlighted: "${selectedText.substring(0, 20)}...". In simple terms, this means that Language Models predict the next word based on context.`);
      setIsExplaining(false);
    }, 1500);
  };

  // Handle Audio Guide
  const toggleAudio = () => {
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      if (!lessonData?.data?.sections) return;
      const fullText = lessonData.data.sections.map(s => s.content).join('. ');
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlaying(false);
      synth.speak(utterance);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => synth.cancel(); // Cleanup on unmount
  }, [synth]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!lessonData?.success || !lessonData.data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-50">Lesson not found</h2>
        <button onClick={() => navigate('/learning')} className="mt-4 text-indigo-600 hover:underline">
          Return to Learning Hub
        </button>
      </div>
    );
  }

  const { title, sections, dayNumber } = lessonData.data;

  // Custom Markdown Components for Code Sandbox & Quizzes
  const markdownComponents = {
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : null;
      
      if (!inline && language) {
        return <CodeSandbox language={language} code={String(children).replace(/\n$/, '')} />;
      }
      return <code className="bg-slate-100 dark:bg-zinc-800/60 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
    },
    blockquote({node, children}) {
      // Very simple inline quiz parser (if blockquote text starts with QUIZ:)
      const textContent = children?.[1]?.props?.children?.[0];
      if (typeof textContent === 'string' && textContent.startsWith('QUIZ:')) {
        return <InlineQuiz question={textContent.replace('QUIZ:', '').trim()} />;
      }
      return <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-600 dark:text-zinc-400 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-r-lg my-4">{children}</blockquote>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 relative">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/learning')}
          className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Back to Curriculum
        </button>

        {/* Audio Guide Button */}
        <button 
          onClick={toggleAudio}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${isPlaying ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300'}`}
        >
          {isPlaying ? <VolumeX size={18} /> : <Volume2 size={18} />}
          {isPlaying ? 'Stop Audio Guide' : 'Play Audio Guide'}
        </button>
      </div>

      <header className="border-b border-slate-200 dark:border-zinc-800 pb-6 pt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">{title}</h1>
      </header>

      {/* Main Content Area */}
      <div className="space-y-12" ref={contentRef}>
        {sections?.map((section, idx) => (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={section.id} 
            className="bg-white dark:bg-zinc-900/90 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 p-8 md:p-10"
          >
            <div className="flex items-center gap-4 mb-8 border-b border-slate-100 dark:border-zinc-800 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 transform -rotate-3">
                {section.section_type === 'Theory' ? <BookOpen size={24} /> :
                 section.section_type === 'Code' ? <Code size={24} /> :
                 <FileImage size={24} />}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-zinc-50">{section.title}</h2>
            </div>
            
            <div className="prose prose-lg prose-slate dark:prose-invert prose-indigo max-w-none prose-headings:font-bold">
              {section.section_type === 'Code' && !section.content.startsWith('```') ? (
                <ReactMarkdown components={markdownComponents}>{`\`\`\`python\n${section.content}\n\`\`\``}</ReactMarkdown>
              ) : section.section_type === 'Diagram' && !section.content.startsWith('```') ? (
                <ReactMarkdown components={markdownComponents}>{`\`\`\`mermaid\n${section.content}\n\`\`\``}</ReactMarkdown>
              ) : (
                <ReactMarkdown components={markdownComponents}>{section.content}</ReactMarkdown>
              )}
            </div>

            {/* Injected Micro-Quiz Example for first section */}
            {idx === 0 && (
              <div className="mt-10">
                <InlineQuiz question="What is the primary function of a Language Model?" correctIndex={1} options={["To generate images from text", "To predict the next word in a sequence", "To store databases efficiently"]} />
              </div>
            )}
          </motion.section>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-8 border-t border-slate-200 dark:border-zinc-800 mt-12">
        <button 
          onClick={() => navigate('/learning')}
          className="text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-2"
        >
          Previous Lesson
        </button>
        <button 
          onClick={() => navigate(`/learning/quiz/${dayNumber || 1}?dayId=${lessonData.data.parent_id}`)}
          className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 dark:hover:bg-indigo-400 hover:-translate-y-1 transition-all"
        >
          Complete & Take Final Quiz
        </button>
      </div>

      {/* Floating Ask AI Button / Popover */}
      <AnimatePresence>
        {selectionBox && (
          <motion.div
            id="ai-popover"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute z-50 flex flex-col items-center"
            style={{ top: selectionBox.top, left: selectionBox.left }}
          >
            {!aiExplanation && !isExplaining ? (
              <button 
                onClick={handleAskAI}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 transform hover:scale-105 transition-transform"
              >
                <Sparkles size={16} /> Explain this
              </button>
            ) : (
              <div className="bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-indigo-200 dark:border-indigo-900 p-4 rounded-2xl shadow-2xl w-80 relative">
                <button onClick={() => { setSelectionBox(null); setAiExplanation(null); }} className="absolute top-2 right-3 text-slate-400 hover:text-slate-600">×</button>
                <div className="flex items-center gap-2 mb-2 font-bold text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={16} /> AI Mentor says:
                </div>
                {isExplaining ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="animate-spin w-4 h-4" /> Analyzing context...
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                    {aiExplanation}
                  </p>
                )}
              </div>
            )}
            {/* Tooltip triangle */}
            {!aiExplanation && <div className="w-3 h-3 bg-indigo-600 rotate-45 -mt-1.5 rounded-sm"></div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponent: Live Code Sandbox
function CodeSandbox({ code, language }) {
  const [output, setOutput] = useState(null);
  
  const handleRun = () => {
    setOutput("Executing code in sandbox...\n\n> " + (language === 'python' ? 'Hello World from Pyodide!' : 'Output successful.'));
  };

  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
      <div className="bg-[#1e1e1e] border-b border-slate-700 px-4 py-3 flex justify-between items-center">
        <span className="text-slate-400 text-xs font-mono uppercase tracking-widest">{language} Interactive Sandbox</span>
        <button 
          onClick={handleRun}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Play size={14} fill="currentColor" /> Run Code
        </button>
      </div>
      <div className="bg-[#1e1e1e] p-2">
        <Editor
          height="150px"
          language={language === 'js' ? 'javascript' : language}
          theme="vs-dark"
          value={code}
          options={{ minimap: { enabled: false }, padding: { top: 10 }, scrollBeyondLastLine: false, fontSize: 14 }}
        />
      </div>
      {output && (
        <div className="bg-black text-emerald-400 p-4 font-mono text-sm border-t border-slate-700 whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  );
}

// Subcomponent: Inline Micro-Quiz
function InlineQuiz({ question, options = ["Option A", "Option B", "Option C"], correctIndex = 1 }) {
  const [selected, setSelected] = useState(null);
  const isAnswered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 my-6">
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-4 uppercase tracking-wider text-xs">
        <Sparkles size={16} /> Knowledge Check
      </div>
      <h4 className="text-lg font-bold text-slate-800 dark:text-zinc-50 mb-4">{question}</h4>
      <div className="space-y-3">
        {options.map((opt, i) => (
          <button
            key={i}
            disabled={isAnswered}
            onClick={() => setSelected(i)}
            className={`w-full text-left px-5 py-3 rounded-xl border-2 font-medium transition-all flex justify-between items-center
              ${isAnswered 
                ? (i === correctIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 
                   i === selected ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 opacity-50')
                : 'border-white bg-white hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:border-indigo-500 shadow-sm'
              }`}
          >
            {opt}
            {isAnswered && i === correctIndex && <CheckCircle2 className="text-emerald-500" />}
            {isAnswered && i === selected && i !== correctIndex && <XCircle className="text-rose-500" />}
          </button>
        ))}
      </div>
      {isAnswered && (
        <div className={`mt-4 p-3 rounded-lg text-sm font-bold ${isCorrect ? 'text-emerald-600 bg-emerald-100/50' : 'text-rose-600 bg-rose-100/50'}`}>
          {isCorrect ? 'Awesome job! You nailed it.' : 'Not quite. The correct answer is to predict the next word.'}
        </div>
      )}
    </div>
  );
}
