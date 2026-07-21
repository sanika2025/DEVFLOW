import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lessonService } from '../services/lessonService';
import { Loader2, ArrowLeft, BookOpen, Code, FileImage } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonService.getLessonDetails(lessonId),
    enabled: !!lessonId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <button 
        onClick={() => navigate('/learning')}
        className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Curriculum
      </button>

      <header className="border-b border-slate-200 dark:border-zinc-800 pb-6">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-zinc-50">{title}</h1>
      </header>

      <div className="space-y-10">
        {sections?.map((section, idx) => (
          <section key={section.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                {section.section_type === 'Theory' ? <BookOpen size={20} /> :
                 section.section_type === 'Code' ? <Code size={20} /> :
                 <FileImage size={20} />}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-50">{section.title}</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert prose-indigo max-w-none prose-headings:font-semibold prose-pre:bg-slate-800 dark:prose-pre:bg-black prose-pre:text-slate-50">
              {section.section_type === 'Code' && !section.content.startsWith('```') ? (
                <ReactMarkdown>{`\`\`\`python\n${section.content}\n\`\`\``}</ReactMarkdown>
              ) : section.section_type === 'Diagram' && !section.content.startsWith('```') ? (
                <ReactMarkdown>{`\`\`\`mermaid\n${section.content}\n\`\`\``}</ReactMarkdown>
              ) : (
                <ReactMarkdown>{section.content}</ReactMarkdown>
              )}
            </div>
          </section>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-8 border-t border-slate-200 dark:border-zinc-800">
        <button 
          onClick={() => navigate('/learning')}
          className="text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-2"
        >
          Previous Lesson
        </button>
        <button 
          onClick={() => navigate(`/learning/quiz/${dayNumber || 1}`)}
          className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors"
        >
          Complete & Take Quiz
        </button>
      </div>
    </div>
  );
}
