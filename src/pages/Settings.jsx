import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Settings as SettingsIcon, Key, Save, Download, LayoutTemplate, Globe, Bell, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { simpleLifeService } from '../services/simpleLifeService';
import Swal from 'sweetalert2';

export default function Settings() {
  const { user, profile, updateProfile } = useAuthStore();
  
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Form State
  const [userMode, setUserMode] = useState(profile?.user_mode || 'full');
  const [prefs, setPrefs] = useState({
    currency: '₹',
    dateFormat: 'DD/MM/YYYY',
    notifyShifts: true,
    notifyTasks: true,
    ...(profile?.preferences || {})
  });

  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiSave = (e) => {
    e.preventDefault();
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setIsProfileSaving(true);
    const updates = {
      user_mode: userMode,
      preferences: prefs
    };
    const res = await updateProfile(user.id, updates);
    setIsProfileSaving(false);
    if (res.success) {
      Swal.fire({ icon: 'success', title: 'Settings Saved', timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: res.error });
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Fetch all data
      const expenses = await simpleLifeService.getExpenses(user.id);
      const shifts = await simpleLifeService.getShifts(user.id);
      const tasks = await simpleLifeService.getTasks(user.id);
      
      // Convert to CSV strings
      const expenseCsv = ['Amount,Category,Description,Date\n'].concat(
        expenses.map(e => `${e.amount},"${e.category}","${e.description || ''}",${e.date}`).join('\n')
      ).join('');
      
      const shiftsCsv = ['\n\nDate,Type,Start,End\n'].concat(
        shifts.map(s => `${s.date},${s.shift_type},${s.start_time || ''},${s.end_time || ''}`).join('\n')
      ).join('');
      
      const tasksCsv = ['\n\nTitle,Category,Priority,Due Date,Completed\n'].concat(
        tasks.map(t => `"${t.title}","${t.category}",${t.priority},${t.due_date},${t.completed}`).join('\n')
      ).join('');

      const combinedCsv = expenseCsv + shiftsCsv + tasksCsv;
      
      // Download
      const blob = new Blob([combinedCsv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `devflow_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setIsExporting(false);
      Swal.fire({ icon: 'success', title: 'Export Successful', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      Swal.fire({ icon: 'error', title: 'Export Failed', text: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-3">
          <SettingsIcon className="text-indigo-600" size={32} />
          Settings
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage your application preferences, exports, and integrations.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          <Card className="border-t-4 border-t-blue-500">
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2 mb-4">
              <LayoutTemplate className="text-blue-500" size={20} />
              Application Settings
            </h3>
            <form onSubmit={handleSettingsSave} className="space-y-6">
              
              {/* App Mode */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">Application Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setUserMode('simple_life')} className={`p-4 rounded-xl border-2 text-left transition-all ${userMode === 'simple_life' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'}`}>
                    <span className="block font-bold text-slate-800 dark:text-zinc-50 mb-1">Simple Life</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Lightweight tracker for money, shifts & routines.</span>
                  </button>
                  <button type="button" onClick={() => setUserMode('full')} className={`p-4 rounded-xl border-2 text-left transition-all ${userMode === 'full' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'}`}>
                    <span className="block font-bold text-slate-800 dark:text-zinc-50 mb-1">Full Advanced</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Complete suite with AI mentor and learning.</span>
                  </button>
                </div>
              </div>

              {/* Regional */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                  <Globe size={16} /> Regional & Display
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Currency Symbol</label>
                    <select value={prefs.currency} onChange={e => setPrefs({...prefs, currency: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 outline-none focus:border-blue-500">
                      <option value="₹">₹ (INR)</option>
                      <option value="$">$ (USD)</option>
                      <option value="€">€ (EUR)</option>
                      <option value="£">£ (GBP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date Format</label>
                    <select value={prefs.dateFormat} onChange={e => setPrefs({...prefs, dateFormat: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 outline-none focus:border-blue-500">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                  <Bell size={16} /> Notification Preferences
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={prefs.notifyShifts} onChange={e => setPrefs({...prefs, notifyShifts: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                    <span className="text-sm text-slate-700 dark:text-zinc-300">Notify for upcoming shifts</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={prefs.notifyTasks} onChange={e => setPrefs({...prefs, notifyTasks: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                    <span className="text-sm text-slate-700 dark:text-zinc-300">Notify for tasks due today</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button type="submit" disabled={isProfileSaving} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {isProfileSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Preferences
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="border-t-4 border-t-emerald-500">
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2 mb-4">
              <Download className="text-emerald-500" size={20} />
              Data Export & Backup
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
              Download a complete physical backup of all your personal data including Expenses, Income, Shifts, Tasks, and Routines as a CSV file for Excel/Google Sheets.
            </p>
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
              Export Data to CSV
            </button>
          </Card>

          <Card className="border-t-4 border-t-indigo-500">
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2 mb-4">
              <Key className="text-indigo-500" size={20} />
              AI Integrations
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
              Enter your Google Gemini API Key to enable the AI Mentor and Interview Prep modules. Your key is stored securely in your browser's local storage and is never sent to our servers.
            </p>
            <form onSubmit={handleApiSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Gemini API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..." 
                  className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-900"
                />
              </div>
              <div className="flex items-center gap-4">
                <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <Save size={18} /> Save Key
                </button>
                {isSaved && <span className="text-emerald-500 text-sm font-medium">Saved!</span>}
              </div>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
}
