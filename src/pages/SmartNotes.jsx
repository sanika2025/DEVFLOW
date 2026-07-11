import { useState } from 'react';
import { Search, Folder, Tag, Pin, FileText, Sparkles, Plus, MoreVertical, Edit3, Eye } from 'lucide-react';
import { Card } from '../components/Card';
import ReactMarkdown from 'react-markdown';
import Swal from 'sweetalert2';

const DUMMY_MARKDOWN_1 = `
# Understanding React Context

React Context provides a way to pass data through the component tree without having to pass props down manually at every level.

## When to use Context

Context is designed to share data that can be considered "global" for a tree of React components, such as:
* Current authenticated user
* Theme (e.g., light or dark)
* Preferred language

### Example Usage

\`\`\`jsx
const ThemeContext = React.createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}
\`\`\`
`;

const DUMMY_MARKDOWN_2 = `
# GraphQL Basics

GraphQL is a query language for APIs and a runtime for fulfilling those queries with your existing data.

* **Ask for what you need**: Clients specify exactly what data they want.
* **Get predictable results**: You always get back exactly what you requested.

## Example Query

\`\`\`graphql
{
  user(id: "1") {
    name
    email
    friends {
      name
    }
  }
}
\`\`\`
`;

const INITIAL_FOLDERS = [
  { id: 1, name: 'React Mastery', count: 12 },
  { id: 2, name: 'System Design', count: 5 },
  { id: 3, name: 'Interview Prep', count: 24 },
];

export default function SmartNotes() {
  const [content, setContent] = useState(DUMMY_MARKDOWN_1);
  const [activeNoteTitle, setActiveNoteTitle] = useState('Understanding React Context');
  const [isAIActionsOpen, setIsAIActionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState(1);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);

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
        setFolders([...folders, { id: Date.now(), name: result.value, count: 0 }]);
        Swal.fire({
          icon: 'success',
          title: 'Created!',
          text: `Folder "${result.value}" created successfully.`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
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
      Swal.fire({
        icon: 'success',
        title: 'Complete!',
        text: `AI has successfully finished: ${actionName}`,
        confirmButtonColor: '#4f46e5'
      });
    });
  };

  const handleNoteClick = (title, markdown) => {
    setActiveNoteTitle(title);
    setContent(markdown);
  };

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

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
            <h3 className="font-semibold text-slate-700 text-sm">Pinned Notes</h3>
          </div>
          <div className="p-2 space-y-1">
            <NoteItem 
              title="Understanding React Context" 
              date="Today" 
              pinned 
              active={activeNoteTitle === 'Understanding React Context'}
              onClick={() => handleNoteClick('Understanding React Context', DUMMY_MARKDOWN_1)}
            />
            <NoteItem 
              title="GraphQL Basics" 
              date="Yesterday" 
              pinned 
              active={activeNoteTitle === 'GraphQL Basics'}
              onClick={() => handleNoteClick('GraphQL Basics', DUMMY_MARKDOWN_2)}
            />
          </div>
        </Card>
      </div>

      {/* Editor Area */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-md" noPadding>
        {/* Editor Toolbar */}
        <div className="h-14 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium cursor-pointer hover:text-slate-700 transition-colors">
              <Folder size={16} /> {folders.find(f => f.id === activeFolderId)?.name || 'Folder'}
              <span className="text-slate-300">/</span>
              <span className="text-slate-800">{activeNoteTitle}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => Swal.fire({title: 'Filtered by Tag', text: 'Showing all notes tagged with #react', icon: 'success', confirmButtonColor: '#4f46e5'})}
                className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md flex items-center gap-1 hover:bg-indigo-100 transition-colors"
              >
                <Tag size={12} /> react
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setIsAIActionsOpen(!isAIActionsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <Sparkles size={16} /> AI Actions
            </button>

            {/* AI Actions Dropdown */}
            {isAIActionsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAIActionsOpen(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden z-50 py-1">
                  <button onClick={() => handleAIAction('Summarizing Note')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Summarize Note</button>
                  <button onClick={() => handleAIAction('Explaining Concept')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Explain Concept</button>
                  <button onClick={() => handleAIAction('Generating Flashcards')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Generate Flashcards</button>
                  <button onClick={() => handleAIAction('Generating Quiz')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Generate Quiz</button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button onClick={() => handleAIAction('Improving Writing')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2">
                    <Sparkles size={14} /> Improve Writing
                  </button>
                </div>
              </>
            )}

            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button 
              onClick={handleEditClick} 
              className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
              title={isEditing ? "Preview Markdown" : "Edit Markdown"}
            >
              {isEditing ? <Eye size={18} /> : <Edit3 size={18} />}
            </button>
            <button onClick={() => Swal.fire({title: 'Options', text: 'More options menu', icon: 'info', confirmButtonColor: '#4f46e5'})} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><MoreVertical size={18} /></button>
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
