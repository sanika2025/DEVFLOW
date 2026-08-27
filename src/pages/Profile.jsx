import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/Card';
import { User, Shield, Camera, Save, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Profile() {
  const { user, profile, updateProfile, updatePassword } = useAuthStore();
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isPassSaving, setIsPassSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateProfile(user.id, formData);
    setIsSaving(false);
    if (res.success) {
      Swal.fire({ icon: 'success', title: 'Profile Updated', timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: res.error });
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      return Swal.fire({ icon: 'error', title: 'Passwords do not match' });
    }
    if (passwordData.new_password.length < 6) {
      return Swal.fire({ icon: 'error', title: 'Password must be at least 6 characters' });
    }
    
    setIsPassSaving(true);
    const res = await updatePassword(passwordData.new_password);
    setIsPassSaving(false);
    
    if (res.success) {
      setPasswordData({ new_password: '', confirm_password: '' });
      Swal.fire({ icon: 'success', title: 'Password Updated', timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: res.error });
    }
  };

  const handleAvatarClick = () => {
    Swal.fire({
      icon: 'info',
      title: 'Avatar Customization',
      text: 'File upload via Supabase Storage is coming soon! For now, your avatar is dynamically generated from your email.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-3">
          <User className="text-indigo-600" size={32} />
          Your Profile
        </h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage your personal information and account security.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="flex flex-col items-center text-center p-6 border-t-4 border-t-indigo-500">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-zinc-800">
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'Analyst'}&backgroundColor=e0e7ff`}
                  alt="Profile" 
                  className="w-full h-full object-cover bg-indigo-50"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-800 dark:text-zinc-50">{profile?.full_name || user?.email?.split('@')[0]}</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400">{user?.email}</p>
            <p className="mt-2 text-sm font-medium px-3 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full inline-block">
              {profile?.role?.toUpperCase() || 'ANALYST'}
            </p>
          </Card>
        </div>

        {/* Right Column - Forms */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2">
              <User size={20} className="text-indigo-500" />
              Personal Information
            </h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="John Doe" 
                    className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Email Address (Read Only)</label>
                  <input 
                    type="email" 
                    disabled
                    value={user?.email || ''}
                    className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Bio / Role</label>
                <textarea 
                  rows="3"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="e.g., Senior Financial Analyst" 
                  className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-50"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          </Card>

          <Card className="border-t-4 border-t-rose-500">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-rose-500" />
              Account Security
            </h3>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-50"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isPassSaving}
                  className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isPassSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Update Password
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
