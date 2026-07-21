import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    // Get initial session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session?.user) {
      set({ user: session.user });
      await get().fetchProfile(session.user.id);
    } else {
      set({ loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user || null });
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      } else {
        set({ profile: null, loading: false });
      }
    });
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message);
      }
      
      set({ profile: data, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  signup: async (email, password, fullName) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    if (error) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
    
    // Automatically create profile is handled by Supabase Triggers ideally, 
    // but for safety we can insert it if it doesn't exist
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, full_name: fullName, role: 'student' });
        
      if(profileError) console.error("Profile creation error", profileError);
    }

    return { success: true, data };
  },

  logout: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  }
}));
