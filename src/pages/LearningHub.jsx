import { BookOpen, PlayCircle, FileText, Code2, CheckCircle2, ChevronRight, BrainCircuit } from 'lucide-react';
import { Card } from '../components/Card';

export default function LearningHub() {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Learning Hub</h2>
          <p className="text-slate-500 mt-1">Day 14: React Hooks & Custom Hooks</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-slate-500 mb-1">Overall Progress</div>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[65%] rounded-full"></div>
            </div>
            <span className="font-bold text-slate-700">65%</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-semibold text-lg text-slate-800">Today's Curriculum</h3>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 font-medium text-xs rounded-full">Intermediate</span>
            </div>
            
            <div className="space-y-3">
              <CurriculumItem icon={PlayCircle} title="Understanding useEffect Deep Dive" duration="15 mins" type="Video" completed />
              <CurriculumItem icon={FileText} title="Rules of Hooks" duration="5 mins" type="Article" completed />
              <CurriculumItem icon={Code2} title="Build a useLocalStorage Hook" duration="30 mins" type="Coding Task" active />
              <CurriculumItem icon={BookOpen} title="Hooks Quiz" duration="10 mins" type="Quiz" locked />
            </div>

            <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              Continue Learning <ChevronRight w={18} h={18} />
            </button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="text-indigo-600" size={20} />
              <h3 className="font-semibold text-indigo-900">AI Summary</h3>
            </div>
            <p className="text-sm text-indigo-800/80 leading-relaxed mb-4">
              Today you're focusing on React Hooks. Remember that hooks must always be called at the top level of your component. We'll be practicing managing side effects and extracting logic into custom hooks.
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">Resources</h3>
            <div className="space-y-3">
              <ResourceLink title="React Official Docs" />
              <ResourceLink title="Hooks API Reference" />
              <ResourceLink title="Community Examples" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CurriculumItem({ icon: Icon, title, duration, type, completed, active, locked }) {
  return (
    <div className={`flex items-center p-3 rounded-xl border transition-all ${active ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${completed ? 'bg-emerald-100 text-emerald-600' : active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
        {completed ? <CheckCircle2 size={20} /> : <Icon size={20} />}
      </div>
      <div className="ml-4 flex-1">
        <h4 className={`font-medium ${locked ? 'text-slate-400' : 'text-slate-800'}`}>{title}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-medium text-slate-500">{type}</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span className="text-xs text-slate-500">{duration}</span>
        </div>
      </div>
      {!locked && !completed && (
        <button className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <PlayCircle size={16} />
        </button>
      )}
    </div>
  );
}

function ResourceLink({ title }) {
  return (
    <a href="#" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
      <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{title}</span>
      <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500" />
    </a>
  );
}
