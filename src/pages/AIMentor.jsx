import { useState } from 'react';
import { Send, Bot, User, Sparkles, Mic, Paperclip } from 'lucide-react';
import { Card } from '../components/Card';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_PROMPTS = [
  "Explain React Context API like I'm 5",
  "Generate a mock interview for Senior Frontend role",
  "Review my notes on System Design",
  "Help me debug this useEffect hook"
];

const CHAT_HISTORY = [
  { role: 'assistant', content: "Hello Sanika! I'm your AI Mentor. How can I help you accelerate your learning today?" },
  { role: 'user', content: "Can you explain the difference between useMemo and useCallback?" },
  { role: 'assistant', content: "Great question! Both `useMemo` and `useCallback` are React hooks used for performance optimization, but they serve different purposes:\n\n1. **`useMemo`**: Returns a memoized **value**. Use it when you have an expensive computation that you don't want to run on every render.\n\n2. **`useCallback`**: Returns a memoized **function callback**. Use it when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary renders.\n\n### Analogy\n* `useMemo` is like caching the *result* of a complex math equation.\n* `useCallback` is like keeping the *same recipe card* instead of writing a new identical one every time." }
];

export default function AIMentor() {
  const [input, setInput] = useState('');

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <Card className="flex-1 flex flex-col overflow-hidden bg-white shadow-sm border-slate-200" noPadding>
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {CHAT_HISTORY.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none prose prose-sm prose-slate max-w-none'
              }`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Bot size={18} />
             </div>
             <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {/* Suggested Prompts */}
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button key={i} className="flex items-center gap-2 whitespace-nowrap px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg transition-colors border border-indigo-100">
                <Sparkles size={14} /> {prompt}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
              <Paperclip size={20} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none py-2 text-slate-800 placeholder:text-slate-400"
              rows={1}
            />
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
              <Mic size={20} />
            </button>
            <button className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
              <Send size={18} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
