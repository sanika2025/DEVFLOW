import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Folder, Tag, FileText, Sparkles, Plus, Edit3, Loader2, Save, Trash, Clock, CheckCircle2, ChevronRight, X, Heart, Star, GripVertical, AlertCircle, Calendar } from 'lucide-react';
import { Card } from '../components/Card';
import ReactMarkdown from 'react-markdown';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '../services/noteService';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_FOLDERS = ['General', 'Learning', 'Interview Prep', 'Projects', 'System Design', 'Personal'];
const TAG_SUGGESTIONS = ['Python', 'SQL', 'React', 'System Design', 'Interview', 'Important', 'Revision'];

export default function SmartNotes() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State
  const [activeNote, setActiveNote] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  
  const [activeFolderId, setActiveFolderId] = useState('All Notes');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile Support
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // AI State
  const [isAIActionsOpen, setIsAIActionsOpen] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Queries
  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => noteService.getNotes(user?.id),
    enabled: !!user?.id
  });

  const notes = notesData?.data || [];

  // Derived Data
  const folders = useMemo(() => {
    const fMap = {};
    DEFAULT_FOLDERS.forEach(f => fMap[f] = 0);
    notes.forEach(n => {
      const f = n.folder_id || 'General';
      fMap[f] = (fMap[f] || 0) + 1;
    });
    return Object.entries(fMap).map(([name, count]) => ({ id: name, name, count }));
  }, [notes]);

  const stats = useMemo(() => {
    const needRevision = notes.filter(n => n.revision_status === 'Not Reviewed' || n.revision_status === 'Reviewing').length;
    const favorites = notes.filter(n => n.is_favorite).length;
    return { needRevision, favorites };
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let q = notes;
    if (activeFolderId === 'Favorites') {
      q = q.filter(n => n.is_favorite);
    } else if (activeFolderId === 'Recently Edited') {
      q = [...q].sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 10);
    } else if (activeFolderId !== 'All Notes') {
      q = q.filter(n => (n.folder_id || 'General') === activeFolderId);
    }
    
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      q = q.filter(n => (n.title || '').toLowerCase().includes(lower) || (n.content || '').toLowerCase().includes(lower));
    }
    
    return [...q].sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [notes, activeFolderId, searchQuery]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (updates) => noteService.updateNote(activeNote.id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
      // Don't override activeNote if we just saved content/title, it causes jumping
      if (data.data) {
         setActiveNote(prev => ({...prev, ...data.data}));
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: (newNote) => noteService.createNote(user?.id, newNote.title, newNote.folderId, newNote.content, newNote.tags),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
      if (data.data) {
        openNote(data.data);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId) => noteService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
      setActiveNote(null);
      setIsMobileEditorOpen(false);
    }
  });

  // Editor Autosave Effect
  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content || '');
      setTitle(activeNote.title || 'Untitled Note');
    }
  }, [activeNote?.id]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeNote && (content !== activeNote.content || title !== activeNote.title)) {
        saveMutation.mutate({ title, content });
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [content, title]);

  const openNote = (note) => {
    setActiveNote(note);
    setIsMobileEditorOpen(true);
  };

  const handleCreateNote = () => {
    const folder = activeFolderId === 'All Notes' || activeFolderId === 'Favorites' || activeFolderId === 'Recently Edited' ? 'General' : activeFolderId;
    createMutation.mutate({ title: '', folderId: folder, content: '', tags: [] });
  };

  const handleCreateTemplate = (templateType) => {
    const folder = activeFolderId === 'All Notes' || activeFolderId === 'Favorites' || activeFolderId === 'Recently Edited' ? 'General' : activeFolderId;
    let newContent = '';
    let newTitle = '';
    
    if (templateType === 'Learning Notes') {
      newTitle = 'New Learning Note';
      newContent = '# Topic Overview\n\n## Key Concepts\n- \n- \n\n## Summary\n\n## References\n';
    } else if (templateType === 'System Design') {
      newTitle = 'System Design: ';
      newContent = '# Requirements\n## Functional\n- \n## Non-Functional\n- \n\n# High-Level Design\n\n# Database Schema\n\n# Bottlenecks\n';
    } else {
      newTitle = 'Meeting Notes';
      newContent = '# Date:\n# Attendees:\n\n## Discussion\n- \n\n## Action Items\n- [ ] \n';
    }
    
    createMutation.mutate({ title: newTitle, folderId: folder, content: newContent, tags: [] });
  };

  const handleDelete = () => {
    if (activeNote) {
      Swal.fire({
        title: 'Delete Note?',
        text: 'This cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444'
      }).then((result) => {
        if(result.isConfirmed) {
          deleteMutation.mutate(activeNote.id);
        }
      });
    }
  };

  const handleAIAction = async (actionName) => {
    setIsAIActionsOpen(false);
    
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      Swal.fire('Error', 'Please configure your Gemini API Key in the Settings page.', 'error');
      return;
    }

    setIsProcessingAI(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      let prompt = '';
      if (actionName === 'Summarize') prompt = `Summarize the following notes in 3 concise bullet points:\n\n${content}`;
      else if (actionName === 'Flashcards') prompt = `Create 3 flashcards from the following notes. Format as Q: ... A: ...\n\n${content}`;
      else if (actionName === 'Explain') prompt = `Explain the core concepts in the following notes as if I were a beginner:\n\n${content}`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      Swal.fire({
        title: `AI ${actionName}`,
        html: `<div class="text-left text-sm whitespace-pre-wrap">${response}</div>`,
        showCancelButton: true,
        confirmButtonText: 'Append to Note',
        cancelButtonText: 'Close',
      }).then((res) => {
        if (res.isConfirmed) {
          setContent(prev => prev + `\n\n> **AI ${actionName}**\n> ${response.replace(/\n/g, '\n> ')}`);
        }
      });
      
    } catch (error) {
      Swal.fire('Error', 'Failed to process AI request.', 'error');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const toggleFavorite = (noteId, currentStatus, e) => {
    if (e) e.stopPropagation();
    noteService.updateNote(noteId, { is_favorite: !currentStatus }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
      if (activeNote?.id === noteId) {
        setActiveNote(prev => ({...prev, is_favorite: !currentStatus}));
      }
    });
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 xl:gap-6 relative">
      
      {/* 1. Left Sidebar (Folders) */}
      <div className={`absolute lg:static z-20 bg-white lg:bg-transparent h-full w-64 lg:w-64 flex flex-col gap-4 transition-transform ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-[120%] lg:translate-x-0'} rounded-2xl`}>
        {/* Mobile Sidebar Close */}
        <button onClick={()=>setIsSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 bg-slate-100 rounded-lg"><X size={16}/></button>
        
        <button onClick={handleCreateNote} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-md shadow-indigo-600/20 transition-all">
          <Plus size={18} /> New Note
        </button>

        <Card className="flex-1 overflow-y-auto" noPadding>
          <div className="p-3 space-y-1">
            <SidebarItem icon={FileText} label="All Notes" count={notes.length} active={activeFolderId === 'All Notes'} onClick={() => setActiveFolderId('All Notes')} />
            <SidebarItem icon={Star} label="Favorites" count={stats.favorites} iconColor="text-amber-500" active={activeFolderId === 'Favorites'} onClick={() => setActiveFolderId('Favorites')} />
            <SidebarItem icon={Clock} label="Recently Edited" active={activeFolderId === 'Recently Edited'} onClick={() => setActiveFolderId('Recently Edited')} />
          </div>

          <div className="px-4 py-3 mt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Folders</h3>
            <button className="text-slate-400 hover:text-indigo-600"><Plus size={14}/></button>
          </div>
          <div className="p-2 space-y-0.5">
            {folders.map(f => (
              <SidebarItem key={f.id} icon={Folder} label={f.name} count={f.count} active={activeFolderId === f.id} onClick={() => setActiveFolderId(f.id)} />
            ))}
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg"><CheckCircle2 size={18}/></div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-zinc-50 text-sm">Quick Revision</h4>
              <p className="text-xs text-slate-500">{stats.needRevision} notes to review</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Middle Panel (Notes List) */}
      <Card className={`flex-1 flex flex-col lg:max-w-md ${isMobileEditorOpen ? 'hidden md:flex' : 'flex'} overflow-hidden shadow-sm border-slate-200/60`} noPadding>
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button onClick={()=>setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-sm"><Folder size={16} className="text-slate-600"/></button>
            <h2 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
              {activeFolderId}
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-full text-xs">{filteredNotes.length}</span>
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search in list..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/30 dark:bg-zinc-950/30">
          {filteredNotes.length === 0 ? (
            <div className="text-center p-8 mt-10">
              <FileText size={40} className="mx-auto text-slate-300 dark:text-zinc-700 mb-3" />
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">No notes found.</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => openNote(note)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group ${activeNote?.id === note.id ? 'bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-500/30 shadow-sm' : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-zinc-900 hover:border-slate-200 dark:hover:border-zinc-800'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-semibold text-sm truncate pr-2 ${activeNote?.id === note.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-zinc-50'}`}>
                    {note.title || 'Untitled Note'}
                  </h4>
                  <button onClick={(e) => toggleFavorite(note.id, note.is_favorite, e)} className="shrink-0 text-slate-300 hover:text-amber-500 transition-colors">
                    <Star size={16} className={note.is_favorite ? 'fill-amber-500 text-amber-500' : ''} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                  {note.content?.substring(0, 100) || 'Empty note...'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-md truncate max-w-[100px]">
                    {note.folder_id}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 3. Right Panel (Editor) */}
      <Card className={`flex-1 flex flex-col overflow-hidden shadow-sm ${!isMobileEditorOpen ? 'hidden md:flex' : 'flex fixed inset-0 z-50 md:relative rounded-none md:rounded-2xl'}`} noPadding>
        {activeNote ? (
          <>
            {/* Editor Header */}
            <div className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <button onClick={()=>setIsMobileEditorOpen(false)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"><ChevronRight className="rotate-180" size={20}/></button>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md shrink-0">
                  <Folder size={12} /> {activeNote.folder_id}
                </div>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="font-bold text-lg text-slate-800 dark:text-zinc-50 bg-transparent border-none focus:ring-0 outline-none w-full min-w-0"
                  placeholder="Note Title"
                />
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-medium text-slate-400 hidden sm:inline-block">
                  {saveMutation.isPending ? 'Saving...' : 'Saved'}
                </span>
                <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block"></div>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsAIActionsOpen(!isAIActionsOpen)}
                    disabled={isProcessingAI}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {isProcessingAI ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
                    <span className="hidden sm:inline">AI Assist</span>
                  </button>
                  {isAIActionsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsAIActionsOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 p-1">
                        <button onClick={() => handleAIAction('Summarize')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">Summarize Note</button>
                        <button onClick={() => handleAIAction('Explain')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">Explain Concepts</button>
                        <button onClick={() => handleAIAction('Flashcards')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">Generate Flashcards</button>
                      </div>
                    </>
                  )}
                </div>

                <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash size={18} /></button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 flex overflow-hidden bg-white dark:bg-zinc-900">
              {/* Actual Editor */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <textarea
                  className="w-full h-full min-h-[400px] resize-none outline-none font-mono text-sm bg-transparent border-0 focus:ring-0 text-slate-700 dark:text-zinc-300 leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing..."
                  spellCheck="false"
                />
              </div>
              
              {/* Details Pane (Hidden on Mobile/Tablet unless toggled, showing inline for now) */}
              <div className="w-64 bg-slate-50 dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 p-5 hidden xl:block overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Note Details</h4>
                
                <div className="space-y-4 mb-8">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Status</span>
                    <select 
                      value={activeNote.revision_status} 
                      onChange={(e) => saveMutation.mutate({revision_status: e.target.value})}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-semibold rounded-lg p-2 outline-none focus:border-indigo-500 text-slate-700"
                    >
                      <option>Not Reviewed</option>
                      <option>Reviewing</option>
                      <option>Mastered</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Created</span>
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">{new Date(activeNote.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Word Count</span>
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">{(content.match(/\w+/g) || []).length} words</p>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tags</h4>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(activeNote.tags || []).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400 rounded-md">
                      {tag}
                    </span>
                  ))}
                  <button className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 border border-dashed border-slate-300 dark:border-zinc-600 text-xs font-medium text-slate-500 rounded-md hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-950 text-slate-400 p-8 text-center">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex items-center justify-center mb-6">
              <FileText size={32} className="text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 mb-2">Knowledge Hub</h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm mb-8">Select a note from the list, or create a new one to capture your ideas.</p>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-md">
              <button onClick={() => handleCreateTemplate('Learning Notes')} className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-300 text-slate-700 dark:text-zinc-300 text-sm font-semibold rounded-xl shadow-sm transition-all">📘 Learning Template</button>
              <button onClick={() => handleCreateTemplate('System Design')} className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-300 text-slate-700 dark:text-zinc-300 text-sm font-semibold rounded-xl shadow-sm transition-all">⚙️ System Design</button>
              <button onClick={() => handleCreateTemplate('Meeting Notes')} className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-300 text-slate-700 dark:text-zinc-300 text-sm font-semibold rounded-xl shadow-sm transition-all">📝 Meeting Notes</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, count, active, onClick, iconColor = "text-slate-400 dark:text-zinc-500" }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium'}`}>
      <div className="flex items-center gap-2.5">
        <Icon size={16} className={active ? 'text-indigo-600' : iconColor} />
        {label}
      </div>
      {count !== undefined && count > 0 && <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>{count}</span>}
    </button>
  );
}
