import { useState, useEffect } from 'react';
import { Search, Folder, Tag, Pin, FileText, Sparkles, Plus, MoreVertical, Edit3, Eye, Loader2, Save, Trash } from 'lucide-react';
import { Card } from '../components/Card';
import ReactMarkdown from 'react-markdown';
import Swal from 'sweetalert2';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '../services/noteService';
import { useAuthStore } from '../store/useAuthStore';

export default function SmartNotes() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeNote, setActiveNote] = useState(null);
  const [content, setContent] = useState('');
  const [isAIActionsOpen, setIsAIActionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState('general');

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => noteService.getNotes(user?.id),
    enabled: !!user?.id
  });

  const notes = notesData?.data || [];

  // Group notes by folder to simulate folders
  const folders = notes.reduce((acc, note) => {
    const fId = note.folder_id || 'general';
    if (!acc.find(f => f.id === fId)) {
      acc.push({ id: fId, name: fId.charAt(0).toUpperCase() + fId.slice(1), count: 1 });
    } else {
      acc.find(f => f.id === fId).count++;
    }
    return acc;
  }, [{ id: 'general', name: 'General', count: 0 }]); // Default folder

  const activeNotes = notes.filter(n => (n.folder_id || 'general') === activeFolderId);

  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content || '');
    }
  }, [activeNote]);

  const saveMutation = useMutation({
    mutationFn: (updatedNote) => noteService.updateNote(updatedNote.id, { content: updatedNote.content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notes', user?.id]);
      Swal.fire({ icon: 'success', title: 'Saved!', timer: 1000, showConfirmButton: false });
    }
  });

  const createMutation = useMutation({
    mutationFn: (newNote) => noteService.createNote(user?.id, newNote.title, newNote.folderId, newNote.content),
    onSuccess: () => {
      queryClient.invalidateQueries(['notes', user?.id]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId) => noteService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries(['notes', user?.id]);
      setActiveNote(null);
      setContent('');
    }
  });

  const handleCreateFolder = () => {
    Swal.fire({
      title: 'New Folder',
      input: 'text',
      inputPlaceholder: 'Enter folder name...',
      showCancelButton: true,
      confirmButtonText: 'Create',
      confirmButtonColor: '#4f46e5',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // Just create a dummy note to implicitly create the folder
        createMutation.mutate({ title: 'New Note', folderId: result.value.toLowerCase(), content: '# New Note' });
      }
    });
  };

  const handleCreateNote = () => {
    createMutation.mutate({ title: 'Untitled Note', folderId: activeFolderId, content: '# Untitled' });
  };

  const handleSave = () => {
    if (activeNote) {
      saveMutation.mutate({ id: activeNote.id, content });
    }
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

  const handleAIAction = (actionName) => {
    setIsAIActionsOpen(false);
    Swal.fire({
      title: `${actionName}...`,
      html: 'Our AI Mentor is processing your request. Please wait.',
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      }
    }).then(() => {
      Swal.fire({ icon: 'success', title: 'Complete!', text: `AI has successfully finished: ${actionName}`, confirmButtonColor: '#4f46e5' });
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar / File Explorer */}
      <div className="w-72 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search notes..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        <Card className="flex-1 overflow-y-auto" noPadding>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-700 text-sm">Folders</h3>
            <button onClick={handleCreateFolder} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {folders.map(folder => (
              <FolderItem 
                key={folder.id} 
                name={folder.name} 
                count={folder.count} 
                active={activeFolderId === folder.id} 
                onClick={() => setActiveFolderId(folder.id)}
              />
            ))}
          </div>

          <div className="p-4 border-y border-slate-100 bg-slate-50/50 mt-4 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700 text-sm">{folders.find(f=>f.id===activeFolderId)?.name} Notes</h3>
            <button onClick={handleCreateNote} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {activeNotes.map(note => (
              <NoteItem 
                key={note.id}
                title={note.title} 
                date={new Date(note.updated_at).toLocaleDateString()} 
                active={activeNote?.id === note.id}
                onClick={() => setActiveNote(note)}
              />
            ))}
            {activeNotes.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">No notes in this folder.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Editor Area */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-md" noPadding>
        {activeNote ? (
          <>
            {/* Editor Toolbar */}
            <div className="h-14 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium cursor-pointer hover:text-slate-700 transition-colors">
                  <Folder size={16} /> {folders.find(f => f.id === activeFolderId)?.name || 'Folder'}
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-800">{activeNote?.title}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 relative">
                <button 
                  onClick={() => setIsAIActionsOpen(!isAIActionsOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Sparkles size={16} /> AI Actions
                </button>

                {isAIActionsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAIActionsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden z-50 py-1">
                      <button onClick={() => handleAIAction('Summarizing Note')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Summarize Note</button>
                      <button onClick={() => handleAIAction('Explaining Concept')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Explain Concept</button>
                      <button onClick={() => handleAIAction('Improving Writing')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2">
                        <Sparkles size={14} /> Improve Writing
                      </button>
                    </div>
                  </>
                )}

                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                <button onClick={handleSave} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Save"><Save size={18} /></button>
                <button 
                  onClick={() => setIsEditing(!isEditing)} 
                  className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  title={isEditing ? "Preview Markdown" : "Edit Markdown"}
                >
                  {isEditing ? <Eye size={18} /> : <Edit3 size={18} />}
                </button>
                <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash size={18} /></button>
              </div>
            </div>

            {/* Markdown Preview Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-white prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-indigo-600 prose-pre:bg-slate-50 prose-pre:text-slate-800 prose-pre:border prose-pre:border-slate-200 h-full">
              {isEditing ? (
                <textarea
                  className="w-full h-full min-h-[400px] resize-none outline-none font-mono text-sm bg-transparent border-0 focus:ring-0 text-slate-700"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your markdown here..."
                  spellCheck="false"
                />
              ) : (
                <ReactMarkdown>{content}</ReactMarkdown>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>Select a note or create a new one to start writing.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function FolderItem({ name, count, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
      <div className="flex items-center gap-2">
        <Folder size={16} className={active ? 'text-indigo-500 fill-indigo-100' : 'text-slate-400'} />
        {name}
      </div>
      <span className={`text-xs ${active ? 'text-indigo-500 font-bold' : 'text-slate-400'}`}>{count}</span>
    </button>
  );
}

function NoteItem({ title, date, pinned, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all border ${active ? 'bg-white border-indigo-200 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}`}>
      <FileText size={18} className={`mt-0.5 shrink-0 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm truncate ${active ? 'font-semibold text-indigo-900' : 'font-medium text-slate-800'}`}>{title}</h4>
        <p className={`text-xs mt-1 ${active ? 'text-indigo-400' : 'text-slate-400'}`}>{date}</p>
      </div>
      {pinned && <Pin size={14} className={`shrink-0 ${active ? 'text-indigo-500 fill-indigo-500' : 'text-slate-300 fill-slate-300'}`} />}
    </button>
  );
}
