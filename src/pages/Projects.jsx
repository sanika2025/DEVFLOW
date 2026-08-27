import { useState, useMemo } from 'react';
import { Plus, ExternalLink, MessageSquare, Loader2, GitBranch, Code, CheckCircle2, Clock, AlertCircle, XCircle, LayoutDashboard, Flag, Activity, Book, ArrowRight, Circle, CheckCircle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { StatsCard } from '../components/StatsCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personalProjectService } from '../services/personalProjectService';
import { useAuthStore } from '../store/useAuthStore';
import Swal from 'sweetalert2';

export default function Projects() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState('All');
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [projectForm, setProjectForm] = useState({
    title: '', description: '', category: 'Development', deadline: '', tech_stack: '', repo_url: '', doc_url: ''
  });

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['personal_projects', user?.id],
    queryFn: () => personalProjectService.getProjects(user?.id),
    enabled: !!user?.id
  });

  const addProjectMut = useMutation({
    mutationFn: (data) => personalProjectService.addProject(user?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal_projects', user?.id] });
      setIsNewProjectOpen(false);
      setProjectForm({ title: '', description: '', category: 'Development', deadline: '', tech_stack: '', repo_url: '', doc_url: '' });
      Swal.fire({ icon: 'success', title: 'Project Created', timer: 1500, showConfirmButton: false });
    }
  });

  const updateProjectMut = useMutation({
    mutationFn: ({ id, updates }) => personalProjectService.updateProject(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal_projects', user?.id] })
  });

  const addMilestoneMut = useMutation({
    mutationFn: ({ projectId, title, dueDate }) => personalProjectService.addMilestone(projectId, title, dueDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal_projects', user?.id] })
  });

  const updateMilestoneMut = useMutation({
    mutationFn: ({ id, updates, projectId, title }) => personalProjectService.updateMilestone(id, updates, projectId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal_projects', user?.id] })
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!projectForm.title) return;
    const techArray = projectForm.tech_stack ? projectForm.tech_stack.split(',').map(t => t.trim()).filter(t => t) : [];
    addProjectMut.mutate({ ...projectForm, tech_stack: techArray });
  };

  const projects = projectsData?.data || [];

  const filteredProjects = useMemo(() => {
    if (filter === 'All') return projects;
    return projects.filter(p => p.status === filter);
  }, [projects, filter]);

  const activeProjects = projects.filter(p => p.status === 'Active');
  const completedProjects = projects.filter(p => p.status === 'Completed');
  
  // Calculate Due This Week
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  const dueThisWeek = projects.filter(p => {
    if (!p.deadline || p.status === 'Completed' || p.status === 'Archived') return false;
    const d = new Date(p.deadline);
    return d >= new Date() && d <= oneWeekFromNow;
  }).length;

  const avgProgress = activeProjects.length > 0 
    ? activeProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / activeProjects.length 
    : 0;

  // Aggregate Activities
  const allActivities = projects.reduce((acc, p) => {
    return [...acc, ...(p.activities || []).map(a => ({ ...a, project_title: p.title }))];
  }, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  // Aggregate Upcoming Milestones
  const upcomingMilestones = projects.reduce((acc, p) => {
    if (p.status !== 'Active') return acc;
    const activeMilestones = (p.milestones || []).filter(m => m.status !== 'Completed' && m.due_date);
    return [...acc, ...activeMilestones.map(m => ({ ...m, project_title: p.title }))];
  }, []).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  const getHealthColor = (health) => {
    switch(health) {
      case 'On Track': return 'bg-emerald-500';
      case 'At Risk': return 'bg-amber-500';
      case 'Blocked': return 'bg-red-500';
      case 'Completed': return 'bg-indigo-500';
      default: return 'bg-slate-300';
    }
  };

  const getHealthIcon = (health) => {
    switch(health) {
      case 'On Track': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'At Risk': return <AlertCircle size={14} className="text-amber-500" />;
      case 'Blocked': return <XCircle size={14} className="text-red-500" />;
      case 'Completed': return <CheckCircle2 size={14} className="text-indigo-500" />;
      default: return <Clock size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50">Projects</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Track your projects, progress, deadlines, and development activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="All">All Projects</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
          <button 
            onClick={() => setIsNewProjectOpen(true)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> New Project
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Active Projects" value={activeProjects.length} icon={LayoutDashboard} trend="In Progress" />
        <StatsCard title="Completed" value={completedProjects.length} icon={CheckCircle2} trend="All time" iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatsCard title="Due This Week" value={dueThisWeek} icon={Clock} trend="Upcoming deadlines" iconColor="text-amber-500" iconBg="bg-amber-50 dark:bg-amber-500/10" />
        <StatsCard title="Overall Progress" value={`${avgProgress.toFixed(0)}%`} icon={Activity} trend="Active projects average" />
      </div>

      {/* Main Grid: Projects & Secondary Panels */}
      {projects.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 mb-2">Your workspace is ready.</h3>
          <p className="text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-8">Create your first project and start tracking your progress, milestones, and development activity.</p>
          <button onClick={() => setIsNewProjectOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Active Projects Grid */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
              <Code size={18} className="text-indigo-500" /> {filter === 'All' ? 'Project Portfolio' : `${filter} Projects`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} getHealthColor={getHealthColor} getHealthIcon={getHealthIcon} onClick={() => setSelectedProject(project)} />
              ))}
              {filteredProjects.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                  <p className="text-slate-500">No {filter.toLowerCase()} projects found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Panels (Deadlines & Activity) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="flex flex-col h-fit">
              <h3 className="font-bold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2">
                <Flag size={18} className="text-amber-500" /> Upcoming Deadlines
              </h3>
              <div className="space-y-4">
                {upcomingMilestones.length > 0 ? upcomingMilestones.map(m => {
                  const daysRemaining = Math.ceil((new Date(m.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={m.id} className="flex justify-between items-start gap-3 border-b border-slate-100 dark:border-zinc-800 last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium text-sm text-slate-800 dark:text-zinc-50 line-clamp-1">{m.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{m.project_title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${daysRemaining < 0 ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : daysRemaining <= 3 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                          {daysRemaining < 0 ? 'Overdue' : daysRemaining === 0 ? 'Today' : `${daysRemaining}d left`}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines.</p>
                )}
              </div>
            </Card>

            <Card className="flex flex-col h-fit">
              <h3 className="font-bold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" /> Recent Activity
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-zinc-800 before:to-transparent">
                {allActivities.length > 0 ? allActivities.map((activity, index) => (
                  <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 bg-indigo-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0 md:ml-0 shadow-sm" />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm ml-4 md:ml-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{activity.activity_type}</span>
                        <span className="text-[10px] text-slate-400">{new Date(activity.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2">{activity.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{activity.project_title}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      <Modal isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} title="Create New Project" className="max-w-xl">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Project Name</label>
              <input type="text" required value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm" placeholder="e.g. E-commerce API" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Description</label>
              <textarea value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm" rows="3" placeholder="Briefly describe the project..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Category</label>
              <select value={projectForm.category} onChange={e => setProjectForm({...projectForm, category: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm">
                <option>Development</option><option>Design</option><option>Research</option><option>Personal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Deadline (Optional)</label>
              <input type="date" value={projectForm.deadline} onChange={e => setProjectForm({...projectForm, deadline: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Tech Stack (Comma separated)</label>
              <input type="text" value={projectForm.tech_stack} onChange={e => setProjectForm({...projectForm, tech_stack: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm" placeholder="React, Node.js, PostgreSQL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Repository URL (Optional)</label>
              <input type="url" value={projectForm.repo_url} onChange={e => setProjectForm({...projectForm, repo_url: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm" placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Docs URL (Optional)</label>
              <input type="url" value={projectForm.doc_url} onChange={e => setProjectForm({...projectForm, doc_url: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm" placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
            <button type="button" onClick={() => setIsNewProjectOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
            <button type="submit" disabled={addProjectMut.isPending} className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
              {addProjectMut.isPending && <Loader2 size={16} className="animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal 
          project={projects.find(p => p.id === selectedProject.id)} 
          isOpen={!!selectedProject} 
          onClose={() => setSelectedProject(null)} 
          updateProjectMut={updateProjectMut}
          addMilestoneMut={addMilestoneMut}
          updateMilestoneMut={updateMilestoneMut}
          getHealthColor={getHealthColor}
          getHealthIcon={getHealthIcon}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, getHealthColor, getHealthIcon, onClick }) {
  const isCompleted = project.status === 'Completed';
  
  return (
    <div onClick={onClick} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col h-full group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-zinc-50 leading-tight line-clamp-1">{project.title}</h4>
          <span className="text-xs text-slate-500 mt-0.5 block">{project.category}</span>
        </div>
        <div className={`w-2 h-2 rounded-full shrink-0 ${getHealthColor(project.health)}`}></div>
      </div>
      
      <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
        {project.description || 'No description provided.'}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {(project.tech_stack || []).slice(0, 4).map(t => (
          <span key={t} className="px-2 py-0.5 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-100 dark:border-zinc-700 rounded-md text-[10px] font-semibold tracking-wide uppercase">{t}</span>
        ))}
        {(project.tech_stack || []).length > 4 && <span className="px-2 py-0.5 bg-slate-50 dark:bg-zinc-800 text-slate-500 rounded-md text-[10px] font-semibold tracking-wide">+{project.tech_stack.length - 4}</span>}
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">{getHealthIcon(project.health)} {project.health}</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{width: `${project.progress}%`}}></div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock size={14} />
          {project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'No deadline'}
        </div>
        <div className="flex gap-2">
          {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"><GitBranch size={16}/></a>}
          {project.doc_url && <a href={project.doc_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="text-slate-400 hover:text-indigo-600 transition-colors"><Book size={16}/></a>}
        </div>
      </div>
    </div>
  );
}

function ProjectDetailModal({ project, isOpen, onClose, updateProjectMut, addMilestoneMut, updateMilestoneMut, getHealthColor, getHealthIcon }) {
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  
  if (!project) return null;

  const handleProgressChange = (e) => {
    updateProjectMut.mutate({ id: project.id, updates: { progress: parseInt(e.target.value) } });
  };

  const handleStatusChange = (e) => {
    updateProjectMut.mutate({ id: project.id, updates: { status: e.target.value } });
  };

  const handleHealthChange = (e) => {
    updateProjectMut.mutate({ id: project.id, updates: { health: e.target.value } });
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    addMilestoneMut.mutate({ projectId: project.id, title: newMilestoneTitle }, {
      onSuccess: () => setNewMilestoneTitle('')
    });
  };

  const toggleMilestone = (m) => {
    const nextStatus = m.status === 'Completed' ? 'Not Started' : m.status === 'Not Started' ? 'In Progress' : 'Completed';
    updateMilestoneMut.mutate({ id: m.id, updates: { status: nextStatus }, projectId: project.id, title: m.title });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project.title} className="max-w-4xl h-[90vh] md:h-[80vh] flex flex-col p-0">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-wrap gap-4 justify-between items-start mb-8">
          <div>
            <p className="text-slate-600 dark:text-zinc-300 max-w-2xl text-sm sm:text-base">{project.description || 'No description provided.'}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {(project.tech_stack || []).map(t => (
                <span key={t} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-xs font-bold tracking-wide uppercase shadow-sm">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><GitBranch size={16}/> Repository</a>}
            {project.doc_url && <a href={project.doc_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Book size={16}/> Docs</a>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 space-y-6">
            {/* Progress Control */}
            <Card className="bg-slate-50 dark:bg-zinc-900 border-none shadow-inner">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-slate-800 dark:text-zinc-50">Overall Progress</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{project.progress}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={project.progress} 
                onChange={handleProgressChange}
                className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </Card>

            {/* Milestones */}
            <Card>
              <h4 className="font-bold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2"><Flag size={18} className="text-indigo-500"/> Milestones</h4>
              <div className="space-y-3">
                {(project.milestones || []).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                    <button onClick={() => toggleMilestone(m)} className="shrink-0 transition-colors">
                      {m.status === 'Completed' ? <CheckCircle size={20} className="text-emerald-500"/> : m.status === 'In Progress' ? <Circle size={20} className="text-amber-500"/> : <Circle size={20} className="text-slate-300 dark:text-zinc-600"/>}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${m.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-zinc-50'}`}>{m.title}</p>
                    </div>
                    {m.due_date && <span className="text-xs text-slate-400">{new Date(m.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>}
                  </div>
                ))}
                
                <form onSubmit={handleAddMilestone} className="flex gap-2 pt-2">
                  <input type="text" value={newMilestoneTitle} onChange={e=>setNewMilestoneTitle(e.target.value)} placeholder="Add a milestone..." className="flex-1 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:border-indigo-500" />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Plus size={16}/> Add</button>
                </form>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h4 className="font-bold text-slate-800 dark:text-zinc-50 mb-4">Project Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={project.status} onChange={handleStatusChange} className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm">
                    <option>Active</option><option>Completed</option><option>Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Health</label>
                  <select value={project.health} onChange={handleHealthChange} className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900 text-sm">
                    <option>On Track</option><option>At Risk</option><option>Blocked</option><option>Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deadline</label>
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                    <Clock size={16} className="text-slate-400"/>
                    {project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, {weekday:'short', month:'long', day:'numeric', year:'numeric'}) : 'No deadline set'}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Modal>
  );
}
