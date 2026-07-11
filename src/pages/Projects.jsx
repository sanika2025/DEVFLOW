import { useState } from 'react';
import { Plus, GitBranch, ExternalLink, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Modal } from '../components/Modal';

export default function Projects() {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="h-full flex flex-col space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Projects Workspace</h2>
          <p className="text-slate-500 mt-1">Manage your development workflow.</p>
        </div>
        <button 
          onClick={() => setIsNewProjectOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> New Project
        </button>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
        <KanbanColumn title="Todo" count={3}>
          <ProjectCard title="Portfolio Website Redesign" tech={['React', 'Framer']} progress={0} onClick={() => setSelectedProject({title: "Portfolio Website Redesign", tech: ['React', 'Framer'], progress: 0})} />
          <ProjectCard title="Expense API" tech={['Node', 'Express', 'PostgreSQL']} progress={10} onClick={() => setSelectedProject({title: "Expense API", tech: ['Node', 'Express', 'PostgreSQL'], progress: 10})} />
        </KanbanColumn>
        
        <KanbanColumn title="In Progress" count={2}>
          <ProjectCard title="DevMind LearningOS" tech={['React', 'Tailwind']} progress={65} onClick={() => setSelectedProject({title: "DevMind LearningOS", tech: ['React', 'Tailwind'], progress: 65})} />
        </KanbanColumn>

        <KanbanColumn title="Review" count={1}>
          <ProjectCard title="Authentication Microservice" tech={['FastAPI', 'JWT']} progress={90} onClick={() => setSelectedProject({title: "Authentication Microservice", tech: ['FastAPI', 'JWT'], progress: 90})} />
        </KanbanColumn>

        <KanbanColumn title="Completed" count={5}>
          <ProjectCard title="Weather App CLI" tech={['Python']} progress={100} onClick={() => setSelectedProject({title: "Weather App CLI", tech: ['Python'], progress: 100})} />
        </KanbanColumn>
      </div>

      {/* New Project Modal */}
      <Modal isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} title="Create New Project">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. E-commerce API" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" rows="3" placeholder="Describe your project..."></textarea>
          </div>
          <button className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Create Project
          </button>
        </div>
      </Modal>

      {/* View Project Modal */}
      <Modal isOpen={!!selectedProject} onClose={() => setSelectedProject(null)} title={selectedProject?.title}>
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex gap-2">
              {selectedProject.tech.map(t => (
                <span key={t} className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs font-semibold tracking-wide uppercase">{t}</span>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-700 font-medium">
                <span>Current Progress</span>
                <span>{selectedProject.progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{width: `${selectedProject.progress}%`}}></div>
              </div>
            </div>
            <p className="text-slate-600 text-sm">
              This is a placeholder description for {selectedProject.title}. Here you would see the full project details, active tasks, and team members.
            </p>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors flex justify-center items-center gap-2">
                <GitBranch size={16} /> Repository
              </button>
              <button className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                Open Workspace <ExternalLink size={16} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function KanbanColumn({ title, count, children }) {
  return (
    <div className="min-w-[320px] w-[320px] flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 h-full p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">{count}</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600"><Plus size={18}/></button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar">
        {children}
      </div>
    </div>
  );
}

function ProjectCard({ title, tech, progress, onClick }) {
  return (
    <div onClick={onClick} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-slate-800 leading-tight">{title}</h4>
        <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal size={16}/></button>
      </div>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        {tech.map(t => (
          <span key={t} className="px-2 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded text-[10px] font-medium tracking-wide uppercase">{t}</span>
        ))}
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{width: `${progress}%`}}></div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex gap-2">
          <button className="text-slate-400 hover:text-slate-800 transition-colors"><GitBranch size={16}/></button>
          <button className="text-slate-400 hover:text-indigo-600 transition-colors"><ExternalLink size={16}/></button>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
          <MessageSquare size={14} /> 3
        </div>
      </div>
    </div>
  );
}
