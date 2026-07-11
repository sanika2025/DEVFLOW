import { Bell, Search, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Navbar({ toggleSidebar }) {
  const location = useLocation();
  
  // Format pathname into a readable title (e.g. /ai-mentor -> AI Mentor)
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path || path === 'dashboard') return 'Dashboard';
    return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 tracking-tight hidden md:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search everything... (Cmd+K)" 
            className="w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 relative rounded-full text-slate-500 hover:bg-slate-50 transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          
          <button className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-indigo-500/30 transition-all">
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Sanika&backgroundColor=e0e7ff" 
              alt="Profile" 
              className="w-full h-full object-cover bg-indigo-50"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
